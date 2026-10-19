# dsh-skills-mcp

**在 DSH Web 设置页和模型工具里，统一管理系统级 / 项目级的 Skills 与 MCP 服务器。**

![DSH](https://img.shields.io/badge/DSH-0.2.1--rc.2%20~%200.2.x-4c6ef5)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522.19-339933?logo=node.js&logoColor=white)](#安装)
[![tests](https://img.shields.io/badge/tests-43%20passed-2ea043)](#开发)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)插件：在 **Settings → Skills 与 MCP** 里对Skills和MCP进行统一管理，同时给模型两个对应工具 `skills_manager` / `mcp_manager`。

---

## 功能

| 能力         | 系统级                                                                                 | 项目级                                                         |
| ------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Skills 目录  | `$DSH_HOME/skills` + `$AGENTS_HOME/skills`（默认 `~/.dsh/skills`、`~/.agents/skills`） | `<project>/.dsh/skills` + `<project>/.agents/skills`           |
| MCP 配置文件 | `$DSH_HOME/mcp.json` + 外部 `~/.claude.json`                                           | `<project>/.dsh/mcp.json` + 外部 Claude 项目配置 / `.mcp.json` |
| 作用范围     | 所有会话                                                                               | 仅项目根匹配的会话                                             |
| 加载方式     | 插件全局挂载                                                                           | 每个 Agent 的 Cordis scope 内挂载                              |
| 生效方式     | 保存后立即重载                                                                         | 保存后重载活动会话；新会话创建前加载                           |

**Skills**

- 合并展示 DSH 与 Shared Agents 两个根目录的技能，行上标记来源；同名技能在两个根下可以分别存在。
- 新建 / 编辑完整 `SKILL.md` 时可以选择保存到哪个根目录，编辑器会校验 frontmatter。
- **在 DSH 中停用 / 启用**：只写状态文件，不动源文件、不影响其他 Agent。
- 删除进回收站，可恢复。

**MCP**

- DSH 管理的服务器与从 Claude Code 发现的外部服务器同页展示，按「DSH 管理 / Claude Code 发现 / 其他 Claude 项目」分组。
- 外部条目**默认已在 DSH 启用**，可单独停用；也可以一键「导入」为 DSH 管理的 `mcp.json` 条目后自由编辑。
- 支持 `stdio` 与 `streamable-http`，含 `env` / `headers` / `cwd` / `toolCallTimeoutMs`。
- 外部卡片的密钥不会出现在 WebUI 快照或模型工具输出里。

**页面布局**

- 顶部是作用域与项目上下文（只有项目级才显示项目选择器和完整路径）。
- 下方是带计数的 Skills / MCP 页签、搜索框与行内操作。
- 新建 / 编辑会切换到聚焦编辑器，不再把长表单挤在列表上方。

## 安装

前置条件：Node.js ≥ 22.19，且已经装好 `dsh` 命令行。

### 方式一：本地源码（开发调试，推荐用于改代码）

```bash
cd /path/to/dsh-skills-mcp
npm install --legacy-peer-deps
npm run build

# 本地开发必须用 link:（profile 使用 hoisted linker，file: 是安装时快照）
dsh plugin --profile web add link:/path/to/dsh-skills-mcp
```

### 方式二：GitHub

仓库已提交构建产物（`dist/`），因此 Git 源安装**不需要**在本地跑构建脚本，不会触发 `git-hosted plugins build on install` 的拦截。

```bash
dsh plugin --profile web add github:<你的账号>/dsh-skills-mcp
```

### 验证安装

```bash
dsh --profile web --dump-config | grep -A3 'id: dsh-skills-mcp'
```

确认 bundle 行已进入组合树后，**重启 dsh 并刷新 WebUI**，在 **设置 → Skills 与 MCP** 打开管理页。

> WebUI 平台要求 dsh 0.2.1-rc.2。只在 TUI / headless 下使用 `skills_manager` / `mcp_manager` 时不需要设置页。

## 快速开始

1. **看看现在有什么** —— 打开设置页，Skills 页签会列出 `~/.dsh/skills`、`~/.agents/skills` 以及当前项目的 `.dsh` / `.agents` 下的全部技能；MCP 页签会列出已配置的服务器和从 Claude Code 发现的外部服务器。
2. **加一个 MCP 服务器** —— 切到 MCP 页签 →「新建」，填 `stdio` 的 command/args 或 `streamable-http` 的 url/headers → 保存即生效。已有的 Claude Code 服务器如果已经在列表里，什么都不用做，它们默认已启用。
3. **临时关掉一个技能** —— 在技能卡上点「在 DSH 停用」。源文件不变，Claude Code 里照常可用；想恢复点「启用」。

## Skills

### 文件格式

支持两种形式，与 DSH 原生 provider 一致：

- 目录 bundle：`<name>/SKILL.md`
- 单文件：`<name>.md`

扫描的根目录（DSH 原生 provider 的同一组）：

| 来源          | 系统级                | 项目级                     |
| ------------- | --------------------- | -------------------------- |
| DSH           | `$DSH_HOME/skills`    | `<project>/.dsh/skills`    |
| Shared Agents | `$AGENTS_HOME/skills` | `<project>/.agents/skills` |

`$AGENTS_HOME` 默认为 `~/.agents`，可用环境变量覆盖。DSH 根的 `.system` 子目录不会纳入管理；指向根目录外的符号链接技能会列出并显示为**只读**，编辑和删除会被拒绝。

`SKILL.md` 必须以 YAML frontmatter 开头，至少包含：

```markdown
---
name: my-skill
description: 这个技能做什么、何时使用。
whenToUse: 可选，补充触发场景。
---

# My Skill

正文……
```

可选的调用控制与 DSH 一致：

```yaml
disable-model-invocation: true # 模型不可调用
user-invocable: false # 用户不能用 /name 调用
```

管理页会校验 frontmatter 并拒绝保存无效文件；已损坏的文件仍会列出来并标记问题，便于修复。

### 在 DSH 中启用 / 停用

每张技能卡都有 **在 DSH 停用 / 启用** 按钮。停用**不移动、不改写源文件**：插件会为活动 Agent 在 agent scope 注册一个同名、不可调用的 runtime skill，遮蔽文件系统 provider 的真实技能；新会话创建时同样应用。源目录、frontmatter 与其他 Agent（Claude Code、Codex 等）完全不受影响。

- 停用状态按 CWD 的项目根记录在 `$DSH_HOME/skills-mcp-state.json`。
- 系统级停用对所有会话生效；项目级只对匹配项目根的会话生效。
- 同名技能按“技能名”停用；再次启用后恢复原有可见性。
- 删除则是另一件事：移到 `$DSH_HOME/.skills-mcp-trash/<root-id>/<timestamp>-<name>`。

### 原生发现

管理页只负责写文件。让 Agent 看见技能仍需要 profile / preset 启用 `@deepseek-ai/dsh-skill-filesystem`（由 `skill-filesystem` provider 扫描上述根目录）。在 dsh 0.2.1 的 Web preset 组合中，本地 skill-filesystem 由 agent preset 提供。

## MCP

### 配置文件格式

```json
{
	"mcpServers": {
		"filesystem": {
			"transport": "stdio",
			"command": "npx",
			"args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
			"env": { "TOKEN": "..." },
			"cwd": "/optional/cwd",
			"toolCallTimeoutMs": 60000
		},
		"remote": {
			"transport": "streamable-http",
			"url": "https://example.com/mcp",
			"headers": { "Authorization": "Bearer ..." }
		},
		"disabled-server": {
			"transport": "stdio",
			"command": "node",
			"args": ["server.js"],
			"disabled": true
		}
	}
}
```

- `transport` 也接受 `type`，HTTP 别名 `http`。
- 项目级 stdio 未填 `cwd` 时默认使用项目根；系统级默认交给官方 client（空 cwd）。
- 未识别的条目字段会原样保留；顶层 `mcpServers` 之外的内容也会保留。
- 保存前自动写 `mcp.json.bak`，新文件权限为 `0600`。
- 同一作用域内 `serverName` 必须唯一；项目级与系统级同名会拒绝加载项目级条目。

### 加载与状态

- **系统级**：插件启动后异步挂载到全局工具层。加载失败的服务器会显示错误，不影响其他服务器。
- **项目级**：每个 Agent 创建（含恢复）时，根据会话 `cwd` 找到最近的 `.git` 根；若存在 `.dsh/mcp.json`，在 `agent.ctx` 里挂载官方 MCP client，因此工具只对该会话可见。多个活动会话各自持有连接和子进程，这是项目隔离的直接代价。
- 保存 MCP 配置会立即重载；外部手改文件后点“重载 MCP”或新建会话。
- 状态是 **加载状态 + 已注册工具数**，不是实时连接的健康检查：官方 client 当前不提供公开的连接状态 seam。挂载失败会显示错误；挂载成功后的断线由官方 client 的自动重连处理。
- 为保证错误可见，本插件挂载时设置 `failOnStartupError: true`。初次连接失败会显示错误并停止该实例；修正配置后点“重载 MCP”即可重试。成功挂载后的自动重连仍遵循官方 client 行为。

### Claude Code 外部 MCP 发现

插件会只读扫描：

- `~/.claude.json` 的全局 `mcpServers`
- `~/.claude.json` 中与当前项目根匹配的 `projects[<path>].mcpServers`
- 项目根下的 `.mcp.json`
- 系统级额外扫描其它项目的 `projects[<path>].mcpServers`，仅作为“可导入”候选

外部服务器卡片标记 **Claude Code / 来源只读**，不会修改 Claude Code 配置。它们默认**已在 DSH 启用**：插件启动时通过官方 client 加载，并把显式停用的 id 写入 `$DSH_HOME/mcp-external.json`（只存 id，不存 URL / env / header 密钥）。“在 DSH 禁用”只影响 DSH，Claude Code 继续使用原配置。旧版 `{ enabled: [...] }` 状态文件会按 allowlist 兼容读取，下一次启停时迁移为 v2 的 `disabled` 列表。

系统级页面还会列出**其它 Claude 项目**的 MCP 作为“可导入”候选（这些条目不会在当前作用域自动加载）。点“导入”会把它的 URL / command / env / headers（可能含密钥）复制到当前作用域的 `mcp.json`，成为可编辑 / 删除的 DSH 条目；同名 DSH 条目存在时拒绝覆盖。外部卡片的密钥不会出现在 WebUI 快照或模型工具的列表输出中；导入后的条目与普通 DSH 条目一样，其 headers / env 会在编辑表单中显示（文件本身是 0600 权限）。

导入或手工添加同名 managed 条目时，插件会先卸载已挂载的外部实例，再由 managed 条目接管，避免 `mcp-client` 的 `serverName` 冲突。managed 条目（即使已停用）按名字遮蔽外部条目；删除 managed 条目后，外部条目会重新按默认策略加载。

外部配置更新后，系统级点“重载 MCP”重新发现；项目级点“重载 MCP”或新建会话时重新读取。Claude Code 插件缓存目录里的 `.mcp.json` 不属于当前发现范围（`~/.claude.json` 与项目 `.mcp.json` 中已有的服务器会发现）。

### OAuth / 密钥

当前只支持直接 headers（适合 API key / Bearer token），不实现 OAuth 流程。`mcp.json` 中的 env / header 值是明文；请限制文件权限，不要把带密钥的配置提交到仓库。

## 模型工具

模型侧有两个工具，能力与设置页对齐：

- `skills_manager`：`list` / `read` / `save` / `delete` / `enable` / `disable`
- `mcp_manager`：`list` / `save` / `delete` / `enable` / `disable` / `reload` / `enable_external` / `disable_external` / `import_external`（外部 id 来自 `list`）

两个工具都接受 `scope: "system" | "project"` 与可选 `project`；项目级默认取调用会话的 cwd。

`list` / `read` 之外的写操作与官方 `plugin_manager` 一样要求当前的 `danger-full-access`，否则会在每次调用前请求审批；审批渠道不可用时拒绝执行。这样普通工作区会话无法借管理工具修改宿主配置。

## 架构

```text
WebUI (settings.section)
      │ POST /api/dsh-skills-mcp（connection.fetch 鉴权）
      ▼
ManagerService ── SkillsStore ──> ~/.dsh/skills | ~/.agents/skills | <project>/{.dsh,.agents}/skills
      │             └─ SkillStateStore → agent-scoped runtime shadows
      │
      └── McpRuntime
            ├─ 系统级：插件 ctx.plugin(@deepseek-ai/dsh-mcp-client)
            ├─ 外部：ExternalMcpManager (Claude Code) + mcp-external.json
            └─ 项目级：agent/created → agent.ctx.plugin(...)
```

| 文件                   | 作用                                                    |
| ---------------------- | ------------------------------------------------------- |
| `src/index.ts`         | 插件入口：注册工具、API、生命周期                       |
| `src/service.ts`       | 组合层，快照与跨 host/tool 的操作                       |
| `src/skills.ts`        | Skills 扫描、frontmatter 校验、CRUD、回收站             |
| `src/skill-state.ts`   | DSH-only 技能启停状态（按系统 / 项目根存储）            |
| `src/skill-runtime.ts` | 在 Agent 作用域注册 runtime 遮蔽技能                    |
| `src/mcp-config.ts`    | `mcp.json` 读取 / 校验 / 原子写入，官方 client 配置映射 |
| `src/external-mcp.ts`  | Claude Code MCP 只读发现与 DSH 启用 overlay             |
| `src/mcp-runtime.ts`   | 系统级、外部来源与 per-Agent 项目级动态挂载、状态、重载 |
| `src/api.ts`           | 认证的 Fetch 路由                                       |
| `src/tools.ts`         | `skills_manager` / `mcp_manager`                        |
| `src/client/`          | Web 设置页（中英双语、无额外 UI 依赖）                  |

## 数据位置

| 路径                                                | 内容                              |
| --------------------------------------------------- | --------------------------------- |
| `$DSH_HOME/skills`、`$AGENTS_HOME/skills`           | 系统级技能源文件                  |
| `<project>/.dsh/skills`、`<project>/.agents/skills` | 项目级技能源文件                  |
| `$DSH_HOME/mcp.json`                                | 系统级 MCP 配置                   |
| `<project>/.dsh/mcp.json`                           | 项目级 MCP 配置                   |
| `$DSH_HOME/skills-mcp-state.json`                   | DSH-only 技能停用状态             |
| `$DSH_HOME/mcp-external.json`                       | 显式停用的外部 MCP id（不含密钥） |
| `$DSH_HOME/.skills-mcp-trash/`                      | 删除技能的回收站                  |
| `mcp.json.bak`                                      | 每次写入前自动备份                |

## 开发

```bash
npm install --legacy-peer-deps
npm run typecheck                # tsc 双配置检查
npm test                         # 43 项单元测试（vitest）
npm run build                    # tsc + client bundle → dist/index.js、dist/client.js
npm run dev                      # host 侧 watch
npm run dev:client               # client 侧 watch
```

本地挂载后用 `dsh --profile web --dump-config` 检查组合；改客户端代码后 `npm run build` 并刷新页面，改宿主代码需要重启 dsh。

`dist/` 已提交进仓库，是为了让 Git 源安装可以跳过构建脚本。修改源码后请重新 `npm run build` 再提交。

## License

[MIT](./LICENSE)
