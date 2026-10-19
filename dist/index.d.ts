import type { Context } from '@deepseek-ai/cordis';
import { Config } from './config.ts';
import type { Config as PluginConfig } from './config.ts';
export declare const name = "dsh-skills-mcp";
export declare const inject: string[];
export declare const version = "0.4.1";
export { Config };
export type { Config as PluginConfig };
/**
 * 统一管理 DSH 的系统级 / 项目级 Skills 与 MCP。
 *
 * - Skills 直接读写 DSH 原生目录，交给 skill-filesystem 的热更新生效。
 * - 系统 MCP 挂在插件全局作用域；项目 MCP 挂在每个项目会话的 agent 作用域。
 * - WebUI 走经过连接鉴权的 /api/dsh-skills-mcp；模型侧提供两个管理工具。
 */
export declare function apply(ctx: Context, rawConfig?: PluginConfig): void;
//# sourceMappingURL=index.d.ts.map