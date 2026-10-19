import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Scope, ScopeSnapshot, SkillListItem, SkillRootId, SkillRootView } from '../shared.ts'
import { deleteSkill, readSkill, saveSkill, setSkillEnabled } from './api.ts'
import type { NoticeTone } from './ui.tsx'
import {
  Badge, Button, EmptyState, Icon, IconButton, Issues, NoticeBox, SearchField, SkeletonList, Switch,
  displayPath,
} from './ui.tsx'
import type { Translate } from './types.ts'

interface SkillsPanelProps {
  t: Translate
  scope: Scope
  projectPath: string
  scopeSnapshot: ScopeSnapshot | null
  loading: boolean
  notify: (tone: NoticeTone, text: string) => void
  onDone: () => void
}

interface Draft {
  mode: 'create' | 'edit'
  name: string
  originalName?: string
  root: SkillRootId
  content: string
  contentTouched: boolean
}

function defaultRoot(scope: Scope): SkillRootId {
  return scope === 'project' ? 'project-dsh' : 'system-dsh'
}

function matches(skill: SkillListItem, query: string, t: Translate): boolean {
  if (query === '') return true
  const haystack = [
    skill.name,
    skill.description,
    skill.whenToUse ?? '',
    skill.path,
    skill.rootKind,
    t(`skillRoot.${skill.rootKind}`),
  ].join('\n').toLowerCase()
  return haystack.includes(query)
}

export function SkillsPanel(props: SkillsPanelProps): ReactNode {
  const { t, scope, scopeSnapshot } = props
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    setDraft(null)
    setEditorError(null)
    setQuery('')
  }, [scope, props.projectPath])

  const roots = scopeSnapshot?.skillRoots ?? []
  const skills = scopeSnapshot?.skills ?? []
  const normalizedQuery = query.trim().toLowerCase()
  const visible = useMemo(
    () => normalizedQuery === '' ? skills : skills.filter(skill => matches(skill, normalizedQuery, t)),
    [skills, normalizedQuery, t],
  )

  const scopeReady = scope === 'system' || props.projectPath.trim() !== ''
  if (!scopeReady) {
    return <NoticeBox tone="warn">{t('errors.noProjectSkills')}</NoticeBox>
  }

  const startCreate = (): void => {
    setEditorError(null)
    const root = roots[0]?.id ?? defaultRoot(scope)
    setDraft({
      mode: 'create',
      name: '',
      root,
      content: '',
      contentTouched: false,
    })
  }

  const startEdit = async (skill: SkillListItem): Promise<void> => {
    setEditorError(null)
    setLoadingContent(true)
    try {
      const result = await readSkill(
        scope,
        scope === 'project' ? props.projectPath : undefined,
        skill.root,
        skill.name,
      )
      if (!result.ok) {
        props.notify('error', t('errors.actionFailed', { message: result.error.message }))
        return
      }
      setDraft({
        mode: 'edit',
        name: skill.name,
        originalName: skill.name,
        root: skill.root,
        content: result.value.content,
        contentTouched: true,
      })
    } catch (error) {
      props.notify('error', t('errors.actionFailed', { message: error instanceof Error ? error.message : String(error) }))
    } finally {
      setLoadingContent(false)
    }
  }

  const updateName = (name: string): void => {
    setDraft(current => {
      if (current === null) return current
      const next = { ...current, name }
      if (current.mode === 'create' && !current.contentTouched) {
        next.content = name.trim() === '' ? '' : t('skills.template', { name: name.trim() })
      }
      return next
    })
  }

  const save = async (): Promise<void> => {
    if (draft === null) return
    const name = draft.name.trim()
    if (name === '') {
      setEditorError(t('editor.nameRequired'))
      return
    }
    setBusy(true)
    setEditorError(null)
    try {
      const result = await saveSkill(
        scope,
        scope === 'project' ? props.projectPath : undefined,
        draft.root,
        name,
        draft.content,
      )
      if (!result.ok) {
        setEditorError(result.error.message)
        return
      }
      setDraft(null)
      props.notify('success', t('skills.saved'))
      props.onDone()
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (skill: SkillListItem): Promise<void> => {
    if (!window.confirm(t('skills.deleteConfirm', { name: skill.name }))) return
    setBusy(true)
    try {
      const result = await deleteSkill(
        scope,
        scope === 'project' ? props.projectPath : undefined,
        skill.root,
        skill.name,
      )
      if (!result.ok) {
        props.notify('error', t('errors.actionFailed', { message: result.error.message }))
        return
      }
      props.notify('success', t('skills.deleted', { path: result.value.trashPath ?? '—' }))
      if (draft?.name === skill.name && draft.root === skill.root) setDraft(null)
      props.onDone()
    } catch (error) {
      props.notify('error', t('errors.actionFailed', { message: error instanceof Error ? error.message : String(error) }))
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (skill: SkillListItem, enabled: boolean): Promise<void> => {
    setBusy(true)
    try {
      const result = await setSkillEnabled(
        scope,
        scope === 'project' ? props.projectPath : undefined,
        skill.name,
        enabled,
      )
      if (!result.ok) {
        props.notify('error', t('errors.actionFailed', { message: result.error.message }))
        return
      }
      props.notify('success', t(enabled ? 'skills.enabledInDshMessage' : 'skills.disabledInDshMessage', { name: skill.name }))
      props.onDone()
    } catch (error) {
      props.notify('error', t('errors.actionFailed', { message: error instanceof Error ? error.message : String(error) }))
    } finally {
      setBusy(false)
    }
  }

  if (draft !== null) {
    return (
      <SkillEditor
        t={t}
        draft={draft}
        roots={roots}
        projectPath={scope === 'project' ? props.projectPath : undefined}
        busy={busy}
        error={editorError}
        onChangeName={updateName}
        onChangeRoot={root => { setDraft(current => current === null ? current : { ...current, root }) }}
        onChangeContent={content => { setDraft(current => current === null ? current : { ...current, content, contentTouched: true }) }}
        onCancel={() => { setDraft(null); setEditorError(null) }}
        onSave={() => { void save() }}
      />
    )
  }

  const toolbarDisabled = busy || loadingContent || props.loading || scopeSnapshot === null

  return (
    <div className="dshsm-panel">
      <div className="dshsm-panel-bar">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder={t('skills.searchPlaceholder')}
          label={t('skills.searchPlaceholder')}
          clearLabel={t('common.clearSearch')}
        />
        <Button
          variant="primary"
          icon="plus"
          onClick={startCreate}
          disabled={toolbarDisabled}
        >
          {t('skills.add')}
        </Button>
      </div>

      <div className="dshsm-panel-meta">
        {roots.map(root => (
          <span className="dshsm-source" key={root.id} title={root.path}>
            <Icon name="folder" size={12} />
            <span>{t(`skillRoot.${root.kind}`)}</span>
            <code>{displayPath(root.path, scope === 'project' ? props.projectPath : undefined)}</code>
          </span>
        ))}
        {normalizedQuery === '' ? null : (
          <span className="dshsm-count">{visible.length} / {skills.length}</span>
        )}
      </div>

      {scopeSnapshot !== null ? <Issues items={scopeSnapshot.issues} t={t} /> : null}

      {scopeSnapshot === null && props.loading ? <SkeletonList rows={3} /> : null}

      {scopeSnapshot === null && !props.loading ? (
        <EmptyState icon="sparkle" title={t('errors.noData')} />
      ) : null}

      {scopeSnapshot !== null && skills.length === 0 ? (
        <EmptyState
          icon="sparkle"
          title={t('skills.empty')}
          hint={t('skills.emptyHint')}
          action={(
            <Button variant="primary" icon="plus" onClick={startCreate} disabled={toolbarDisabled}>
              {t('skills.add')}
            </Button>
          )}
        />
      ) : null}

      {scopeSnapshot !== null && skills.length > 0 && visible.length === 0 ? (
        <EmptyState
          icon="search"
          title={t('skills.noMatch')}
          hint={t('skills.noMatchHint')}
          action={<Button onClick={() => { setQuery('') }}>{t('common.clearSearch')}</Button>}
        />
      ) : null}

      {visible.length > 0 ? (
        <div className="dshsm-list">
          {visible.map(skill => (
            <SkillRow
              key={`${skill.root}:${skill.name}`}
              t={t}
              skill={skill}
              busy={busy || loadingContent}
              pathLabel={displayPath(skill.path, scope === 'project' ? props.projectPath : undefined)}
              onToggle={enabled => { void toggle(skill, enabled) }}
              onEdit={() => { void startEdit(skill) }}
              onDelete={() => { void remove(skill) }}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SkillRow(props: {
  t: Translate
  skill: SkillListItem
  busy: boolean
  pathLabel: string
  onToggle: (enabled: boolean) => void
  onEdit: () => void
  onDelete: () => void
}): ReactNode {
  const { t, skill } = props
  const disabled = skill.disabledInDsh === true
  const readOnly = skill.readOnly === true
  const surface = skill.issue !== undefined
    ? null
    : !skill.modelInvocable && !skill.userInvocable
      ? 'hidden'
      : !skill.userInvocable
        ? 'model'
        : !skill.modelInvocable
          ? 'user'
          : null

  return (
    <article className="dshsm-row" data-disabled={disabled ? 'true' : undefined}>
      <div className="dshsm-row-body">
        <div className="dshsm-row-title">
          <span className="dshsm-row-name">{skill.name}</span>
          <Badge tone={skill.rootKind === 'dsh' ? 'accent' : undefined}>{t(`skillRoot.${skill.rootKind}`)}</Badge>
          {disabled ? <Badge tone="warn">{t('skills.disabledInDsh')}</Badge> : null}
          {readOnly ? <Badge>{t('skills.readOnly')}</Badge> : null}
          {skill.issue !== undefined ? <Badge tone="error">{t('skills.invalid')}</Badge> : null}
          {surface === 'hidden' ? <Badge tone="warn">{t('skills.hidden')}</Badge> : null}
          {surface === 'model' ? <Badge>{t('skills.modelOnly')}</Badge> : null}
          {surface === 'user' ? <Badge>{t('skills.userOnly')}</Badge> : null}
        </div>
        {skill.description === '' ? null : (
          <p className="dshsm-row-desc" title={skill.description}>{skill.description}</p>
        )}
        {skill.issue === undefined ? null : (
          <div className="dshsm-row-note">
            <Icon name="alert" size={12} />
            <span>{skill.issue}</span>
          </div>
        )}
        <div className="dshsm-row-meta">
          <span className="dshsm-row-path" title={skill.path}>{props.pathLabel}</span>
          {skill.kind === 'flat' ? <span className="dshsm-row-tag">{t('skills.flat')}</span> : null}
        </div>
      </div>
      <div className="dshsm-row-actions">
        <IconButton
          icon="edit"
          label={t('common.edit')}
          title={readOnly ? t('skills.readOnly') : t('common.edit')}
          onClick={props.onEdit}
          disabled={props.busy || readOnly}
        />
        <IconButton
          icon="trash"
          label={t('common.delete')}
          title={readOnly ? t('skills.readOnly') : t('common.delete')}
          variant="danger"
          onClick={props.onDelete}
          disabled={props.busy || readOnly}
        />
        <Switch
          checked={!disabled}
          onChange={props.onToggle}
          disabled={props.busy || readOnly}
          label={t('skills.enabledSwitch')}
          title={t('skills.toggleHint')}
        />
      </div>
    </article>
  )
}

function SkillEditor(props: {
  t: Translate
  draft: Draft
  roots: readonly SkillRootView[]
  projectPath: string | undefined
  busy: boolean
  error: string | null
  onChangeName: (name: string) => void
  onChangeRoot: (root: SkillRootId) => void
  onChangeContent: (content: string) => void
  onCancel: () => void
  onSave: () => void
}): ReactNode {
  const { t, draft } = props
  const editing = draft.mode === 'edit'
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
        {t('skills.backToList')}
      </button>

      <div className="dshsm-editor-head">
        <div>
          <h3>{editing ? t('skills.editTitle', { name: draft.name }) : t('skills.newTitle')}</h3>
          <p>{t('skills.editorIntro')}</p>
        </div>
        {actions}
      </div>

      {props.error === null ? null : <NoticeBox tone="error">{props.error}</NoticeBox>}

      <div className="dshsm-field">
        <label htmlFor="dshsm-skill-name">{t('skills.name')}</label>
        <input
          id="dshsm-skill-name"
          className="dshsm-input dshsm-mono"
          value={draft.name}
          placeholder={t('skills.namePlaceholder')}
          onChange={event => { props.onChangeName(event.target.value) }}
          disabled={props.busy || editing}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="dshsm-field">
        <span className="dshsm-field-label">{t('skills.root')}</span>
        <div className="dshsm-radio-cards" role="radiogroup" aria-label={t('skills.root')}>
          {props.roots.map(root => {
            const active = draft.root === root.id
            return (
              <label
                key={root.id}
                className="dshsm-radio-card"
                data-active={active}
                data-disabled={editing}
                title={root.path}
              >
                <input
                  type="radio"
                  name="dshsm-skill-root"
                  value={root.id}
                  checked={active}
                  onChange={() => { props.onChangeRoot(root.id) }}
                  disabled={props.busy || editing}
                />
                <span className="dshsm-radio-card-label">
                  {t(`skillRoot.${root.kind}`)}
                  <span className="dshsm-radio-check"><Icon name="check" size={12} /></span>
                </span>
                <code>{displayPath(root.path, props.projectPath)}</code>
              </label>
            )
          })}
        </div>
        <span className="dshsm-hint">{t('skills.rootHint')}</span>
      </div>

      <div className="dshsm-field">
        <label htmlFor="dshsm-skill-content">{t('skills.content')}</label>
        <textarea
          id="dshsm-skill-content"
          className="dshsm-textarea dshsm-code dshsm-code-lg"
          value={draft.content}
          onChange={event => { props.onChangeContent(event.target.value) }}
          disabled={props.busy}
          spellCheck={false}
        />
        <span className="dshsm-hint">{t('skills.saveHint')}</span>
      </div>

      <div className="dshsm-editor-footer">
        <span className="dshsm-hint">{t('skills.footerHint')}</span>
        {actions}
      </div>
    </form>
  )
}
