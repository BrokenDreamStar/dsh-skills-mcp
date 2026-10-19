import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { SkillStateStore } from './skill-state.ts'

const roots: string[] = []

async function fixture(): Promise<{ file: string; store: SkillStateStore }> {
  const root = await mkdtemp(join(tmpdir(), 'dshsm-skill-state-'))
  roots.push(root)
  const file = join(root, 'skills-mcp-state.json')
  return { file, store: new SkillStateStore(file) }
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('SkillStateStore', () => {
  it('starts empty and persists system/project disable lists', async () => {
    const { file, store } = await fixture()
    expect((await store.read()).system).toEqual([])
    await store.setDisabled('system', undefined, 'alpha-skill', true)
    await store.setDisabled('project', '/project', 'beta-skill', true)
    expect([...(await store.disabledNames('system'))]).toEqual(['alpha-skill'])
    expect([...(await store.disabledNames('project', '/project'))].sort()).toEqual(['alpha-skill', 'beta-skill'])
    expect(JSON.parse(await readFile(file, 'utf8'))).toMatchObject({
      version: 1,
      system: ['alpha-skill'],
      projects: { '/project': ['beta-skill'] },
    })
    expect((await stat(file)).mode & 0o777).toBe(0o600)
  })

  it('removes empty project buckets when re-enabled', async () => {
    const { store } = await fixture()
    await store.setDisabled('project', '/project', 'beta-skill', true)
    await store.setDisabled('project', '/project', 'beta-skill', false)
    expect((await store.read()).projects).toEqual({})
  })

  it('reports an invalid state file and refuses writes over it', async () => {
    const { file, store } = await fixture()
    await writeFile(file, '{ bad json')
    const state = await store.read()
    expect(state.issue).toMatch(/不是合法 JSON/)
    await expect(store.setDisabled('system', undefined, 'alpha-skill', true)).rejects.toThrow(/不是合法 JSON/)
  })

  it('filters invalid names and ignores malformed lists', async () => {
    const { file, store } = await fixture()
    await writeFile(file, JSON.stringify({
      version: 1,
      system: ['good-name', 'Bad Name', 42],
      projects: {
        '/project': ['project-good', '../bad'],
        '/other': 'not-an-array',
      },
    }))
    const state = await store.read()
    expect(state.system).toEqual(['good-name'])
    expect(state.projects).toEqual({ '/project': ['project-good'] })
  })
})
