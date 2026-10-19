import { randomUUID } from 'node:crypto';
import { cp, lstat, readFile, readdir, realpath, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ManagerError, messageOf } from "./errors.js";
import { assertSkillName, ensureDirectory, isInside, isSkillName, pathExists } from "./paths.js";
const SKILL_ROOT_IDS = [
    'system-dsh',
    'system-agents',
    'project-dsh',
    'project-agents',
];
export function isSkillRootId(value) {
    return typeof value === 'string' && SKILL_ROOT_IDS.includes(value);
}
export function scopeOfSkillRoot(root) {
    return root.startsWith('project-') ? 'project' : 'system';
}
export function defaultSkillRoot(scope) {
    return scope === 'project' ? 'project-dsh' : 'system-dsh';
}
/** 同时管理 DSH 与 Shared Agents 的系统/项目技能根；文件变化交给原生 watcher。 */
export class SkillsStore {
    options;
    constructor(options) {
        this.options = options;
    }
    roots(scope, projectRoot) {
        if (scope === 'system') {
            return [
                { id: 'system-dsh', scope, kind: 'dsh', path: join(this.options.dshHome, 'skills') },
                { id: 'system-agents', scope, kind: 'agents', path: join(this.options.agentsHome, 'skills') },
            ];
        }
        if (projectRoot === undefined)
            throw new ManagerError('invalid-argument', '项目级技能需要项目路径');
        return [
            { id: 'project-dsh', scope, kind: 'dsh', path: join(projectRoot, '.dsh', 'skills') },
            { id: 'project-agents', scope, kind: 'agents', path: join(projectRoot, '.agents', 'skills') },
        ];
    }
    rootViews(scope, projectRoot) {
        return this.roots(scope, projectRoot).map(root => ({ ...root }));
    }
    resolveRoot(rootId, projectRoot) {
        const root = this.roots(scopeOfSkillRoot(rootId), projectRoot).find(candidate => candidate.id === rootId);
        if (root === undefined)
            throw new ManagerError('invalid-argument', `未知技能根：${rootId}`);
        return root;
    }
    async list(scope, projectRoot) {
        const issues = [];
        const skills = [];
        const roots = this.roots(scope, projectRoot);
        const rootOrder = new Map(roots.map((root, index) => [root.id, index]));
        for (const root of roots) {
            const result = await this.listRoot(root);
            skills.push(...result.skills);
            issues.push(...result.issues);
        }
        skills.sort((a, b) => a.name.localeCompare(b.name)
            || (rootOrder.get(a.root) ?? 0) - (rootOrder.get(b.root) ?? 0));
        return { skills, issues };
    }
    async listRoot(root) {
        const issues = [];
        let entries;
        try {
            entries = await readdir(root.path, { withFileTypes: true });
        }
        catch (error) {
            if (isMissing(error))
                return { skills: [], issues: [] };
            return { skills: [], issues: [`无法读取 ${root.path}：${messageOf(error)}`] };
        }
        const skills = new Map();
        for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
            if (entry.name.startsWith('.'))
                continue;
            const fullPath = join(root.path, entry.name);
            let skill;
            try {
                if (entry.isSymbolicLink()) {
                    const target = await stat(fullPath).catch(() => undefined);
                    if (target?.isDirectory()) {
                        const file = join(fullPath, 'SKILL.md');
                        const fileInfo = await stat(file).catch(() => undefined);
                        if (fileInfo?.isFile()) {
                            const raw = await this.readText(file);
                            skill = {
                                ...this.parseFile({ name: entry.name, path: file, kind: 'bundle', raw }),
                                readOnly: true,
                            };
                        }
                    }
                    else if (target?.isFile() && entry.name.endsWith('.md')) {
                        const raw = await this.readText(fullPath);
                        skill = {
                            ...this.parseFile({ name: basename(entry.name, '.md'), path: fullPath, kind: 'flat', raw }),
                            readOnly: true,
                        };
                    }
                }
                else if (entry.isDirectory()) {
                    const file = join(fullPath, 'SKILL.md');
                    const fileInfo = await stat(file).catch(() => undefined);
                    if (!fileInfo?.isFile())
                        continue;
                    const raw = await this.readText(file);
                    skill = {
                        ...this.parseFile({ name: entry.name, path: file, kind: 'bundle', raw }),
                        ...await isSymlink(file) ? { readOnly: true } : {},
                    };
                }
                else if (entry.isFile() && entry.name.endsWith('.md')) {
                    const raw = await this.readText(fullPath);
                    skill = this.parseFile({ name: basename(entry.name, '.md'), path: fullPath, kind: 'flat', raw });
                }
            }
            catch (error) {
                issues.push(`${fullPath}: ${messageOf(error)}`);
                continue;
            }
            if (skill === undefined)
                continue;
            if (!isSkillName(skill.name)) {
                issues.push(`${skill.path}: 技能名不是 kebab-case（${JSON.stringify(skill.name)}），未纳入管理`);
                continue;
            }
            const previous = skills.get(skill.name);
            if (previous !== undefined) {
                issues.push(`${root.id}: 技能名 ${skill.name} 出现多次，仅展示 ${previous.path}；另一份在 ${skill.path}`);
                continue;
            }
            skills.set(skill.name, {
                name: skill.name,
                description: skill.description,
                ...skill.whenToUse === undefined ? {} : { whenToUse: skill.whenToUse },
                path: skill.path,
                kind: skill.kind,
                source: root.scope,
                root: root.id,
                rootKind: root.kind,
                modelInvocable: skill.modelInvocable,
                userInvocable: skill.userInvocable,
                ...skill.issue === undefined ? {} : { issue: skill.issue },
                ...skill.readOnly === true ? { readOnly: true } : {},
            });
        }
        return {
            skills: [...skills.values()].sort((a, b) => a.name.localeCompare(b.name)),
            issues,
        };
    }
    async read(rootId, projectRoot, name) {
        assertSkillName(name);
        const root = this.resolveRoot(rootId, projectRoot);
        const target = await this.findEntry(root.path, name);
        if (target === undefined)
            throw new ManagerError('not-found', `技能不存在：${name}（${root.path}）`);
        const bundleDirectory = target.kind === 'bundle' ? dirname(target.path) : undefined;
        const readOnly = await isSymlink(target.path)
            || (bundleDirectory !== undefined && await isSymlink(bundleDirectory));
        if (!readOnly)
            await this.assertSafeTarget(root.path, target.path, target.kind === 'bundle');
        const info = await stat(target.path);
        if (info.size > this.options.maxSkillBytes) {
            throw new ManagerError('invalid-content', `技能文件超过 ${this.options.maxSkillBytes} 字节上限，无法在管理页打开`);
        }
        return {
            name,
            root: rootId,
            path: target.path,
            content: await readFile(target.path, 'utf8'),
        };
    }
    async save(rootId, projectRoot, name, content) {
        assertSkillName(name);
        const bytes = Buffer.byteLength(content, 'utf8');
        if (bytes > this.options.maxSkillBytes) {
            throw new ManagerError('invalid-content', `技能文件过大：${bytes} 字节，上限 ${this.options.maxSkillBytes} 字节`);
        }
        const parsed = this.parseContent(content);
        if (parsed.issue !== undefined)
            throw new ManagerError('invalid-content', parsed.issue);
        if (parsed.name !== name) {
            throw new ManagerError('invalid-content', `frontmatter 中的 name（${parsed.name}）必须与技能名（${name}）一致`);
        }
        const root = this.resolveRoot(rootId, projectRoot);
        const existing = await this.findEntry(root.path, name);
        await ensureDirectory(root.path);
        if (existing !== undefined) {
            await this.assertSafeTarget(root.path, existing.path, existing.kind === 'bundle');
            await atomicWrite(existing.path, content);
            return { name, root: rootId, path: existing.path };
        }
        const directory = join(root.path, name);
        const path = join(directory, 'SKILL.md');
        if (await pathExists(directory) || await pathExists(join(root.path, `${name}.md`))) {
            throw new ManagerError('conflict', `技能 ${name} 已存在，但路径不是可管理的技能文件`);
        }
        await ensureDirectory(directory);
        await atomicWrite(path, content);
        return { name, root: rootId, path };
    }
    async delete(rootId, projectRoot, name) {
        assertSkillName(name);
        const root = this.resolveRoot(rootId, projectRoot);
        const target = await this.findEntry(root.path, name);
        if (target === undefined)
            throw new ManagerError('not-found', `技能不存在：${name}（${root.path}）`);
        await this.assertSafeTarget(root.path, target.path, target.kind === 'bundle');
        const pathToMove = target.kind === 'bundle' ? dirname(target.path) : target.path;
        const trashRoot = join(this.options.dshHome, '.skills-mcp-trash', rootId);
        await ensureDirectory(trashRoot);
        const suffix = target.kind === 'flat' ? '.md' : '';
        let trashPath = join(trashRoot, `${Date.now()}-${name}${suffix}`);
        if (await pathExists(trashPath))
            trashPath = join(trashRoot, `${Date.now()}-${name}-${randomUUID().slice(0, 8)}${suffix}`);
        try {
            await rename(pathToMove, trashPath);
        }
        catch (error) {
            if (!hasCode(error, 'EXDEV')) {
                throw new ManagerError('io-error', `无法移动技能到回收站：${name}`, { cause: error });
            }
            await cp(pathToMove, trashPath, { recursive: true, errorOnExist: true, force: false });
            await rm(pathToMove, { recursive: true, force: false });
        }
        return { name, root: rootId, path: target.path, trashPath };
    }
    async findEntry(root, name) {
        const bundle = join(root, name, 'SKILL.md');
        const flat = join(root, `${name}.md`);
        const hasBundle = await isFileFollowing(bundle);
        const hasFlat = await isFileFollowing(flat);
        if (hasBundle && hasFlat) {
            throw new ManagerError('conflict', `技能 ${name} 同时存在目录与单文件两种形式，请先手动处理冲突`);
        }
        if (hasBundle)
            return { path: bundle, kind: 'bundle' };
        if (hasFlat)
            return { path: flat, kind: 'flat' };
        // 目录名/文件名与 frontmatter name 不一致时，仍允许按 frontmatter name 管理。
        let entries;
        try {
            entries = await readdir(root, { withFileTypes: true });
        }
        catch {
            return undefined;
        }
        const matches = [];
        for (const entry of entries) {
            if (entry.name.startsWith('.') || entry.isSymbolicLink())
                continue;
            let candidate;
            if (entry.isDirectory()) {
                const path = join(root, entry.name, 'SKILL.md');
                if (await isRegularFile(path))
                    candidate = { path, kind: 'bundle' };
            }
            else if (entry.isFile() && entry.name.endsWith('.md')) {
                candidate = { path: join(root, entry.name), kind: 'flat' };
            }
            if (candidate === undefined)
                continue;
            try {
                const parsed = this.parseContent(await this.readText(candidate.path));
                if (parsed.issue === undefined && parsed.name === name)
                    matches.push(candidate);
            }
            catch {
                // 无法读取的条目留给列表诊断；这里只做兜底查找。
            }
        }
        if (matches.length > 1) {
            throw new ManagerError('conflict', `技能 ${name} 对应多个文件，请先手动清理：${matches.map(match => match.path).join(', ')}`);
        }
        return matches[0];
    }
    parseFile(input) {
        const parsed = this.parseContent(input.raw);
        return {
            name: parsed.issue !== undefined ? input.name : parsed.name,
            description: parsed.description || '（frontmatter 无效）',
            ...parsed.whenToUse === undefined ? {} : { whenToUse: parsed.whenToUse },
            path: input.path,
            kind: input.kind,
            modelInvocable: parsed.modelInvocable,
            userInvocable: parsed.userInvocable,
            content: parsed.content,
            ...parsed.issue === undefined ? {} : { issue: parsed.issue },
        };
    }
    parseContent(raw) {
        const empty = {
            name: '',
            description: '',
            modelInvocable: true,
            userInvocable: true,
            content: raw,
        };
        const normalized = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
        const lines = normalized.split('\n');
        if (lines[0]?.trim() !== '---') {
            return { ...empty, issue: '缺少 YAML frontmatter（文件必须以 --- 开头）' };
        }
        let closing = -1;
        for (let index = 1; index < lines.length; index += 1) {
            if (lines[index]?.trim() === '---') {
                closing = index;
                break;
            }
        }
        if (closing < 0)
            return { ...empty, issue: 'YAML frontmatter 缺少结束的 ---' };
        let data;
        try {
            data = parseYaml(lines.slice(1, closing).join('\n'));
        }
        catch (error) {
            return { ...empty, issue: `YAML frontmatter 解析失败：${messageOf(error)}` };
        }
        if (data === null || typeof data !== 'object' || Array.isArray(data)) {
            return { ...empty, issue: 'YAML frontmatter 必须是键值对象' };
        }
        const record = data;
        const name = record.name;
        const description = record.description;
        if (typeof name !== 'string' || !name.trim())
            return { ...empty, issue: 'frontmatter 缺少 name' };
        if (typeof description !== 'string' || !description.trim())
            return { ...empty, issue: 'frontmatter 缺少 description' };
        try {
            assertSkillName(name);
        }
        catch (error) {
            return { ...empty, issue: error instanceof Error ? error.message : String(error) };
        }
        const whenToUse = record.whenToUse;
        if (whenToUse !== undefined && typeof whenToUse !== 'string') {
            return { ...empty, issue: 'whenToUse 必须是字符串' };
        }
        let modelInvocable;
        let userInvocable;
        try {
            modelInvocable = !parseInvocationBoolean(record['disable-model-invocation'], 'disable-model-invocation', false);
            userInvocable = parseInvocationBoolean(record['user-invocable'], 'user-invocable', true);
        }
        catch (error) {
            return { ...empty, issue: messageOf(error) };
        }
        return {
            name,
            description,
            ...whenToUse === undefined ? {} : { whenToUse },
            modelInvocable,
            userInvocable,
            content: lines.slice(closing + 1).join('\n').trim(),
        };
    }
    async readText(path) {
        const info = await lstat(path);
        if (info.size > this.options.maxSkillBytes) {
            throw new ManagerError('invalid-content', `技能文件超过 ${this.options.maxSkillBytes} 字节上限`);
        }
        return readFile(path, 'utf8');
    }
    /** 拒绝通过符号链接读写或删除，避免管理操作越过 roots。 */
    async assertSafeTarget(root, target, directoryEntry) {
        const canonicalRoot = await realpath(root).catch(() => resolve(root));
        const entryPath = directoryEntry ? dirname(target) : target;
        try {
            const info = await lstat(entryPath);
            if (info.isSymbolicLink())
                throw new ManagerError('forbidden', `不允许通过符号链接管理技能：${entryPath}`);
            if (directoryEntry && await isSymlink(target)) {
                throw new ManagerError('forbidden', `不允许通过符号链接管理技能文件：${target}`);
            }
            const canonicalEntry = await realpath(entryPath);
            if (!isInside(canonicalRoot, canonicalEntry)) {
                throw new ManagerError('forbidden', `技能路径越界：${entryPath}`);
            }
        }
        catch (error) {
            if (error instanceof ManagerError)
                throw error;
            throw new ManagerError('io-error', `无法检查技能路径：${entryPath}`, { cause: error });
        }
    }
}
function parseInvocationBoolean(value, field, fallback) {
    if (value === undefined)
        return fallback;
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string') {
        switch (value.trim().toLowerCase()) {
            case 'true':
            case 'yes':
            case 'on':
            case '1':
                return true;
            case 'false':
            case 'no':
            case 'off':
            case '0':
                return false;
        }
    }
    throw new ManagerError('invalid-content', `${field} 必须是布尔值`);
}
async function isRegularFile(path) {
    try {
        return (await lstat(path)).isFile();
    }
    catch {
        return false;
    }
}
/** 跟随符号链接判断最终目标是否是文件；列表与只读预览需要。 */
async function isFileFollowing(path) {
    try {
        return (await stat(path)).isFile();
    }
    catch {
        return false;
    }
}
async function isSymlink(path) {
    try {
        return (await lstat(path)).isSymbolicLink();
    }
    catch {
        return false;
    }
}
async function atomicWrite(path, content) {
    const temp = join(dirname(path), `.${basename(path)}.${process.pid}.${randomUUID().slice(0, 8)}.tmp`);
    try {
        await writeFile(temp, content, { encoding: 'utf8', mode: 0o644 });
        await rename(temp, path);
    }
    catch (error) {
        await rm(temp, { force: true }).catch(() => { });
        throw new ManagerError('io-error', `写入技能文件失败：${path}`, { cause: error });
    }
}
function isMissing(error) {
    return hasCode(error, 'ENOENT') || hasCode(error, 'ENOTDIR');
}
function hasCode(error, code) {
    return typeof error === 'object' && error !== null && error.code === code;
}
//# sourceMappingURL=skills.js.map