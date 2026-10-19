import type { Context } from '@deepseek-ai/cordis';
import type { ManagerService } from './service.ts';
export declare const API_PATH = "/api/dsh-skills-mcp";
/** 挂到 connection 的认证 Fetch 路由；浏览器请求与 /api 一样经过 Host/Origin 与 cookie 校验。 */
export declare function registerApi(ctx: Context, service: ManagerService): void;
export declare function handleApiRequest(service: ManagerService, request: Request): Promise<Response>;
//# sourceMappingURL=api.d.ts.map