import { homedir } from 'node:os'
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from 'node:path'
import { mkdir, realpath, stat } from 'node:fs/promises'
import { ManagerError, messageOf } from './errors.ts'

const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MCP_SERVER_NAME = /^[A-Za-z0-9_-]{1,32}$/

export function expandHome(value: string): string {
  if (value === '~') return homedir()
  if (value.startsWith('~/') || value.startsWith('~\\')) return join(homedir(), value.slice(2))
  return value
}

export function resolveDshHome(configured?: string): string {
  const explicit = configured?.trim() || process.env.DSH_HOME?.trim()
  return resolve(expandHome(explicit || join(homedir(), '.dsh')))
}

export function resolveAgentsHome(configured?: string): string {
  const explicit = configured?.trim() || process.env.DSH_AGENTS_HOME?.trim()
  return resolve(expandHome(explicit || join(homedir(), '.agents')))
}

export function isSkillName(value: string): boolean {
  return SKILL_NAME.test(value)
}

export function isMcpServerName(value: string): boolean {
  return MCP_SERVER_NAME.test(value)
}

export function assertSkillName(value: string): string {
  if (!isSkillName(value)) {
    throw new ManagerError('invalid-argument', `技能名必须是 kebab-case（例如 my-skill）：${JSON.stringify(value)}`)
  }
  return value
}

export function assertMcpServerName(value: string): string {
  if (!isMcpServerName(value)) {
    throw new ManagerError(
      'invalid-argument',
      `MCP 服务器名只能包含字母、数字、下划线和连字符，长度 1–32：${JSON.stringify(value)}`,
    )
  }
  return value
}

/** 目标必须严格位于 root 内（root 本身不算）。 */
export function isInside(root: string, target: string): boolean {
  const rel = relative(resolve(root), resolve(target))
  return rel !== '' && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

export async function ensureDirectory(path: string): Promise<void> {
  await mkdir(path, { recursive: true })
}

/** 把用户提供的目录规范化为真实路径，并向上寻找最近的 `.git` 祖先。 */
export async function resolveProjectRoot(input: string): Promise<string> {
  const expanded = resolve(expandHome(input.trim()))
  let canonical: string
  try {
    canonical = await realpath(expanded)
  } catch (error) {
    throw new ManagerError('not-found', `项目目录不存在或不可访问：${expanded}`, { cause: error })
  }
  const info = await stat(canonical).catch((error: unknown) => {
    throw new ManagerError('not-found', `项目目录不可访问：${canonical}`, { cause: error })
  })
  if (!info.isDirectory()) throw new ManagerError('invalid-argument', `项目路径不是目录：${canonical}`)

  let cursor = canonical
  const root = parse(cursor).root
  while (true) {
    try {
      const git = await stat(join(cursor, '.git'))
      if (git.isDirectory() || git.isFile()) return cursor
    } catch {
      // 没有 .git，继续向上。
    }
    if (cursor === root) return canonical
    const parent = dirname(cursor)
    if (parent === cursor) return canonical
    cursor = parent
  }
}

/** 仅用于诊断的简短错误文本；避免把可能含密钥的原始对象整段带出去。 */
export function briefError(error: unknown, limit = 400): string {
  const text = messageOf(error).replace(/\s+/g, ' ').trim()
  return text.length > limit ? `${text.slice(0, limit)}…` : text
}
