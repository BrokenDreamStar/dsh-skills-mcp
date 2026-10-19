import type { Context } from '@deepseek-ai/cordis';
import type { McpConfigStore } from './mcp-config.ts';
import type { ExternalMcpRuntimeSource } from './external-mcp.ts';
import type { RuntimeState } from './shared.ts';
export interface ServerRuntimeStatus {
    state: Exclude<RuntimeState, 'disabled' | 'idle'>;
    error?: string;
    toolCount?: number;
}
export interface ProjectRuntimeStatus {
    activeAgents: number;
    servers: Record<string, ServerRuntimeStatus>;
    externalServers: Record<string, ServerRuntimeStatus>;
}
export interface McpRuntimeOptions {
    ctx: Context;
    configStore: McpConfigStore;
    systemFile: string;
    mountProjectMcp: boolean;
    external?: ExternalMcpRuntimeSource;
}
/** 按 agent 挂载项目级 MCP；系统级 MCP 挂在插件自身的全局作用域。 */
export declare class McpRuntime {
    private readonly options;
    private readonly system;
    private readonly systemNames;
    private readonly externalSystem;
    private readonly externalSystemNames;
    private readonly agents;
    private readonly pending;
    private modulePromise;
    private systemReloading;
    private projectQueue;
    private disposed;
    constructor(options: McpRuntimeOptions);
    /** 注册 per-agent 生命周期；系统级连接由 {@link start} 建立。 */
    registerLifecycle(): void;
    start(): Promise<void>;
    /** HMR 重新装载后，为已存在的会话补挂项目级 MCP。 */
    private syncExistingAgents;
    reloadSystem(): Promise<void>;
    private doReloadSystem;
    /** 已发现的 Claude Code 等外部系统级 MCP；启停状态由独立 overlay 决定。 */
    private reloadExternalSystem;
    private refreshAllProjects;
    /** 重新读取项目配置并重挂该项目全部活动会话的服务器。 */
    refreshProject(root: string): Promise<void>;
    projectStatus(root: string): ProjectRuntimeStatus;
    systemStatus(): Record<string, ServerRuntimeStatus>;
    externalSystemStatus(): Record<string, ServerRuntimeStatus>;
    dispose(): Promise<void>;
    private syncAgent;
    private resyncAgent;
    private resyncExternalProject;
    /**
     * 卸载与保留名冲突的外部系统实例。
     * 导入外部条目、启用同名 DSH 条目时，managed 实例必须先于外部实例释放，
     * 否则 mcp-client 会因 serverName 重复而拒绝新的挂载。
     */
    private pruneExternalSystem;
    /** 项目级版本：释放该 Agent 上即将被 managed 条目接管的同名外部实例。 */
    private pruneExternalProject;
    private mount;
    private toolsFor;
    private loadModule;
    private removeAgent;
    private withProjectLock;
    private disposeServers;
    private track;
}
export declare function projectConfigFile(projectRoot: string): string;
//# sourceMappingURL=mcp-runtime.d.ts.map