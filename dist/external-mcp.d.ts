import type { McpConfigEntry } from './mcp-config.ts';
import type { Scope } from './shared.ts';
export type ExternalMcpSource = 'claude-code';
export interface ExternalMcpServer {
    /** 稳定标识：来源 + 作用域 + 项目根 + 服务器名。 */
    id: string;
    source: ExternalMcpSource;
    origin: string;
    scope: Scope;
    projectRoot?: string;
    name: string;
    entry: McpConfigEntry;
    configPath: string;
    /** 是否已在 DSH 中启用（发现即启用；显式停用后为 false）。 */
    enabled: boolean;
}
export interface ExternalMcpListing {
    servers: ExternalMcpServer[];
    issues: string[];
}
export interface ExternalMcpRuntimeSource {
    enabledSystem(): Promise<readonly ExternalMcpServer[]>;
    enabledProject(projectRoot: string): Promise<readonly ExternalMcpServer[]>;
}
interface ExternalMcpManagerOptions {
    dshHome: string;
    homeDir?: string;
    claudeConfigFile?: string;
    stateFile?: string;
}
/**
 * 只读发现 Claude Code 的用户/项目 MCP 配置，并使用独立状态文件记录
 * DSH 侧的显式停用；从不写入 Claude Code 配置。
 *
 * 默认策略是“发现即启用”：用户在本机为 Claude Code 安装的 MCP 会直接
 * 在 DSH 中加载；在管理页停用后写入 `mcp-external.json` 的 disabled 列表。
 */
export declare class ExternalMcpManager implements ExternalMcpRuntimeSource {
    readonly stateFile: string;
    private readonly claudeConfigFile;
    private queue;
    constructor(options: ExternalMcpManagerOptions);
    list(scope: Scope, projectRoot?: string): Promise<ExternalMcpListing>;
    /** 其他项目的 Claude Code 服务器，用于系统级“可导入”候选。 */
    listOtherProjects(excludeProjectRoot?: string): Promise<ExternalMcpListing>;
    /** 按 id 查找，覆盖用户级、当前项目与其他项目三种来源。 */
    findById(id: string, projectRoot?: string): Promise<ExternalMcpServer | undefined>;
    enabledSystem(): Promise<readonly ExternalMcpServer[]>;
    enabledProject(projectRoot: string): Promise<readonly ExternalMcpServer[]>;
    setEnabled(scope: Scope, projectRoot: string | undefined, id: string, enabled: boolean): Promise<void>;
    isEnabled(id: string): Promise<boolean>;
    private discover;
    /** 扫描 `~/.claude.json` 中所有项目（可排除当前项目）的 mcpServers。 */
    private discoverProjects;
    /** 迁移旧版 allowlist 时需要的全量集合（含当前项目与其他项目）。 */
    private allServers;
    private readClaudeConfig;
    private readState;
    private writeState;
    private serial;
}
export {};
//# sourceMappingURL=external-mcp.d.ts.map