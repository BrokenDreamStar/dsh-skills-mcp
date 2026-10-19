import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  McpServerFormValue, McpServerView, McpTransport, Scope, ScopeSnapshot,
} from '../shared.ts'
import {
  deleteMcpServer, importExternalMcp, reloadMcp, saveMcpServer, setExternalMcpEnabled, setMcpEnabled,
} from './api.ts'
import type { NoticeTone } from './ui.tsx'
import {
  Badge, Button, EmptyState, Icon, IconButton, Issues, NoticeBox, SearchField, SkeletonList, StatusBadge,
  Switch, displayPath, formatError, keyValueToText, parseKeyValueLines, shortenPath,
} from './ui.tsx'
import type { Translate } from './types.ts'

interface McpPanelProps {
  t: Translate
  scope: Scope
  projectPath: string
  scopeSnapshot: ScopeSnapshot | null
  loading: boolean
  notify: (tone: NoticeTone, text: string) => void
  onDone: () => void
}

interface Draft {
  originalName?: string
  name: string
  transport: McpTransport
  command: string
  argsText: string
  envText: string
  cwd: string
  url: string
  headersText: string
  timeoutText: string
  enabled: boolean
}

const EMPTY_DRAFT: Draft = {
  name: '',
  transport: 'stdio',
  command: '',
  argsText: '',
  envText: '',
  cwd: '',
  url: '',
  headersText: '',
  timeoutText: '',
  enabled: true,
}

function matches(server: McpServerView, query: string, t: Translate): boolean {
  if (query === '') return true
  const haystack = [
    server.name,
    server.target,
    server.origin ?? '',
    server.configPath ?? '',
    server.projectRoot ?? '',
    server.transport,
    server.managed ? t('mcp.sourceDsh') : t('mcp.sourceClaudeCode'),
  ].join('\n').toLowerCase()
  return haystack.includes(query)
}

export function McpPanel(props: McpPanelProps): ReactNode {
  const { t, scope, scopeSnapshot } = props
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    setDraft(null)
    setEditorError(null)
    setQuery('')
  }, [scope, props.projectPath])

  const servers = scopeSnapshot?.servers ?? []
  const normalizedQuery = query.trim().toLowerCase()
  const visible = useMemo(
    () => normalizedQuery === '' ? servers : servers.filter(server => matches(server, normalizedQuery, t)),
    [servers, normalizedQuery, t],
  )

  const scopeReady = scope === 'system' || props.projectPath.trim() !== ''
  if (!scopeReady) return <NoticeBox tone="warn">{t('errors.noProject')}</NoticeBox>

  const groups = [
    { key: 'managed', title: t('mcp.groupManaged'), items: visible.filter(server => server.managed) },
    {
      key: 'external',
      title: t('mcp.groupExternal'),
      items: visible.filter(server => !server.managed && server.inPlace !== false),
    },
    {
      key: 'other',
      title: t('mcp.groupOther'),
      items: visible.filter(server => !server.managed && server.inPlace === false),
    },
  ].filter(group => group.items.length > 0)
  const hasExternal = servers.some(server => !server.managed)
  const mcpFile = scopeSnapshot?.mcpFile ?? ''
  const mcpFileLabel = mcpFile === '' ? '—' : displayPath(mcpFile, scope === 'project' ? props.projectPath : undefined)

  const startAdd = (): void => {
    setDraft({ ...EMPTY_DRAFT })
    setEditorError(null)
  }

  const startEdit = (server: McpServerView): void => {
    if (!server.managed) return
    const config = server.config
    setDraft({
      originalName: server.name,
      name: server.name,
      transport: config.transport,
      command: config.command ?? '',
      argsText: (config.args ?? []).join('\n'),
      envText: keyValueToText(config.env),
      cwd: config.cwd ?? '',
      url: config.url ?? '',
      headersText: keyValueToText(config.headers),
      timeoutText: config.toolCallTimeoutMs === undefined ? '' : String(config.toolCallTimeoutMs),
      enabled: !server.disabled,
    })
    setEditorError(null)
  }

  const save = async (): Promise<void> => {
    if (draft === null) return
    const name = draft.name.trim()
    if (name === '') {
      setEditorError(t('mcp.nameRequired'))
      return
    }
    const env = parseKeyValueLines(draft.envText)
    if (!env.ok) {
      setEditorError(t('editor.envInvalid', { line: env.line, text: env.text }))
      return
    }
    const headers = parseKeyValueLines(draft.headersText)
    if (!headers.ok) {
      setEditorError(t('editor.envInvalid', { line: headers.line, text: headers.text }))
      return
    }
    let toolCallTimeoutMs: number | undefined
    if (draft.timeoutText.trim() !== '') {
      const parsed = Number(draft.timeoutText)
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setEditorError(t('editor.timeoutInvalid'))
        return
      }
      toolCallTimeoutMs = Math.trunc(parsed)
    }
    const form: McpServerFormValue = {
      transport: draft.transport,
      ...draft.transport === 'stdio'
        ? {
          command: draft.command,
          args: draft.argsText.split(/\r?\n/).map(item => item.trim()).filter(item => item !== ''),
          env: env.value,
          ...draft.cwd.trim() === '' ? {} : { cwd: draft.cwd.trim() },
        }
        : {
          url: draft.url,
          headers: headers.value,
        },
      ...toolCallTimeoutMs === undefined ? {} : { toolCallTimeoutMs },
      disabled: !draft.enabled,
    }
    setBusy(true)
    setEditorError(null)
    try {
      const result = await saveMcpServer(
        scope,
        scope === 'project' ? props.projectPath : undefined,
        name,
        form,
        draft.originalName,
      )
      if (!result.ok) {
        setEditorError(formatError(t, result.error.message))
        return
      }
      setDraft(null)
      props.notify('success', t('mcp.saved'))
      props.onDone()
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (server: McpServerView, enabled: boolean): Promise<void> => {
    setBusy(true)
    try {
      const project = scope === 'project' ? props.projectPath : undefined
      const result = server.managed
        ? await setMcpEnabled(scope, project, server.name, enabled)
        : await setExternalMcpEnabled(scope, project, server.id, enabled)
      if (!result.ok) {
        props.notify('error', formatError(t, result.error.message))
        return
      }
      props.notify(
        'success',
        server.source === 'claude-code'
          ? t(enabled ? 'mcp.externalEnabled' : 'mcp.externalDisabled', { name: server.name })
          : t(enabled ? 'mcp.enabled' : 'mcp.disabled'),
      )
      props.onDone()
    } catch (error) {
      props.notify('error', formatError(t, error instanceof Error ? error.message : String(error)))
    } finally {
      setBusy(false)
    }
  }

  const importServer = async (server: McpServerView): Promise<void> => {
    if (server.managed) return
    if (!window.confirm(t('mcp.importConfirm', { name: server.name, file: mcpFile }))) return
    setBusy(true)
    try {
      const result = await importExternalMcp(
        scope,
        scope === 'project' ? props.projectPath : undefined,
        server.id,
      )
      if (!result.ok) {
        props.notify('error', formatError(t, result.error.message))
        return
      }
      props.notify('success', t('mcp.imported', { name: server.name }))
      props.onDone()
    } catch (error) {
      props.notify('error', formatError(t, error instanceof Error ? error.message : String(error)))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (server: McpServerView): Promise<void> => {
    if (!server.managed) return
    if (!window.confirm(t('mcp.deleteConfirm', { name: server.name, file: mcpFile }))) return
    setBusy(true)
    try {
      const result = await deleteMcpServer(scope, scope === 'project' ? props.projectPath : undefined, server.name)
      if (!result.ok) {
        props.notify('error', formatError(t, result.error.message))
        return
      }
      props.notify('success', t('mcp.deleted'))
      if (draft?.originalName === server.name) setDraft(null)
      props.onDone()
    } catch (error) {
      props.notify('error', formatError(t, error instanceof Error ? error.message : String(error)))
    } finally {
      setBusy(false)
    }
  }

  const reload = async (): Promise<void> => {
    setBusy(true)
    try {
      const result = await reloadMcp(scope, scope === 'project' ? props.projectPath : undefined)
      if (!result.ok) {
        props.notify('error', formatError(t, result.error.message))
        return
      }
      props.notify('success', t('mcp.reloaded'))
      props.onDone()
    } catch (error) {
      props.notify('error', formatError(t, error instanceof Error ? error.message : String(error)))
    } finally {
      setBusy(false)
    }
  }

  if (draft !== null) {
    return (
      <McpEditor
        t={t}
        draft={draft}
        file={mcpFileLabel}
        busy={busy}
        error={editorError}
        onUpdate={patch => { setDraft(current => current === null ? current : { ...current, ...patch }) }}
        onCancel={() => { setDraft(null); setEditorError(null) }}
        onSave={() => { void save() }}
      />
    )
  }

  const toolbarDisabled = busy || props.loading || scopeSnapshot === null

  return (
    <div className="dshsm-panel">
      <div className="dshsm-panel-bar">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder={t('mcp.searchPlaceholder')}
          label={t('mcp.searchPlaceholder')}
          clearLabel={t('common.clearSearch')}
        />
        <Button icon="refresh" onClick={() => { void reload() }} disabled={toolbarDisabled}>
          {t('mcp.reload')}
        </Button>
        <Button variant="primary" icon="plus" onClick={startAdd} disabled={toolbarDisabled}>
          {t('mcp.add')}
        </Button>
      </div>

      <div className="dshsm-panel-meta">
        <span className="dshsm-source" title={mcpFile}>
          <Icon name="folder" size={12} />
          <span>{t('mcp.file')}</span>
          <code>{mcpFileLabel}</code>
        </span>
        {normalizedQuery === '' ? null : (
          <span className="dshsm-count">{visible.length} / {servers.length}</span>
        )}
      </div>

      {hasExternal ? (
        <details className="dshsm-details">
          <summary>{t('mcp.externalHintTitle')}</summary>
          <p>{t('mcp.externalHint')}</p>
        </details>
      ) : null}

      {scopeSnapshot !== null ? <Issues items={scopeSnapshot.issues} t={t} /> : null}

      {scopeSnapshot === null && props.loading ? <SkeletonList rows={3} /> : null}

      {scopeSnapshot === null && !props.loading ? (
        <EmptyState icon="server" title={t('errors.noData')} />
      ) : null}

      {scopeSnapshot !== null && servers.length === 0 ? (
        <EmptyState
          icon="server"
          title={t('mcp.empty')}
          hint={t('mcp.emptyHint')}
          action={(
            <Button variant="primary" icon="plus" onClick={startAdd} disabled={toolbarDisabled}>
              {t('mcp.add')}
            </Button>
          )}
        />
      ) : null}

      {scopeSnapshot !== null && servers.length > 0 && visible.length === 0 ? (
        <EmptyState
          icon="search"
          title={t('mcp.noMatch')}
          hint={t('mcp.noMatchHint')}
          action={<Button onClick={() => { setQuery('') }}>{t('common.clearSearch')}</Button>}
        />
      ) : null}

      {groups.map(group => (
        <section className="dshsm-group" key={group.key} aria-label={group.title}>
          <div className="dshsm-group-head">
            <h4>{group.title}</h4>
            <span className="dshsm-group-count">{group.items.length}</span>
          </div>
          {group.key === 'other' ? <p className="dshsm-group-hint">{t('mcp.groupOtherHint')}</p> : null}
          <div className="dshsm-list">
            {group.items.map(server => (
              <McpRow
                key={server.id}
                t={t}
                server={server}
                busy={busy}
                onToggle={enabled => { void toggle(server, enabled) }}
                onEdit={() => { startEdit(server) }}
                onDelete={() => { void remove(server) }}
                onImport={() => { void importServer(server) }}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function McpRow(props: {
  t: Translate
  server: McpServerView
  busy: boolean
  onToggle: (enabled: boolean) => void
  onEdit: () => void
  onDelete: () => void
  onImport: () => void
}): ReactNode {
  const { t, server } = props
  const inPlace = server.managed || server.inPlace !== false
  const importable = !server.managed && server.importable === true
  const external = !server.managed

  return (
    <article className="dshsm-row" data-disabled={server.disabled ? 'true' : undefined}>
      <div className="dshsm-row-body">
        <div className="dshsm-row-title">
          <span className="dshsm-row-name">{server.name}</span>
          <Badge tone={server.managed ? 'accent' : undefined}>
            {server.managed ? t('mcp.sourceDsh') : t('mcp.sourceClaudeCode')}
          </Badge>
          <span className="dshsm-chip">{server.transport === 'stdio' ? 'stdio' : t('mcp.httpShort')}</span>
          {inPlace ? <StatusBadge status={server.status} t={t} /> : <Badge tone="warn">{t('mcp.otherProject')}</Badge>}
          {server.toolCount === undefined ? null : (
            <span className="dshsm-row-count">{t('mcp.toolsCount', { count: server.toolCount })}</span>
          )}
        </div>
        <div className="dshsm-row-target" title={server.target}>{server.target === '' ? '—' : server.target}</div>
        {external && server.origin !== undefined ? (
          <div className="dshsm-row-meta">
            <span>{server.origin}</span>
            {server.configPath === undefined ? null : (
              <span className="dshsm-row-path" title={server.configPath}>{shortenPath(server.configPath)}</span>
            )}
          </div>
        ) : null}
        {server.projectRoot === undefined ? null : (
          <div className="dshsm-row-meta">
            <span>{t('mcp.projectRoot')}</span>
            <span className="dshsm-row-path" title={server.projectRoot}>{shortenPath(server.projectRoot)}</span>
          </div>
        )}
        {server.error === undefined ? null : (
          <div className="dshsm-row-note">
            <Icon name="alert" size={12} />
            <span>{server.error}</span>
          </div>
        )}
      </div>
      <div className="dshsm-row-actions">
        {importable ? (
          <Button onClick={props.onImport} disabled={props.busy}>{t('mcp.import')}</Button>
        ) : null}
        {server.managed ? (
          <IconButton
            icon="edit"
            label={t('common.edit')}
            onClick={props.onEdit}
            disabled={props.busy}
          />
        ) : null}
        {server.managed ? (
          <IconButton
            icon="trash"
            label={t('common.delete')}
            variant="danger"
            onClick={props.onDelete}
            disabled={props.busy}
          />
        ) : null}
        {inPlace ? (
          <Switch
            checked={!server.disabled}
            onChange={props.onToggle}
            disabled={props.busy}
            label={t('mcp.enabledSwitch')}
            title={t('mcp.enableHint')}
          />
        ) : null}
      </div>
    </article>
  )
}

function McpEditor(props: {
  t: Translate
  draft: Draft
  file: string
  busy: boolean
  error: string | null
  onUpdate: (patch: Partial<Draft>) => void
  onCancel: () => void
  onSave: () => void
}): ReactNode {
  const { t, draft } = props
  const editing = draft.originalName !== undefined
  const stdio = draft.transport === 'stdio'
  const actions = (
    <div className="dshsm-editor-actions">
      <Button onClick={props.onCancel} disabled={props.busy}>{t('common.cancel')}</Button>
      <Button type="submit" variant="primary" disabled={props.busy}>
        {props.busy ? t('common.saving') : t('common.save')}
      </Button>
    </div>
  )

  return (
    <form
      className="dshsm-editor"
      onSubmit={event => {
        event.preventDefault()
        props.onSave()
      }}
    >
      <button type="button" className="dshsm-back" onClick={props.onCancel} disabled={props.busy}>
        <Icon name="back" size={14} />
        {t('mcp.backToList')}
      </button>

      <div className="dshsm-editor-head">
        <div>
          <h3>{editing ? t('mcp.editTitle', { name: draft.originalName }) : t('mcp.newTitle')}</h3>
          <p>{t('mcp.formIntro', { file: props.file })}</p>
        </div>
        {actions}
      </div>

      {props.error === null ? null : <NoticeBox tone="error">{props.error}</NoticeBox>}

      <section className="dshsm-form-section">
        <h4>{t('mcp.sectionBasic')}</h4>
        <div className="dshsm-field">
          <label htmlFor="dshsm-mcp-name">{t('mcp.name')}</label>
          <input
            id="dshsm-mcp-name"
            className="dshsm-input dshsm-mono"
            value={draft.name}
            placeholder={t('mcp.namePlaceholder')}
            onChange={event => { props.onUpdate({ name: event.target.value }) }}
            disabled={props.busy}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className="dshsm-field">
          <span className="dshsm-field-label">{t('mcp.transport')}</span>
          <div className="dshsm-segmented dshsm-segmented--fluid" role="radiogroup" aria-label={t('mcp.transport')}>
            <button
              type="button"
              role="radio"
              aria-checked={stdio}
              data-active={stdio}
              onClick={() => { props.onUpdate({ transport: 'stdio' }) }}
              disabled={props.busy}
            >
              {t('mcp.stdio')}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!stdio}
              data-active={!stdio}
              onClick={() => { props.onUpdate({ transport: 'streamable-http' }) }}
              disabled={props.busy}
            >
              {t('mcp.http')}
            </button>
          </div>
        </div>
      </section>

      <section className="dshsm-form-section">
        <h4>{t('mcp.sectionConnection')}</h4>
        {stdio ? (
          <>
            <div className="dshsm-form-grid">
              <div className="dshsm-field">
                <label htmlFor="dshsm-mcp-command">{t('mcp.command')}</label>
                <input
                  id="dshsm-mcp-command"
                  className="dshsm-input dshsm-mono"
                  value={draft.command}
                  placeholder={t('mcp.commandPlaceholder')}
                  onChange={event => { props.onUpdate({ command: event.target.value }) }}
                  disabled={props.busy}
                  spellCheck={false}
                />
              </div>
              <div className="dshsm-field">
                <label htmlFor="dshsm-mcp-cwd">{t('mcp.cwd')}</label>
                <input
                  id="dshsm-mcp-cwd"
                  className="dshsm-input dshsm-mono"
                  value={draft.cwd}
                  onChange={event => { props.onUpdate({ cwd: event.target.value }) }}
                  disabled={props.busy}
                  spellCheck={false}
                />
              </div>
            </div>
            <span className="dshsm-hint">{t('mcp.cwdHint')}</span>
            <div className="dshsm-field">
              <label htmlFor="dshsm-mcp-args">{t('mcp.args')}</label>
              <textarea
                id="dshsm-mcp-args"
                className="dshsm-textarea dshsm-code"
                value={draft.argsText}
                onChange={event => { props.onUpdate({ argsText: event.target.value }) }}
                disabled={props.busy}
                spellCheck={false}
              />
              <span className="dshsm-hint">{t('mcp.argsHint')}</span>
            </div>
            <div className="dshsm-field">
              <label htmlFor="dshsm-mcp-env">{t('mcp.env')}</label>
              <textarea
                id="dshsm-mcp-env"
                className="dshsm-textarea dshsm-code"
                value={draft.envText}
                onChange={event => { props.onUpdate({ envText: event.target.value }) }}
                disabled={props.busy}
                spellCheck={false}
              />
              <span className="dshsm-hint">{t('mcp.envHint')}</span>
            </div>
          </>
        ) : (
          <>
            <div className="dshsm-field">
              <label htmlFor="dshsm-mcp-url">{t('mcp.url')}</label>
              <input
                id="dshsm-mcp-url"
                className="dshsm-input dshsm-mono"
                value={draft.url}
                placeholder="https://example.com/mcp"
                onChange={event => { props.onUpdate({ url: event.target.value }) }}
                disabled={props.busy}
                spellCheck={false}
              />
            </div>
            <div className="dshsm-field">
              <label htmlFor="dshsm-mcp-headers">{t('mcp.headers')}</label>
              <textarea
                id="dshsm-mcp-headers"
                className="dshsm-textarea dshsm-code"
                value={draft.headersText}
                onChange={event => { props.onUpdate({ headersText: event.target.value }) }}
                disabled={props.busy}
                spellCheck={false}
              />
              <span className="dshsm-hint">{t('mcp.headersHint')}</span>
            </div>
          </>
        )}
      </section>

      <section className="dshsm-form-section">
        <h4>{t('mcp.sectionAdvanced')}</h4>
        <div className="dshsm-form-grid">
          <div className="dshsm-field">
            <label htmlFor="dshsm-mcp-timeout">{t('mcp.timeout')}</label>
            <input
              id="dshsm-mcp-timeout"
              className="dshsm-input"
              inputMode="numeric"
              value={draft.timeoutText}
              placeholder="60000"
              onChange={event => { props.onUpdate({ timeoutText: event.target.value }) }}
              disabled={props.busy}
            />
            <span className="dshsm-hint">{t('mcp.timeoutHint')}</span>
          </div>
          <div className="dshsm-field dshsm-switch-field">
            <div>
              <span className="dshsm-field-label">{t('mcp.enableLabel')}</span>
              <span className="dshsm-hint">{t('mcp.enableHint')}</span>
            </div>
            <Switch
              checked={draft.enabled}
              onChange={enabled => { props.onUpdate({ enabled }) }}
              disabled={props.busy}
              label={t('mcp.enableLabel')}
            />
          </div>
        </div>
      </section>

      <div className="dshsm-editor-footer">
        <span className="dshsm-hint">{t('mcp.footerHint')}</span>
        {actions}
      </div>
    </form>
  )
}
