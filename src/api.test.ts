import { describe, expect, it, vi } from 'vitest'
import type { ManagerService } from './service.ts'
import { handleApiRequest } from './api.ts'
import { ManagerError } from './errors.ts'

function request(body: unknown): Request {
  return new Request('http://localhost/api/dsh-skills-mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function mockService(overrides: Partial<Record<keyof ManagerService, unknown>> = {}): ManagerService {
  return {
    snapshot: vi.fn(async () => ({ system: {}, project: null })),
    readSkill: vi.fn(async () => ({ name: 'x', path: '/x', content: 'c' })),
    saveSkill: vi.fn(async () => ({ name: 'x', path: '/x' })),
    deleteSkill: vi.fn(async () => ({ name: 'x', path: '/x', trashPath: '/trash' })),
    setSkillEnabled: vi.fn(async () => undefined),
    saveMcpServer: vi.fn(async () => undefined),
    deleteMcpServer: vi.fn(async () => undefined),
    setMcpEnabled: vi.fn(async () => undefined),
    setExternalMcpEnabled: vi.fn(async () => undefined),
    reloadMcp: vi.fn(async () => undefined),
    ...overrides,
  } as unknown as ManagerService
}

describe('management API', () => {
  it('returns a snapshot with an optional project', async () => {
    const service = mockService()
    const response = await handleApiRequest(service, request({ action: 'snapshot', project: '/project' }))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ ok: true })
    expect(service.snapshot).toHaveBeenCalledWith('/project')
  })

  it('routes skill and mcp mutations with the selected scope', async () => {
    const service = mockService()
    const skill = await handleApiRequest(service, request({
      action: 'skill.save', scope: 'project', project: '/project', root: 'project-agents', name: 'alpha', content: 'body',
    }))
    expect(skill.status).toBe(200)
    expect(service.saveSkill).toHaveBeenCalledWith('project', '/project', 'project-agents', 'alpha', 'body')

    const mcp = await handleApiRequest(service, request({
      action: 'mcp.enable', scope: 'system', name: 'github', enabled: false,
    }))
    expect(mcp.status).toBe(200)
    expect(service.setMcpEnabled).toHaveBeenCalledWith('system', undefined, 'github', false)

    const external = await handleApiRequest(service, request({
      action: 'mcp.external.setEnabled', scope: 'system', id: 'claude-code:system::context7', enabled: true,
    }))
    expect(external.status).toBe(200)
    expect(service.setExternalMcpEnabled).toHaveBeenCalledWith(
      'system', undefined, 'claude-code:system::context7', true,
    )

    const skillToggle = await handleApiRequest(service, request({
      action: 'skill.setEnabled', scope: 'system', name: 'alpha', enabled: false,
    }))
    expect(skillToggle.status).toBe(200)
    expect(service.setSkillEnabled).toHaveBeenCalledWith('system', undefined, 'alpha', false)
  })

  it('validates scope, action and form fields', async () => {
    const service = mockService()
    const noScope = await handleApiRequest(service, request({ action: 'skill.read', name: 'x' }))
    expect(noScope.status).toBe(400)
    const unknown = await handleApiRequest(service, request({ action: 'nope', scope: 'system' }))
    expect(unknown.status).toBe(400)
    const badForm = await handleApiRequest(service, request({
      action: 'mcp.save',
      scope: 'system',
      name: 'one',
      form: { transport: 'stdio', command: 'node', env: { X: 1 } },
    }))
    expect(badForm.status).toBe(400)
    expect(service.saveMcpServer).not.toHaveBeenCalled()
  })

  it('maps expected failures to 4xx responses', async () => {
    const service = mockService({
      readSkill: vi.fn(async () => { throw new ManagerError('not-found', 'missing') }),
    })
    const response = await handleApiRequest(service, request({
      action: 'skill.read', scope: 'system', name: 'x',
    }))
    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ ok: false, error: { code: 'not-found' } })
  })
})
