import { briefError, resolveProjectRoot } from "./paths.js";
/**
 * DSH-only 技能停用：为活动 Agent 注册同名、不可调用的 runtime skill，
 * 在 agent scope 内遮蔽文件系统 provider 的真实条目。源文件完全不动。
 */
export class SkillShadowRuntime {
    options;
    agents = new Map();
    queue = Promise.resolve();
    disposed = false;
    constructor(options) {
        this.options = options;
    }
    registerLifecycle() {
        this.options.ctx.on('agent/created', async ({ agent }) => {
            await this.serial(() => this.applyAgent(agent));
        }, { prepend: true });
        this.options.ctx.on('agent/disposed', ({ agent }) => {
            void this.serial(() => this.removeAgent(agent));
        });
    }
    async start() {
        await this.serial(async () => {
            for (const agent of this.listAgents())
                await this.applyAgent(agent);
        });
    }
    /** 状态文件变化后，重建所有活动 Agent 的遮蔽层。 */
    async refresh() {
        await this.serial(async () => {
            for (const agent of this.agents.keys())
                await this.applyAgent(agent);
        });
    }
    async dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        await this.queue.catch(() => { });
        for (const entry of this.agents.values())
            await disposeFiber(entry.fiber);
        this.agents.clear();
    }
    async applyAgent(agent) {
        if (this.disposed)
            return;
        const skills = this.skillsRegistry();
        const agents = this.agentRegistry();
        if (skills === undefined || agents?.get(agent.id) !== agent) {
            // 没有技能注册表或 Agent 已退出：清理旧遮蔽。
            await this.disposeEntry(agent);
            return;
        }
        let root;
        const cwd = agent.session.header.cwd;
        if (cwd !== undefined) {
            try {
                root = await resolveProjectRoot(cwd);
            }
            catch {
                root = undefined;
            }
        }
        const names = await this.options.state.disabledNames('system');
        if (root !== undefined) {
            for (const name of await this.options.state.disabledNames('project', root))
                names.add(name);
        }
        const previous = this.agents.get(agent);
        if (previous !== undefined
            && previous.root === root
            && sameSet(previous.names, names)
            && previous.fiber !== undefined) {
            return;
        }
        await disposeFiber(previous?.fiber);
        const entry = { ...root === undefined ? {} : { root }, names };
        this.agents.set(agent, entry);
        if (names.size === 0)
            return;
        try {
            const fiber = agent.ctx.inject(['skills'], (scoped) => {
                const registry = scoped.skills;
                for (const name of names) {
                    try {
                        registry.register({
                            name,
                            description: 'Disabled in DSH by dsh-skills-mcp',
                            content: '',
                            source: 'runtime',
                            provider: 'dsh-skills-mcp',
                            invocation: { modelInvocable: false, userInvocable: false },
                        });
                    }
                    catch (error) {
                        this.options.ctx.logger.warn(`dsh-skills-mcp: 无法遮蔽已停用技能 ${name}：${briefError(error)}`);
                    }
                }
            });
            entry.fiber = fiber;
            await fiber.await();
        }
        catch (error) {
            this.options.ctx.logger.warn(`dsh-skills-mcp: 技能遮蔽层加载失败：${briefError(error)}`);
        }
    }
    async removeAgent(agent) {
        await this.disposeEntry(agent);
    }
    async disposeEntry(agent) {
        const entry = this.agents.get(agent);
        if (entry === undefined)
            return;
        this.agents.delete(agent);
        await disposeFiber(entry.fiber);
    }
    skillsRegistry() {
        try {
            return this.options.ctx.get('skills');
        }
        catch {
            return undefined;
        }
    }
    listAgents() {
        try {
            return this.agentRegistry()?.list() ?? [];
        }
        catch {
            return [];
        }
    }
    agentRegistry() {
        try {
            return this.options.ctx.get('agents');
        }
        catch {
            return undefined;
        }
    }
    serial(operation) {
        const task = this.queue.then(operation, operation);
        this.queue = task.then(() => undefined, () => undefined);
        return task;
    }
}
function sameSet(left, right) {
    if (left.size !== right.size)
        return false;
    for (const value of left)
        if (!right.has(value))
            return false;
    return true;
}
async function disposeFiber(fiber) {
    if (fiber === undefined)
        return;
    await Promise.resolve(fiber.dispose()).catch(() => { });
}
//# sourceMappingURL=skill-runtime.js.map