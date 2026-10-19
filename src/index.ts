import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { Config, normalizeConfig } from './config.ts'
import type { Config as PluginConfig } from './config.ts'
import { registerApi } from './api.ts'
import { ExternalMcpManager } from './external-mcp.ts'
import { McpConfigStore } from './mcp-config.ts'
import { McpRuntime } from './mcp-runtime.ts'
import { resolveAgentsHome, resolveDshHome } from './paths.ts'
import { ManagerService, PLUGIN_VERSION } from './service.ts'
import { SkillShadowRuntime } from './skill-runtime.ts'
import { SkillStateStore } from './skill-state.ts'
import { SkillsStore } from './skills.ts'
import { registerTools } from './tools.ts'
import { messageOf } from './errors.ts'

export const name = 'dsh-skills-mcp'
export const inject = ['tools']
export const version = PLUGIN_VERSION
export { Config }
export type { Config as PluginConfig }

/**
 * 统一管理 DSH 的系统级 / 项目级 Skills 与 MCP。
 *
 * - Skills 直接读写 DSH 原生目录，交给 skill-filesystem 的热更新生效。
 * - 系统 MCP 挂在插件全局作用域；项目 MCP 挂在每个项目会话的 agent 作用域。
 * - WebUI 走经过连接鉴权的 /api/dsh-skills-mcp；模型侧提供两个管理工具。
 */
export function apply(ctx: Context, rawConfig: PluginConfig = {}): void {
  const config = normalizeConfig(rawConfig)
  const dshHome = resolveDshHome(config.dshHome)
  const agentsHome = resolveAgentsHome(config.agentsHome)
  const logger = ctx.logger

  const skills = new SkillsStore({ dshHome, agentsHome, maxSkillBytes: config.maxSkillBytes })
  const skillState = new SkillStateStore(join(dshHome, 'skills-mcp-state.json'))
  const skillRuntime = new SkillShadowRuntime({ ctx, state: skillState })
  const mcpConfig = new McpConfigStore({ maxBytes: config.maxMcpConfigBytes })
  const externalMcp = new ExternalMcpManager({ dshHome })
  const runtime = new McpRuntime({
    ctx,
    configStore: mcpConfig,
    systemFile: join(dshHome, 'mcp.json'),
    mountProjectMcp: config.mountProjectMcp,
    external: externalMcp,
  })
  const service = new ManagerService({
    dshHome,
    skills,
    skillState,
    skillRuntime,
    externalMcp,
    mcpConfig,
    runtime,
  })

  runtime.registerLifecycle()
  skillRuntime.registerLifecycle()
  registerTools(ctx, { ctx, service, logger })
  registerApi(ctx, service)

  ctx.effect(() => () => Promise.all([runtime.dispose(), skillRuntime.dispose()]), 'dsh-skills-mcp: runtimes')
  void runtime.start().catch((error: unknown) => {
    logger.warn(`dsh-skills-mcp: 系统级 MCP 启动失败：${messageOf(error)}`)
  })
  void skillRuntime.start().catch((error: unknown) => {
    logger.warn(`dsh-skills-mcp: DSH 技能停用遮蔽启动失败：${messageOf(error)}`)
  })

  logger.debug(`dsh-skills-mcp ${PLUGIN_VERSION}: 已挂载（dshHome=${dshHome}, agentsHome=${agentsHome}）`)
}
