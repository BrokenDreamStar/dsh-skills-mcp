import type { Context } from '@deepseek-ai/cordis'
import { approveEscalation } from '@deepseek-ai/dsh-sandbox'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ManagerService } from './service.ts'
import { assertScope } from './service.ts'
import type { McpServerFormValue, McpServerView, Scope, SkillRootId } from './shared.ts'
import { ManagerError, messageOf } from './errors.ts'
import { isSkillRootId } from './skills.ts'

export interface ToolOptions {
  ctx: Context
  service: ManagerService
  logger: Context['logger']
}

interface ToolExecLike {
  agent?: {
    session: unknown
  }
  callId: string
  signal: AbortSignal
}

/** 注册 skills_manager / mcp_manager 两个模型工具；工具失败不会影响插件装载。 */
export function registerTools(ctx: Context, options: ToolOptions): void {
  const tools = [
    ['skills_manager', skillsTool(options)],
    ['mcp_manager', mcpTool(options)],
  ] as const
  for (const [toolName, tool] of tools) {
    try {
      ctx.tools.register(tool)
    } catch (error) {
      options.logger.warn(`dsh-skills-mcp: 工具 ${toolName} 注册失败：${messageOf(error)}`)
    }
  }
}

function skillsTool(options: ToolOptions) {
  return defineTool({
    name: 'skills_manager',
    description:
      'List, read, create/update, or delete local skills in the system scope (~/.dsh/skills and ~/.agents/skills) or the current project scope (<project>/.dsh/skills and <project>/.agents/skills). '
      + 'Use save with the full SKILL.md content (YAML frontmatter required). Deleting moves the skill into the DSH trash, not permanent removal. '
      + 'Write actions require danger-full-access permission or approval for this call.',
    parameters: {
      action: {
        type: 'string',
        required: true,
        enum: ['list', 'read', 'save', 'delete', 'enable', 'disable'],
        description: 'Operation to perform. enable/disable changes DSH visibility only, without touching the source file.',
      },
      scope: { type: 'string', enum: ['system', 'project'], description: 'Defaults to system.' },
      project: {
        type: 'string',
        description: 'Project directory for project scope: absolute path or the current session workspace. Defaults to the calling session cwd.',
      },
      root: {
        type: 'string',
        enum: ['system-dsh', 'system-agents', 'project-dsh', 'project-agents'],
        description: 'Skill root. Defaults to system-dsh for system scope and project-dsh for project scope. Use the root returned by list.',
      },
      name: { type: 'string', description: 'Kebab-case skill name required for read/save/delete.' },
      content: { type: 'string', description: 'Complete SKILL.md content including YAML frontmatter; required for save.' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    timeoutMs: 30000,
    isConcurrencySafe: args => args.action === 'list' || args.action === 'read',
    async execute(args, exec) {
      exec.signal.throwIfAborted()
      const scope = toolScope(args.scope)
      const project = await projectFor(options.service, scope, args.project, exec.agent?.session.header.cwd)
      const root = skillRootArg(args.root)
      switch (args.action) {
        case 'list': {
          const snapshot = await options.service.snapshot(project)
          const view = scope === 'system' ? snapshot.system : snapshot.project
          if (view === null) throw new ManagerError('not-found', snapshot.projectError ?? '项目作用域不可用')
          return format({
            scope,
            root: view.root,
            skillRoots: view.skillRoots,
            skills: view.skills,
            issues: view.issues,
          })
        }
        case 'read': {
          if (args.name === undefined) throw new ManagerError('invalid-argument', 'read 需要 name')
          return format(await options.service.readSkill(scope, project, root, args.name))
        }
        case 'save': {
          if (args.name === undefined) throw new ManagerError('invalid-argument', 'save 需要 name')
          if (args.content === undefined) throw new ManagerError('invalid-argument', 'save 需要 content')
          await requireEscalation(options.ctx, exec, 'skills_manager', `save skill ${args.name} (${root ?? scope})`)
          return format(await options.service.saveSkill(scope, project, root, args.name, args.content))
        }
        case 'delete': {
          if (args.name === undefined) throw new ManagerError('invalid-argument', 'delete 需要 name')
          await requireEscalation(options.ctx, exec, 'skills_manager', `delete skill ${args.name} (${root ?? scope})`)
          return format(await options.service.deleteSkill(scope, project, root, args.name))
        }
        case 'enable':
        case 'disable': {
          if (args.name === undefined) throw new ManagerError('invalid-argument', `${args.action} 需要 name`)
          await requireEscalation(options.ctx, exec, 'skills_manager', `${args.action} skill in DSH ${args.name} (${scope})`)
          await options.service.setSkillEnabled(scope, project, args.name, args.action === 'enable')
          return format({ [args.action === 'enable' ? 'enabled' : 'disabled']: args.name, scope })
        }
      }
    },
  })
}

function mcpTool(options: ToolOptions) {
  return defineTool({
    name: 'mcp_manager',
    description:
      'Manage MCP servers for DSH. System scope uses ~/.dsh/mcp.json and loads for every session; project scope uses <project>/.dsh/mcp.json and loads only in that project\'s sessions. '
      + 'Claude Code user/project MCP servers are discovered automatically (enabled by default) and can be enabled or disabled in DSH by their id with enable_external/disable_external. import_external copies one into DSH mcp.json (including env/headers, which may contain secrets) so it becomes a managed entry. '
      + 'Secret env/header values are never returned by list. Changes reload the official dsh-mcp-client immediately. '
      + 'Write actions require danger-full-access permission or approval for this call.',
    parameters: {
      action: {
        type: 'string',
        required: true,
        enum: ['list', 'save', 'delete', 'enable', 'disable', 'reload', 'enable_external', 'disable_external', 'import_external'],
        description: 'Operation to perform. enable_external/disable_external control Claude Code discoveries in DSH only; import_external copies one into DSH mcp.json so it becomes editable here.',
      },
      scope: { type: 'string', enum: ['system', 'project'], description: 'Defaults to system.' },
      project: { type: 'string', description: 'Project directory for project scope; defaults to the calling session cwd.' },
      name: { type: 'string', description: 'DSH-managed server name for save/delete/enable/disable.' },
      id: { type: 'string', description: 'External server id returned by list; required for enable_external/disable_external.' },
      originalName: { type: 'string', description: 'Previous name when renaming during save.' },
      form: {
        type: 'json',
        description:
          'Server configuration for save: { transport: "stdio"|"streamable-http", command?, args?, env?, cwd?, url?, headers?, toolCallTimeoutMs?, disabled? }.',
      },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    timeoutMs: 120000,
    isConcurrencySafe: args => args.action === 'list',
    async execute(args, exec) {
      exec.signal.throwIfAborted()
      const scope = toolScope(args.scope)
      const project = await projectFor(options.service, scope, args.project, exec.agent?.session.header.cwd)
      switch (args.action) {
        case 'list': {
          const snapshot = await options.service.snapshot(project)
          const view = scope === 'system' ? snapshot.system : snapshot.project
          if (view === null) throw new ManagerError('not-found', snapshot.projectError ?? '项目作用域不可用')
          return format({
            scope,
            mcpFile: view.mcpFile,
            servers: view.servers.map(redactServer),
            issues: view.issues,
          })
        }
        case 'save': {
          if (args.name === undefined) throw new ManagerError('invalid-argument', 'save 需要 name')
          const form = normalizeForm(args.form)
          const target = form.transport === 'stdio'
            ? `${form.command ?? ''} ${(form.args ?? []).join(' ')}`.trim()
            : form.url ?? ''
          await requireEscalation(
            options.ctx,
            exec,
            'mcp_manager',
            `save MCP server ${args.name} (${scope}, ${form.transport}, ${redactTarget(target)})`,
          )
          await options.service.saveMcpServer(scope, project, args.name, form, args.originalName)
          return format({ saved: args.name, scope })
        }
        case 'delete': {
          if (args.name === undefined) throw new ManagerError('invalid-argument', 'delete 需要 name')
          await requireEscalation(options.ctx, exec, 'mcp_manager', `delete MCP server ${args.name} (${scope})`)
          await options.service.deleteMcpServer(scope, project, args.name)
          return format({ deleted: args.name, scope })
        }
        case 'enable':
        case 'disable': {
          if (args.name === undefined) throw new ManagerError('invalid-argument', `${args.action} 需要 name`)
          await requireEscalation(options.ctx, exec, 'mcp_manager', `${args.action} MCP server ${args.name} (${scope})`)
          await options.service.setMcpEnabled(scope, project, args.name, args.action === 'enable')
          return format({ [args.action === 'enable' ? 'enabled' : 'disabled']: args.name, scope })
        }
        case 'enable_external':
        case 'disable_external': {
          if (args.id === undefined) throw new ManagerError('invalid-argument', `${args.action} 需要 id`)
          const enable = args.action === 'enable_external'
          await requireEscalation(
            options.ctx,
            exec,
            'mcp_manager',
            `${enable ? 'enable' : 'disable'} external MCP server in DSH ${args.id} (${scope})`,
          )
          await options.service.setExternalMcpEnabled(scope, project, args.id, enable)
          return format({ [enable ? 'enabled' : 'disabled']: args.id, scope })
        }
        case 'import_external': {
          if (args.id === undefined) throw new ManagerError('invalid-argument', 'import_external 需要 id')
          const name = args.name?.trim() || undefined
          await requireEscalation(
            options.ctx,
            exec,
            'mcp_manager',
            `import external MCP server into DSH ${args.id} as ${name ?? '(same name)'} (${scope})`,
          )
          await options.service.importExternalMcp(scope, project, args.id, name)
          return format({ imported: name ?? args.id, scope })
        }
        case 'reload': {
          await requireEscalation(options.ctx, exec, 'mcp_manager', `reload MCP servers (${scope})`)
          await options.service.reloadMcp(scope, project)
          return format({ reloaded: true, scope })
        }
      }
    },
  })
}

function format(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

/**
 * 与官方 plugin_manager 相同：管理类写操作需要危险权限或逐次审批。
 * 审批渠道或策略缺失时拒绝执行，避免模型绕过工作区边界修改宿主。
 */
async function requireEscalation(
  ctx: Context,
  exec: ToolExecLike,
  toolName: string,
  summary: string,
): Promise<void> {
  let mode = 'read-only'
  try {
    const policy = ctx.get('sandboxPolicy') as {
      resolve(scope: object): { mode: string }
    } | undefined
    if (policy !== undefined) mode = policy.resolve(exec.agent === undefined ? {} : { session: exec.agent.session }).mode
  } catch {
    // 取不到策略时按只读处理，让审批链决定是否放行。
  }
  const approval = ctx.get('approval')
  await approveEscalation({
    requestedMode: 'danger-full-access',
    effectiveMode: mode,
    subject: 'dsh-skills-mcp management operation',
    justification: summary,
  } as never, {
    approver: approval,
    agent: exec.agent,
    callId: exec.callId,
    toolName,
    signal: exec.signal,
  } as never)
  exec.signal.throwIfAborted()
}

function toolScope(value: string | undefined): Scope {
  try {
    return assertScope(value ?? 'system')
  } catch (error) {
    throw new ManagerError('invalid-argument', messageOf(error))
  }
}

function skillRootArg(value: string | undefined): SkillRootId | undefined {
  if (value === undefined) return undefined
  if (!isSkillRootId(value)) throw new ManagerError('invalid-argument', `未知技能根：${value}`)
  return value
}

async function projectFor(
  service: ManagerService,
  scope: Scope,
  explicit: string | undefined,
  sessionCwd: string | undefined,
): Promise<string | undefined> {
  if (scope === 'system') return undefined
  const input = explicit?.trim() || sessionCwd
  if (input === undefined || input === '') {
    throw new ManagerError('invalid-argument', '项目级操作需要 project 参数，或一个带 cwd 的调用会话')
  }
  const resolved = await service.resolveProject(input)
  return resolved.root
}

function normalizeForm(value: unknown): McpServerFormValue {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new ManagerError('invalid-argument', 'form 必须是对象')
  }
  const form = value as Record<string, unknown>
  const transport = form.transport
  if (transport !== 'stdio' && transport !== 'streamable-http') {
    throw new ManagerError('invalid-argument', 'form.transport 必须是 stdio 或 streamable-http')
  }
  for (const field of ['command', 'cwd', 'url'] as const) {
    if (form[field] !== undefined && typeof form[field] !== 'string') {
      throw new ManagerError('invalid-argument', `form.${field} 必须是字符串`)
    }
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
  if (form.toolCallTimeoutMs !== undefined
    && (typeof form.toolCallTimeoutMs !== 'number' || !Number.isFinite(form.toolCallTimeoutMs))) {
    throw new ManagerError('invalid-argument', 'form.toolCallTimeoutMs 必须是数字')
  }
  if (form.disabled !== undefined && typeof form.disabled !== 'boolean') {
    throw new ManagerError('invalid-argument', 'form.disabled 必须是布尔值')
  }
  return {
    transport,
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

function redactServer(server: McpServerView): Record<string, unknown> {
  const config = server.config
  return {
    id: server.id,
    name: server.name,
    source: server.source,
    managed: server.managed,
    ...server.inPlace === undefined ? {} : { inPlace: server.inPlace },
    ...server.importable === undefined ? {} : { importable: server.importable },
    ...server.projectRoot === undefined ? {} : { projectRoot: server.projectRoot },
    ...server.origin === undefined ? {} : { origin: server.origin },
    ...server.configPath === undefined ? {} : { configPath: server.configPath },
    transport: server.transport,
    target: redactTarget(server.target),
    disabled: server.disabled,
    status: server.status,
    ...server.toolCount === undefined ? {} : { toolCount: server.toolCount },
    ...server.error === undefined ? {} : { error: redactText(server.error) },
    // 外部来源的 env/header/args 可能含密钥；管理工具只需要 id 与状态。
    ...server.source === 'claude-code' ? {} : {
      config: {
        transport: config.transport,
        ...config.command === undefined ? {} : { command: redactText(config.command) },
        ...config.args === undefined ? {} : { args: config.args.map(redactText) },
        ...config.cwd === undefined ? {} : { cwd: config.cwd },
        ...config.url === undefined ? {} : { url: redactTarget(config.url) },
        ...config.env === undefined ? {} : { env: Object.fromEntries(Object.keys(config.env).map(key => [key, '[redacted]'])) },
        ...config.headers === undefined ? {} : { headers: Object.fromEntries(Object.keys(config.headers).map(key => [key, '[redacted]'])) },
        ...config.toolCallTimeoutMs === undefined ? {} : { toolCallTimeoutMs: config.toolCallTimeoutMs },
        ...config.disabled ? { disabled: true } : {},
      },
    },
  }
}

function redactTarget(value: string): string {
  try {
    const url = new URL(value)
    if (url.username !== '' || url.password !== '') {
      url.username = ''
      url.password = ''
    }
    url.search = ''
    return url.toString()
  } catch {
    return redactText(value)
  }
}

function redactText(value: string): string {
  return value
    .replace(/Bearer\s+[^\s]+/gi, 'Bearer [redacted]')
    .replace(/([?&](?:token|key|api[_-]?key|secret|password)=)[^&\s]+/gi, '$1[redacted]')
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.values(value as Record<string, unknown>).every(item => typeof item === 'string')
}
