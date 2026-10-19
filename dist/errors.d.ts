export type ManagerErrorCode = 'invalid-argument' | 'invalid-content' | 'not-found' | 'conflict' | 'forbidden' | 'unavailable' | 'io-error';
/** 可呈现给 WebUI / 模型的可预期失败。 */
export declare class ManagerError extends Error {
    readonly code: ManagerErrorCode;
    constructor(code: ManagerErrorCode, message: string, options?: ErrorOptions);
}
export declare function messageOf(error: unknown): string;
//# sourceMappingURL=errors.d.ts.map