export declare function expandHome(value: string): string;
export declare function resolveDshHome(configured?: string): string;
export declare function resolveAgentsHome(configured?: string): string;
export declare function isSkillName(value: string): boolean;
export declare function isMcpServerName(value: string): boolean;
export declare function assertSkillName(value: string): string;
export declare function assertMcpServerName(value: string): string;
/** 目标必须严格位于 root 内（root 本身不算）。 */
export declare function isInside(root: string, target: string): boolean;
export declare function pathExists(path: string): Promise<boolean>;
export declare function ensureDirectory(path: string): Promise<void>;
/** 把用户提供的目录规范化为真实路径，并向上寻找最近的 `.git` 祖先。 */
export declare function resolveProjectRoot(input: string): Promise<string>;
/** 仅用于诊断的简短错误文本；避免把可能含密钥的原始对象整段带出去。 */
export declare function briefError(error: unknown, limit?: number): string;
//# sourceMappingURL=paths.d.ts.map