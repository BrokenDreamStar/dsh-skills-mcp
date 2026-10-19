import { mkdtemp, mkdir, realpath, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { isInside, resolveProjectRoot } from './paths.ts'

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('paths', () => {
  it('finds the nearest .git ancestor', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dshsm-root-'))
    roots.push(root)
    await mkdir(join(root, '.git'))
    const nested = join(root, 'packages', 'app')
    await mkdir(nested, { recursive: true })
    expect(await resolveProjectRoot(nested)).toBe(await realpath(root))
  })

  it('falls back to the selected directory without .git', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dshsm-root-'))
    roots.push(root)
    await mkdir(join(root, 'nested'))
    expect(await resolveProjectRoot(join(root, 'nested'))).toBe(await realpath(join(root, 'nested')))
  })

  it('rejects a missing project directory', async () => {
    await expect(resolveProjectRoot('/definitely/not/here/dshsm')).rejects.toThrow(/不存在/)
  })

  it('checks containment without treating the root itself as inside', () => {
    expect(isInside('/a/b', '/a/b/c')).toBe(true)
    expect(isInside('/a/b', '/a/b')).toBe(false)
    expect(isInside('/a/b', '/a/bc')).toBe(false)
    expect(isInside('/a/b', '/a/b/../c')).toBe(false)
  })
})
