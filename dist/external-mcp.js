import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { parseMcpConfigEntry } from "./mcp-config.js";
import { ManagerError } from "./errors.js";
import { ensureDirectory, pathExists } from "./paths.js";
const EMPTY_STATE = { version: 2, disabled: [] };
/** 防止异常庞大的 Claude 项目表拖慢系统级发现。 */
const MAX_PROJECTS = 200;
/**
 * 只读发现 Claude Code 的用户/项目 MCP 配置，并使用独立状态文件记录
 * DSH 侧的显式停用；从不写入 Claude Code 配置。
 *
 * 默认策略是“发现即启用”：用户在本机为 Claude Code 安装的 MCP 会直接
 * 在 DSH 中加载；在管理页停用后写入 `mcp-external.json` 的 disabled 列表。
 */
export class ExternalMcpManager {
    stateFile;
    claudeConfigFile;
    queue = Promise.resolve();
    constructor(options) {
        this.claudeConfigFile = options.claudeConfigFile ?? join(options.homeDir ?? homedir(), '.claude.json');
        this.stateFile = options.stateFile ?? join(options.dshHome, 'mcp-external.json');
    }
    async list(scope, projectRoot) {
        const state = await this.readState();
        return this.discover(scope, projectRoot, state);
    }
    /** 其他项目的 Claude Code 服务器，用于系统级“可导入”候选。 */
    async listOtherProjects(excludeProjectRoot) {
        const state = await this.readState();
        const issues = [];
        if (state.issue !== undefined)
            issues.push(state.issue);
        const servers = await this.discoverProjects(excludeProjectRoot, issues);
        return {
            servers: withState(servers, state).sort((a, b) => a.name.localeCompare(b.name) || (a.projectRoot ?? '').localeCompare(b.projectRoot ?? '')),
            issues,
        };
    }
    /** 按 id 查找，覆盖用户级、当前项目与其他项目三种来源。 */
    async findById(id, projectRoot) {
        const state = await this.readState();
        const candidates = [
            ...(await this.discover('system', undefined, state)).servers,
            ...(projectRoot === undefined ? [] : (await this.discover('project', projectRoot, state)).servers),
            ...(await this.listOtherProjects(projectRoot)).servers,
        ];
        return candidates.find(server => server.id === id);
    }
    async enabledSystem() {
        const state = await this.readState();
        const { servers } = await this.discover('system', undefined, state);
        return servers.filter(server => server.enabled);
    }
    async enabledProject(projectRoot) {
        const state = await this.readState();
        const { servers } = await this.discover('project', projectRoot, state);
        return servers.filter(server => server.enabled);
    }
    async setEnabled(scope, projectRoot, id, enabled) {
        await this.serial(async () => {
            const state = await this.readState();
            if (state.issue !== undefined)
                throw new ManagerError('invalid-content', state.issue);
            const { servers } = await this.discover(scope, projectRoot, state);
            if (!servers.some(server => server.id === id))
                throw new ManagerError('not-found', `外部 MCP 服务器不存在：${id}`);
            const disabled = state.legacyEnabled === undefined
                ? new Set(state.disabled)
                : new Set((await this.allServers(state)).filter(server => !state.legacyEnabled.includes(server.id)).map(server => server.id));
            if (enabled)
                disabled.delete(id);
            else
                disabled.add(id);
            await this.writeState({ version: 2, disabled: [...disabled].sort() });
        });
    }
    async isEnabled(id) {
        const state = await this.readState();
        if (state.legacyEnabled !== undefined)
            return state.legacyEnabled.includes(id);
        return !state.disabled.includes(id);
    }
    async discover(scope, projectRoot, state) {
        const issues = [];
        if (state.issue !== undefined)
            issues.push(state.issue);
        if (scope === 'system') {
            const config = await this.readClaudeConfig(issues);
            const servers = withState(parseServerMap(config?.mcpServers, {
                scope,
                origin: 'Claude Code · 用户配置',
                configPath: this.claudeConfigFile,
            }, issues), state);
            return { servers, issues };
        }
        if (projectRoot === undefined)
            return { servers: [], issues };
        const serversByName = new Map();
        const config = await this.readClaudeConfig(issues);
        if (config?.projects !== undefined) {
            for (const [key, project] of Object.entries(config.projects)) {
                if (project?.mcpServers === undefined || !await samePath(key, projectRoot))
                    continue;
                for (const server of parseServerMap(project.mcpServers, {
                    scope,
                    // 使用配置里的项目路径作为稳定 id，避免调用方传入软链接/真实路径时 id 漂移。
                    projectRoot: key,
                    origin: 'Claude Code · 项目配置',
                    configPath: this.claudeConfigFile,
                }, issues)) {
                    serversByName.set(server.name, server);
                }
            }
        }
        const projectConfigPath = join(projectRoot, '.mcp.json');
        if (await pathExists(projectConfigPath)) {
            const local = await readJson(projectConfigPath, issues);
            if (local !== undefined) {
                for (const server of parseServerMap(local.mcpServers, {
                    scope,
                    projectRoot,
                    origin: 'Claude Code · .mcp.json',
                    configPath: projectConfigPath,
                }, issues)) {
                    serversByName.set(server.name, server);
                }
            }
        }
        return {
            servers: withState([...serversByName.values()], state).sort((a, b) => a.name.localeCompare(b.name)),
            issues,
        };
    }
    /** 扫描 `~/.claude.json` 中所有项目（可排除当前项目）的 mcpServers。 */
    async discoverProjects(excludeProjectRoot, issues) {
        const config = await this.readClaudeConfig(issues);
        if (config?.projects === undefined)
            return [];
        const servers = [];
        let scanned = 0;
        let truncated = false;
        for (const [key, project] of Object.entries(config.projects)) {
            if (project?.mcpServers === undefined)
                continue;
            if (scanned >= MAX_PROJECTS) {
                truncated = true;
                break;
            }
            scanned += 1;
            if (excludeProjectRoot !== undefined && await samePath(key, excludeProjectRoot))
                continue;
            servers.push(...parseServerMap(project.mcpServers, {
                scope: 'project',
                projectRoot: key,
                origin: 'Claude Code · 项目配置',
                configPath: this.claudeConfigFile,
            }, issues));
        }
        if (truncated)
            issues.push(`Claude Code 项目过多，只扫描了前 ${MAX_PROJECTS} 个项目`);
        return servers;
    }
    /** 迁移旧版 allowlist 时需要的全量集合（含当前项目与其他项目）。 */
    async allServers(state) {
        const issues = [];
        const servers = [
            ...(await this.discover('system', undefined, state)).servers,
            ...(await this.discoverProjects(undefined, issues)),
        ];
        return [...new Map(servers.map(server => [server.id, server])).values()];
    }
    async readClaudeConfig(issues) {
        if (!(await pathExists(this.claudeConfigFile)))
            return undefined;
        const raw = await readJson(this.claudeConfigFile, issues);
        if (raw === undefined)
            return undefined;
        if (raw.projects !== undefined && (typeof raw.projects !== 'object' || Array.isArray(raw.projects))) {
            issues.push('Claude Code 配置的 projects 字段不是对象');
            return { ...raw, projects: undefined };
        }
        return raw;
    }
    async readState() {
        let raw;
        try {
            raw = await readFile(this.stateFile, 'utf8');
        }
        catch (error) {
            if (hasCode(error, 'ENOENT'))
                return { ...EMPTY_STATE };
            return { ...EMPTY_STATE, issue: `读取外部 MCP 状态失败：${message(error)}` };
        }
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch (error) {
            return { ...EMPTY_STATE, issue: `外部 MCP 状态不是合法 JSON：${message(error)}` };
        }
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return { ...EMPTY_STATE, issue: '外部 MCP 状态顶层必须是对象' };
        }
        const disabled = parsed.disabled;
        if (Array.isArray(disabled)) {
            return { version: 2, disabled: disabled.filter((id) => typeof id === 'string') };
        }
        const enabled = parsed.enabled;
        if (Array.isArray(enabled)) {
            return {
                version: 2,
                disabled: [],
                legacyEnabled: enabled.filter((id) => typeof id === 'string'),
            };
        }
        return { ...EMPTY_STATE };
    }
    async writeState(state) {
        await ensureDirectory(dirname(this.stateFile));
        const temp = `${this.stateFile}.${process.pid}.${randomUUID().slice(0, 8)}.tmp`;
        try {
            await writeFile(temp, `${JSON.stringify(state, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
            await rename(temp, this.stateFile);
        }
        catch (error) {
            await rm(temp, { force: true }).catch(() => { });
            throw new ManagerError('io-error', `写入外部 MCP 状态失败：${this.stateFile}`, { cause: error });
        }
    }
    serial(operation) {
        const task = this.queue.then(operation, operation);
        this.queue = task.then(() => undefined, () => undefined);
        return task;
    }
}
function parseServerMap(value, context, issues) {
    if (value === undefined)
        return [];
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        issues.push(`${context.configPath} 的 mcpServers 必须是对象`);
        return [];
    }
    const servers = [];
    for (const [name, raw] of Object.entries(value)) {
        const entry = parseMcpConfigEntry(name, raw);
        servers.push({
            id: externalId(context.scope, context.projectRoot, name),
            source: 'claude-code',
            origin: context.origin,
            scope: context.scope,
            ...context.projectRoot === undefined ? {} : { projectRoot: context.projectRoot },
            name,
            entry,
            configPath: context.configPath,
            enabled: false,
        });
    }
    return servers;
}
function withState(servers, state) {
    return servers.map(server => ({
        ...server,
        enabled: isEnabledByState(state, server.id, server.entry.disabled === true),
    }));
}
function isEnabledByState(state, id, sourceDisabled) {
    if (sourceDisabled)
        return false;
    if (state.legacyEnabled !== undefined)
        return state.legacyEnabled.includes(id);
    return !state.disabled.includes(id);
}
function externalId(scope, projectRoot, name) {
    return `claude-code:${scope}:${projectRoot ?? ''}:${name}`;
}
async function readJson(path, issues) {
    try {
        const parsed = JSON.parse(await readFile(path, 'utf8'));
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            issues.push(`${path} 顶层必须是 JSON 对象`);
            return undefined;
        }
        return parsed;
    }
    catch (error) {
        issues.push(`读取 ${path} 失败：${message(error)}`);
        return undefined;
    }
}
async function samePath(left, right) {
    if (resolve(left) === resolve(right))
        return true;
    const [canonicalLeft, canonicalRight] = await Promise.all([
        realpath(left).catch(() => resolve(left)),
        realpath(right).catch(() => resolve(right)),
    ]);
    return canonicalLeft === canonicalRight;
}
function message(error) {
    return error instanceof Error ? error.message : String(error);
}
function hasCode(error, code) {
    return typeof error === 'object' && error !== null && error.code === code;
}
//# sourceMappingURL=external-mcp.js.map