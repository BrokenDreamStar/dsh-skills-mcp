import z from '@deepseek-ai/schemastery'

/** 插件配置。管理数据本身保存在 skills 目录与 mcp.json，不使用 settings.yaml。 */
export interface Config {
  /** DSH home；留空使用 `$DSH_HOME` 或 `~/.dsh`。 */
  dshHome?: string
  /** Shared Agents home；留空使用 `$DSH_AGENTS_HOME` 或 `~/.agents`。 */
  agentsHome?: string
  /** 单个 SKILL.md 的最大字节数。 */
  maxSkillBytes?: number
  /** 单个 mcp.json 的最大字节数。 */
  maxMcpConfigBytes?: number
  /** 是否把项目级 MCP 加载到该项目内创建的会话；关闭后只做配置管理。 */
  mountProjectMcp?: boolean
}

export const Config: z<Config> = z.object({
  dshHome: z.string().default(''),
  agentsHome: z.string().default(''),
  maxSkillBytes: z.natural().min(1024).default(256 * 1024),
  maxMcpConfigBytes: z.natural().min(1024).default(1024 * 1024),
  mountProjectMcp: z.boolean().default(true),
})

export function normalizeConfig(
  config: Config,
): Required<Omit<Config, 'dshHome' | 'agentsHome'>> & Pick<Config, 'dshHome' | 'agentsHome'> {
  return {
    dshHome: config.dshHome?.trim() || undefined,
    agentsHome: config.agentsHome?.trim() || undefined,
    maxSkillBytes: config.maxSkillBytes ?? 256 * 1024,
    maxMcpConfigBytes: config.maxMcpConfigBytes ?? 1024 * 1024,
    mountProjectMcp: config.mountProjectMcp ?? true,
  }
}
