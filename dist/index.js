import { join } from 'node:path';
import { Config, normalizeConfig } from "./config.js";
import { registerApi } from "./api.js";
import { ExternalMcpManager } from "./external-mcp.js";
import { McpConfigStore } from "./mcp-config.js";
import { McpRuntime } from "./mcp-runtime.js";
import { resolveAgentsHome, resolveDshHome } from "./paths.js";
import { ManagerService, PLUGIN_VERSION } from "./service.js";
import { SkillShadowRuntime } from "./skill-runtime.js";
import { SkillStateStore } from "./skill-state.js";
import { SkillsStore } from "./skills.js";
import { registerTools } from "./tools.js";
import { messageOf } from "./errors.js";
export const name = 'dsh-skills-mcp';
export const inject = ['tools'];
export const version = PLUGIN_VERSION;
export { Config };
/**
 * 统一管理 DSH 的系统级 / 项目级 Skills 与 MCP。
 *
 * - Skills 直接读写 DSH 原生目录，交给 skill-filesystem 的热更新生效。
 * - 系统 MCP 挂在插件全局作用域；项目 MCP 挂在每个项目会话的 agent 作用域。
 * - WebUI 走经过连接鉴权的 /api/dsh-skills-mcp；模型侧提供两个管理工具。
 */
export function apply(ctx, rawConfig = {}) {
    const config = normalizeConfig(rawConfig);
    const dshHome = resolveDshHome(config.dshHome);
    const agentsHome = resolveAgentsHome(config.agentsHome);
    const logger = ctx.logger;
    const skills = new SkillsStore({ dshHome, agentsHome, maxSkillBytes: config.maxSkillBytes });
    const skillState = new SkillStateStore(join(dshHome, 'skills-mcp-state.json'));
    const skillRuntime = new SkillShadowRuntime({ ctx, state: skillState });
    const mcpConfig = new McpConfigStore({ maxBytes: config.maxMcpConfigBytes });
    const externalMcp = new ExternalMcpManager({ dshHome });
    const runtime = new McpRuntime({
        ctx,
        configStore: mcpConfig,
        systemFile: join(dshHome, 'mcp.json'),
        mountProjectMcp: config.mountProjectMcp,
        external: externalMcp,
    });
    const service = new ManagerService({
        dshHome,
        skills,
        skillState,
        skillRuntime,
        externalMcp,
        mcpConfig,
        runtime,
    });
    runtime.registerLifecycle();
    skillRuntime.registerLifecycle();
    registerTools(ctx, { ctx, service, logger });
    registerApi(ctx, service);
    ctx.effect(() => () => Promise.all([runtime.dispose(), skillRuntime.dispose()]), 'dsh-skills-mcp: runtimes');
    void runtime.start().catch((error) => {
        logger.warn(`dsh-skills-mcp: 系统级 MCP 启动失败：${messageOf(error)}`);
    });
    void skillRuntime.start().catch((error) => {
        logger.warn(`dsh-skills-mcp: DSH 技能停用遮蔽启动失败：${messageOf(error)}`);
    });
    logger.debug(`dsh-skills-mcp ${PLUGIN_VERSION}: 已挂载（dshHome=${dshHome}, agentsHome=${agentsHome}）`);
}
//# sourceMappingURL=index.js.map