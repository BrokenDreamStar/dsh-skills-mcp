/** 宿主与浏览器半共享的 wire 类型（不含任何 Node 依赖）。 */

export type Scope = 'system' | 'project'

/** DSH 原生发现的两个系统/项目技能根。 */
export type SkillRootId = 'system-dsh' | 'system-agents' | 'project-dsh' | 'project-agents'

export type SkillRootKind = 'dsh' | 'agents'

export interface SkillRootView {
  id: SkillRootId
  scope: Scope
  kind: SkillRootKind
  path: string
}

export type McpTransport = 'stdio' | 'streamable-http'

export type RuntimeState = 'disabled' | 'starting' | 'ready' | 'idle' | 'error'

export interface SkillListItem {
  name: string
  description: string
  whenToUse?: string
  /** 指令文件的绝对路径。 */
  path: string
  /** 目录 bundle 为 `bundle`，单文件为 `flat`。 */
  kind: 'bundle' | 'flat'
  source: Scope
  /** 所属根目录；同名技能可能同时存在于 DSH 与 Shared Agents。 */
  root: SkillRootId
  rootKind: SkillRootKind
  /** 符号链接来源只读；可查看，但编辑与删除会被拒绝。 */
  readOnly?: true
  /** 已在 DSH 中停用（通过 runtime 遮蔽，不修改源文件）。 */
  disabledInDsh?: true
  /** 是否允许模型调用；来自 frontmatter。 */
  modelInvocable: boolean
  /** 是否允许用户用 `/name` 调用；来自 frontmatter。 */
  userInvocable: boolean
  /** 解析失败时的诊断；条目仍会列出，便于修复。 */
  issue?: string
}

export type McpServerSource = 'dsh' | 'claude-code'

export interface McpServerView {
  /** DSH 配置为 `dsh:<name>`；外部来源使用稳定 id。 */
  id: string
  name: string
  source: McpServerSource
  /** 来源说明，例如 Claude Code 用户配置。 */
  origin?: string
  /** 来源配置文件（外部只读）。 */
  configPath?: string
  /** 是否由本插件的 mcp.json 管理；外部来源为 false。 */
  managed: boolean
  /** 外部条目是否属于当前作用域（可在当前作用域启停）；跨项目候选为 false。 */
  inPlace?: boolean
  /** 可一键导入为 DSH 管理条目；仅外部来源。 */
  importable?: boolean
  /** 外部条目的来源项目根（跨项目发现时）。 */
  projectRoot?: string
  transport: McpTransport
  /** stdio 显示 command + args；HTTP 显示 url。 */
  target: string
  disabled: boolean
  status: RuntimeState
  toolCount?: number
  /** 加载或校验错误的简短说明（不含密钥）。 */
  error?: string
  /** 编辑表单字段；外部来源的值会脱敏。 */
  config: McpServerFormValue
}

export interface McpServerFormValue {
  transport: McpTransport
  command?: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string
  url?: string
  headers?: Record<string, string>
  toolCallTimeoutMs?: number
  disabled?: boolean
}

export interface ScopeSnapshot {
  scope: Scope
  /** 系统级：DSH home；项目级：项目根。 */
  root: string
  /** 当前作用域的全部技能根（DSH 与 Shared Agents）。 */
  skillRoots: SkillRootView[]
  mcpFile: string
  skills: SkillListItem[]
  servers: McpServerView[]
  /** 某个文件/目录不可读等非致命问题。 */
  issues: string[]
}

export interface ManagerSnapshot {
  dshHome: string
  system: ScopeSnapshot
  project: ScopeSnapshot | null
  /** 请求了项目作用域但目录不可用时的原因。 */
  projectError?: string
  version: string
}

export interface SkillContentValue {
  name: string
  root: SkillRootId
  path: string
  content: string
}

export interface SkillMutationValue {
  name: string
  root: SkillRootId
  path: string
  /** 删除时返回回收站位置。 */
  trashPath?: string
}

export interface ApiFailure {
  code: string
  message: string
}

export type ApiResult<T> = { ok: true; value: T } | { ok: false; error: ApiFailure }
