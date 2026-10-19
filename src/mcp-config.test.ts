import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { Config as McpClientConfig } from '@deepseek-ai/dsh-mcp-client'
import { McpConfigStore, toMcpClientConfig } from './mcp-config.ts'

const roots: string[] = []

async function fixture(): Promise<{ file: string; store: McpConfigStore }> {
  const root = await mkdtemp(join(tmpdir(), 'dshsm-mcp-'))
  roots.push(root)
  return {
    file: join(root, 'mcp.json'),
    store: new McpConfigStore({ maxBytes: 256 * 1024 }),
  }
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('McpConfigStore', () => {
  it('reads a missing file as an empty config', async () => {
    const { file, store } = await fixture()
    const read = await store.read(file)
    expect(read.exists).toBe(false)
    expect(read.servers).toEqual([])
    expect(read.issue).toBeUndefined()
  })

  it('saves stdio and HTTP servers, preserving unrelated top-level keys', async () => {
    const { file, store } = await fixture()
    await writeFile(file, JSON.stringify({ custom: { keep: true }, mcpServers: {} }))
    await store.saveServer(file, 'files', {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', 'server-filesystem', '/tmp'],
      env: { TOKEN: 'secret' },
    })
    await store.saveServer(file, 'remote', {
      transport: 'streamable-http',
      url: 'https://example.test/mcp',
      headers: { Authorization: 'Bearer xyz' },
      toolCallTimeoutMs: 15000,
    })
    const parsed = JSON.parse(await readFile(file, 'utf8')) as Record<string, unknown>
    expect(parsed.custom).toEqual({ keep: true })
    const read = await store.read(file)
    expect(read.issue).toBeUndefined()
    expect(read.servers.map(server => server.name)).toEqual(['files', 'remote'])
    expect(read.servers[0]).toMatchObject({
      transport: 'stdio',
      command: 'npx',
      env: { TOKEN: 'secret' },
    })
    expect(read.servers[1]).toMatchObject({
      transport: 'streamable-http',
      url: 'https://example.test/mcp',
      toolCallTimeoutMs: 15000,
    })
    expect((await stat(file)).mode & 0o777).toBe(0o600)
  })

  it('preserves unknown entry fields while applying form edits and rename', async () => {
    const { file, store } = await fixture()
    await writeFile(file, JSON.stringify({
      mcpServers: {
        old: {
          transport: 'stdio',
          command: 'node',
          args: ['server.js'],
          reconnect: { enabled: false },
          vendorFlag: 'keep',
        },
      },
    }))
    await store.saveServer(file, 'renamed', {
      transport: 'stdio',
      command: 'node',
      args: ['other.js'],
    }, 'old')
    const read = await store.read(file)
    expect(read.servers.map(server => server.name)).toEqual(['renamed'])
    const raw = read.servers[0]?.raw
    expect(raw?.reconnect).toEqual({ enabled: false })
    expect(raw?.vendorFlag).toBe('keep')
    expect(raw?.args).toEqual(['other.js'])
  })

  it('creates imported entries and refuses to overwrite an existing name', async () => {
    const { file, store } = await fixture()
    await store.saveServer(file, 'one', { transport: 'stdio', command: 'node' })
    await expect(store.createServer(file, 'one', { transport: 'stdio', command: 'node' }))
      .rejects.toThrow(/已存在/)
    const created = await store.createServer(file, 'imported', {
      transport: 'streamable-http',
      url: 'https://example.test/mcp',
      headers: { API_KEY: 'secret' },
    }, { type: 'http', reconnect: { enabled: false }, vendorFlag: 'keep' })
    expect(created).toMatchObject({
      name: 'imported',
      transport: 'streamable-http',
      url: 'https://example.test/mcp',
      disabled: false,
    })
    const read = await store.read(file)
    const entry = read.servers.find(server => server.name === 'imported')
    expect(entry?.raw.reconnect).toEqual({ enabled: false })
    expect(entry?.raw.vendorFlag).toBe('keep')
    expect(entry?.headers).toEqual({ API_KEY: 'secret' })
  })

  it('toggles enabled state and deletes servers', async () => {
    const { file, store } = await fixture()
    await store.saveServer(file, 'one', { transport: 'stdio', command: 'node' })
    await store.setServerEnabled(file, 'one', false)
    expect((await store.read(file)).servers[0]?.disabled).toBe(true)
    await store.setServerEnabled(file, 'one', true)
    expect((await store.read(file)).servers[0]?.disabled).toBe(false)
    await store.deleteServer(file, 'one')
    expect((await store.read(file)).servers).toEqual([])
    await expect(store.deleteServer(file, 'missing')).rejects.toThrow(/不存在/)
  })

  it('reports invalid JSON and refuses to overwrite it', async () => {
    const { file, store } = await fixture()
    await writeFile(file, '{ not json')
    const read = await store.read(file)
    expect(read.issue).toMatch(/不是合法 JSON/)
    await expect(store.saveServer(file, 'one', { transport: 'stdio', command: 'node' }))
      .rejects.toThrow(/不是合法 JSON/)
  })

  it('marks malformed entries but keeps them visible for repair', async () => {
    const { file, store } = await fixture()
    await writeFile(file, JSON.stringify({
      mcpServers: {
        broken: { transport: 'stdio' },
        badname: { transport: 'weird', url: 'https://x.test' },
      },
    }))
    const read = await store.read(file)
    expect(read.servers.find(server => server.name === 'broken')?.issue).toMatch(/command/)
    expect(read.servers.find(server => server.name === 'badname')?.issue).toMatch(/transport/)
  })

  it('maps entries to a config accepted by the official MCP client', async () => {
    const { file, store } = await fixture()
    await store.saveServer(file, 'stdio-server', {
      transport: 'stdio',
      command: 'node',
      args: ['server.js'],
      env: { X: '1' },
    })
    await store.saveServer(file, 'http-server', {
      transport: 'streamable-http',
      url: 'https://example.test/mcp',
    })
    const read = await store.read(file)
    const stdio = read.servers.find(server => server.name === 'stdio-server')!
    const http = read.servers.find(server => server.name === 'http-server')!
    const stdioConfig = toMcpClientConfig(stdio, '/project')
    const httpConfig = toMcpClientConfig(http, '/project')
    expect(stdioConfig).toMatchObject({
      transport: 'stdio',
      serverName: 'stdio-server',
      failOnStartupError: true,
      cwd: '/project',
    })
    expect(httpConfig).toMatchObject({
      transport: 'streamable-http',
      serverName: 'http-server',
      failOnStartupError: true,
    })
    expect(() => McpClientConfig(stdioConfig)).not.toThrow()
    expect(() => McpClientConfig(httpConfig)).not.toThrow()
  })
})
