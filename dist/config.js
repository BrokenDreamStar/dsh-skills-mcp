import z from '@deepseek-ai/schemastery';
export const Config = z.object({
    dshHome: z.string().default(''),
    agentsHome: z.string().default(''),
    maxSkillBytes: z.natural().min(1024).default(256 * 1024),
    maxMcpConfigBytes: z.natural().min(1024).default(1024 * 1024),
    mountProjectMcp: z.boolean().default(true),
});
export function normalizeConfig(config) {
    return {
        dshHome: config.dshHome?.trim() || undefined,
        agentsHome: config.agentsHome?.trim() || undefined,
        maxSkillBytes: config.maxSkillBytes ?? 256 * 1024,
        maxMcpConfigBytes: config.maxMcpConfigBytes ?? 1024 * 1024,
        mountProjectMcp: config.mountProjectMcp ?? true,
    };
}
//# sourceMappingURL=config.js.map