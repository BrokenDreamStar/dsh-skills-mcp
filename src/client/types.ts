import type { ManagerSnapshot } from '../shared.ts'

export type Translate = (key: string, params?: Record<string, unknown>) => string

export interface ClientProject {
  title: string
  path: string
}

export interface WorkspaceViewLike {
  workspaceId: string
  path: string
  title: string
}

export interface WorkspacesServiceLike {
  list: {
    getSnapshot(): {
      items: readonly WorkspaceViewLike[]
    }
    subscribe(listener: () => void): () => void
  }
}

export interface SlotSpec {
  name: string
  id?: string
  order?: number
  label?: string | (() => string)
  locale?: string
  inject?: () => unknown
}

export interface ClientCtx {
  slots: {
    register(spec: SlotSpec, component: (props: Record<string, unknown>) => unknown): unknown
    inject(name: string, register: () => unknown): () => void
  }
  locale: {
    register(ns: string, dictionaries: Record<string, Record<string, string>>): () => void
    bind(ns: string): Translate
  }
  effect(fn: () => unknown, label?: string): unknown
  get(name: string): unknown
}

export interface ManagerSectionProps {
  t: Translate
  listProjects: () => ClientProject[]
  subscribeProjects: (listener: () => void) => () => void
}

export interface LoadState {
  snapshot: ManagerSnapshot | null
  loading: boolean
  error: string | null
}
