import { randomUUID } from 'node:crypto';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ManagerError } from "./errors.js";
import { ensureDirectory, isSkillName } from "./paths.js";
const EMPTY = { version: 1, system: [], projects: {} };
/** DSH-only 技能启停状态；不修改技能源文件。 */
export class SkillStateStore {
    file;
    queue = Promise.resolve();
    constructor(file) {
        this.file = file;
    }
    async read() {
        let raw;
        try {
            raw = await readFile(this.file, 'utf8');
        }
        catch (error) {
            if (hasCode(error, 'ENOENT'))
                return { ...clone(EMPTY) };
            return { ...clone(EMPTY), issue: `读取 DSH 技能状态失败：${message(error)}` };
        }
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch (error) {
            return { ...clone(EMPTY), issue: `DSH 技能状态不是合法 JSON：${message(error)}` };
        }
        if (!isRecord(parsed))
            return { ...clone(EMPTY), issue: 'DSH 技能状态顶层必须是对象' };
        const system = stringArray(parsed.system);
        const projects = {};
        if (isRecord(parsed.projects)) {
            for (const [root, names] of Object.entries(parsed.projects)) {
                const list = stringArray(names);
                if (list !== undefined && list.length > 0)
                    projects[root] = list;
            }
        }
        return { version: 1, system: system ?? [], projects };
    }
    async disabledNames(scope, projectRoot) {
        const state = await this.read();
        const names = new Set(state.system);
        if (scope === 'project' && projectRoot !== undefined) {
            for (const name of state.projects[projectRoot] ?? [])
                names.add(name);
        }
        return names;
    }
    async setDisabled(scope, projectRoot, name, disabled) {
        await this.serial(async () => {
            const current = await this.read();
            if (current.issue !== undefined)
                throw new ManagerError('invalid-content', current.issue);
            const state = {
                version: 1,
                system: [...current.system],
                projects: Object.fromEntries(Object.entries(current.projects).map(([root, names]) => [root, [...names]])),
            };
            if (scope === 'system') {
                state.system = updateList(state.system, name, disabled);
            }
            else {
                if (projectRoot === undefined)
                    throw new ManagerError('invalid-argument', '项目级技能需要项目路径');
                const names = updateList(state.projects[projectRoot] ?? [], name, disabled);
                if (names.length === 0)
                    delete state.projects[projectRoot];
                else
                    state.projects[projectRoot] = names;
            }
            await this.write(state);
        });
    }
    async write(state) {
        const normalized = {
            version: 1,
            system: [...new Set(state.system)].sort(),
            projects: Object.fromEntries(Object.entries(state.projects)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([root, names]) => [root, [...new Set(names)].sort()])),
        };
        await ensureDirectory(dirname(this.file));
        const temp = `${this.file}.${process.pid}.${randomUUID().slice(0, 8)}.tmp`;
        try {
            await writeFile(temp, `${JSON.stringify(normalized, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
            await rename(temp, this.file);
        }
        catch (error) {
            await rm(temp, { force: true }).catch(() => { });
            throw new ManagerError('io-error', `写入 DSH 技能状态失败：${this.file}`, { cause: error });
        }
    }
    serial(operation) {
        const task = this.queue.then(operation, operation);
        this.queue = task.then(() => undefined, () => undefined);
        return task;
    }
}
function updateList(list, name, add) {
    const next = new Set(list);
    if (add)
        next.add(name);
    else
        next.delete(name);
    return [...next];
}
function stringArray(value) {
    if (!Array.isArray(value))
        return undefined;
    return value.filter((item) => typeof item === 'string' && isSkillName(item));
}
function clone(state) {
    return {
        version: 1,
        system: [...state.system],
        projects: Object.fromEntries(Object.entries(state.projects).map(([root, names]) => [root, [...names]])),
    };
}
function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function message(error) {
    return error instanceof Error ? error.message : String(error);
}
function hasCode(error, code) {
    return typeof error === 'object' && error !== null && error.code === code;
}
//# sourceMappingURL=skill-state.js.map