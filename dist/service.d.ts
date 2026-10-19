import type { ManagerSnapshot, McpServerFormValue, Scope, SkillContentValue, SkillMutationValue, SkillRootId } from './shared.ts';
import type { ExternalMcpManager } from './external-mcp.ts';
import type { SkillsStore } from './skills.ts';
import type { SkillStateStore } from './skill-state.ts';
import type { SkillShadowRuntime } from './skill-runtime.ts';
import type { McpConfigStore } from './mcp-config.ts';
import type { McpRuntime } from './mcp-runtime.ts';
export declare const PLUGIN_VERSION = "0.4.1";
export interface ManagerServiceOptions {
    dshHome: string;
    skills: SkillsStore;
    skillState: SkillStateStore;
    skillRuntime: SkillShadowRuntime;
    externalMcp: ExternalMcpManager;
    mcpConfig: McpConfigStore;
    runtime: McpRuntime;
}
export interface ResolvedProject {
    root: string;
    mcpFile: string;
}
/** Web API 与模型工具共用的操作层。 */
export declare class ManagerService {
    private readonly options;
    constructor(options: ManagerServiceOptions);
    get dshHome(): string;
    resolveProject(input: string): Promise<ResolvedProject>;
    snapshot(projectInput?: string): Promise<ManagerSnapshot>;
    readSkill(scope: Scope, projectInput: string | undefined, root: SkillRootId | undefined, name: string): Promise<SkillContentValue>;
    saveSkill(scope: Scope, projectInput: string | undefined, root: SkillRootId | undefined, name: string, content: string): Promise<SkillMutationValue>;
    deleteSkill(scope: Scope, projectInput: string | undefined, root: SkillRootId | undefined, name: string): Promise<SkillMutationValue>;
    setSkillEnabled(scope: Scope, projectInput: string | undefined, name: string, enabled: boolean): Promise<void>;
    saveMcpServer(scope: Scope, projectInput: string | undefined, name: string, form: McpServerFormValue, originalName?: string): Promise<void>;
    deleteMcpServer(scope: Scope, projectInput: string | undefined, name: string): Promise<void>;
    setMcpEnabled(scope: Scope, projectInput: string | undefined, name: string, enabled: boolean): Promise<void>;
    setExternalMcpEnabled(scope: Scope, projectInput: string | undefined, id: string, enabled: boolean): Promise<void>;
    /**
     * 把 Claude Code 外部条目复制为当前作用域的 DSH 管理条目。
     * 会复制 URL / command / env / headers（可能含密钥），由调用方负责确认。
     */
    importExternalMcp(scope: Scope, projectInput: string | undefined, id: string, name?: string): Promise<void>;
    reloadMcp(scope: Scope, projectInputOrResolved?: string | ResolvedProject): Promise<void>;
    private scopeSnapshot;
    private skillRoot;
    private projectFor;
    private mcpFile;
}
export declare function assertScope(value: unknown): Scope;
//# sourceMappingURL=service.d.ts.map