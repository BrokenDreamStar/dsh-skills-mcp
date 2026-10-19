/** 可呈现给 WebUI / 模型的可预期失败。 */
export class ManagerError extends Error {
    code;
    constructor(code, message, options) {
        super(message, options);
        this.code = code;
        this.name = 'ManagerError';
    }
}
export function messageOf(error) {
    return error instanceof Error ? error.message : String(error);
}
//# sourceMappingURL=errors.js.map