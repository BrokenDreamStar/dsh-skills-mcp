import type { ReactNode } from 'react'
import type { RuntimeState } from '../shared.ts'
import type { Translate } from './types.ts'

export type NoticeTone = 'info' | 'success' | 'error' | 'warn'

export interface Notice {
  tone: NoticeTone
  text: string
}

export type IconName =
  | 'refresh'
  | 'search'
  | 'close'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'chevron'
  | 'back'
  | 'folder'
  | 'check'
  | 'alert'
  | 'info'
  | 'sparkle'
  | 'server'

const ICONS: Record<IconName, ReactNode> = {
  refresh: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.49-6.01" />
      <path d="M20.5 4.5v5h-5" />
    </>
  ),
  search: (
    <>
      <circle cx="10.75" cy="10.75" r="6.25" />
      <path d="m15.4 15.4 4.1 4.1" />
    </>
  ),
  close: <path d="M6.5 6.5l11 11m0-11l-11 11" />,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  edit: (
    <>
      <path d="M12.5 20H21" />
      <path d="M16.7 3.8a2.1 2.1 0 0 1 3 3L7.4 19.1l-4 1 1-4Z" />
    </>
  ),
  trash: (
    <>
      <path d="M4 6.5h16" />
      <path d="M9 6.5V4.2h6v2.3" />
      <path d="M18.5 6.5 17.6 20H6.4L5.5 6.5" />
      <path d="M10 10.5v5.5M14 10.5v5.5" />
    </>
  ),
  chevron: <path d="m7 9.5 5 5 5-5" />,
  back: (
    <>
      <path d="M19 12H5" />
      <path d="m11.5 18.5-6.5-6.5 6.5-6.5" />
    </>
  ),
  folder: (
    <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h3.6c.5 0 1 .2 1.35.6L12.4 7h5.6a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5Z" />
  ),
  check: <path d="m5 12.5 4.2 4.2L19 6.8" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4.7M12 16.1h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 7.9h.01" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.2 13.9 9l5.8 1.9-5.8 1.9L12 18.6l-1.9-5.8L4.3 10.9 10.1 9Z" />
      <path d="M18.5 3.5v3M17 5h3" />
    </>
  ),
  server: (
    <>
      <rect x="4" y="4.5" width="16" height="6" rx="2" />
      <rect x="4" y="13.5" width="16" height="6" rx="2" />
      <path d="M7.5 7.5h.01M7.5 16.5h.01" />
    </>
  ),
}

export function Icon(props: { name: IconName; size?: number }): ReactNode {
  const size = props.size ?? 16
  return (
    <svg
      className="dshsm-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[props.name]}
    </svg>
  )
}

export function Button(props: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
  title?: string
  type?: 'button' | 'submit'
  icon?: IconName
}): ReactNode {
  return (
    <button
      type={props.type ?? 'button'}
      className="dshsm-button"
      data-variant={props.variant}
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.title}
    >
      {props.icon === undefined ? null : <Icon name={props.icon} size={14} />}
      {props.children}
    </button>
  )
}

export function IconButton(props: {
  icon: IconName
  label: string
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'danger'
  title?: string
  busy?: boolean
}): ReactNode {
  return (
    <button
      type="button"
      className="dshsm-icon-button"
      data-variant={props.variant}
      data-busy={props.busy === true ? 'true' : undefined}
      aria-label={props.label}
      title={props.title ?? props.label}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      <Icon name={props.icon} size={15} />
    </button>
  )
}

export function Switch(props: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label: string
  title?: string
}): ReactNode {
  return (
    <button
      type="button"
      role="switch"
      className="dshsm-switch"
      aria-checked={props.checked}
      aria-label={props.label}
      title={props.title ?? props.label}
      disabled={props.disabled}
      onClick={() => { props.onChange(!props.checked) }}
    >
      <span className="dshsm-switch-thumb" />
    </button>
  )
}

export function Badge(props: { children: ReactNode; tone?: 'default' | 'accent' | 'success' | 'warn' | 'error' }): ReactNode {
  return <span className="dshsm-badge" data-tone={props.tone ?? 'default'}>{props.children}</span>
}

export function NoticeBox(props: { tone?: NoticeTone; children: ReactNode }): ReactNode {
  const tone = props.tone ?? 'info'
  return (
    <div className="dshsm-notice" data-tone={tone} role={tone === 'error' ? 'alert' : undefined}>
      <Icon name={tone === 'error' || tone === 'warn' ? 'alert' : tone === 'success' ? 'check' : 'info'} size={14} />
      <div className="dshsm-notice-body">{props.children}</div>
    </div>
  )
}

export function StatusBadge(props: { status: RuntimeState; t: Translate }): ReactNode {
  const tone = props.status === 'ready'
    ? 'success'
    : props.status === 'error'
      ? 'error'
      : props.status === 'starting'
        ? 'warn'
        : 'default'
  return (
    <Badge tone={tone}>
      <span className="dshsm-dot" data-tone={tone === 'default' ? undefined : tone} />
      {props.t(`status.${props.status}`)}
    </Badge>
  )
}

export function Issues(props: { items: readonly string[]; t: Translate }): ReactNode {
  if (props.items.length === 0) return null
  return (
    <div className="dshsm-issues" role="note">
      <div className="dshsm-issues-head">
        <Icon name="alert" size={13} />
        {props.t('common.issues')}
      </div>
      <ul>
        {props.items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
      </ul>
    </div>
  )
}

export function SearchField(props: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
  clearLabel: string
}): ReactNode {
  return (
    <div className="dshsm-search">
      <Icon name="search" size={14} />
      <input
        type="search"
        value={props.value}
        placeholder={props.placeholder}
        aria-label={props.label}
        onChange={event => { props.onChange(event.target.value) }}
        spellCheck={false}
        autoComplete="off"
      />
      {props.value === '' ? null : (
        <button
          type="button"
          className="dshsm-search-clear"
          aria-label={props.clearLabel}
          title={props.clearLabel}
          onClick={() => { props.onChange('') }}
        >
          <Icon name="close" size={12} />
        </button>
      )}
    </div>
  )
}

export function Select(props: {
  id?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  ariaLabel?: string
  className?: string
  children: ReactNode
}): ReactNode {
  return (
    <span className={props.className === undefined ? 'dshsm-select-wrap' : `dshsm-select-wrap ${props.className}`}>
      <select
        id={props.id}
        className="dshsm-select"
        value={props.value}
        aria-label={props.ariaLabel}
        disabled={props.disabled}
        onChange={event => { props.onChange(event.target.value) }}
      >
        {props.children}
      </select>
      <Icon name="chevron" size={13} />
    </span>
  )
}

export function EmptyState(props: {
  icon?: IconName
  title: string
  hint?: string
  action?: ReactNode
}): ReactNode {
  return (
    <div className="dshsm-empty">
      <span className="dshsm-empty-icon"><Icon name={props.icon ?? 'sparkle'} size={17} /></span>
      <strong>{props.title}</strong>
      {props.hint === undefined ? null : <p>{props.hint}</p>}
      {props.action}
    </div>
  )
}

export function SkeletonList(props: { rows?: number }): ReactNode {
  const rows = props.rows ?? 3
  return (
    <div className="dshsm-list" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div className="dshsm-skeleton-row" key={index}>
          <span className="dshsm-skeleton-line" style={{ width: `${34 + index * 7}%` }} />
          <span className="dshsm-skeleton-line" style={{ width: '92%' }} />
          <span className="dshsm-skeleton-line" style={{ width: '58%' }} />
        </div>
      ))}
    </div>
  )
}

export function formatError(t: Translate, message: string): string {
  return t('errors.actionFailed', { message })
}

/** 把 `/Users/name/...`、`/home/name/...`、`C:\\Users\\name\\...` 缩短为 `~/...`。 */
export function shortenPath(path: string): string {
  const match = /^(\/Users\/[^/]+|\/home\/[^/]+|[A-Za-z]:\\Users\\[^\\]+)/.exec(path)
  return match === null ? path : `~${path.slice(match[0].length)}`
}

/** 项目级路径优先显示项目根之后的相对部分，避免把最关键的尾段截掉。 */
export function displayPath(path: string, projectPath?: string): string {
  const base = (projectPath ?? '').trim().replace(/[\\/]+$/, '')
  const separator = base.includes('\\') ? '\\' : '/'
  if (base !== '' && path.startsWith(`${base}${separator}`)) return path.slice(base.length + 1)
  return shortenPath(path)
}

export type ParsedKeyValues =
  | { ok: true; value: Record<string, string> }
  | { ok: false; line: number; text: string }

export function parseKeyValueLines(text: string): ParsedKeyValues {
  const result: Record<string, string> = {}
  const lines = text.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index] ?? ''
    if (raw.trim() === '' || raw.trimStart().startsWith('#')) continue
    const equals = raw.indexOf('=')
    if (equals <= 0) return { ok: false, line: index + 1, text: raw }
    const key = raw.slice(0, equals).trim()
    if (key === '') return { ok: false, line: index + 1, text: raw }
    result[key] = raw.slice(equals + 1)
  }
  return { ok: true, value: result }
}

export function keyValueToText(value: Record<string, string> | undefined): string {
  if (value === undefined) return ''
  return Object.entries(value).map(([key, item]) => `${key}=${item}`).join('\n')
}
