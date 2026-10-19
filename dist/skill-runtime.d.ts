import type { Context } from '@deepseek-ai/cordis';
import type { SkillStateStore } from './skill-state.ts';
export interface SkillShadowRuntimeOptions {
    ctx: Context;
    state: SkillStateStore;
}
/**
 * DSH-only 技能停用：为活动 Agent 注册同名、不可调用的 runtime skill，
 * 在 agent scope 内遮蔽文件系统 provider 的真实条目。源文件完全不动。
 */
export declare class SkillShadowRuntime {
    private readonly options;
    private readonly agents;
    private queue;
    private disposed;
    constructor(options: SkillShadowRuntimeOptions);
    registerLifecycle(): void;
    start(): Promise<void>;
    /** 状态文件变化后，重建所有活动 Agent 的遮蔽层。 */
    refresh(): Promise<void>;
    dispose(): Promise<void>;
    private applyAgent;
    private removeAgent;
    private disposeEntry;
    private skillsRegistry;
    private listAgents;
    private agentRegistry;
    private serial;
}
//# sourceMappingURL=skill-runtime.d.ts.map