import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ManagerSnapshot, Scope } from '../shared.ts'
import { loadSnapshot } from './api.ts'
import { McpPanel } from './McpPanel.tsx'
import { SkillsPanel } from './SkillsPanel.tsx'
import { Button, IconButton, NoticeBox, Select } from './ui.tsx'
import type { Notice, NoticeTone } from './ui.tsx'
import type { ClientProject, ManagerSectionProps } from './types.ts'

type Tab = 'skills' | 'mcp'
const PROJECT_KEY = 'dsh-skills-mcp.project'
const SCOPE_KEY = 'dsh-skills-mcp.scope'
const TAB_KEY = 'dsh-skills-mcp.tab'

function stored(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function store(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // 隐私模式禁用 localStorage 时不影响使用。
  }
}

export function SkillsMcpSection(props: ManagerSectionProps): ReactNode {
  const { t, listProjects, subscribeProjects } = props
  const [projects, setProjects] = useState<ClientProject[]>(() => safeList(listProjects))
  const [projectPath, setProjectPath] = useState(() => {
    const saved = stored(PROJECT_KEY)
    return saved !== null && saved.trim() !== '' ? saved : safeList(listProjects)[0]?.path ?? ''
  })
  const [scope, setScope] = useState<Scope>(() => stored(SCOPE_KEY) === 'project' ? 'project' : 'system')
  const [tab, setTab] = useState<Tab>(() => stored(TAB_KEY) === 'mcp' ? 'mcp' : 'skills')
  const [snapshot, setSnapshot] = useState<ManagerSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [notice, setNotice] = useState<Notice | null>(null)
  const sequence = useRef(0)
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const notify = (tone: NoticeTone, text: string): void => {
    if (noticeTimer.current !== null) clearTimeout(noticeTimer.current)
    setNotice({ tone, text })
    noticeTimer.current = setTimeout(() => { setNotice(null) }, 4500)
  }

  useEffect(() => () => {
    if (noticeTimer.current !== null) clearTimeout(noticeTimer.current)
  }, [])

  useEffect(() => {
    store(PROJECT_KEY, projectPath)
  }, [projectPath])

  useEffect(() => {
    store(SCOPE_KEY, scope)
  }, [scope])

  useEffect(() => {
    store(TAB_KEY, tab)
  }, [tab])

  useEffect(() => {
    const sync = (): void => {
      const next = safeList(listProjects)
      setProjects(next)
      // 只填空值，不覆盖用户手输的路径。
      setProjectPath(current => current.trim() === '' && next[0] !== undefined ? next[0].path : current)
    }
    sync()
    return subscribeProjects(sync)
  }, [listProjects, subscribeProjects])

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      const requestId = ++sequence.current
      setLoading(true)
      void loadSnapshot(projectPath.trim() === '' ? undefined : projectPath.trim(), controller.signal)
        .then(result => {
          if (sequence.current !== requestId) return
          if (result.ok) {
            setSnapshot(result.value)
            setError(null)
          } else {
            setError(t('errors.loadFailed', { message: result.error.message }))
          }
        })
        .catch(errorValue => {
          if (sequence.current !== requestId) return
          if (errorValue instanceof Error && errorValue.name === 'AbortError') return
          setError(t('errors.loadFailed', { message: errorValue instanceof Error ? errorValue.message : String(errorValue) }))
        })
        .finally(() => {
          if (sequence.current === requestId) setLoading(false)
        })
    }, 220)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [projectPath, refreshKey, t])

  const refreshProjects = (): void => {
    const next = safeList(listProjects)
    setProjects(next)
    if (projectPath.trim() === '' && next[0] !== undefined) setProjectPath(next[0].path)
  }

  const refresh = (): void => {
    setRefreshKey(value => value + 1)
  }

  const onDone = (): void => { refresh() }
  const scopeInfo = scope === 'system' ? snapshot?.system : snapshot?.project
  const projectError = scope === 'project'
    ? (projectPath.trim() === '' ? t('errors.noProject') : snapshot?.projectError ?? null)
    : null
  const filteredProjects = projects.filter(project => project.path !== '')
  const skillsCount = scopeInfo?.skills.length
  const serversCount = scopeInfo?.servers.length

  return (
    <div className="dshsm-section" aria-busy={loading}>
      <header className="dshsm-header">
        <div className="dshsm-heading">
          <h2>{t('title')}</h2>
          <p title={t('intro')}>{t('intro')}</p>
        </div>
        <IconButton
          icon="refresh"
          label={t('common.refresh')}
          onClick={refresh}
          disabled={loading}
          busy={loading}
        />
      </header>

      <div className="dshsm-context">
        <div className="dshsm-context-row">
          <span className="dshsm-context-label">{t('scope.label')}</span>
          <div className="dshsm-segmented" role="tablist" aria-label={t('scope.label')}>
            <button
              type="button"
              role="tab"
              aria-selected={scope === 'system'}
              data-active={scope === 'system'}
              onClick={() => { setScope('system') }}
            >
              {t('scope.system')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scope === 'project'}
              data-active={scope === 'project'}
              onClick={() => { setScope('project') }}
            >
              {t('scope.project')}
            </button>
          </div>
          <span className="dshsm-context-hint">
            {scope === 'system' ? t('scope.systemHint') : t('scope.projectHint')}
          </span>
        </div>

        {scope === 'project' ? (
          <div className="dshsm-context-row dshsm-context-row--project">
            <label className="dshsm-context-label" htmlFor="dshsm-project-path">{t('project.label')}</label>
            <Select
              className="dshsm-project-select"
              ariaLabel={t('project.choose')}
              value={filteredProjects.some(project => project.path === projectPath.trim()) ? projectPath.trim() : ''}
              onChange={value => {
                if (value !== '') setProjectPath(value)
              }}
              disabled={loading}
            >
              <option value="">{t('project.choose')}</option>
              {filteredProjects.map(project => (
                <option key={project.path} value={project.path}>{project.title}</option>
              ))}
            </Select>
            <input
              id="dshsm-project-path"
              className="dshsm-input dshsm-mono dshsm-project-path"
              value={projectPath}
              placeholder={t('project.placeholder')}
              onChange={event => { setProjectPath(event.target.value) }}
              spellCheck={false}
              autoComplete="off"
            />
            <IconButton
              icon="refresh"
              label={t('project.refresh')}
              onClick={refreshProjects}
              disabled={loading}
            />
          </div>
        ) : null}
      </div>

      {notice !== null ? <NoticeBox tone={notice.tone}>{notice.text}</NoticeBox> : null}
      {error !== null ? (
        <NoticeBox tone="error">
          {error}
          <Button onClick={refresh} disabled={loading}>{t('common.retry')}</Button>
        </NoticeBox>
      ) : null}
      {projectError !== null ? <NoticeBox tone="warn">{projectError}</NoticeBox> : null}

      <div className="dshsm-tabbar">
        <div className="dshsm-tabs" role="tablist" aria-label={t('title')}>
          <button
            id="dshsm-tab-skills"
            type="button"
            role="tab"
            className="dshsm-tab"
            aria-selected={tab === 'skills'}
            data-active={tab === 'skills'}
            onClick={() => { setTab('skills') }}
          >
            {t('tabs.skills')}
            {skillsCount === undefined ? null : <span className="dshsm-tab-count">{skillsCount}</span>}
          </button>
          <button
            id="dshsm-tab-mcp"
            type="button"
            role="tab"
            className="dshsm-tab"
            aria-selected={tab === 'mcp'}
            data-active={tab === 'mcp'}
            onClick={() => { setTab('mcp') }}
          >
            {t('tabs.mcp')}
            {serversCount === undefined ? null : <span className="dshsm-tab-count">{serversCount}</span>}
          </button>
        </div>
      </div>

      {loading && snapshot !== null ? <div className="dshsm-progress" aria-hidden="true" /> : null}

      <div
        id={tab === 'skills' ? 'dshsm-panel-skills' : 'dshsm-panel-mcp'}
        className="dshsm-panel-wrap"
        role="tabpanel"
        aria-labelledby={tab === 'skills' ? 'dshsm-tab-skills' : 'dshsm-tab-mcp'}
      >
        {tab === 'skills' ? (
          <SkillsPanel
            t={t}
            scope={scope}
            projectPath={projectPath}
            scopeSnapshot={scopeInfo ?? null}
            loading={loading}
            notify={notify}
            onDone={onDone}
          />
        ) : (
          <McpPanel
            t={t}
            scope={scope}
            projectPath={projectPath}
            scopeSnapshot={scopeInfo ?? null}
            loading={loading}
            notify={notify}
            onDone={onDone}
          />
        )}
      </div>
    </div>
  )
}

function safeList(listProjects: ManagerSectionProps['listProjects']): ClientProject[] {
  try {
    return listProjects().filter(project => typeof project.path === 'string' && project.path !== '')
  } catch {
    return []
  }
}
