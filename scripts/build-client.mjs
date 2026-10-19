/**
 * 构建浏览器半 bundle：dist/client.js。
 *
 * dsh 客户端 bundle 契约（dsh-client-modules）：一个以
 * window.__ModuleLoader__.load({ id, factory }) 包装的工厂脚本，factory
 * 接收运行时 require（解析 react 等平台基线模块），返回 { apply, inject }。
 */
import { build, context } from 'esbuild';
import { readFileSync, statSync } from 'node:fs';

const PLUGIN_ID = 'dsh-skills-mcp';
const watch = process.argv.includes('--watch');
const outfile = new URL('../dist/client.js', import.meta.url).pathname;

/** @type {import('esbuild').BuildOptions} */
const options = {
	entryPoints: [new URL('../src/client/index.ts', import.meta.url).pathname],
	bundle: true,
	format: 'cjs',
	platform: 'browser',
	target: 'es2022',
	jsx: 'automatic',
	external: ['react', 'react/jsx-runtime'],
	outfile,
	sourcemap: true,
	legalComments: 'none',
	logLevel: 'info',
	banner: {
		js: [
			'window.__ModuleLoader__.load({',
			`  id: ${JSON.stringify(PLUGIN_ID)},`,
			'  factory: (require) => {',
			'    var module = { exports: {} };',
			'    var exports = module.exports;',
			'    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });',
		].join('\n'),
	},
	footer: {
		js: ['    return module.exports;', '  }', '});'].join('\n'),
	},
};

function verify() {
	const code = readFileSync(outfile, 'utf8');
	const missing = [];
	if (!code.includes('window.__ModuleLoader__.load(')) missing.push('__ModuleLoader__.load 包装');
	if (!code.includes(`"id":"${PLUGIN_ID}"`) && !code.includes(`id: "${PLUGIN_ID}"`) && !code.includes(`id:"${PLUGIN_ID}"`)) missing.push('bundle id');
	if (!code.includes('exports.apply') && !code.includes('apply:')) missing.push('exports.apply');
	if (!statSync(outfile).size) missing.push('空文件');
	if (missing.length > 0) {
		console.error(`${PLUGIN_ID}: client bundle 形状校验失败：缺少 ${missing.join('、')}`);
		process.exit(1);
	}
	console.log(`${PLUGIN_ID}: client bundle 已生成 ${outfile} (${statSync(outfile).size} bytes)`);
}

if (watch) {
	const ctx = await context(options);
	await ctx.watch();
	console.log(`${PLUGIN_ID}: client bundle watch 已启动`);
} else {
	await build(options);
	verify();
}
