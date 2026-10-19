import type { Context } from '@deepseek-ai/cordis';
import type { ManagerService } from './service.ts';
export interface ToolOptions {
    ctx: Context;
    service: ManagerService;
    logger: Context['logger'];
}
/** 注册 skills_manager / mcp_manager 两个模型工具；工具失败不会影响插件装载。 */
export declare function registerTools(ctx: Context, options: ToolOptions): void;
//# sourceMappingURL=tools.d.ts.map