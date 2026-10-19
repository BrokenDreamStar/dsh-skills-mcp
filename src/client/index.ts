import { SkillsMcpSection } from './Section.tsx'
import { injectStyles } from './style.ts'
import { en, zh } from './locales.ts'
import type { ClientCtx, ClientProject, WorkspacesServiceLike } from './types.ts'

export const inject = ['slots', 'locale']

const NS = 'dsh-skills-mcp'
const SECTION_ID = 'dsh-skills-mcp'
const SECTION_ORDER = 22

/** 在设置左列注册系统级 / 项目级 Skills 与 MCP 管理页。 */
export function apply(ctx: ClientCtx): void {
  injectStyles()
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-skills-mcp: dictionaries')
  const t = ctx.locale.bind(NS)
  const getWorkspaces = (): WorkspacesServiceLike | undefined => {
    try {
      return ctx.get('workspaces') as WorkspacesServiceLike | undefined
    } catch {
      return undefined
    }
  }
  const listProjects = (): ClientProject[] => {
    try {
      const items = getWorkspaces()?.list.getSnapshot().items ?? []
      return items.map(item => ({ title: item.title, path: item.path }))
    } catch {
      return []
    }
  }
  const subscribeProjects = (listener: () => void): (() => void) => {
    try {
      return getWorkspaces()?.list.subscribe(listener) ?? (() => {})
    } catch {
      return () => {}
    }
  }

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: SECTION_ID,
    order: SECTION_ORDER,
    label: () => t('nav'),
    locale: NS,
    inject: () => ({ listProjects, subscribeProjects }),
  }, SkillsMcpSection as unknown as (props: Record<string, unknown>) => unknown))
}
