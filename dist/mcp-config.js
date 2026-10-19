import { randomUUID } from 'node:crypto';
import { chmod, copyFile, lstat, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { ManagerError, messageOf } from "./errors.js";
import { assertMcpServerName, ensureDirectory } from "./paths.js";
const SERVER_FIELDS = new Set([
    'transport', 'type', 'serverName', 'command', 'args', 'env', 'cwd', 'url', 'headers',
    'toolCallTimeoutMs', 'disabled', 'failOnStartupError', 'maxInstructionBytes', 'reconnect',
]);
/** 读写 `mcp.json`；只理解 `mcpServers`，其余顶层字段原样保留。 */
export class McpConfigStore {
    options;
    writeQueue = Promise.resolve();
    constructor(options) {
        this.options = options;
    }
    async read(file) {
        let rawText;
        try {
            const info = await lstat(file);
            if (info.isSymbolicLink()) {
                return { file, exists: true, raw: { mcpServers: {} }, servers: [], issue: `MCP 配置不能是符号链接：${file}` };
            }
            if (info.size > this.options.maxBytes) {
                return { file, exists: true, raw: { mcpServers: {} }, servers: [], issue: `MCP 配置超过 ${this.options.maxBytes} 字节上限` };
            }
            rawText = await readFile(file, 'utf8');
        }
        catch (error) {
            if (hasCode(error, 'ENOENT'))
                return { file, exists: false, raw: { mcpServers: {} }, servers: [] };
            return { file, exists: true, raw: { mcpServers: {} }, servers: [], issue: `读取 MCP 配置失败：${messageOf(error)}` };
        }
        let parsed;
        try {
            parsed = rawText.trim() === '' ? {} : JSON.parse(rawText);
        }
        catch (error) {
            return { file, exists: true, raw: { mcpServers: {} }, servers: [], issue: `MCP 配置不是合法 JSON：${messageOf(error)}` };
        }
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return { file, exists: true, raw: { mcpServers: {} }, servers: [], issue: 'MCP 配置顶层必须是对象' };
        }
        const raw = parsed;
        const bucket = raw.mcpServers;
        if (bucket === undefined)
            return { file, exists: true, raw, servers: [] };
        if (bucket === null || typeof bucket !== 'object' || Array.isArray(bucket)) {
            return { file, exists: true, raw, servers: [], issue: 'mcpServers 必须是对象' };
        }
        const servers = Object.entries(bucket)
            .map(([name, value]) => parseEntry(name, value))
            .sort((a, b) => a.name.localeCompare(b.name));
        return { file, exists: true, raw, servers };
    }
    saveServer(file, name, form, originalName) {
        return this.serial(async () => {
            assertMcpServerName(name);
            const current = await this.readForWrite(file);
            const bucket = ensureBucket(current.raw);
            const previousName = originalName ?? name;
            const previous = bucket[previousName];
            if (previousName !== name && bucket[name] !== undefined) {
                throw new ManagerError('conflict', `MCP 服务器 ${name} 已存在`);
            }
            if (previousName === name && previous === undefined && originalName !== undefined) {
                throw new ManagerError('not-found', `MCP 服务器不存在：${name}`);
            }
            const previousObject = previous !== null && typeof previous === 'object' && !Array.isArray(previous)
                ? previous
                : {};
            const entry = buildRawEntry(form, previousObject);
            delete bucket[previousName];
            bucket[name] = entry;
            await this.write(file, current.raw);
            return parseEntry(name, entry);
        });
    }
    /** 新建条目；同名已存在时报冲突，供“从外部导入”使用。 */
    createServer(file, name, form, base) {
        return this.serial(async () => {
            assertMcpServerName(name);
            const current = await this.readForWrite(file);
            const bucket = ensureBucket(current.raw);
            if (Object.hasOwn(bucket, name)) {
                throw new ManagerError('conflict', `MCP 服务器 ${name} 已存在`);
            }
            const entry = buildRawEntry(form, base ?? {});
            bucket[name] = entry;
            await this.write(file, current.raw);
            return parseEntry(name, entry);
        });
    }
    deleteServer(file, name) {
        return this.serial(async () => {
            const current = await this.readForWrite(file);
            const bucket = ensureBucket(current.raw);
            if (!Object.hasOwn(bucket, name))
                throw new ManagerError('not-found', `MCP 服务器不存在：${name}`);
            delete bucket[name];
            await this.write(file, current.raw);
        });
    }
    setServerEnabled(file, name, enabled) {
        return this.serial(async () => {
            const current = await this.readForWrite(file);
            const bucket = ensureBucket(current.raw);
            if (!Object.hasOwn(bucket, name))
                throw new ManagerError('not-found', `MCP 服务器不存在：${name}`);
            const existing = bucket[name];
            if (existing === null || typeof existing !== 'object' || Array.isArray(existing)) {
                throw new ManagerError('invalid-content', `MCP 服务器 ${name} 的配置不是对象`);
            }
            const entry = { ...existing };
            if (enabled)
                delete entry.disabled;
            else
                entry.disabled = true;
            bucket[name] = entry;
            await this.write(file, current.raw);
        });
    }
    serial(operation) {
        const task = this.writeQueue.then(operation, operation);
        this.writeQueue = task.then(() => undefined, () => undefined);
        return task;
    }
    async readForWrite(file) {
        const current = await this.read(file);
        if (current.issue !== undefined) {
            throw new ManagerError('invalid-content', current.issue);
        }
        return current;
    }
    async write(file, raw) {
        let text;
        try {
            text = `${JSON.stringify(raw, null, 2)}\n`;
        }
        catch (error) {
            throw new ManagerError('invalid-content', `MCP 配置不能序列化为 JSON：${messageOf(error)}`);
        }
        if (Buffer.byteLength(text, 'utf8') > this.options.maxBytes) {
            throw new ManagerError('invalid-content', `写入后 MCP 配置超过 ${this.options.maxBytes} 字节上限`);
        }
        await ensureDirectory(dirname(file));
        const backup = `${file}.bak`;
        try {
            if (await fileExists(file)) {
                await copyFile(file, backup);
                await chmod(backup, 0o600);
            }
        }
        catch {
            // 备份失败不阻止本次写入，但保留原始文件用于原子回滚。
        }
        const temp = join(dirname(file), `.${basename(file)}.${process.pid}.${randomUUID().slice(0, 8)}.tmp`);
        try {
            await writeFile(temp, text, { encoding: 'utf8', mode: 0o600 });
            await rename(temp, file);
            await chmod(file, 0o600);
        }
        catch (error) {
            await rm(temp, { force: true }).catch(() => { });
            throw new ManagerError('io-error', `写入 MCP 配置失败：${file}`, { cause: error });
        }
    }
}
/** 转为官方 dsh-mcp-client 的 Config；启动失败会拒绝该实例，便于状态如实显示。 */
export function toMcpClientConfig(entry, defaultCwd) {
    if (entry.issue !== undefined)
        throw new ManagerError('invalid-content', entry.issue);
    const common = {
        serverName: entry.name,
        failOnStartupError: true,
        ...entry.toolCallTimeoutMs === undefined ? {} : { toolCallTimeoutMs: entry.toolCallTimeoutMs },
        ...typeof entry.raw.maxInstructionBytes === 'number' ? { maxInstructionBytes: entry.raw.maxInstructionBytes } : {},
        ...isRecord(entry.raw.reconnect) ? { reconnect: entry.raw.reconnect } : {},
    };
    if (entry.transport === 'stdio') {
        return {
            transport: 'stdio',
            ...common,
            command: entry.command,
            args: entry.args ?? [],
            env: entry.env ?? {},
            cwd: entry.cwd?.trim() || defaultCwd,
        };
    }
    return {
        transport: 'streamable-http',
        ...common,
        url: entry.url,
        headers: entry.headers ?? {},
    };
}
/** 供外部来源（Claude Code 等）复用同一套校验与字段归一。 */
export function parseMcpConfigEntry(name, value) {
    return parseEntry(name, value);
}
export function serverFormValue(entry) {
    return {
        transport: entry.transport,
        ...entry.command === undefined ? {} : { command: entry.command },
        ...entry.args === undefined ? {} : { args: entry.args },
        ...entry.env === undefined ? {} : { env: entry.env },
        ...entry.cwd === undefined ? {} : { cwd: entry.cwd },
        ...entry.url === undefined ? {} : { url: entry.url },
        ...entry.headers === undefined ? {} : { headers: entry.headers },
        ...entry.toolCallTimeoutMs === undefined ? {} : { toolCallTimeoutMs: entry.toolCallTimeoutMs },
        ...entry.disabled ? { disabled: true } : {},
    };
}
export function serverTarget(entry) {
    if (entry.transport === 'stdio')
        return [entry.command, ...entry.args ?? []].filter(Boolean).join(' ');
    return entry.url ?? '';
}
function parseEntry(name, value) {
    const base = {
        name,
        transport: 'stdio',
        disabled: false,
        raw: isRecord(value) ? value : {},
    };
    let issue;
    try {
        assertMcpServerName(name);
    }
    catch (error) {
        issue = messageOf(error);
    }
    if (!isRecord(value)) {
        return {
            ...base,
            issue: issue ?? '服务器配置必须是对象',
        };
    }
    const record = value;
    const rawTransport = record.transport ?? record.type;
    let transport;
    if (rawTransport === undefined) {
        transport = record.url !== undefined ? 'streamable-http' : 'stdio';
    }
    else if (typeof rawTransport === 'string') {
        const normalized = rawTransport.trim().toLowerCase().replaceAll('_', '-');
        if (normalized === 'stdio')
            transport = 'stdio';
        else if (normalized === 'streamable-http' || normalized === 'http' || normalized === 'streamablehttp')
            transport = 'streamable-http';
        else {
            transport = 'stdio';
            issue ??= `不支持的 transport/type：${rawTransport}`;
        }
    }
    else {
        transport = 'stdio';
        issue ??= 'transport/type 必须是字符串';
    }
    const disabled = record.disabled;
    if (disabled !== undefined && typeof disabled !== 'boolean')
        issue ??= 'disabled 必须是布尔值';
    const command = optionalString(record.command);
    const url = optionalString(record.url);
    const cwd = optionalString(record.cwd);
    const args = optionalStringArray(record.args);
    const env = optionalStringRecord(record.env);
    const headers = optionalStringRecord(record.headers);
    const timeout = record.toolCallTimeoutMs;
    if (record.args !== undefined && args === undefined)
        issue ??= 'args 必须是字符串数组';
    if (record.env !== undefined && env === undefined)
        issue ??= 'env 必须是字符串键值对象';
    if (record.headers !== undefined && headers === undefined)
        issue ??= 'headers 必须是字符串键值对象';
    if (record.toolCallTimeoutMs !== undefined && (typeof timeout !== 'number' || !Number.isFinite(timeout) || timeout <= 0)) {
        issue ??= 'toolCallTimeoutMs 必须是正数';
    }
    if (transport === 'stdio' && command === undefined)
        issue ??= 'stdio 服务器缺少 command';
    if (transport === 'streamable-http' && url === undefined)
        issue ??= 'streamable-http 服务器缺少 url';
    return {
        name,
        transport,
        disabled: disabled === true,
        ...command === undefined ? {} : { command },
        ...args === undefined ? {} : { args },
        ...env === undefined ? {} : { env },
        ...cwd === undefined ? {} : { cwd },
        ...url === undefined ? {} : { url },
        ...headers === undefined ? {} : { headers },
        ...typeof timeout === 'number' && Number.isFinite(timeout) && timeout > 0 ? { toolCallTimeoutMs: timeout } : {},
        raw: { ...record },
        ...issue === undefined ? {} : { issue },
    };
}
function buildRawEntry(form, previous) {
    const transport = form.transport === 'streamable-http' ? 'streamable-http' : 'stdio';
    const entry = {};
    // 保留未知字段和高级字段，再写入表单管理的字段。
    for (const [key, value] of Object.entries(previous)) {
        if (!SERVER_FIELDS.has(key))
            entry[key] = value;
    }
    for (const key of ['failOnStartupError', 'maxInstructionBytes', 'reconnect']) {
        if (previous[key] !== undefined)
            entry[key] = previous[key];
    }
    entry.transport = transport;
    if (transport === 'stdio') {
        const command = requireNonEmpty(form.command, 'command');
        entry.command = command;
        entry.args = normalizeStringArray(form.args ?? [], 'args');
        entry.env = normalizeStringRecord(form.env ?? {}, 'env');
        const cwd = form.cwd?.trim();
        if (cwd)
            entry.cwd = cwd;
        else
            delete entry.cwd;
        delete entry.url;
        delete entry.headers;
    }
    else {
        const url = requireNonEmpty(form.url, 'url');
        entry.url = url;
        entry.headers = normalizeStringRecord(form.headers ?? {}, 'headers');
        delete entry.command;
        delete entry.args;
        delete entry.env;
        delete entry.cwd;
    }
    if (form.toolCallTimeoutMs !== undefined) {
        if (!Number.isFinite(form.toolCallTimeoutMs) || form.toolCallTimeoutMs <= 0) {
            throw new ManagerError('invalid-argument', 'toolCallTimeoutMs 必须是正数');
        }
        entry.toolCallTimeoutMs = Math.trunc(form.toolCallTimeoutMs);
    }
    else {
        delete entry.toolCallTimeoutMs;
    }
    if (form.disabled === true)
        entry.disabled = true;
    return entry;
}
function ensureBucket(raw) {
    const bucket = raw.mcpServers;
    if (bucket === undefined) {
        const created = {};
        raw.mcpServers = created;
        return created;
    }
    if (!isRecord(bucket))
        throw new ManagerError('invalid-content', 'mcpServers 必须是对象');
    return bucket;
}
function optionalString(value) {
    return typeof value === 'string' ? value : undefined;
}
function optionalStringArray(value) {
    if (!Array.isArray(value) || value.some(item => typeof item !== 'string'))
        return undefined;
    return value;
}
function optionalStringRecord(value) {
    if (!isRecord(value) || Object.values(value).some(item => typeof item !== 'string'))
        return undefined;
    return value;
}
function normalizeStringArray(value, field) {
    if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
        throw new ManagerError('invalid-argument', `${field} 必须是字符串数组`);
    }
    return [...value];
}
function normalizeStringRecord(value, field) {
    if (!isRecord(value) || Object.values(value).some(item => typeof item !== 'string')) {
        throw new ManagerError('invalid-argument', `${field} 必须是字符串键值对象`);
    }
    return { ...value };
}
function requireNonEmpty(value, field) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new ManagerError('invalid-argument', `${field} 不能为空`);
    }
    return value.trim();
}
function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
async function fileExists(path) {
    try {
        await lstat(path);
        return true;
    }
    catch {
        return false;
    }
}
function hasCode(error, code) {
    return typeof error === 'object' && error !== null && error.code === code;
}
//# sourceMappingURL=mcp-config.js.map