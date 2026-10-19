import type { Scope } from './shared.ts';
interface StoredState {
    version: 1;
    system: string[];
    projects: Record<string, string[]>;
}
export interface SkillStateSnapshot extends StoredState {
    /** 文件不可读时的诊断；读取失败按空状态展示。 */
    issue?: string;
}
/** DSH-only 技能启停状态；不修改技能源文件。 */
export declare class SkillStateStore {
    readonly file: string;
    private queue;
    constructor(file: string);
    read(): Promise<SkillStateSnapshot>;
    disabledNames(scope: Scope, projectRoot?: string): Promise<Set<string>>;
    setDisabled(scope: Scope, projectRoot: string | undefined, name: string, disabled: boolean): Promise<void>;
    private write;
    private serial;
}
export {};
//# sourceMappingURL=skill-state.d.ts.map