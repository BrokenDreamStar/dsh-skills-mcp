import type { ApiResult, ManagerSnapshot, McpServerFormValue, SkillContentValue, SkillRootId } from '../shared.ts'

export const API_PATH = '/api/dsh-skills-mcp'

async function call<T>(body: Record<string, unknown>, signal?: AbortSignal): Promise<ApiResult<T>> {
  let response: Response
  try {
    response = await fetch(API_PATH, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      ...signal === undefined ? {} : { signal },
    })
  } catch (error) {
    if (isAbort(error)) throw error
    return { ok: false, error: { code: 'network', message: error instanceof Error ? error.message : String(error) } }
  }
  let parsed: unknown
  try {
    parsed = await response.json()
  } catch {
    return {
      ok: false,
      error: {
        code: `http-${response.status}`,
        message: response.status === 401 || response.status === 403
          ? '会话已失效，请刷新页面后重试'
          : `管理接口返回了非 JSON 响应（HTTP ${response.status}）`,
      },
    }
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: { code: 'bad-response', message: '管理接口响应格式不正确' } }
  }
  const result = parsed as ApiResult<T>
  if (result.ok === true) return result
  if (result.ok === false && typeof result.error?.message === 'string') return result
  return { ok: false, error: { code: 'bad-response', message: `管理接口响应格式不正确（HTTP ${response.status}）` } }
}

export async function loadSnapshot(project: string | undefined, signal?: AbortSignal): Promise<ApiResult<ManagerSnapshot>> {
  return call<ManagerSnapshot>({ action: 'snapshot', ...project === undefined ? {} : { project } }, signal)
}

export async function readSkill(
  scope: 'system' | 'project',
  project: string | undefined,
  root: SkillRootId,
  name: string,
  signal?: AbortSignal,
): Promise<ApiResult<SkillContentValue>> {
  return call({ action: 'skill.read', scope, ...project === undefined ? {} : { project }, root, name }, signal)
}

export async function saveSkill(
  scope: 'system' | 'project',
  project: string | undefined,
  root: SkillRootId,
  name: string,
  content: string,
): Promise<ApiResult<{ name: string; root: SkillRootId; path: string }>> {
  return call({ action: 'skill.save', scope, ...project === undefined ? {} : { project }, root, name, content })
}

export async function deleteSkill(
  scope: 'system' | 'project',
  project: string | undefined,
  root: SkillRootId,
  name: string,
): Promise<ApiResult<{ name: string; root: SkillRootId; path: string; trashPath?: string }>> {
  return call({ action: 'skill.delete', scope, ...project === undefined ? {} : { project }, root, name })
}

export async function setSkillEnabled(
  scope: 'system' | 'project',
  project: string | undefined,
  name: string,
  enabled: boolean,
): Promise<ApiResult<{ name: string; enabled: boolean }>> {
  return call({ action: 'skill.setEnabled', scope, ...project === undefined ? {} : { project }, name, enabled })
}

export async function saveMcpServer(
  scope: 'system' | 'project',
  project: string | undefined,
  name: string,
  form: McpServerFormValue,
  originalName?: string,
): Promise<ApiResult<ManagerSnapshot>> {
  return call({
    action: 'mcp.save',
    scope,
    ...project === undefined ? {} : { project },
    name,
    form,
    ...originalName === undefined ? {} : { originalName },
  })
}

export async function deleteMcpServer(
  scope: 'system' | 'project',
  project: string | undefined,
  name: string,
): Promise<ApiResult<ManagerSnapshot>> {
  return call({ action: 'mcp.delete', scope, ...project === undefined ? {} : { project }, name })
}

export async function setMcpEnabled(
  scope: 'system' | 'project',
  project: string | undefined,
  name: string,
  enabled: boolean,
): Promise<ApiResult<ManagerSnapshot>> {
  return call({ action: 'mcp.enable', scope, ...project === undefined ? {} : { project }, name, enabled })
}

export async function setExternalMcpEnabled(
  scope: 'system' | 'project',
  project: string | undefined,
  id: string,
  enabled: boolean,
): Promise<ApiResult<ManagerSnapshot>> {
  return call({ action: 'mcp.external.setEnabled', scope, ...project === undefined ? {} : { project }, id, enabled })
}

export async function importExternalMcp(
  scope: 'system' | 'project',
  project: string | undefined,
  id: string,
  name?: string,
): Promise<ApiResult<ManagerSnapshot>> {
  return call({
    action: 'mcp.external.import',
    scope,
    ...project === undefined ? {} : { project },
    id,
    ...name === undefined ? {} : { name },
  })
}

export async function reloadMcp(
  scope: 'system' | 'project',
  project: string | undefined,
): Promise<ApiResult<ManagerSnapshot>> {
  return call({ action: 'mcp.reload', scope, ...project === undefined ? {} : { project } })
}

export function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
    || error instanceof Error && error.name === 'AbortError'
}
