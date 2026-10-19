import type { McpServerFormValue, McpTransport } from './shared.ts';
export interface McpConfigEntry {
    name: string;
    transport: McpTransport;
    disabled: boolean;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
    url?: string;
    headers?: Record<string, string>;
    toolCallTimeoutMs?: number;
    /** 原始条目，保留本插件未识别的字段，保存时合并回去。 */
    raw: Record<string, unknown>;
    /** 条目无法使用时给出原因；仍会出现在管理列表里。 */
    issue?: string;
}
export interface McpConfigReadResult {
    file: string;
    exists: boolean;
    raw: Record<string, unknown>;
    servers: McpConfigEntry[];
    /** 文件整体不可解析（此时 servers 为空）。 */
    issue?: string;
}
export interface McpConfigOptions {
    maxBytes: number;
}
/** 读写 `mcp.json`；只理解 `mcpServers`，其余顶层字段原样保留。 */
export declare class McpConfigStore {
    private readonly options;
    private writeQueue;
    constructor(options: McpConfigOptions);
    read(file: string): Promise<McpConfigReadResult>;
    saveServer(file: string, name: string, form: McpServerFormValue, originalName?: string): Promise<McpConfigEntry>;
    /** 新建条目；同名已存在时报冲突，供“从外部导入”使用。 */
    createServer(file: string, name: string, form: McpServerFormValue, base?: Record<string, unknown>): Promise<McpConfigEntry>;
    deleteServer(file: string, name: string): Promise<void>;
    setServerEnabled(file: string, name: string, enabled: boolean): Promise<void>;
    private serial;
    private readForWrite;
    private write;
}
/** 转为官方 dsh-mcp-client 的 Config；启动失败会拒绝该实例，便于状态如实显示。 */
export declare function toMcpClientConfig(entry: McpConfigEntry, defaultCwd: string): Record<string, unknown>;
/** 供外部来源（Claude Code 等）复用同一套校验与字段归一。 */
export declare function parseMcpConfigEntry(name: string, value: unknown): McpConfigEntry;
export declare function serverFormValue(entry: McpConfigEntry): McpServerFormValue;
export declare function serverTarget(entry: Pick<McpConfigEntry, 'transport' | 'command' | 'args' | 'url'>): string;
//# sourceMappingURL=mcp-config.d.ts.map