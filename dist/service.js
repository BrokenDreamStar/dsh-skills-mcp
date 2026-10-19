import { join } from 'node:path';
import { ManagerError, messageOf } from "./errors.js";
import { defaultSkillRoot, isSkillRootId, scopeOfSkillRoot } from "./skills.js";
import { serverFormValue, serverTarget } from "./mcp-config.js";
import { projectConfigFile } from "./mcp-runtime.js";
import { briefError, resolveProjectRoot } from "./paths.js";
export const PLUGIN_VERSION = '0.4.1';
/** Web API 与模型工具共用的操作层。 */
export class ManagerService {
    options;
    constructor(options) {
        this.options = options;
    }
    get dshHome() {
        return this.options.dshHome;
    }
    async resolveProject(input) {
        if (typeof input !== 'string' || input.trim() === '') {
            throw new ManagerError('invalid-argument', '项目级操作需要项目路径');
        }
        const root = await resolveProjectRoot(input);
        return {
            root,
            mcpFile: projectConfigFile(root),
        };
    }
    async snapshot(projectInput) {
        const system = await this.scopeSnapshot('system');
        let project = null;
        let projectError;
        if (projectInput !== undefined && projectInput.trim() !== '') {
            try {
                const resolved = await this.resolveProject(projectInput);
                project = await this.scopeSnapshot('project', resolved);
            }
            catch (error) {
                projectError = messageOf(error);
            }
        }
        return {
            dshHome: this.options.dshHome,
            system,
            project,
            ...projectError === undefined ? {} : { projectError },
            version: PLUGIN_VERSION,
        };
    }
    async readSkill(scope, projectInput, root, name) {
        const resolved = await this.projectFor(scope, projectInput);
        return this.options.skills.read(this.skillRoot(scope, root), resolved?.root, name);
    }
    async saveSkill(scope, projectInput, root, name, content) {
        const resolved = await this.projectFor(scope, projectInput);
        return this.options.skills.save(this.skillRoot(scope, root), resolved?.root, name, content);
    }
    async deleteSkill(scope, projectInput, root, name) {
        const resolved = await this.projectFor(scope, projectInput);
        return this.options.skills.delete(this.skillRoot(scope, root), resolved?.root, name);
    }
    async setSkillEnabled(scope, projectInput, name, enabled) {
        const resolved = await this.projectFor(scope, projectInput);
        await this.options.skillState.setDisabled(scope, resolved?.root, name, !enabled);
        await this.options.skillRuntime.refresh();
    }
    async saveMcpServer(scope, projectInput, name, form, originalName) {
        const resolved = await this.projectFor(scope, projectInput);
        const file = this.mcpFile(scope, resolved);
        await this.options.mcpConfig.saveServer(file, name, form, originalName);
        await this.reloadMcp(scope, resolved);
    }
    async deleteMcpServer(scope, projectInput, name) {
        const resolved = await this.projectFor(scope, projectInput);
        await this.options.mcpConfig.deleteServer(this.mcpFile(scope, resolved), name);
        await this.reloadMcp(scope, resolved);
    }
    async setMcpEnabled(scope, projectInput, name, enabled) {
        const resolved = await this.projectFor(scope, projectInput);
        await this.options.mcpConfig.setServerEnabled(this.mcpFile(scope, resolved), name, enabled);
        await this.reloadMcp(scope, resolved);
    }
    async setExternalMcpEnabled(scope, projectInput, id, enabled) {
        const resolved = await this.projectFor(scope, projectInput);
        await this.options.externalMcp.setEnabled(scope, resolved?.root, id, enabled);
        await this.reloadMcp(scope, resolved);
    }
    /**
     * 把 Claude Code 外部条目复制为当前作用域的 DSH 管理条目。
     * 会复制 URL / command / env / headers（可能含密钥），由调用方负责确认。
     */
    async importExternalMcp(scope, projectInput, id, name) {
        const resolved = await this.projectFor(scope, projectInput);
        const server = await this.options.externalMcp.findById(id, resolved?.root);
        if (server === undefined)
            throw new ManagerError('not-found', `外部 MCP 服务器不存在：${id}`);
        if (server.entry.issue !== undefined)
            throw new ManagerError('invalid-content', server.entry.issue);
        const form = { ...serverFormValue(server.entry), disabled: false };
        await this.options.mcpConfig.createServer(this.mcpFile(scope, resolved), name?.trim() || server.name, form, server.entry.raw);
        await this.reloadMcp(scope, resolved);
    }
    async reloadMcp(scope, projectInputOrResolved) {
        if (scope === 'system') {
            await this.options.runtime.reloadSystem();
            return;
        }
        const resolved = typeof projectInputOrResolved === 'object' && projectInputOrResolved !== null
            ? projectInputOrResolved
            : await this.resolveProject(projectInputOrResolved ?? '');
        await this.options.runtime.refreshProject(resolved.root);
    }
    async scopeSnapshot(scope, resolved) {
        const root = resolved?.root ?? this.options.dshHome;
        const skillRoots = this.options.skills.rootViews(scope, resolved?.root);
        const mcpFile = resolved?.mcpFile ?? join(this.options.dshHome, 'mcp.json');
        const [skillResult, mcpResult, skillState, external, otherProjects] = await Promise.all([
            this.options.skills.list(scope, resolved?.root),
            this.options.mcpConfig.read(mcpFile),
            this.options.skillState.read(),
            this.options.externalMcp.list(scope, resolved?.root),
            scope === 'system'
                ? this.options.externalMcp.listOtherProjects()
                : Promise.resolve({ servers: [], issues: [] }),
        ]);
        const disabledNames = new Set(skillState.system);
        if (scope === 'project' && resolved !== undefined) {
            for (const name of skillState.projects[resolved.root] ?? [])
                disabledNames.add(name);
        }
        const skills = skillResult.skills.map(skill => disabledNames.has(skill.name)
            ? { ...skill, disabledInDsh: true }
            : skill);
        const projectStatus = scope === 'project' && resolved !== undefined
            ? this.options.runtime.projectStatus(resolved.root)
            : undefined;
        const runtimeStatuses = scope === 'system'
            ? this.options.runtime.systemStatus()
            : projectStatus?.servers ?? {};
        const externalStatuses = scope === 'system'
            ? this.options.runtime.externalSystemStatus()
            : projectStatus?.externalServers ?? {};
        const projectAgents = projectStatus?.activeAgents;
        // 已被导入为 DSH 条目的外部服务器不再重复展示；同名条目以 DSH 为准。
        const managedNames = new Set(mcpResult.servers.map(server => server.name));
        const externalServers = external.servers.filter(server => !managedNames.has(server.name));
        const seenNames = new Set([...managedNames, ...externalServers.map(server => server.name)]);
        const otherServers = [];
        for (const server of otherProjects.servers) {
            if (seenNames.has(server.name))
                continue;
            seenNames.add(server.name);
            otherServers.push(server);
        }
        const servers = [
            ...mcpResult.servers.map(server => serverView(server, runtimeStatuses[server.name])),
            ...externalServers.map(server => externalServerView(server, externalStatuses[server.id], true)),
            ...otherServers.map(server => externalServerView(server, undefined, false)),
        ];
        const issues = [...new Set([
                ...skillResult.issues,
                ...external.issues,
                ...otherProjects.issues,
            ])];
        if (mcpResult.issue !== undefined)
            issues.push(mcpResult.issue);
        if (skillState.issue !== undefined)
            issues.push(skillState.issue);
        if (scope === 'project' && projectAgents === 0) {
            issues.push('项目级 MCP 会在该项目中新建或恢复会话时加载；当前没有活动会话。');
        }
        return {
            scope,
            root,
            skillRoots,
            mcpFile,
            skills,
            servers,
            issues,
        };
    }
    skillRoot(scope, root) {
        const id = root ?? defaultSkillRoot(scope);
        if (!isSkillRootId(id))
            throw new ManagerError('invalid-argument', `未知技能根：${String(id)}`);
        if (scopeOfSkillRoot(id) !== scope) {
            throw new ManagerError('invalid-argument', `技能根 ${id} 不属于当前作用域 ${scope}`);
        }
        return id;
    }
    async projectFor(scope, input) {
        if (scope === 'system')
            return undefined;
        return this.resolveProject(input ?? '');
    }
    mcpFile(scope, resolved) {
        return scope === 'system'
            ? join(this.options.dshHome, 'mcp.json')
            : resolved?.mcpFile ?? join(this.dshHome, '.dsh', 'mcp.json');
    }
}
function serverView(entry, runtime) {
    const state = entry.disabled
        ? 'disabled'
        : entry.issue !== undefined
            ? 'error'
            : runtime?.state ?? 'idle';
    const error = entry.issue ?? runtime?.error;
    return {
        id: `dsh:${entry.name}`,
        name: entry.name,
        source: 'dsh',
        managed: true,
        transport: entry.transport,
        target: serverTarget(entry),
        disabled: entry.disabled,
        status: state,
        ...runtime?.toolCount === undefined ? {} : { toolCount: runtime.toolCount },
        ...error === undefined ? {} : { error: briefError(error) },
        config: {
            ...serverFormValue(entry),
            ...entry.disabled ? { disabled: true } : {},
        },
    };
}
function externalServerView(server, runtime, inPlace) {
    const disabled = !server.enabled || server.entry.disabled;
    // 跨项目候选只用于导入，不在当前作用域加载。
    const state = !inPlace
        ? 'idle'
        : disabled
            ? 'disabled'
            : server.entry.issue !== undefined
                ? 'error'
                : runtime?.state ?? 'idle';
    const error = server.entry.issue ?? (inPlace ? runtime?.error : undefined);
    const config = serverFormValue(server.entry);
    return {
        id: server.id,
        name: server.name,
        source: 'claude-code',
        origin: server.origin,
        configPath: server.configPath,
        managed: false,
        inPlace,
        importable: true,
        ...server.projectRoot === undefined ? {} : { projectRoot: server.projectRoot },
        transport: server.entry.transport,
        target: redactTarget(serverTarget(server.entry)),
        disabled: inPlace && disabled,
        status: state,
        ...runtime?.toolCount === undefined ? {} : { toolCount: runtime.toolCount },
        ...error === undefined ? {} : { error: briefError(errorsRedacted(error)) },
        config: {
            ...config,
            ...config.command === undefined ? {} : { command: errorsRedacted(config.command) },
            ...config.args === undefined ? {} : { args: config.args.map(errorsRedacted) },
            ...config.url === undefined ? {} : { url: redactTarget(config.url) },
            ...config.env === undefined ? {} : { env: redactKeys(config.env) },
            ...config.headers === undefined ? {} : { headers: redactKeys(config.headers) },
            ...disabled ? { disabled: true } : {},
        },
    };
}
function redactKeys(record) {
    return Object.fromEntries(Object.keys(record).map(key => [key, '[redacted]']));
}
function errorsRedacted(value) {
    return value
        .replace(/Bearer\s+[^\s]+/gi, 'Bearer [redacted]')
        .replace(/([?&](?:token|key|api[_-]?key|secret|password)=)[^&\s]+/gi, '$1[redacted]');
}
function redactTarget(value) {
    try {
        const url = new URL(value);
        url.username = '';
        url.password = '';
        url.search = '';
        return url.toString();
    }
    catch {
        return errorsRedacted(value);
    }
}
export function assertScope(value) {
    if (value === 'system' || value === 'project')
        return value;
    throw new ManagerError('invalid-argument', 'scope 必须是 system 或 project');
}
//# sourceMappingURL=service.js.map