import { describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { ExternalMcpRuntimeSource, ExternalMcpServer } from './external-mcp.ts'
import type { McpConfigEntry, McpConfigStore } from './mcp-config.ts'
import { McpRuntime } from './mcp-runtime.ts'

/**
 * 用 mock ctx 模拟 mcp-client 的 serverName 唯一性：同一 ctx 上第二次挂载
 * 同名服务器必须失败。真实报错文案来自 mcp-client，这里保持同一关键片段。
 */
const { mountedNames } = vi.hoisted(() => ({ mountedNames: new WeakMap<object, Set<string>>() }))

vi.mock('@deepseek-ai/dsh-mcp-client', () => ({
  Config: (value: Record<string, unknown>) => value,
  apply: (ctx: Context, config: { serverName?: string }) => {
    let names = mountedNames.get(ctx)
    if (names === undefined) {
      names = new Set()
      mountedNames.set(ctx, names)
    }
    const name = config.serverName ?? ''
    if (names.has(name)) {
      throw new Error(`mcp-client: serverName "${name}" is already in use by another mcp-client instance`)
    }
    names.add(name)
  },
}))

interface Harness {
  ctx: Context
  warnings: string[]
  configStore: { servers: McpConfigEntry[]; read(file: string): Promise<unknown> }
  external: ExternalMcpRuntimeSource & { servers: ExternalMcpServer[] }
}

function configEntry(name: string): McpConfigEntry {
  return {
    name,
    transport: 'streamable-http',
    disabled: false,
    url: `https://example.com/${name}`,
    raw: {},
  }
}

function externalServer(name: string): ExternalMcpServer {
  return {
    id: `claude-code:system:${name}`,
    source: 'claude-code',
    origin: 'test',
    scope: 'system',
    name,
    entry: configEntry(name),
    configPath: '/tmp/.claude.json',
    enabled: true,
  }
}

function createHarness(): Harness {
  const warnings: string[] = []
  const ctx = {
    logger: {
      warn: (message: string) => { warnings.push(message) },
      debug: () => {},
    },
    tools: {
      schemas: () => [...(mountedNames.get(ctx as unknown as object) ?? [])]
        .map(name => ({ name: `mcp__${name}__test` })),
    },
    plugin(module: { apply?: (ctx: unknown, config: unknown) => unknown }, config: { serverName?: string }) {
      const names = mountedNames.get(this as unknown as object) ?? new Set<string>()
      mountedNames.set(this as unknown as object, names)
      module.apply?.(this, config)
      return {
        await: async () => {},
        dispose: async () => { names.delete(config.serverName ?? '') },
      }
    },
    on: () => () => {},
    get: () => undefined,
  } as unknown as Context
  const configStore = {
    servers: [] as McpConfigEntry[],
    async read(file: string) {
      return { file, exists: true, raw: {}, servers: configStore.servers }
    },
  }
  const external = {
    servers: [] as ExternalMcpServer[],
    async enabledSystem() { return external.servers },
    async enabledProject() { return [] },
  }
  return { ctx, warnings, configStore, external }
}

describe('McpRuntime external takeover', () => {
  it('takes over a mounted external server when a managed entry with the same name appears', async () => {
    const harness = createHarness()
    harness.external.servers = [externalServer('context7')]
    const runtime = new McpRuntime({
      ctx: harness.ctx,
      configStore: harness.configStore as unknown as McpConfigStore,
      systemFile: '/tmp/mcp.json',
      mountProjectMcp: false,
      external: harness.external,
    })
    try {
      await runtime.reloadSystem()
      expect(runtime.externalSystemStatus()['claude-code:system:context7']?.state).toBe('ready')

      // 模拟“导入”：外部条目仍在配置中，但 managed 配置里出现同名条目。
      harness.configStore.servers = [configEntry('context7')]
      await runtime.reloadSystem()

      expect(runtime.systemStatus().context7).toMatchObject({ state: 'ready', toolCount: 1 })
      expect(harness.warnings.some(message => message.includes('already in use'))).toBe(false)

      // managed 条目即使停用也遮蔽外部条目；删除后才回到外部来源。
      harness.configStore.servers = [{ ...configEntry('context7'), disabled: true }]
      await runtime.reloadSystem()
      expect(runtime.systemStatus().context7).toBeUndefined()
      expect(runtime.externalSystemStatus()['claude-code:system:context7']?.state).not.toBe('ready')

      harness.configStore.servers = []
      await runtime.reloadSystem()
      expect(runtime.externalSystemStatus()['claude-code:system:context7']?.state).toBe('ready')
      expect(harness.warnings.some(message => message.includes('already in use'))).toBe(false)
    } finally {
      await runtime.dispose()
    }
  })
})
