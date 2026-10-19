import type { Scope, SkillContentValue, SkillListItem, SkillMutationValue, SkillRootId, SkillRootKind, SkillRootView } from './shared.ts';
export interface SkillListResult {
    skills: SkillListItem[];
    issues: string[];
}
interface SkillRoot {
    id: SkillRootId;
    scope: Scope;
    kind: SkillRootKind;
    path: string;
}
export interface SkillsStoreOptions {
    dshHome: string;
    agentsHome: string;
    maxSkillBytes: number;
}
export declare function isSkillRootId(value: unknown): value is SkillRootId;
export declare function scopeOfSkillRoot(root: SkillRootId): Scope;
export declare function defaultSkillRoot(scope: Scope): SkillRootId;
/** 同时管理 DSH 与 Shared Agents 的系统/项目技能根；文件变化交给原生 watcher。 */
export declare class SkillsStore {
    private readonly options;
    constructor(options: SkillsStoreOptions);
    roots(scope: Scope, projectRoot?: string): SkillRoot[];
    rootViews(scope: Scope, projectRoot?: string): SkillRootView[];
    resolveRoot(rootId: SkillRootId, projectRoot?: string): SkillRoot;
    list(scope: Scope, projectRoot?: string): Promise<SkillListResult>;
    private listRoot;
    read(rootId: SkillRootId, projectRoot: string | undefined, name: string): Promise<SkillContentValue>;
    save(rootId: SkillRootId, projectRoot: string | undefined, name: string, content: string): Promise<SkillMutationValue>;
    delete(rootId: SkillRootId, projectRoot: string | undefined, name: string): Promise<SkillMutationValue>;
    private findEntry;
    private parseFile;
    private parseContent;
    private readText;
    /** 拒绝通过符号链接读写或删除，避免管理操作越过 roots。 */
    private assertSafeTarget;
}
export {};
//# sourceMappingURL=skills.d.ts.map