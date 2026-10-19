import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { ExternalMcpManager } from './external-mcp.ts'
import { McpConfigStore } from './mcp-config.ts'
import { ManagerService } from './service.ts'
import type { McpRuntime } from './mcp-runtime.ts'
import type { SkillShadowRuntime } from './skill-runtime.ts'
import type { SkillStateStore } from './skill-state.ts'
import type { SkillsStore } from './skills.ts'

const roots: string[] = []

async function fixture(): Promise<{
  home: string
  project: string
  claudeFile: string
  manager: ExternalMcpManager
  service: ManagerService
  reloads: string[]
}> {
  const home = await mkdtemp(join(tmpdir(), 'dshsm-service-'))
  roots.push(home)
  const project = join(home, 'project')
  await mkdir(project)
  const claudeFile = join(home, '.claude.json')
  await writeFile(claudeFile, JSON.stringify({
    mcpServers: {
      context7: {
        type: 'http',
        url: 'https://mcp.context7.com/mcp',
        headers: { CONTEXT7_API_KEY: 'ctx7-secret' },
        toolCallTimeoutMs: 30000,
      },
    },
    projects: {
      [project]: { mcpServers: { exa: { type: 'http', url: 'https://mcp.exa.ai/mcp' } } },
      '/other': { mcpServers: { local: { type: 'stdio', command: 'node', args: ['server.js'] } } },
    },
  }))
  const manager = new ExternalMcpManager({ dshHome: home, claudeConfigFile: claudeFile })
  const reloads: string[] = []
  const runtime = {
    reloadSystem: async () => { reloads.push('system') },
    refreshProject: async (root: string) => { reloads.push(root) },
  } as unknown as McpRuntime
  const service = new ManagerService({
    dshHome: home,
    skills: {} as SkillsStore,
    skillState: {} as SkillStateStore,
    skillRuntime: {} as SkillShadowRuntime,
    externalMcp: manager,
    mcpConfig: new McpConfigStore({ maxBytes: 256 * 1024 }),
    runtime,
  })
  return { home, project, claudeFile, manager, service, reloads }
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('ManagerService external MCP import', () => {
  it('copies a user-level Claude server into the DSH system config', async () => {
    const { home, manager, service, reloads } = await fixture()
    const context7 = (await manager.list('system')).servers[0]!
    await service.importExternalMcp('system', undefined, context7.id)
    const store = new McpConfigStore({ maxBytes: 256 * 1024 })
    const read = await store.read(join(home, 'mcp.json'))
    expect(read.issue).toBeUndefined()
    expect(read.servers).toHaveLength(1)
    expect(read.servers[0]).toMatchObject({
      name: 'context7',
      transport: 'streamable-http',
      url: 'https://mcp.context7.com/mcp',
      headers: { CONTEXT7_API_KEY: 'ctx7-secret' },
      toolCallTimeoutMs: 30000,
      disabled: false,
    })
    expect(reloads).toEqual(['system'])
  })

  it('imports a server from another Claude project', async () => {
    const { home, manager, service } = await fixture()
    const candidates = await manager.listOtherProjects()
    const local = candidates.servers.find(server => server.name === 'local')!
    await service.importExternalMcp('system', undefined, local.id)
    const read = await new McpConfigStore({ maxBytes: 256 * 1024 }).read(join(home, 'mcp.json'))
    expect(read.servers[0]).toMatchObject({
      name: 'local',
      transport: 'stdio',
      command: 'node',
      args: ['server.js'],
    })
  })

  it('imports into a project scope and refuses duplicate names', async () => {
    const { project, manager, service, reloads } = await fixture()
    const exa = (await manager.list('project', project)).servers[0]!
    await service.importExternalMcp('project', project, exa.id)
    const read = await new McpConfigStore({ maxBytes: 256 * 1024 }).read(join(project, '.dsh', 'mcp.json'))
    expect(read.servers[0]).toMatchObject({ name: 'exa', url: 'https://mcp.exa.ai/mcp' })
    await expect(service.importExternalMcp('project', project, exa.id)).rejects.toThrow(/已存在/)
    expect(reloads).toHaveLength(1)
  })

  it('rejects unknown ids and invalid external entries', async () => {
    const { service } = await fixture()
    await expect(service.importExternalMcp('system', undefined, 'claude-code:system::missing'))
      .rejects.toThrow(/不存在/)
  })
})
