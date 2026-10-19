import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { SkillsStore } from './skills.ts'

const roots: string[] = []

async function fixture(): Promise<{ home: string; agentsHome: string; project: string; store: SkillsStore }> {
  const home = await mkdtemp(join(tmpdir(), 'dshsm-skills-'))
  roots.push(home)
  const agentsHome = join(home, '.agents')
  const project = join(home, 'project')
  await mkdir(project, { recursive: true })
  return {
    home,
    agentsHome,
    project,
    store: new SkillsStore({ dshHome: home, agentsHome, maxSkillBytes: 64 * 1024 }),
  }
}

function skill(name: string, description = 'Test skill'): string {
  return `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n\nBody.\n`
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('SkillsStore', () => {
  it('saves, lists and reads a system DSH skill', async () => {
    const { home, store } = await fixture()
    const saved = await store.save('system-dsh', undefined, 'alpha-skill', skill('alpha-skill'))
    expect(saved.path).toBe(join(home, 'skills', 'alpha-skill', 'SKILL.md'))
    const listed = await store.list('system')
    expect(listed.issues).toEqual([])
    expect(listed.skills).toHaveLength(1)
    expect(listed.skills[0]).toMatchObject({
      name: 'alpha-skill',
      description: 'Test skill',
      modelInvocable: true,
      userInvocable: true,
      kind: 'bundle',
      root: 'system-dsh',
      rootKind: 'dsh',
    })
    const content = await store.read('system-dsh', undefined, 'alpha-skill')
    expect(content.content).toContain('Body.')
  })

  it('discovers flat skills and honours invocation frontmatter', async () => {
    const { home, store } = await fixture()
    await mkdir(join(home, 'skills'), { recursive: true })
    await writeFile(join(home, 'skills', 'flat-skill.md'), [
      '---',
      'name: flat-skill',
      'description: Flat',
      'disable-model-invocation: yes',
      'user-invocable: false',
      '---',
      '',
      '# Flat',
    ].join('\n'))
    const listed = await store.list('system')
    expect(listed.skills[0]).toMatchObject({
      name: 'flat-skill',
      kind: 'flat',
      modelInvocable: false,
      userInvocable: false,
    })
    const saved = await store.save('system-dsh', undefined, 'flat-skill', skill('flat-skill', 'Updated'))
    expect(saved.path).toBe(join(home, 'skills', 'flat-skill.md'))
    expect(await readFile(saved.path, 'utf8')).toContain('description: Updated')
  })

  it('reads both DSH and Shared Agents system roots', async () => {
    const { home, agentsHome, store } = await fixture()
    await store.save('system-dsh', undefined, 'dsh-skill', skill('dsh-skill', 'DSH copy'))
    await store.save('system-agents', undefined, 'agents-skill', skill('agents-skill', 'Agents copy'))
    const listed = await store.list('system')
    expect(listed.skills.map(item => [item.name, item.root, item.rootKind])).toEqual([
      ['agents-skill', 'system-agents', 'agents'],
      ['dsh-skill', 'system-dsh', 'dsh'],
    ])
    expect(listed.skills.find(item => item.root === 'system-agents')?.path)
      .toBe(join(agentsHome, 'skills', 'agents-skill', 'SKILL.md'))
    const content = await store.read('system-agents', undefined, 'agents-skill')
    expect(content.root).toBe('system-agents')
    await store.delete('system-agents', undefined, 'agents-skill')
    expect((await store.list('system')).skills.map(item => item.root)).toEqual(['system-dsh'])
    expect(home).toContain('dshsm-skills-')
  })

  it('supports same-name copies in the two roots', async () => {
    const { store } = await fixture()
    await store.save('system-dsh', undefined, 'same-skill', skill('same-skill', 'DSH'))
    await store.save('system-agents', undefined, 'same-skill', skill('same-skill', 'Agents'))
    const listed = await store.list('system')
    expect(listed.skills.map(item => [item.root, item.description])).toEqual([
      ['system-dsh', 'DSH'],
      ['system-agents', 'Agents'],
    ])
  })

  it('creates and edits project skills under .dsh/skills and .agents/skills', async () => {
    const { project, store } = await fixture()
    const saved = await store.save('project-dsh', project, 'project-skill', skill('project-skill'))
    expect(saved.path).toBe(join(project, '.dsh', 'skills', 'project-skill', 'SKILL.md'))
    const agents = await store.save('project-agents', project, 'agents-project-skill', skill('agents-project-skill'))
    expect(agents.path).toBe(join(project, '.agents', 'skills', 'agents-project-skill', 'SKILL.md'))
    const listed = await store.list('project', project)
    expect(listed.skills.map(item => [item.name, item.root])).toEqual([
      ['agents-project-skill', 'project-agents'],
      ['project-skill', 'project-dsh'],
    ])
    expect((await store.list('system')).skills).toEqual([])
  })

  it('rejects invalid frontmatter, mismatched names and traversal', async () => {
    const { store } = await fixture()
    await expect(store.save('system-dsh', undefined, 'bad-skill', 'no frontmatter')).rejects.toThrow(/frontmatter/)
    await expect(store.save('system-dsh', undefined, 'first', skill('second'))).rejects.toThrow(/必须与技能名/)
    await expect(store.save('system-dsh', undefined, '../escape', skill('escape'))).rejects.toThrow(/kebab-case/)
    await expect(store.save('system-dsh', undefined, 'bad_name', skill('bad_name'))).rejects.toThrow(/kebab-case/)
    await expect(store.save('system-dsh', undefined, 'bad_name', skill('bad_name'))).rejects.toThrow()
  })

  it('shows broken files as issues but still lets them be read and fixed', async () => {
    const { home, store } = await fixture()
    await mkdir(join(home, 'skills', 'broken-skill'), { recursive: true })
    await writeFile(join(home, 'skills', 'broken-skill', 'SKILL.md'), '---\nname: broken-skill\n---\nbody')
    const listed = await store.list('system')
    expect(listed.skills[0]?.issue).toMatch(/description/)
    const content = await store.read('system-dsh', undefined, 'broken-skill')
    expect(content.content).toContain('body')
    await store.save('system-dsh', undefined, 'broken-skill', skill('broken-skill', 'Fixed'))
    expect((await store.list('system')).skills[0]?.issue).toBeUndefined()
  })

  it('moves deleted skills into a per-root trash instead of removing them', async () => {
    const { home, store } = await fixture()
    const saved = await store.save('system-dsh', undefined, 'trash-me', skill('trash-me'))
    const deleted = await store.delete('system-dsh', undefined, 'trash-me')
    expect(deleted.trashPath).toBeDefined()
    expect(deleted.trashPath).toContain(join(home, '.skills-mcp-trash', 'system-dsh'))
    expect(await readFile(join(deleted.trashPath!, 'SKILL.md'), 'utf8')).toContain('Body.')
    await expect(store.read('system-dsh', undefined, 'trash-me')).rejects.toThrow(/不存在/)
    expect(saved.path).not.toContain('.skills-mcp-trash')
  })

  it('shows symlinked skills as read-only and refuses writes through them', async () => {
    const { home, store } = await fixture()
    await mkdir(join(home, 'skills', 'linked'), { recursive: true })
    const outside = join(home, 'outside.md')
    await writeFile(outside, skill('linked'))
    await symlink(outside, join(home, 'skills', 'linked', 'SKILL.md'))
    const listed = await store.list('system')
    expect(listed.skills).toHaveLength(1)
    expect(listed.skills[0]).toMatchObject({ name: 'linked', readOnly: true })
    const content = await store.read('system-dsh', undefined, 'linked')
    expect(content.content).toContain('Body.')
    await expect(store.save('system-dsh', undefined, 'linked', skill('linked', 'Changed')))
      .rejects.toThrow(/符号链接/)
    await expect(store.delete('system-dsh', undefined, 'linked'))
      .rejects.toThrow(/符号链接/)
  })
})
