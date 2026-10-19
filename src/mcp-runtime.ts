import { join } from 'node:path'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { Context, Fiber, Plugin } from '@deepseek-ai/cordis'
import type { McpConfigEntry, McpConfigStore } from './mcp-config.ts'
import { toMcpClientConfig } from './mcp-config.ts'
import type { ExternalMcpRuntimeSource, ExternalMcpServer } from './external-mcp.ts'
import type { RuntimeState } from './shared.ts'
import { ManagerError, messageOf } from './errors.ts'
import { briefError, isMcpServerName, resolveProjectRoot } from './paths.ts'

export interface ServerRuntimeStatus {
  state: Exclude<RuntimeState, 'disabled' | 'idle'>
  error?: string
  toolCount?: number
}

export interface ProjectRuntimeStatus {
  activeAgents: number
  servers: Record<string, ServerRuntimeStatus>
  externalServers: Record<string, ServerRuntimeStatus>
}

interface MountedServer {
  /** 配置中的 serverName；外部条目以 id 为 map key，但冲突检查必须用这个名字。 */
  name: string
  signature: string
  status: ServerRuntimeStatus
  fiber?: Fiber
}

interface AgentEntry {
  root: string
  servers: Map<string, MountedServer>
  externalServers: Map<string, MountedServer>
}

interface McpClientModule {
  Config: (value: Record<string, unknown>) => unknown
  apply?: (ctx: Context, config: unknown) => unknown
  default?: unknown
}

export interface McpRuntimeOptions {
  ctx: Context
  configStore: McpConfigStore
  systemFile: string
  mountProjectMcp: boolean
  external?: ExternalMcpRuntimeSource
}

const REDACT_PATTERNS: readonly [RegExp, string][] = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]'],
  [/([?&](?:token|key|api[_-]?key|access[_-]?token|secret|password)=)[^&\s]+/gi, '$1[redacted]'],
  [/\/\/[^/@\s]+:[^/@\s]+@/g, '//[redacted]@'],
  [/("?(?:authorization|token|api[_-]?key|secret|password)"?\s*[:=]\s*"?)[^",\s}]+/gi, '$1[redacted]'],
]

/** 按 agent 挂载项目级 MCP；系统级 MCP 挂在插件自身的全局作用域。 */
export class McpRuntime {
  private readonly system = new Map<string, MountedServer>()
  private readonly systemNames = new Set<string>()
  private readonly externalSystem = new Map<string, MountedServer>()
  private readonly externalSystemNames = new Set<string>()
  private readonly agents = new Map<Agent, AgentEntry>()
  private readonly pending = new Set<Promise<void>>()
  private modulePromise: Promise<McpClientModule> | undefined
  private systemReloading: Promise<void> | undefined
  private projectQueue: Promise<unknown> = Promise.resolve()
  private disposed = false

  constructor(private readonly options: McpRuntimeOptions) {}

  /** 注册 per-agent 生命周期；系统级连接由 {@link start} 建立。 */
  registerLifecycle(): void {
    this.options.ctx.on('agent/created', async ({ agent, signal }) => {
      // 项目级 MCP 在首个提示词前完成挂载；单台服务器失败只会记录状态，
      // 不会拒绝会话创建。
      await this.withProjectLock(async () => {
        signal?.throwIfAborted()
        await this.syncAgent(agent)
      })
    }, { prepend: true })
    this.options.ctx.on('agent/disposed', ({ agent }) => {
      this.track(this.withProjectLock(() => this.removeAgent(agent)))
    })
  }

  async start(): Promise<void> {
    await this.reloadSystem()
    await this.syncExistingAgents()
  }

  /** HMR 重新装载后，为已存在的会话补挂项目级 MCP。 */
  private async syncExistingAgents(): Promise<void> {
    if (this.disposed || !this.options.mountProjectMcp) return
    let agents: Agent[] = []
    try {
      const registry = this.options.ctx.get('agents') as { list(): Agent[] } | undefined
      agents = registry?.list() ?? []
    } catch {
      return
    }
    await this.withProjectLock(async () => {
      for (const agent of agents) {
        if (this.disposed) return
        await this.syncAgent(agent).catch((error: unknown) => {
          this.options.ctx.logger.warn(`dsh-skills-mcp: 为已有会话加载项目级 MCP 失败：${briefRedacted(error)}`)
        })
      }
    })
  }

  async reloadSystem(): Promise<void> {
    if (this.systemReloading !== undefined) return this.systemReloading
    const task = (async () => {
      await this.doReloadSystem()
      await this.refreshAllProjects()
    })()
    this.systemReloading = task
    this.track(task)
    try {
      await task
    } finally {
      if (this.systemReloading === task) this.systemReloading = undefined
    }
  }

  private async doReloadSystem(): Promise<void> {
    if (this.disposed) return
    const result = await this.options.configStore.read(this.options.systemFile)
    if (result.issue !== undefined) {
      this.options.ctx.logger.warn(`dsh-skills-mcp: 系统级 MCP 配置不可用：${result.issue}`)
      await this.disposeServers(this.system)
      this.system.clear()
      this.systemNames.clear()
    } else {
      const desired = new Map(result.servers.filter(server => !server.disabled).map(server => [server.name, server]))
      // 已配置的 managed 名字（含 disabled）都会遮蔽同名外部条目；
      // 用户想回到外部来源时，应删除 managed 条目，而不是只把它停用。
      const configuredNames = new Set(result.servers.map(server => server.name))
      this.systemNames.clear()
      for (const name of desired.keys()) this.systemNames.add(name)
      // 先卸掉与即将挂载的 DSH 条目同名的外部实例，避免 mcp-client 的 serverName 冲突。
      await this.pruneExternalSystem(configuredNames)
      for (const [name, mounted] of [...this.system]) {
        const entry = desired.get(name)
        if (entry === undefined || entry.issue !== undefined) {
          await this.disposeServers(new Map([[name, mounted]]))
          this.system.delete(name)
        }
      }
      for (const [name, entry] of desired) {
        if (entry.issue !== undefined) {
          this.system.set(name, {
            name,
            signature: '',
            status: { state: 'error', error: entry.issue },
          })
          continue
        }
        const signature = signatureOf(entry, '')
        const existing = this.system.get(name)
        if (existing?.signature === signature && existing.status.state === 'ready') continue
        if (existing !== undefined) {
          await this.disposeServers(new Map([[name, existing]]))
          this.system.delete(name)
        }
        this.system.set(name, {
          name,
          signature,
          status: { state: 'starting' },
        })
        const mounted = await this.mount(entry, this.options.ctx, '')
        this.system.set(name, { name, signature, ...mounted })
      }
      await this.reloadExternalSystem(configuredNames)
      return
    }
    await this.reloadExternalSystem()
  }

  /** 已发现的 Claude Code 等外部系统级 MCP；启停状态由独立 overlay 决定。 */
  private async reloadExternalSystem(reserved: ReadonlySet<string> = this.systemNames): Promise<void> {
    if (this.disposed) return
    let servers: readonly ExternalMcpServer[] = []
    if (this.options.external !== undefined) {
      try {
        servers = await this.options.external.enabledSystem()
      } catch (error) {
        this.options.ctx.logger.warn(`dsh-skills-mcp: 读取外部系统级 MCP 失败：${briefRedacted(error)}`)
        return
      }
    }
    const desiredNames = new Set(reserved)
    const all = new Map(servers.map(server => [server.id, server]))
    for (const [id, mounted] of [...this.externalSystem]) {
      if (!all.has(id)) {
        await this.disposeServers(new Map([[id, mounted]]))
        this.externalSystem.delete(id)
      }
    }
    this.externalSystemNames.clear()
    for (const server of servers) {
      const existing = this.externalSystem.get(server.id)
      if (server.entry.issue !== undefined) {
        if (existing !== undefined) {
          await this.disposeServers(new Map([[server.id, existing]]))
          this.externalSystem.delete(server.id)
        }
        this.externalSystem.set(server.id, {
          name: server.name,
          signature: '',
          status: { state: 'error', error: server.entry.issue },
        })
        continue
      }
      if (desiredNames.has(server.name)) {
        if (existing !== undefined) {
          await this.disposeServers(new Map([[server.id, existing]]))
          this.externalSystem.delete(server.id)
        }
        this.externalSystem.set(server.id, {
          name: server.name,
          signature: '',
          status: { state: 'error', error: `MCP 服务器名 ${server.name} 已被占用，外部服务器未加载` },
        })
        continue
      }
      desiredNames.add(server.name)
      const signature = signatureOf(server.entry, '')
      if (existing?.signature === signature && existing.status.state === 'ready') {
        this.externalSystemNames.add(server.name)
        continue
      }
      if (existing !== undefined) {
        await this.disposeServers(new Map([[server.id, existing]]))
        this.externalSystem.delete(server.id)
      }
      this.externalSystem.set(server.id, { name: server.name, signature, status: { state: 'starting' } })
      const mounted = await this.mount(server.entry, this.options.ctx, '')
      this.externalSystem.set(server.id, { name: server.name, signature, ...mounted })
      if (mounted.status.state === 'ready') this.externalSystemNames.add(server.name)
    }
  }

  private async refreshAllProjects(): Promise<void> {
    await this.withProjectLock(async () => {
      for (const [agent, entry] of this.agents) {
        if (this.disposed) return
        await this.resyncAgent(agent, entry.root)
      }
    })
  }

  /** 重新读取项目配置并重挂该项目全部活动会话的服务器。 */
  async refreshProject(root: string): Promise<void> {
    await this.withProjectLock(async () => {
      const affected = [...this.agents.entries()].filter(([, entry]) => entry.root === root)
      await Promise.all(affected.map(([agent]) => this.resyncAgent(agent, root)))
    })
  }

  projectStatus(root: string): ProjectRuntimeStatus {
    const entries = [...this.agents.values()].filter(entry => entry.root === root)
    return {
      activeAgents: entries.length,
      servers: aggregateStatuses(entries.map(entry => entry.servers)),
      externalServers: aggregateStatuses(entries.map(entry => entry.externalServers)),
    }
  }

  systemStatus(): Record<string, ServerRuntimeStatus> {
    return Object.fromEntries([...this.system].map(([name, mounted]) => [name, { ...mounted.status }]))
  }

  externalSystemStatus(): Record<string, ServerRuntimeStatus> {
    return Object.fromEntries([...this.externalSystem].map(([id, mounted]) => [id, { ...mounted.status }]))
  }

  async dispose(): Promise<void> {
    if (this.disposed) return
    this.disposed = true
    await Promise.allSettled([...this.pending])
    await this.projectQueue.catch(() => {})
    await this.disposeServers(this.system)
    this.system.clear()
    this.systemNames.clear()
    await this.disposeServers(this.externalSystem)
    this.externalSystem.clear()
    this.externalSystemNames.clear()
    for (const entry of this.agents.values()) {
      await this.disposeServers(entry.servers)
      await this.disposeServers(entry.externalServers)
    }
    this.agents.clear()
  }

  private async syncAgent(agent: Agent): Promise<void> {
    if (this.disposed) return
    const cwd = agent.session.header.cwd
    if (cwd === undefined) {
      this.options.ctx.logger.debug('dsh-skills-mcp: 会话没有 cwd，跳过项目级 MCP')
      return
    }
    let root: string
    try {
      root = await resolveProjectRoot(cwd)
    } catch (error) {
      this.options.ctx.logger.warn(`dsh-skills-mcp: 无法确定项目根：${briefRedacted(error)}`)
      return
    }
    await this.resyncAgent(agent, root)
  }

  private async resyncAgent(agent: Agent, root: string): Promise<void> {
    if (this.disposed) return
    if (!this.options.mountProjectMcp) return
    let entry = this.agents.get(agent)
    if (entry === undefined) {
      entry = { root, servers: new Map(), externalServers: new Map() }
      this.agents.set(agent, entry)
    } else {
      entry.root = root
    }
    const usedNames = new Set([...this.systemNames, ...this.externalSystemNames])
    const result = await this.options.configStore.read(projectConfigFile(root))
    if (result.issue !== undefined) {
      this.options.ctx.logger.warn(`dsh-skills-mcp: 项目级 MCP 配置不可用（${root}）：${result.issue}`)
      await this.disposeServers(entry.servers)
      entry.servers.clear()
    } else {
      const desired = result.servers.filter(server => !server.disabled && isMcpServerName(server.name))
      // 与系统级一致：managed 条目（含 disabled）按名字遮蔽外部条目。
      const configuredNames = new Set(result.servers.map(server => server.name))
      for (const name of configuredNames) usedNames.add(name)
      // 项目级同样先卸载同名外部实例，再挂载 DSH 管理条目。
      await this.pruneExternalProject(entry, configuredNames)
      for (const [name, mounted] of [...entry.servers]) {
        if (!desired.some(server => server.name === name)) {
          await this.disposeServers(new Map([[name, mounted]]))
          entry.servers.delete(name)
        }
      }
      for (const server of desired) {
        usedNames.add(server.name)
        if (server.issue !== undefined) {
          const existing = entry.servers.get(server.name)
          if (existing !== undefined) await this.disposeServers(new Map([[server.name, existing]]))
          entry.servers.set(server.name, { name: server.name, signature: '', status: { state: 'error', error: server.issue } })
          continue
        }
        if (this.systemNames.has(server.name) || this.externalSystemNames.has(server.name)) {
          const existing = entry.servers.get(server.name)
          if (existing !== undefined) await this.disposeServers(new Map([[server.name, existing]]))
          entry.servers.set(server.name, {
            name: server.name,
            signature: '',
            status: { state: 'error', error: `与系统级 MCP 服务器 ${server.name} 重名，项目级条目不加载` },
          })
          continue
        }
        const signature = signatureOf(server, root)
        const existing = entry.servers.get(server.name)
        if (existing?.signature === signature && existing.status.state === 'ready') continue
        if (existing !== undefined) await this.disposeServers(new Map([[server.name, existing]]))
        entry.servers.set(server.name, { name: server.name, signature, status: { state: 'starting' } })
        const mounted = await this.mount(server, agent.ctx, root, agent)
        entry.servers.set(server.name, { name: server.name, signature, ...mounted })
      }
    }
    await this.resyncExternalProject(agent, entry, root, usedNames)
  }

  private async resyncExternalProject(
    agent: Agent,
    entry: AgentEntry,
    root: string,
    usedNames: Set<string>,
  ): Promise<void> {
    let servers: readonly ExternalMcpServer[] = []
    if (this.options.external !== undefined) {
      try {
        servers = await this.options.external.enabledProject(root)
      } catch (error) {
        this.options.ctx.logger.warn(`dsh-skills-mcp: 读取项目外部 MCP 失败：${briefRedacted(error)}`)
        return
      }
    }
    const all = new Map(servers.map(server => [server.id, server]))
    for (const [id, mounted] of [...entry.externalServers]) {
      if (!all.has(id)) {
        await this.disposeServers(new Map([[id, mounted]]))
        entry.externalServers.delete(id)
      }
    }
    for (const server of servers) {
      const existing = entry.externalServers.get(server.id)
      if (server.entry.issue !== undefined) {
        if (existing !== undefined) {
          await this.disposeServers(new Map([[server.id, existing]]))
          entry.externalServers.delete(server.id)
        }
        entry.externalServers.set(server.id, {
          name: server.name,
          signature: '',
          status: { state: 'error', error: server.entry.issue },
        })
        continue
      }
      if (usedNames.has(server.name)) {
        if (existing !== undefined) {
          await this.disposeServers(new Map([[server.id, existing]]))
          entry.externalServers.delete(server.id)
        }
        entry.externalServers.set(server.id, {
          name: server.name,
          signature: '',
          status: { state: 'error', error: `MCP 服务器名 ${server.name} 已被占用，外部服务器未加载` },
        })
        continue
      }
      usedNames.add(server.name)
      const signature = signatureOf(server.entry, root)
      if (existing?.signature === signature && existing.status.state === 'ready') continue
      if (existing !== undefined) {
        await this.disposeServers(new Map([[server.id, existing]]))
        entry.externalServers.delete(server.id)
      }
      entry.externalServers.set(server.id, { name: server.name, signature, status: { state: 'starting' } })
      const mounted = await this.mount(server.entry, agent.ctx, root, agent)
      entry.externalServers.set(server.id, { name: server.name, signature, ...mounted })
    }
  }

  /**
   * 卸载与保留名冲突的外部系统实例。
   * 导入外部条目、启用同名 DSH 条目时，managed 实例必须先于外部实例释放，
   * 否则 mcp-client 会因 serverName 重复而拒绝新的挂载。
   */
  private async pruneExternalSystem(reserved: ReadonlySet<string>): Promise<void> {
    if (reserved.size === 0) return
    const doomed = new Map<string, MountedServer>()
    for (const [id, mounted] of this.externalSystem) {
      if (reserved.has(mounted.name)) doomed.set(id, mounted)
    }
    if (doomed.size === 0) return
    await this.disposeServers(doomed)
    for (const [id, mounted] of doomed) {
      this.externalSystem.delete(id)
      this.externalSystemNames.delete(mounted.name)
    }
  }

  /** 项目级版本：释放该 Agent 上即将被 managed 条目接管的同名外部实例。 */
  private async pruneExternalProject(entry: AgentEntry, reserved: ReadonlySet<string>): Promise<void> {
    if (reserved.size === 0) return
    const doomed = new Map<string, MountedServer>()
    for (const [id, mounted] of entry.externalServers) {
      if (reserved.has(mounted.name)) doomed.set(id, mounted)
    }
    if (doomed.size === 0) return
    await this.disposeServers(doomed)
    for (const id of doomed.keys()) entry.externalServers.delete(id)
  }

  private async mount(
    entry: McpConfigEntry,
    target: Context,
    defaultCwd: string,
    agent?: Agent,
  ): Promise<Omit<MountedServer, 'signature' | 'name'>> {
    let fiber: Fiber | undefined
    try {
      const module = await this.loadModule()
      const config = module.Config(toMcpClientConfig(entry, defaultCwd))
      fiber = target.plugin(module as unknown as Plugin, config)
      await fiber.await()
      if (this.disposed) {
        await fiber.dispose()
        return { status: { state: 'error', error: '插件已卸载' } }
      }
      const tools = this.toolsFor(agent)
      const toolCount = tools.filter(tool => tool.name.startsWith(`mcp__${entry.name}__`)).length
      return { fiber, status: { state: 'ready', toolCount } }
    } catch (error) {
      if (fiber !== undefined) {
        await Promise.resolve(fiber.dispose()).catch(() => {})
      }
      const message = briefError(new ManagerError('unavailable', redact(errorChain(error))))
      this.options.ctx.logger.warn(`dsh-skills-mcp: MCP 服务器 ${entry.name} 加载失败：${message}`)
      return { status: { state: 'error', error: message } }
    }
  }

  private toolsFor(agent?: Agent): readonly { name: string }[] {
    try {
      const tools = this.options.ctx.tools as unknown as { schemas(scope?: object): readonly { name: string }[] }
      return tools.schemas(agent) ?? []
    } catch {
      return []
    }
  }

  private loadModule(): Promise<McpClientModule> {
    this.modulePromise ??= import('@deepseek-ai/dsh-mcp-client').then(module => module as unknown as McpClientModule)
    return this.modulePromise
  }

  private async removeAgent(agent: Agent): Promise<void> {
    const entry = this.agents.get(agent)
    if (entry === undefined) return
    this.agents.delete(agent)
    await this.disposeServers(entry.servers)
    await this.disposeServers(entry.externalServers)
  }

  private withProjectLock<T>(operation: () => Promise<T>): Promise<T> {
    const task = this.projectQueue.then(operation, operation)
    this.projectQueue = task.then(() => undefined, () => undefined)
    return task
  }

  private async disposeServers(servers: Map<string, MountedServer>): Promise<void> {
    await Promise.allSettled([...servers.values()].map(async server => {
      await Promise.resolve(server.fiber?.dispose()).catch(() => {})
    }))
  }

  private track(task: Promise<unknown>): void {
    const handled = task.then(() => {}, error => {
      this.options.ctx.logger.warn(`dsh-skills-mcp: MCP 后台同步失败：${briefRedacted(error)}`)
    }).finally(() => {
      this.pending.delete(handled)
    })
    this.pending.add(handled)
  }
}

export function projectConfigFile(projectRoot: string): string {
  return join(projectRoot, '.dsh', 'mcp.json')
}

function signatureOf(entry: McpConfigEntry, defaultCwd: string): string {
  try {
    return JSON.stringify(toMcpClientConfig(entry, defaultCwd))
  } catch {
    return ''
  }
}

function statusRank(state: ServerRuntimeStatus['state']): number {
  if (state === 'ready') return 3
  if (state === 'starting') return 2
  return 1
}

function aggregateStatuses(
  maps: readonly ReadonlyMap<string, MountedServer>[],
): Record<string, ServerRuntimeStatus> {
  const result: Record<string, ServerRuntimeStatus> = {}
  for (const map of maps) {
    for (const [id, mounted] of map) {
      const previous = result[id]
      if (previous === undefined || statusRank(mounted.status.state) > statusRank(previous.state)) {
        result[id] = { ...mounted.status }
        continue
      }
      if (previous.state === 'ready' && mounted.status.state === 'ready') {
        result[id] = {
          state: 'ready',
          toolCount: Math.max(previous.toolCount ?? 0, mounted.status.toolCount ?? 0),
        }
      }
    }
  }
  return result
}

function redact(text: string): string {
  let result = text
  for (const [pattern, replacement] of REDACT_PATTERNS) result = result.replace(pattern, replacement)
  return result
}

function briefRedacted(error: unknown): string {
  return briefError(new ManagerError('unavailable', redact(errorChain(error))))
}

/** 保留最多三层 cause，否则 Cordis 只留下无信息量的外层错误。 */
function errorChain(error: unknown): string {
  const parts: string[] = []
  let current: unknown = error
  for (let depth = 0; depth < 4 && current !== undefined && current !== null; depth += 1) {
    parts.push(messageOf(current))
    current = current instanceof Error ? current.cause : undefined
  }
  return [...new Set(parts)].join(' ← ')
}
