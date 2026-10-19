import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { ExternalMcpManager } from './external-mcp.ts'

const roots: string[] = []

async function fixture(): Promise<{
  home: string
  project: string
  claudeFile: string
  stateFile: string
  manager: ExternalMcpManager
}> {
  const home = await mkdtemp(join(tmpdir(), 'dshsm-external-mcp-'))
  roots.push(home)
  const project = join(home, 'project')
  await mkdir(project)
  const claudeFile = join(home, '.claude.json')
  const stateFile = join(home, 'state', 'mcp-external.json')
  return {
    home,
    project,
    claudeFile,
    stateFile,
    manager: new ExternalMcpManager({
      dshHome: home,
      claudeConfigFile: claudeFile,
      stateFile,
    }),
  }
}

async function writeClaude(file: string, project: string): Promise<void> {
  await writeFile(file, JSON.stringify({
    mcpServers: {
      context7: {
        type: 'http',
        url: 'https://mcp.context7.com/mcp?token=secret',
        headers: { CONTEXT7_API_KEY: 'ctx7-secret' },
      },
    },
    projects: {
      [project]: {
        mcpServers: {
          exa: { type: 'http', url: 'https://mcp.exa.ai/mcp' },
        },
      },
      '/other': { mcpServers: { ignored: { type: 'stdio', command: 'ignored' } } },
    },
  }))
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('ExternalMcpManager', () => {
  it('discovers Claude Code user and project MCP servers enabled by default', async () => {
    const { claudeFile, project, manager } = await fixture()
    await writeClaude(claudeFile, project)
    const system = await manager.list('system')
    expect(system.servers.map(server => [server.name, server.entry.transport, server.enabled])).toEqual([
      ['context7', 'streamable-http', true],
    ])
    const scoped = await manager.list('project', project)
    expect(scoped.servers.map(server => [server.name, server.enabled])).toEqual([['exa', true]])
    expect((await manager.enabledSystem()).map(server => server.name)).toEqual(['context7'])
    expect((await manager.enabledProject(project)).map(server => server.name)).toEqual(['exa'])
  })

  it('persists an explicit opt-out without copying secrets', async () => {
    const { claudeFile, project, stateFile, manager } = await fixture()
    await writeClaude(claudeFile, project)
    const system = await manager.list('system')
    const context7 = system.servers[0]!
    await manager.setEnabled('system', undefined, context7.id, false)
    expect(await manager.enabledSystem()).toEqual([])
    const scoped = await manager.list('project', project)
    const exa = scoped.servers[0]!
    await manager.setEnabled('project', project, exa.id, false)
    expect(await manager.enabledProject(project)).toEqual([])
    const state = await readFile(stateFile, 'utf8')
    expect(state).not.toContain('ctx7-secret')
    expect(state).not.toContain('context7.com')
    const parsed = JSON.parse(state) as { version: number; disabled: string[] }
    expect(parsed.version).toBe(2)
    expect(parsed.disabled).toHaveLength(2)
    const claude = await readFile(claudeFile, 'utf8')
    expect(claude).toContain('ctx7-secret')

    await manager.setEnabled('system', undefined, context7.id, true)
    expect((await manager.enabledSystem()).map(server => server.name)).toEqual(['context7'])
    expect((JSON.parse(await readFile(stateFile, 'utf8')) as { disabled: string[] }).disabled).toHaveLength(1)
  })

  it('keeps servers disabled when the Claude entry itself is disabled', async () => {
    const { claudeFile, project, manager } = await fixture()
    await writeFile(claudeFile, JSON.stringify({
      mcpServers: { paused: { type: 'http', url: 'https://example.test/mcp', disabled: true } },
    }))
    expect((await manager.enabledSystem()).map(server => server.name)).toEqual([])
    const projectListing = await manager.list('project', project)
    expect(projectListing.servers).toEqual([])
  })

  it('lists project-scoped servers from other projects as import candidates', async () => {
    const { claudeFile, project, manager } = await fixture()
    await writeClaude(claudeFile, project)
    const others = await manager.listOtherProjects(project)
    expect(others.servers.map(server => [server.name, server.projectRoot])).toEqual([['ignored', '/other']])
    const all = await manager.listOtherProjects()
    expect(all.servers.map(server => server.name).sort()).toEqual(['exa', 'ignored'])
  })

  it('finds a server by id across user, current project and other projects', async () => {
    const { claudeFile, project, manager } = await fixture()
    await writeClaude(claudeFile, project)
    const system = await manager.list('system')
    const scoped = await manager.list('project', project)
    const others = await manager.listOtherProjects(project)
    expect((await manager.findById(system.servers[0]!.id))?.name).toBe('context7')
    expect((await manager.findById(scoped.servers[0]!.id, project))?.name).toBe('exa')
    expect((await manager.findById(others.servers[0]!.id, project))?.name).toBe('ignored')
    expect(await manager.findById('claude-code:system::missing')).toBeUndefined()
  })

  it('migrates the legacy v1 allowlist to a v2 opt-out list', async () => {
    const { claudeFile, project, stateFile, manager } = await fixture()
    await writeClaude(claudeFile, project)
    const scoped = await manager.list('project', project)
    const exaId = scoped.servers[0]!.id
    await mkdir(join(stateFile, '..'), { recursive: true })
    await writeFile(stateFile, JSON.stringify({ version: 1, enabled: [exaId] }))

    const system = await manager.list('system')
    expect(system.servers[0]?.enabled).toBe(false)
    expect((await manager.enabledProject(project)).map(server => server.name)).toEqual(['exa'])

    const context7Id = system.servers[0]!.id
    await manager.setEnabled('system', undefined, context7Id, true)
    const parsed = JSON.parse(await readFile(stateFile, 'utf8')) as { version: number; disabled: string[] }
    expect(parsed.version).toBe(2)
    expect(parsed.disabled).not.toContain(context7Id)
    expect(parsed.disabled).not.toContain(exaId)
    expect(parsed.disabled).toHaveLength(1)
  })

  it('reads project .mcp.json and lets it override the same name in claude.json', async () => {
    const { claudeFile, project, manager } = await fixture()
    await writeClaude(claudeFile, project)
    await writeFile(join(project, '.mcp.json'), JSON.stringify({
      mcpServers: {
        exa: { type: 'stdio', command: 'npx', args: ['exa-local'] },
      },
    }))
    const listing = await manager.list('project', project)
    expect(listing.servers.find(server => server.name === 'exa')?.entry).toMatchObject({
      transport: 'stdio',
      command: 'npx',
    })
  })

  it('reports malformed Claude config and unsupported entries without throwing', async () => {
    const { claudeFile, project, manager } = await fixture()
    await writeFile(claudeFile, '{ bad json')
    const system = await manager.list('system')
    expect(system.servers).toEqual([])
    expect(system.issues.join('\n')).toMatch(/读取 .*\.claude\.json 失败/)

    await writeClaude(claudeFile, project)
    await writeFile(claudeFile, JSON.stringify({
      mcpServers: { sse: { type: 'sse', url: 'https://example.test/sse' } },
    }))
    const broken = await manager.list('system')
    expect(broken.servers[0]?.entry.issue).toMatch(/transport/)
  })

  it('rejects enabling an unknown external id', async () => {
    const { claudeFile, project, manager } = await fixture()
    await writeClaude(claudeFile, project)
    await expect(manager.setEnabled('system', undefined, 'claude-code:system::missing', true))
      .rejects.toThrow(/不存在/)
  })
})
