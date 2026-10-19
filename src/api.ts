import type { Context } from '@deepseek-ai/cordis'
import type { McpServerFormValue, SkillRootId } from './shared.ts'
import { ManagerError, messageOf } from './errors.ts'
import { briefError } from './paths.ts'
import type { ManagerService } from './service.ts'
import { assertScope } from './service.ts'
import { isSkillRootId } from './skills.ts'

export const API_PATH = '/api/dsh-skills-mcp'
const MAX_BODY_BYTES = 2 * 1024 * 1024

interface FetchRoute {
  path: string
  methods: readonly string[]
  requestBody: 'buffered' | 'streaming'
  fetch: (request: Request) => Promise<Response>
}

interface ConnectionLike {
  fetch?: {
    register(route: FetchRoute): () => Promise<void> | void
  }
}

interface RequestBody {
  action?: unknown
  scope?: unknown
  project?: unknown
  root?: unknown
  id?: unknown
  name?: unknown
  content?: unknown
  form?: unknown
  originalName?: unknown
  enabled?: unknown
}

/** 挂到 connection 的认证 Fetch 路由；浏览器请求与 /api 一样经过 Host/Origin 与 cookie 校验。 */
export function registerApi(ctx: Context, service: ManagerService): void {
  ctx.inject(['connection'], (connectionCtx) => {
    const connection = (connectionCtx as unknown as { connection?: ConnectionLike }).connection
    if (connection?.fetch === undefined) {
      ctx.logger.warn('dsh-skills-mcp: 当前宿主没有 connection.fetch，WebUI 管理页不可用（模型工具不受影响）')
      return
    }
    connectionCtx.effect(
      () => connection.fetch!.register({
        path: API_PATH,
        methods: ['POST'],
        requestBody: 'buffered',
        fetch: request => handleApiRequest(service, request),
      }),
      'dsh-skills-mcp: management API',
    )
  })
}

export async function handleApiRequest(service: ManagerService, request: Request): Promise<Response> {
  try {
    const length = Number(request.headers.get('content-length') ?? '0')
    if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
      throw new ManagerError('invalid-argument', '请求体过大')
    }
    const text = await request.text()
    if (Buffer.byteLength(text, 'utf8') > MAX_BODY_BYTES) {
      throw new ManagerError('invalid-argument', '请求体过大')
    }
    let body: RequestBody
    try {
      const parsed: unknown = JSON.parse(text)
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('body must be an object')
      }
      body = parsed as RequestBody
    } catch (error) {
      throw new ManagerError('invalid-argument', `请求体必须是 JSON 对象：${messageOf(error)}`)
    }
    const action = typeof body.action === 'string' ? body.action : ''
    const project = typeof body.project === 'string' ? body.project : undefined
    const root = requireRoot(body.root)
    const scope = body.action === 'snapshot' && body.scope === undefined ? undefined : assertScope(body.scope)

    switch (action) {
      case 'snapshot':
        return ok(await service.snapshot(project))
      case 'skill.read': {
        const value = await service.readSkill(scope!, project, root, requireString(body.name, 'name'))
        return ok(value)
      }
      case 'skill.save': {
        const value = await service.saveSkill(
          scope!,
          project,
          root,
          requireString(body.name, 'name'),
          requireString(body.content, 'content'),
        )
        return ok(value)
      }
      case 'skill.delete': {
        const value = await service.deleteSkill(scope!, project, root, requireString(body.name, 'name'))
        return ok(value)
      }
      case 'skill.setEnabled': {
        if (typeof body.enabled !== 'boolean') throw new ManagerError('invalid-argument', 'enabled 必须是布尔值')
        const name = requireString(body.name, 'name')
        await service.setSkillEnabled(scope!, project, name, body.enabled)
        return ok({ name, enabled: body.enabled })
      }
      case 'mcp.save': {
        const name = requireString(body.name, 'name')
        const originalName = body.originalName === undefined ? undefined : requireString(body.originalName, 'originalName')
        await service.saveMcpServer(scope!, project, name, requireForm(body.form), originalName)
        return ok(await service.snapshot(project))
      }
      case 'mcp.delete': {
        await service.deleteMcpServer(scope!, project, requireString(body.name, 'name'))
        return ok(await service.snapshot(project))
      }
      case 'mcp.enable': {
        if (typeof body.enabled !== 'boolean') throw new ManagerError('invalid-argument', 'enabled 必须是布尔值')
        await service.setMcpEnabled(scope!, project, requireString(body.name, 'name'), body.enabled)
        return ok(await service.snapshot(project))
      }
      case 'mcp.external.setEnabled': {
        if (typeof body.enabled !== 'boolean') throw new ManagerError('invalid-argument', 'enabled 必须是布尔值')
        await service.setExternalMcpEnabled(
          scope!,
          project,
          requireString(body.id, 'id'),
          body.enabled,
        )
        return ok(await service.snapshot(project))
      }
      case 'mcp.external.import': {
        const name = body.name === undefined ? undefined : requireString(body.name, 'name')
        await service.importExternalMcp(scope!, project, requireString(body.id, 'id'), name)
        return ok(await service.snapshot(project))
      }
      case 'mcp.reload': {
        await service.reloadMcp(scope!, project)
        return ok(await service.snapshot(project))
      }
      default:
        throw new ManagerError('invalid-argument', `未知 action：${JSON.stringify(action)}`)
    }
  } catch (error) {
    const failure = error instanceof ManagerError
      ? { code: error.code, message: error.message }
      : { code: 'internal', message: briefError(error) }
    const status = error instanceof ManagerError ? statusOf(error.code) : 500
    return Response.json({ ok: false, error: failure }, {
      status,
      headers: { 'cache-control': 'no-store' },
    })
  }
}

function ok(value: unknown): Response {
  return Response.json({ ok: true, value }, { headers: { 'cache-control': 'no-store' } })
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new ManagerError('invalid-argument', `${field} 必须是字符串`)
  return value
}

function requireRoot(value: unknown): SkillRootId | undefined {
  if (value === undefined) return undefined
  if (!isSkillRootId(value)) throw new ManagerError('invalid-argument', `未知技能根：${String(value)}`)
  return value
}

function requireForm(value: unknown): McpServerFormValue {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new ManagerError('invalid-argument', 'form 必须是对象')
  }
  const form = value as Record<string, unknown>
  if (form.transport !== 'stdio' && form.transport !== 'streamable-http') {
    throw new ManagerError('invalid-argument', 'form.transport 必须是 stdio 或 streamable-http')
  }
  if (form.disabled !== undefined && typeof form.disabled !== 'boolean') {
    throw new ManagerError('invalid-argument', 'form.disabled 必须是布尔值')
  }
  if (form.command !== undefined && typeof form.command !== 'string') {
    throw new ManagerError('invalid-argument', 'form.command 必须是字符串')
  }
  if (form.url !== undefined && typeof form.url !== 'string') {
    throw new ManagerError('invalid-argument', 'form.url 必须是字符串')
  }
  if (form.cwd !== undefined && typeof form.cwd !== 'string') {
    throw new ManagerError('invalid-argument', 'form.cwd 必须是字符串')
  }
  if (form.toolCallTimeoutMs !== undefined
    && (typeof form.toolCallTimeoutMs !== 'number' || !Number.isFinite(form.toolCallTimeoutMs))) {
    throw new ManagerError('invalid-argument', 'form.toolCallTimeoutMs 必须是数字')
  }
  if (form.args !== undefined && (!Array.isArray(form.args) || form.args.some(item => typeof item !== 'string'))) {
    throw new ManagerError('invalid-argument', 'form.args 必须是字符串数组')
  }
  if (form.env !== undefined && !isStringRecord(form.env)) {
    throw new ManagerError('invalid-argument', 'form.env 必须是字符串键值对象')
  }
  if (form.headers !== undefined && !isStringRecord(form.headers)) {
    throw new ManagerError('invalid-argument', 'form.headers 必须是字符串键值对象')
  }
  return {
    transport: form.transport,
    ...form.command === undefined ? {} : { command: form.command as string },
    ...form.args === undefined ? {} : { args: form.args as string[] },
    ...form.env === undefined ? {} : { env: form.env as Record<string, string> },
    ...form.cwd === undefined ? {} : { cwd: form.cwd as string },
    ...form.url === undefined ? {} : { url: form.url as string },
    ...form.headers === undefined ? {} : { headers: form.headers as Record<string, string> },
    ...form.toolCallTimeoutMs === undefined ? {} : { toolCallTimeoutMs: form.toolCallTimeoutMs as number },
    ...form.disabled === undefined ? {} : { disabled: form.disabled as boolean },
  }
}

function isStringRecord(value: unknown): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.values(value as Record<string, unknown>).every(item => typeof item === 'string')
}

function statusOf(code: ManagerError['code']): number {
  switch (code) {
    case 'invalid-argument':
    case 'invalid-content':
      return 400
    case 'not-found':
      return 404
    case 'conflict':
      return 409
    case 'forbidden':
      return 403
    case 'unavailable':
      return 503
    default:
      return 500
  }
}
