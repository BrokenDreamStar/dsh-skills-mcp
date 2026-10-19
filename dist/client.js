window.__ModuleLoader__.load({
  id: "dsh-skills-mcp",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/Section.tsx
var import_react3 = require("react");

// src/client/api.ts
var API_PATH = "/api/dsh-skills-mcp";
async function call(body, signal) {
  let response;
  try {
    response = await fetch(API_PATH, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      ...signal === void 0 ? {} : { signal }
    });
  } catch (error) {
    if (isAbort(error)) throw error;
    return { ok: false, error: { code: "network", message: error instanceof Error ? error.message : String(error) } };
  }
  let parsed;
  try {
    parsed = await response.json();
  } catch {
    return {
      ok: false,
      error: {
        code: `http-${response.status}`,
        message: response.status === 401 || response.status === 403 ? "\u4F1A\u8BDD\u5DF2\u5931\u6548\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5" : `\u7BA1\u7406\u63A5\u53E3\u8FD4\u56DE\u4E86\u975E JSON \u54CD\u5E94\uFF08HTTP ${response.status}\uFF09`
      }
    };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: { code: "bad-response", message: "\u7BA1\u7406\u63A5\u53E3\u54CD\u5E94\u683C\u5F0F\u4E0D\u6B63\u786E" } };
  }
  const result = parsed;
  if (result.ok === true) return result;
  if (result.ok === false && typeof result.error?.message === "string") return result;
  return { ok: false, error: { code: "bad-response", message: `\u7BA1\u7406\u63A5\u53E3\u54CD\u5E94\u683C\u5F0F\u4E0D\u6B63\u786E\uFF08HTTP ${response.status}\uFF09` } };
}
async function loadSnapshot(project, signal) {
  return call({ action: "snapshot", ...project === void 0 ? {} : { project } }, signal);
}
async function readSkill(scope, project, root, name, signal) {
  return call({ action: "skill.read", scope, ...project === void 0 ? {} : { project }, root, name }, signal);
}
async function saveSkill(scope, project, root, name, content) {
  return call({ action: "skill.save", scope, ...project === void 0 ? {} : { project }, root, name, content });
}
async function deleteSkill(scope, project, root, name) {
  return call({ action: "skill.delete", scope, ...project === void 0 ? {} : { project }, root, name });
}
async function setSkillEnabled(scope, project, name, enabled) {
  return call({ action: "skill.setEnabled", scope, ...project === void 0 ? {} : { project }, name, enabled });
}
async function saveMcpServer(scope, project, name, form, originalName) {
  return call({
    action: "mcp.save",
    scope,
    ...project === void 0 ? {} : { project },
    name,
    form,
    ...originalName === void 0 ? {} : { originalName }
  });
}
async function deleteMcpServer(scope, project, name) {
  return call({ action: "mcp.delete", scope, ...project === void 0 ? {} : { project }, name });
}
async function setMcpEnabled(scope, project, name, enabled) {
  return call({ action: "mcp.enable", scope, ...project === void 0 ? {} : { project }, name, enabled });
}
async function setExternalMcpEnabled(scope, project, id, enabled) {
  return call({ action: "mcp.external.setEnabled", scope, ...project === void 0 ? {} : { project }, id, enabled });
}
async function importExternalMcp(scope, project, id, name) {
  return call({
    action: "mcp.external.import",
    scope,
    ...project === void 0 ? {} : { project },
    id,
    ...name === void 0 ? {} : { name }
  });
}
async function reloadMcp(scope, project) {
  return call({ action: "mcp.reload", scope, ...project === void 0 ? {} : { project } });
}
function isAbort(error) {
  return error instanceof DOMException && error.name === "AbortError" || error instanceof Error && error.name === "AbortError";
}

// src/client/McpPanel.tsx
var import_react = require("react");

// src/client/ui.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var ICONS = {
  refresh: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M20.5 12a8.5 8.5 0 1 1-2.49-6.01" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M20.5 4.5v5h-5" })
  ] }),
  search: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "10.75", cy: "10.75", r: "6.25" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m15.4 15.4 4.1 4.1" })
  ] }),
  close: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M6.5 6.5l11 11m0-11l-11 11" }),
  plus: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 5.5v13M5.5 12h13" }),
  edit: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12.5 20H21" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M16.7 3.8a2.1 2.1 0 0 1 3 3L7.4 19.1l-4 1 1-4Z" })
  ] }),
  trash: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 6.5h16" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9 6.5V4.2h6v2.3" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M18.5 6.5 17.6 20H6.4L5.5 6.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M10 10.5v5.5M14 10.5v5.5" })
  ] }),
  chevron: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m7 9.5 5 5 5-5" }),
  back: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M19 12H5" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m11.5 18.5-6.5-6.5 6.5-6.5" })
  ] }),
  folder: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3.5 7.5A2.5 2.5 0 0 1 6 5h3.6c.5 0 1 .2 1.35.6L12.4 7h5.6a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5Z" }),
  check: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m5 12.5 4.2 4.2L19 6.8" }),
  alert: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "8.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 8v4.7M12 16.1h.01" })
  ] }),
  info: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "8.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 11v5M12 7.9h.01" })
  ] }),
  sparkle: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 3.2 13.9 9l5.8 1.9-5.8 1.9L12 18.6l-1.9-5.8L4.3 10.9 10.1 9Z" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M18.5 3.5v3M17 5h3" })
  ] }),
  server: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "4", y: "4.5", width: "16", height: "6", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "4", y: "13.5", width: "16", height: "6", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M7.5 7.5h.01M7.5 16.5h.01" })
  ] })
};
function Icon(props) {
  const size = props.size ?? 16;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "svg",
    {
      className: "dshsm-icon",
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.7,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false",
      children: ICONS[props.name]
    }
  );
}
function Button(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "button",
    {
      type: props.type ?? "button",
      className: "dshsm-button",
      "data-variant": props.variant,
      onClick: props.onClick,
      disabled: props.disabled,
      title: props.title,
      children: [
        props.icon === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: props.icon, size: 14 }),
        props.children
      ]
    }
  );
}
function IconButton(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "button",
    {
      type: "button",
      className: "dshsm-icon-button",
      "data-variant": props.variant,
      "data-busy": props.busy === true ? "true" : void 0,
      "aria-label": props.label,
      title: props.title ?? props.label,
      onClick: props.onClick,
      disabled: props.disabled,
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: props.icon, size: 15 })
    }
  );
}
function Switch(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "button",
    {
      type: "button",
      role: "switch",
      className: "dshsm-switch",
      "aria-checked": props.checked,
      "aria-label": props.label,
      title: props.title ?? props.label,
      disabled: props.disabled,
      onClick: () => {
        props.onChange(!props.checked);
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshsm-switch-thumb" })
    }
  );
}
function Badge(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshsm-badge", "data-tone": props.tone ?? "default", children: props.children });
}
function NoticeBox(props) {
  const tone = props.tone ?? "info";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshsm-notice", "data-tone": tone, role: tone === "error" ? "alert" : void 0, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: tone === "error" || tone === "warn" ? "alert" : tone === "success" ? "check" : "info", size: 14 }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshsm-notice-body", children: props.children })
  ] });
}
function StatusBadge(props) {
  const tone = props.status === "ready" ? "success" : props.status === "error" ? "error" : props.status === "starting" ? "warn" : "default";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, { tone, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshsm-dot", "data-tone": tone === "default" ? void 0 : tone }),
    props.t(`status.${props.status}`)
  ] });
}
function Issues(props) {
  if (props.items.length === 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshsm-issues", role: "note", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshsm-issues-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "alert", size: 13 }),
      props.t("common.issues")
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: props.items.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: item }, `${index}-${item}`)) })
  ] });
}
function SearchField(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshsm-search", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "search", size: 14 }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        type: "search",
        value: props.value,
        placeholder: props.placeholder,
        "aria-label": props.label,
        onChange: (event) => {
          props.onChange(event.target.value);
        },
        spellCheck: false,
        autoComplete: "off"
      }
    ),
    props.value === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        type: "button",
        className: "dshsm-search-clear",
        "aria-label": props.clearLabel,
        title: props.clearLabel,
        onClick: () => {
          props.onChange("");
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "close", size: 12 })
      }
    )
  ] });
}
function Select(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: props.className === void 0 ? "dshsm-select-wrap" : `dshsm-select-wrap ${props.className}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "select",
      {
        id: props.id,
        className: "dshsm-select",
        value: props.value,
        "aria-label": props.ariaLabel,
        disabled: props.disabled,
        onChange: (event) => {
          props.onChange(event.target.value);
        },
        children: props.children
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "chevron", size: 13 })
  ] });
}
function EmptyState(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshsm-empty", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshsm-empty-icon", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: props.icon ?? "sparkle", size: 17 }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: props.title }),
    props.hint === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: props.hint }),
    props.action
  ] });
}
function SkeletonList(props) {
  const rows = props.rows ?? 3;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshsm-list", "aria-hidden": "true", children: Array.from({ length: rows }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshsm-skeleton-row", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshsm-skeleton-line", style: { width: `${34 + index * 7}%` } }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshsm-skeleton-line", style: { width: "92%" } }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshsm-skeleton-line", style: { width: "58%" } })
  ] }, index)) });
}
function formatError(t, message) {
  return t("errors.actionFailed", { message });
}
function shortenPath(path) {
  const match = /^(\/Users\/[^/]+|\/home\/[^/]+|[A-Za-z]:\\Users\\[^\\]+)/.exec(path);
  return match === null ? path : `~${path.slice(match[0].length)}`;
}
function displayPath(path, projectPath) {
  const base = (projectPath ?? "").trim().replace(/[\\/]+$/, "");
  const separator = base.includes("\\") ? "\\" : "/";
  if (base !== "" && path.startsWith(`${base}${separator}`)) return path.slice(base.length + 1);
  return shortenPath(path);
}
function parseKeyValueLines(text) {
  const result = {};
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index] ?? "";
    if (raw.trim() === "" || raw.trimStart().startsWith("#")) continue;
    const equals = raw.indexOf("=");
    if (equals <= 0) return { ok: false, line: index + 1, text: raw };
    const key = raw.slice(0, equals).trim();
    if (key === "") return { ok: false, line: index + 1, text: raw };
    result[key] = raw.slice(equals + 1);
  }
  return { ok: true, value: result };
}
function keyValueToText(value) {
  if (value === void 0) return "";
  return Object.entries(value).map(([key, item]) => `${key}=${item}`).join("\n");
}

// src/client/McpPanel.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var EMPTY_DRAFT = {
  name: "",
  transport: "stdio",
  command: "",
  argsText: "",
  envText: "",
  cwd: "",
  url: "",
  headersText: "",
  timeoutText: "",
  enabled: true
};
function matches(server, query, t) {
  if (query === "") return true;
  const haystack = [
    server.name,
    server.target,
    server.origin ?? "",
    server.configPath ?? "",
    server.projectRoot ?? "",
    server.transport,
    server.managed ? t("mcp.sourceDsh") : t("mcp.sourceClaudeCode")
  ].join("\n").toLowerCase();
  return haystack.includes(query);
}
function McpPanel(props) {
  const { t, scope, scopeSnapshot } = props;
  const [draft, setDraft] = (0, import_react.useState)(null);
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [editorError, setEditorError] = (0, import_react.useState)(null);
  const [query, setQuery] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    setDraft(null);
    setEditorError(null);
    setQuery("");
  }, [scope, props.projectPath]);
  const servers = scopeSnapshot?.servers ?? [];
  const normalizedQuery = query.trim().toLowerCase();
  const visible = (0, import_react.useMemo)(
    () => normalizedQuery === "" ? servers : servers.filter((server) => matches(server, normalizedQuery, t)),
    [servers, normalizedQuery, t]
  );
  const scopeReady = scope === "system" || props.projectPath.trim() !== "";
  if (!scopeReady) return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(NoticeBox, { tone: "warn", children: t("errors.noProject") });
  const groups = [
    { key: "managed", title: t("mcp.groupManaged"), items: visible.filter((server) => server.managed) },
    {
      key: "external",
      title: t("mcp.groupExternal"),
      items: visible.filter((server) => !server.managed && server.inPlace !== false)
    },
    {
      key: "other",
      title: t("mcp.groupOther"),
      items: visible.filter((server) => !server.managed && server.inPlace === false)
    }
  ].filter((group) => group.items.length > 0);
  const hasExternal = servers.some((server) => !server.managed);
  const mcpFile = scopeSnapshot?.mcpFile ?? "";
  const mcpFileLabel = mcpFile === "" ? "\u2014" : displayPath(mcpFile, scope === "project" ? props.projectPath : void 0);
  const startAdd = () => {
    setDraft({ ...EMPTY_DRAFT });
    setEditorError(null);
  };
  const startEdit = (server) => {
    if (!server.managed) return;
    const config = server.config;
    setDraft({
      originalName: server.name,
      name: server.name,
      transport: config.transport,
      command: config.command ?? "",
      argsText: (config.args ?? []).join("\n"),
      envText: keyValueToText(config.env),
      cwd: config.cwd ?? "",
      url: config.url ?? "",
      headersText: keyValueToText(config.headers),
      timeoutText: config.toolCallTimeoutMs === void 0 ? "" : String(config.toolCallTimeoutMs),
      enabled: !server.disabled
    });
    setEditorError(null);
  };
  const save = async () => {
    if (draft === null) return;
    const name = draft.name.trim();
    if (name === "") {
      setEditorError(t("mcp.nameRequired"));
      return;
    }
    const env = parseKeyValueLines(draft.envText);
    if (!env.ok) {
      setEditorError(t("editor.envInvalid", { line: env.line, text: env.text }));
      return;
    }
    const headers = parseKeyValueLines(draft.headersText);
    if (!headers.ok) {
      setEditorError(t("editor.envInvalid", { line: headers.line, text: headers.text }));
      return;
    }
    let toolCallTimeoutMs;
    if (draft.timeoutText.trim() !== "") {
      const parsed = Number(draft.timeoutText);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setEditorError(t("editor.timeoutInvalid"));
        return;
      }
      toolCallTimeoutMs = Math.trunc(parsed);
    }
    const form = {
      transport: draft.transport,
      ...draft.transport === "stdio" ? {
        command: draft.command,
        args: draft.argsText.split(/\r?\n/).map((item) => item.trim()).filter((item) => item !== ""),
        env: env.value,
        ...draft.cwd.trim() === "" ? {} : { cwd: draft.cwd.trim() }
      } : {
        url: draft.url,
        headers: headers.value
      },
      ...toolCallTimeoutMs === void 0 ? {} : { toolCallTimeoutMs },
      disabled: !draft.enabled
    };
    setBusy(true);
    setEditorError(null);
    try {
      const result = await saveMcpServer(
        scope,
        scope === "project" ? props.projectPath : void 0,
        name,
        form,
        draft.originalName
      );
      if (!result.ok) {
        setEditorError(formatError(t, result.error.message));
        return;
      }
      setDraft(null);
      props.notify("success", t("mcp.saved"));
      props.onDone();
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };
  const toggle = async (server, enabled) => {
    setBusy(true);
    try {
      const project = scope === "project" ? props.projectPath : void 0;
      const result = server.managed ? await setMcpEnabled(scope, project, server.name, enabled) : await setExternalMcpEnabled(scope, project, server.id, enabled);
      if (!result.ok) {
        props.notify("error", formatError(t, result.error.message));
        return;
      }
      props.notify(
        "success",
        server.source === "claude-code" ? t(enabled ? "mcp.externalEnabled" : "mcp.externalDisabled", { name: server.name }) : t(enabled ? "mcp.enabled" : "mcp.disabled")
      );
      props.onDone();
    } catch (error) {
      props.notify("error", formatError(t, error instanceof Error ? error.message : String(error)));
    } finally {
      setBusy(false);
    }
  };
  const importServer = async (server) => {
    if (server.managed) return;
    if (!window.confirm(t("mcp.importConfirm", { name: server.name, file: mcpFile }))) return;
    setBusy(true);
    try {
      const result = await importExternalMcp(
        scope,
        scope === "project" ? props.projectPath : void 0,
        server.id
      );
      if (!result.ok) {
        props.notify("error", formatError(t, result.error.message));
        return;
      }
      props.notify("success", t("mcp.imported", { name: server.name }));
      props.onDone();
    } catch (error) {
      props.notify("error", formatError(t, error instanceof Error ? error.message : String(error)));
    } finally {
      setBusy(false);
    }
  };
  const remove = async (server) => {
    if (!server.managed) return;
    if (!window.confirm(t("mcp.deleteConfirm", { name: server.name, file: mcpFile }))) return;
    setBusy(true);
    try {
      const result = await deleteMcpServer(scope, scope === "project" ? props.projectPath : void 0, server.name);
      if (!result.ok) {
        props.notify("error", formatError(t, result.error.message));
        return;
      }
      props.notify("success", t("mcp.deleted"));
      if (draft?.originalName === server.name) setDraft(null);
      props.onDone();
    } catch (error) {
      props.notify("error", formatError(t, error instanceof Error ? error.message : String(error)));
    } finally {
      setBusy(false);
    }
  };
  const reload = async () => {
    setBusy(true);
    try {
      const result = await reloadMcp(scope, scope === "project" ? props.projectPath : void 0);
      if (!result.ok) {
        props.notify("error", formatError(t, result.error.message));
        return;
      }
      props.notify("success", t("mcp.reloaded"));
      props.onDone();
    } catch (error) {
      props.notify("error", formatError(t, error instanceof Error ? error.message : String(error)));
    } finally {
      setBusy(false);
    }
  };
  if (draft !== null) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      McpEditor,
      {
        t,
        draft,
        file: mcpFileLabel,
        busy,
        error: editorError,
        onUpdate: (patch) => {
          setDraft((current) => current === null ? current : { ...current, ...patch });
        },
        onCancel: () => {
          setDraft(null);
          setEditorError(null);
        },
        onSave: () => {
          void save();
        }
      }
    );
  }
  const toolbarDisabled = busy || props.loading || scopeSnapshot === null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-panel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-panel-bar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        SearchField,
        {
          value: query,
          onChange: setQuery,
          placeholder: t("mcp.searchPlaceholder"),
          label: t("mcp.searchPlaceholder"),
          clearLabel: t("common.clearSearch")
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Button, { icon: "refresh", onClick: () => {
        void reload();
      }, disabled: toolbarDisabled, children: t("mcp.reload") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Button, { variant: "primary", icon: "plus", onClick: startAdd, disabled: toolbarDisabled, children: t("mcp.add") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-panel-meta", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dshsm-source", title: mcpFile, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { name: "folder", size: 12 }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("mcp.file") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: mcpFileLabel })
      ] }),
      normalizedQuery === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dshsm-count", children: [
        visible.length,
        " / ",
        servers.length
      ] })
    ] }),
    hasExternal ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { className: "dshsm-details", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("summary", { children: t("mcp.externalHintTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: t("mcp.externalHint") })
    ] }) : null,
    scopeSnapshot !== null ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Issues, { items: scopeSnapshot.issues, t }) : null,
    scopeSnapshot === null && props.loading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SkeletonList, { rows: 3 }) : null,
    scopeSnapshot === null && !props.loading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(EmptyState, { icon: "server", title: t("errors.noData") }) : null,
    scopeSnapshot !== null && servers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      EmptyState,
      {
        icon: "server",
        title: t("mcp.empty"),
        hint: t("mcp.emptyHint"),
        action: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Button, { variant: "primary", icon: "plus", onClick: startAdd, disabled: toolbarDisabled, children: t("mcp.add") })
      }
    ) : null,
    scopeSnapshot !== null && servers.length > 0 && visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      EmptyState,
      {
        icon: "search",
        title: t("mcp.noMatch"),
        hint: t("mcp.noMatchHint"),
        action: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Button, { onClick: () => {
          setQuery("");
        }, children: t("common.clearSearch") })
      }
    ) : null,
    groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "dshsm-group", "aria-label": group.title, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-group-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h4", { children: group.title }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsm-group-count", children: group.items.length })
      ] }),
      group.key === "other" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "dshsm-group-hint", children: t("mcp.groupOtherHint") }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsm-list", children: group.items.map((server) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        McpRow,
        {
          t,
          server,
          busy,
          onToggle: (enabled) => {
            void toggle(server, enabled);
          },
          onEdit: () => {
            startEdit(server);
          },
          onDelete: () => {
            void remove(server);
          },
          onImport: () => {
            void importServer(server);
          }
        },
        server.id
      )) })
    ] }, group.key))
  ] });
}
function McpRow(props) {
  const { t, server } = props;
  const inPlace = server.managed || server.inPlace !== false;
  const importable = !server.managed && server.importable === true;
  const external = !server.managed;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("article", { className: "dshsm-row", "data-disabled": server.disabled ? "true" : void 0, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-row-body", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-row-title", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsm-row-name", children: server.name }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { tone: server.managed ? "accent" : void 0, children: server.managed ? t("mcp.sourceDsh") : t("mcp.sourceClaudeCode") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsm-chip", children: server.transport === "stdio" ? "stdio" : t("mcp.httpShort") }),
        inPlace ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(StatusBadge, { status: server.status, t }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { tone: "warn", children: t("mcp.otherProject") }),
        server.toolCount === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsm-row-count", children: t("mcp.toolsCount", { count: server.toolCount }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsm-row-target", title: server.target, children: server.target === "" ? "\u2014" : server.target }),
      external && server.origin !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-row-meta", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: server.origin }),
        server.configPath === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsm-row-path", title: server.configPath, children: shortenPath(server.configPath) })
      ] }) : null,
      server.projectRoot === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-row-meta", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("mcp.projectRoot") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsm-row-path", title: server.projectRoot, children: shortenPath(server.projectRoot) })
      ] }),
      server.error === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-row-note", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { name: "alert", size: 12 }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: server.error })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-row-actions", children: [
      importable ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Button, { onClick: props.onImport, disabled: props.busy, children: t("mcp.import") }) : null,
      server.managed ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        IconButton,
        {
          icon: "edit",
          label: t("common.edit"),
          onClick: props.onEdit,
          disabled: props.busy
        }
      ) : null,
      server.managed ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        IconButton,
        {
          icon: "trash",
          label: t("common.delete"),
          variant: "danger",
          onClick: props.onDelete,
          disabled: props.busy
        }
      ) : null,
      inPlace ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        Switch,
        {
          checked: !server.disabled,
          onChange: props.onToggle,
          disabled: props.busy,
          label: t("mcp.enabledSwitch"),
          title: t("mcp.enableHint")
        }
      ) : null
    ] })
  ] });
}
function McpEditor(props) {
  const { t, draft } = props;
  const editing = draft.originalName !== void 0;
  const stdio = draft.transport === "stdio";
  const actions = /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-editor-actions", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Button, { onClick: props.onCancel, disabled: props.busy, children: t("common.cancel") }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Button, { type: "submit", variant: "primary", disabled: props.busy, children: props.busy ? t("common.saving") : t("common.save") })
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "form",
    {
      className: "dshsm-editor",
      onSubmit: (event) => {
        event.preventDefault();
        props.onSave();
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "dshsm-back", onClick: props.onCancel, disabled: props.busy, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { name: "back", size: 14 }),
          t("mcp.backToList")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-editor-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: editing ? t("mcp.editTitle", { name: draft.originalName }) : t("mcp.newTitle") }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: t("mcp.formIntro", { file: props.file }) })
          ] }),
          actions
        ] }),
        props.error === null ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(NoticeBox, { tone: "error", children: props.error }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "dshsm-form-section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h4", { children: t("mcp.sectionBasic") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: "dshsm-mcp-name", children: t("mcp.name") }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                id: "dshsm-mcp-name",
                className: "dshsm-input dshsm-mono",
                value: draft.name,
                placeholder: t("mcp.namePlaceholder"),
                onChange: (event) => {
                  props.onUpdate({ name: event.target.value });
                },
                disabled: props.busy,
                autoComplete: "off",
                spellCheck: false
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsm-field-label", children: t("mcp.transport") }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-segmented dshsm-segmented--fluid", role: "radiogroup", "aria-label": t("mcp.transport"), children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "button",
                {
                  type: "button",
                  role: "radio",
                  "aria-checked": stdio,
                  "data-active": stdio,
                  onClick: () => {
                    props.onUpdate({ transport: "stdio" });
                  },
                  disabled: props.busy,
                  children: t("mcp.stdio")
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "button",
                {
                  type: "button",
                  role: "radio",
                  "aria-checked": !stdio,
                  "data-active": !stdio,
                  onClick: () => {
                    props.onUpdate({ transport: "streamable-http" });
                  },
                  disabled: props.busy,
                  children: t("mcp.http")
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "dshsm-form-section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h4", { children: t("mcp.sectionConnection") }),
          stdio ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-form-grid", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-field", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: "dshsm-mcp-command", children: t("mcp.command") }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "input",
                  {
                    id: "dshsm-mcp-command",
                    className: "dshsm-input dshsm-mono",
                    value: draft.command,
                    placeholder: t("mcp.commandPlaceholder"),
                    onChange: (event) => {
                      props.onUpdate({ command: event.target.value });
                    },
                    disabled: props.busy,
                    spellCheck: false
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-field", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: "dshsm-mcp-cwd", children: t("mcp.cwd") }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "input",
                  {
                    id: "dshsm-mcp-cwd",
                    className: "dshsm-input dshsm-mono",
                    value: draft.cwd,
                    onChange: (event) => {
                      props.onUpdate({ cwd: event.target.value });
                    },
                    disabled: props.busy,
                    spellCheck: false
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsm-hint", children: t("mcp.cwdHint") }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-field", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: "dshsm-mcp-args", children: t("mcp.args") }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "textarea",
                {
                  id: "dshsm-mcp-args",
                  className: "dshsm-textarea dshsm-code",
                  value: draft.argsText,
                  onChange: (event) => {
                    props.onUpdate({ argsText: event.target.value });
                  },
                  disabled: props.busy,
                  spellCheck: false
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsm-hint", children: t("mcp.argsHint") })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-field", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: "dshsm-mcp-env", children: t("mcp.env") }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "textarea",
                {
                  id: "dshsm-mcp-env",
                  className: "dshsm-textarea dshsm-code",
                  value: draft.envText,
                  onChange: (event) => {
                    props.onUpdate({ envText: event.target.value });
                  },
                  disabled: props.busy,
                  spellCheck: false
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsm-hint", children: t("mcp.envHint") })
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-field", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: "dshsm-mcp-url", children: t("mcp.url") }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "input",
                {
                  id: "dshsm-mcp-url",
                  className: "dshsm-input dshsm-mono",
                  value: draft.url,
                  placeholder: "https://example.com/mcp",
                  onChange: (event) => {
                    props.onUpdate({ url: event.target.value });
                  },
                  disabled: props.busy,
                  spellCheck: false
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-field", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: "dshsm-mcp-headers", children: t("mcp.headers") }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "textarea",
                {
                  id: "dshsm-mcp-headers",
                  className: "dshsm-textarea dshsm-code",
                  value: draft.headersText,
                  onChange: (event) => {
                    props.onUpdate({ headersText: event.target.value });
                  },
                  disabled: props.busy,
                  spellCheck: false
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsm-hint", children: t("mcp.headersHint") })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "dshsm-form-section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h4", { children: t("mcp.sectionAdvanced") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-form-grid", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-field", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: "dshsm-mcp-timeout", children: t("mcp.timeout") }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "input",
                {
                  id: "dshsm-mcp-timeout",
                  className: "dshsm-input",
                  inputMode: "numeric",
                  value: draft.timeoutText,
                  placeholder: "60000",
                  onChange: (event) => {
                    props.onUpdate({ timeoutText: event.target.value });
                  },
                  disabled: props.busy
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsm-hint", children: t("mcp.timeoutHint") })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-field dshsm-switch-field", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsm-field-label", children: t("mcp.enableLabel") }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsm-hint", children: t("mcp.enableHint") })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                Switch,
                {
                  checked: draft.enabled,
                  onChange: (enabled) => {
                    props.onUpdate({ enabled });
                  },
                  disabled: props.busy,
                  label: t("mcp.enableLabel")
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsm-editor-footer", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshsm-hint", children: t("mcp.footerHint") }),
          actions
        ] })
      ]
    }
  );
}

// src/client/SkillsPanel.tsx
var import_react2 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
function defaultRoot(scope) {
  return scope === "project" ? "project-dsh" : "system-dsh";
}
function matches2(skill, query, t) {
  if (query === "") return true;
  const haystack = [
    skill.name,
    skill.description,
    skill.whenToUse ?? "",
    skill.path,
    skill.rootKind,
    t(`skillRoot.${skill.rootKind}`)
  ].join("\n").toLowerCase();
  return haystack.includes(query);
}
function SkillsPanel(props) {
  const { t, scope, scopeSnapshot } = props;
  const [draft, setDraft] = (0, import_react2.useState)(null);
  const [busy, setBusy] = (0, import_react2.useState)(false);
  const [editorError, setEditorError] = (0, import_react2.useState)(null);
  const [loadingContent, setLoadingContent] = (0, import_react2.useState)(false);
  const [query, setQuery] = (0, import_react2.useState)("");
  (0, import_react2.useEffect)(() => {
    setDraft(null);
    setEditorError(null);
    setQuery("");
  }, [scope, props.projectPath]);
  const roots = scopeSnapshot?.skillRoots ?? [];
  const skills = scopeSnapshot?.skills ?? [];
  const normalizedQuery = query.trim().toLowerCase();
  const visible = (0, import_react2.useMemo)(
    () => normalizedQuery === "" ? skills : skills.filter((skill) => matches2(skill, normalizedQuery, t)),
    [skills, normalizedQuery, t]
  );
  const scopeReady = scope === "system" || props.projectPath.trim() !== "";
  if (!scopeReady) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(NoticeBox, { tone: "warn", children: t("errors.noProjectSkills") });
  }
  const startCreate = () => {
    setEditorError(null);
    const root = roots[0]?.id ?? defaultRoot(scope);
    setDraft({
      mode: "create",
      name: "",
      root,
      content: "",
      contentTouched: false
    });
  };
  const startEdit = async (skill) => {
    setEditorError(null);
    setLoadingContent(true);
    try {
      const result = await readSkill(
        scope,
        scope === "project" ? props.projectPath : void 0,
        skill.root,
        skill.name
      );
      if (!result.ok) {
        props.notify("error", t("errors.actionFailed", { message: result.error.message }));
        return;
      }
      setDraft({
        mode: "edit",
        name: skill.name,
        originalName: skill.name,
        root: skill.root,
        content: result.value.content,
        contentTouched: true
      });
    } catch (error) {
      props.notify("error", t("errors.actionFailed", { message: error instanceof Error ? error.message : String(error) }));
    } finally {
      setLoadingContent(false);
    }
  };
  const updateName = (name) => {
    setDraft((current) => {
      if (current === null) return current;
      const next = { ...current, name };
      if (current.mode === "create" && !current.contentTouched) {
        next.content = name.trim() === "" ? "" : t("skills.template", { name: name.trim() });
      }
      return next;
    });
  };
  const save = async () => {
    if (draft === null) return;
    const name = draft.name.trim();
    if (name === "") {
      setEditorError(t("editor.nameRequired"));
      return;
    }
    setBusy(true);
    setEditorError(null);
    try {
      const result = await saveSkill(
        scope,
        scope === "project" ? props.projectPath : void 0,
        draft.root,
        name,
        draft.content
      );
      if (!result.ok) {
        setEditorError(result.error.message);
        return;
      }
      setDraft(null);
      props.notify("success", t("skills.saved"));
      props.onDone();
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };
  const remove = async (skill) => {
    if (!window.confirm(t("skills.deleteConfirm", { name: skill.name }))) return;
    setBusy(true);
    try {
      const result = await deleteSkill(
        scope,
        scope === "project" ? props.projectPath : void 0,
        skill.root,
        skill.name
      );
      if (!result.ok) {
        props.notify("error", t("errors.actionFailed", { message: result.error.message }));
        return;
      }
      props.notify("success", t("skills.deleted", { path: result.value.trashPath ?? "\u2014" }));
      if (draft?.name === skill.name && draft.root === skill.root) setDraft(null);
      props.onDone();
    } catch (error) {
      props.notify("error", t("errors.actionFailed", { message: error instanceof Error ? error.message : String(error) }));
    } finally {
      setBusy(false);
    }
  };
  const toggle = async (skill, enabled) => {
    setBusy(true);
    try {
      const result = await setSkillEnabled(
        scope,
        scope === "project" ? props.projectPath : void 0,
        skill.name,
        enabled
      );
      if (!result.ok) {
        props.notify("error", t("errors.actionFailed", { message: result.error.message }));
        return;
      }
      props.notify("success", t(enabled ? "skills.enabledInDshMessage" : "skills.disabledInDshMessage", { name: skill.name }));
      props.onDone();
    } catch (error) {
      props.notify("error", t("errors.actionFailed", { message: error instanceof Error ? error.message : String(error) }));
    } finally {
      setBusy(false);
    }
  };
  if (draft !== null) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      SkillEditor,
      {
        t,
        draft,
        roots,
        projectPath: scope === "project" ? props.projectPath : void 0,
        busy,
        error: editorError,
        onChangeName: updateName,
        onChangeRoot: (root) => {
          setDraft((current) => current === null ? current : { ...current, root });
        },
        onChangeContent: (content) => {
          setDraft((current) => current === null ? current : { ...current, content, contentTouched: true });
        },
        onCancel: () => {
          setDraft(null);
          setEditorError(null);
        },
        onSave: () => {
          void save();
        }
      }
    );
  }
  const toolbarDisabled = busy || loadingContent || props.loading || scopeSnapshot === null;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsm-panel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsm-panel-bar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        SearchField,
        {
          value: query,
          onChange: setQuery,
          placeholder: t("skills.searchPlaceholder"),
          label: t("skills.searchPlaceholder"),
          clearLabel: t("common.clearSearch")
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        Button,
        {
          variant: "primary",
          icon: "plus",
          onClick: startCreate,
          disabled: toolbarDisabled,
          children: t("skills.add")
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsm-panel-meta", children: [
      roots.map((root) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "dshsm-source", title: root.path, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "folder", size: 12 }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: t(`skillRoot.${root.kind}`) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("code", { children: displayPath(root.path, scope === "project" ? props.projectPath : void 0) })
      ] }, root.id)),
      normalizedQuery === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "dshsm-count", children: [
        visible.length,
        " / ",
        skills.length
      ] })
    ] }),
    scopeSnapshot !== null ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Issues, { items: scopeSnapshot.issues, t }) : null,
    scopeSnapshot === null && props.loading ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(SkeletonList, { rows: 3 }) : null,
    scopeSnapshot === null && !props.loading ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(EmptyState, { icon: "sparkle", title: t("errors.noData") }) : null,
    scopeSnapshot !== null && skills.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      EmptyState,
      {
        icon: "sparkle",
        title: t("skills.empty"),
        hint: t("skills.emptyHint"),
        action: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Button, { variant: "primary", icon: "plus", onClick: startCreate, disabled: toolbarDisabled, children: t("skills.add") })
      }
    ) : null,
    scopeSnapshot !== null && skills.length > 0 && visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      EmptyState,
      {
        icon: "search",
        title: t("skills.noMatch"),
        hint: t("skills.noMatchHint"),
        action: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Button, { onClick: () => {
          setQuery("");
        }, children: t("common.clearSearch") })
      }
    ) : null,
    visible.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshsm-list", children: visible.map((skill) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      SkillRow,
      {
        t,
        skill,
        busy: busy || loadingContent,
        pathLabel: displayPath(skill.path, scope === "project" ? props.projectPath : void 0),
        onToggle: (enabled) => {
          void toggle(skill, enabled);
        },
        onEdit: () => {
          void startEdit(skill);
        },
        onDelete: () => {
          void remove(skill);
        }
      },
      `${skill.root}:${skill.name}`
    )) }) : null
  ] });
}
function SkillRow(props) {
  const { t, skill } = props;
  const disabled = skill.disabledInDsh === true;
  const readOnly = skill.readOnly === true;
  const surface = skill.issue !== void 0 ? null : !skill.modelInvocable && !skill.userInvocable ? "hidden" : !skill.userInvocable ? "model" : !skill.modelInvocable ? "user" : null;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("article", { className: "dshsm-row", "data-disabled": disabled ? "true" : void 0, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsm-row-body", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsm-row-title", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshsm-row-name", children: skill.name }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Badge, { tone: skill.rootKind === "dsh" ? "accent" : void 0, children: t(`skillRoot.${skill.rootKind}`) }),
        disabled ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Badge, { tone: "warn", children: t("skills.disabledInDsh") }) : null,
        readOnly ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Badge, { children: t("skills.readOnly") }) : null,
        skill.issue !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Badge, { tone: "error", children: t("skills.invalid") }) : null,
        surface === "hidden" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Badge, { tone: "warn", children: t("skills.hidden") }) : null,
        surface === "model" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Badge, { children: t("skills.modelOnly") }) : null,
        surface === "user" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Badge, { children: t("skills.userOnly") }) : null
      ] }),
      skill.description === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "dshsm-row-desc", title: skill.description, children: skill.description }),
      skill.issue === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsm-row-note", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "alert", size: 12 }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: skill.issue })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsm-row-meta", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshsm-row-path", title: skill.path, children: props.pathLabel }),
        skill.kind === "flat" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshsm-row-tag", children: t("skills.flat") }) : null
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsm-row-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        IconButton,
        {
          icon: "edit",
          label: t("common.edit"),
          title: readOnly ? t("skills.readOnly") : t("common.edit"),
          onClick: props.onEdit,
          disabled: props.busy || readOnly
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        IconButton,
        {
          icon: "trash",
          label: t("common.delete"),
          title: readOnly ? t("skills.readOnly") : t("common.delete"),
          variant: "danger",
          onClick: props.onDelete,
          disabled: props.busy || readOnly
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        Switch,
        {
          checked: !disabled,
          onChange: props.onToggle,
          disabled: props.busy || readOnly,
          label: t("skills.enabledSwitch"),
          title: t("skills.toggleHint")
        }
      )
    ] })
  ] });
}
function SkillEditor(props) {
  const { t, draft } = props;
  const editing = draft.mode === "edit";
  const actions = /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsm-editor-actions", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Button, { onClick: props.onCancel, disabled: props.busy, children: t("common.cancel") }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Button, { type: "submit", variant: "primary", disabled: props.busy, children: props.busy ? t("common.saving") : t("common.save") })
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "form",
    {
      className: "dshsm-editor",
      onSubmit: (event) => {
        event.preventDefault();
        props.onSave();
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "dshsm-back", onClick: props.onCancel, disabled: props.busy, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "back", size: 14 }),
          t("skills.backToList")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsm-editor-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { children: editing ? t("skills.editTitle", { name: draft.name }) : t("skills.newTitle") }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: t("skills.editorIntro") })
          ] }),
          actions
        ] }),
        props.error === null ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(NoticeBox, { tone: "error", children: props.error }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsm-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { htmlFor: "dshsm-skill-name", children: t("skills.name") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "input",
            {
              id: "dshsm-skill-name",
              className: "dshsm-input dshsm-mono",
              value: draft.name,
              placeholder: t("skills.namePlaceholder"),
              onChange: (event) => {
                props.onChangeName(event.target.value);
              },
              disabled: props.busy || editing,
              autoComplete: "off",
              spellCheck: false
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsm-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshsm-field-label", children: t("skills.root") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshsm-radio-cards", role: "radiogroup", "aria-label": t("skills.root"), children: props.roots.map((root) => {
            const active = draft.root === root.id;
            return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
              "label",
              {
                className: "dshsm-radio-card",
                "data-active": active,
                "data-disabled": editing,
                title: root.path,
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                    "input",
                    {
                      type: "radio",
                      name: "dshsm-skill-root",
                      value: root.id,
                      checked: active,
                      onChange: () => {
                        props.onChangeRoot(root.id);
                      },
                      disabled: props.busy || editing
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "dshsm-radio-card-label", children: [
                    t(`skillRoot.${root.kind}`),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshsm-radio-check", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "check", size: 12 }) })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("code", { children: displayPath(root.path, props.projectPath) })
                ]
              },
              root.id
            );
          }) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshsm-hint", children: t("skills.rootHint") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsm-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { htmlFor: "dshsm-skill-content", children: t("skills.content") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "textarea",
            {
              id: "dshsm-skill-content",
              className: "dshsm-textarea dshsm-code dshsm-code-lg",
              value: draft.content,
              onChange: (event) => {
                props.onChangeContent(event.target.value);
              },
              disabled: props.busy,
              spellCheck: false
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshsm-hint", children: t("skills.saveHint") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsm-editor-footer", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshsm-hint", children: t("skills.footerHint") }),
          actions
        ] })
      ]
    }
  );
}

// src/client/Section.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var PROJECT_KEY = "dsh-skills-mcp.project";
var SCOPE_KEY = "dsh-skills-mcp.scope";
var TAB_KEY = "dsh-skills-mcp.tab";
function stored(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function store(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
  }
}
function SkillsMcpSection(props) {
  const { t, listProjects, subscribeProjects } = props;
  const [projects, setProjects] = (0, import_react3.useState)(() => safeList(listProjects));
  const [projectPath, setProjectPath] = (0, import_react3.useState)(() => {
    const saved = stored(PROJECT_KEY);
    return saved !== null && saved.trim() !== "" ? saved : safeList(listProjects)[0]?.path ?? "";
  });
  const [scope, setScope] = (0, import_react3.useState)(() => stored(SCOPE_KEY) === "project" ? "project" : "system");
  const [tab, setTab] = (0, import_react3.useState)(() => stored(TAB_KEY) === "mcp" ? "mcp" : "skills");
  const [snapshot, setSnapshot] = (0, import_react3.useState)(null);
  const [loading, setLoading] = (0, import_react3.useState)(true);
  const [error, setError] = (0, import_react3.useState)(null);
  const [refreshKey, setRefreshKey] = (0, import_react3.useState)(0);
  const [notice, setNotice] = (0, import_react3.useState)(null);
  const sequence = (0, import_react3.useRef)(0);
  const noticeTimer = (0, import_react3.useRef)(null);
  const notify = (tone, text) => {
    if (noticeTimer.current !== null) clearTimeout(noticeTimer.current);
    setNotice({ tone, text });
    noticeTimer.current = setTimeout(() => {
      setNotice(null);
    }, 4500);
  };
  (0, import_react3.useEffect)(() => () => {
    if (noticeTimer.current !== null) clearTimeout(noticeTimer.current);
  }, []);
  (0, import_react3.useEffect)(() => {
    store(PROJECT_KEY, projectPath);
  }, [projectPath]);
  (0, import_react3.useEffect)(() => {
    store(SCOPE_KEY, scope);
  }, [scope]);
  (0, import_react3.useEffect)(() => {
    store(TAB_KEY, tab);
  }, [tab]);
  (0, import_react3.useEffect)(() => {
    const sync = () => {
      const next = safeList(listProjects);
      setProjects(next);
      setProjectPath((current) => current.trim() === "" && next[0] !== void 0 ? next[0].path : current);
    };
    sync();
    return subscribeProjects(sync);
  }, [listProjects, subscribeProjects]);
  (0, import_react3.useEffect)(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const requestId = ++sequence.current;
      setLoading(true);
      void loadSnapshot(projectPath.trim() === "" ? void 0 : projectPath.trim(), controller.signal).then((result) => {
        if (sequence.current !== requestId) return;
        if (result.ok) {
          setSnapshot(result.value);
          setError(null);
        } else {
          setError(t("errors.loadFailed", { message: result.error.message }));
        }
      }).catch((errorValue) => {
        if (sequence.current !== requestId) return;
        if (errorValue instanceof Error && errorValue.name === "AbortError") return;
        setError(t("errors.loadFailed", { message: errorValue instanceof Error ? errorValue.message : String(errorValue) }));
      }).finally(() => {
        if (sequence.current === requestId) setLoading(false);
      });
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [projectPath, refreshKey, t]);
  const refreshProjects = () => {
    const next = safeList(listProjects);
    setProjects(next);
    if (projectPath.trim() === "" && next[0] !== void 0) setProjectPath(next[0].path);
  };
  const refresh = () => {
    setRefreshKey((value) => value + 1);
  };
  const onDone = () => {
    refresh();
  };
  const scopeInfo = scope === "system" ? snapshot?.system : snapshot?.project;
  const projectError = scope === "project" ? projectPath.trim() === "" ? t("errors.noProject") : snapshot?.projectError ?? null : null;
  const filteredProjects = projects.filter((project) => project.path !== "");
  const skillsCount = scopeInfo?.skills.length;
  const serversCount = scopeInfo?.servers.length;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshsm-section", "aria-busy": loading, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("header", { className: "dshsm-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshsm-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { children: t("title") }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { title: t("intro"), children: t("intro") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        IconButton,
        {
          icon: "refresh",
          label: t("common.refresh"),
          onClick: refresh,
          disabled: loading,
          busy: loading
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshsm-context", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshsm-context-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dshsm-context-label", children: t("scope.label") }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshsm-segmented", role: "tablist", "aria-label": t("scope.label"), children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": scope === "system",
              "data-active": scope === "system",
              onClick: () => {
                setScope("system");
              },
              children: t("scope.system")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": scope === "project",
              "data-active": scope === "project",
              onClick: () => {
                setScope("project");
              },
              children: t("scope.project")
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dshsm-context-hint", children: scope === "system" ? t("scope.systemHint") : t("scope.projectHint") })
      ] }),
      scope === "project" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshsm-context-row dshsm-context-row--project", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { className: "dshsm-context-label", htmlFor: "dshsm-project-path", children: t("project.label") }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
          Select,
          {
            className: "dshsm-project-select",
            ariaLabel: t("project.choose"),
            value: filteredProjects.some((project) => project.path === projectPath.trim()) ? projectPath.trim() : "",
            onChange: (value) => {
              if (value !== "") setProjectPath(value);
            },
            disabled: loading,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "", children: t("project.choose") }),
              filteredProjects.map((project) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: project.path, children: project.title }, project.path))
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "input",
          {
            id: "dshsm-project-path",
            className: "dshsm-input dshsm-mono dshsm-project-path",
            value: projectPath,
            placeholder: t("project.placeholder"),
            onChange: (event) => {
              setProjectPath(event.target.value);
            },
            spellCheck: false,
            autoComplete: "off"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          IconButton,
          {
            icon: "refresh",
            label: t("project.refresh"),
            onClick: refreshProjects,
            disabled: loading
          }
        )
      ] }) : null
    ] }),
    notice !== null ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(NoticeBox, { tone: notice.tone, children: notice.text }) : null,
    error !== null ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(NoticeBox, { tone: "error", children: [
      error,
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Button, { onClick: refresh, disabled: loading, children: t("common.retry") })
    ] }) : null,
    projectError !== null ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(NoticeBox, { tone: "warn", children: projectError }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dshsm-tabbar", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshsm-tabs", role: "tablist", "aria-label": t("title"), children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
        "button",
        {
          id: "dshsm-tab-skills",
          type: "button",
          role: "tab",
          className: "dshsm-tab",
          "aria-selected": tab === "skills",
          "data-active": tab === "skills",
          onClick: () => {
            setTab("skills");
          },
          children: [
            t("tabs.skills"),
            skillsCount === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dshsm-tab-count", children: skillsCount })
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
        "button",
        {
          id: "dshsm-tab-mcp",
          type: "button",
          role: "tab",
          className: "dshsm-tab",
          "aria-selected": tab === "mcp",
          "data-active": tab === "mcp",
          onClick: () => {
            setTab("mcp");
          },
          children: [
            t("tabs.mcp"),
            serversCount === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dshsm-tab-count", children: serversCount })
          ]
        }
      )
    ] }) }),
    loading && snapshot !== null ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dshsm-progress", "aria-hidden": "true" }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      "div",
      {
        id: tab === "skills" ? "dshsm-panel-skills" : "dshsm-panel-mcp",
        className: "dshsm-panel-wrap",
        role: "tabpanel",
        "aria-labelledby": tab === "skills" ? "dshsm-tab-skills" : "dshsm-tab-mcp",
        children: tab === "skills" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          SkillsPanel,
          {
            t,
            scope,
            projectPath,
            scopeSnapshot: scopeInfo ?? null,
            loading,
            notify,
            onDone
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          McpPanel,
          {
            t,
            scope,
            projectPath,
            scopeSnapshot: scopeInfo ?? null,
            loading,
            notify,
            onDone
          }
        )
      }
    )
  ] });
}
function safeList(listProjects) {
  try {
    return listProjects().filter((project) => typeof project.path === "string" && project.path !== "");
  } catch {
    return [];
  }
}

// src/client/style.ts
var STYLE_ID = "dsh-skills-mcp-style";
var CSS = `
.dshsm-section {
  --dshsm-surface-1: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.06));
  --dshsm-surface-2: var(--dsw-alias-bg-layer-2, rgba(127,127,127,.1));
  --dshsm-surface-3: var(--dsw-alias-bg-layer-3, rgba(127,127,127,.14));
  --dshsm-hover: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.08));
  --dshsm-border: var(--dsw-alias-border-l2, rgba(255,255,255,.12));
  --dshsm-border-subtle: var(--dsw-alias-border-l1, rgba(255,255,255,.07));
  --dshsm-border-strong: var(--dsw-alias-border-l3, rgba(255,255,255,.18));
  --dshsm-text: var(--dsw-alias-label-primary, #f9fafb);
  --dshsm-text-2: var(--dsw-alias-label-secondary, #cfd3d6);
  --dshsm-text-3: var(--dsw-alias-label-tertiary, #adb2b8);
  --dshsm-accent: var(--dsw-alias-state-business-primary, #4f8cff);
  --dshsm-success: var(--dsw-alias-state-success-primary, #3fb950);
  --dshsm-error: var(--dsw-alias-state-error-primary, #f85149);
  --dshsm-warn: var(--dsw-alias-state-warn-primary, #d29922);
  --dshsm-brand: var(--dsw-alias-brand-primary, var(--dsw-alias-label-primary, #f9fafb));
  --dshsm-brand-fg: var(--dsw-alias-label-primary-foreground, #151517);
  --dshsm-switch-track: var(--dsw-alias-border-l3, rgba(255,255,255,.18));
  --dshsm-switch-thumb: var(--dsw-alias-switch-thumb, #adb2b8);
  --dshsm-mono: var(--ds-font-family-code, ui-monospace, monospace);
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 720px;
  min-width: 0;
  color: var(--dshsm-text);
  font: inherit;
}

/* Header */
.dshsm-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.dshsm-heading { min-width: 0; }
.dshsm-heading h2 { margin: 0; font-size: 18px; line-height: 1.35; font-weight: 600; letter-spacing: -.012em; color: var(--dshsm-text); }
.dshsm-heading p { margin: 6px 0 0; max-width: 62ch; color: var(--dshsm-text-3); font-size: 12.5px; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.dshsm-icon { display: block; flex: 0 0 auto; }
.dshsm-icon-button {
  width: 30px; height: 30px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center;
  border: 0; border-radius: 8px; background: transparent; color: var(--dshsm-text-3);
  cursor: pointer; transition: background .14s ease, color .14s ease;
}
.dshsm-icon-button:hover:not(:disabled) { background: var(--dshsm-hover); color: var(--dshsm-text); }
.dshsm-icon-button[data-variant="danger"]:hover:not(:disabled) { background: color-mix(in srgb, var(--dshsm-error) 14%, transparent); color: var(--dshsm-error); }
.dshsm-icon-button:disabled { opacity: .4; cursor: default; }
.dshsm-icon-button[data-busy="true"] .dshsm-icon { animation: dshsm-spin 1s linear infinite; }

/* Scope context */
.dshsm-context {
  display: flex; flex-direction: column; gap: 10px;
  padding: 12px; border: 1px solid var(--dshsm-border-subtle); border-radius: 14px;
  background: var(--dshsm-surface-1);
}
.dshsm-context-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
.dshsm-context-label { flex: 0 0 auto; min-width: 36px; color: var(--dshsm-text-3); font-size: 12px; font-weight: 500; }
.dshsm-context-hint { margin-left: auto; color: var(--dshsm-text-3); font-size: 11.5px; line-height: 1.4; }
.dshsm-context-row--project {
  display: grid; grid-template-columns: 36px minmax(0, 1fr) auto;
  grid-template-areas: "label select refresh" ". path path";
  gap: 8px 10px; align-items: center;
}
.dshsm-context-row--project .dshsm-context-label { grid-area: label; }
.dshsm-context-row--project .dshsm-project-select { grid-area: select; min-width: 0; }
.dshsm-context-row--project .dshsm-project-path { grid-area: path; min-width: 0; }
.dshsm-context-row--project .dshsm-icon-button { grid-area: refresh; border: 1px solid var(--dshsm-border-subtle); border-radius: 8px; }

.dshsm-segmented {
  display: inline-flex; gap: 2px; padding: 3px;
  border: 1px solid var(--dshsm-border-subtle); border-radius: 9px; background: var(--dshsm-surface-2);
}
.dshsm-segmented button {
  border: 0; border-radius: 6px; padding: 5px 12px; background: transparent; color: var(--dshsm-text-3);
  font: inherit; font-size: 12.5px; font-weight: 500; line-height: 1.25; white-space: nowrap;
  cursor: pointer; transition: background .14s ease, color .14s ease;
}
.dshsm-segmented button:hover:not(:disabled) { color: var(--dshsm-text); }
.dshsm-segmented button[data-active="true"] {
  background: var(--dshsm-surface-3); color: var(--dshsm-text);
  box-shadow: inset 0 0 0 1px var(--dshsm-border-subtle);
}
.dshsm-segmented button:disabled { opacity: .5; cursor: default; }
.dshsm-segmented--fluid { display: flex; width: 100%; }
.dshsm-segmented--fluid button { flex: 1 1 0; }

/* Tabs */
.dshsm-tabbar { display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 1px solid var(--dshsm-border-subtle); }
.dshsm-tabs { display: flex; gap: 22px; min-width: 0; }
.dshsm-tab {
  position: relative; display: inline-flex; align-items: center; gap: 7px;
  border: 0; background: none; padding: 0 1px 10px;
  color: var(--dshsm-text-3); font: inherit; font-size: 13px; font-weight: 550; cursor: pointer;
  transition: color .15s ease;
}
.dshsm-tab::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; border-radius: 2px;
  background: var(--dshsm-text); opacity: 0; transition: opacity .15s ease;
}
.dshsm-tab:hover { color: var(--dshsm-text-2); }
.dshsm-tab[data-active="true"] { color: var(--dshsm-text); }
.dshsm-tab[data-active="true"]::after { opacity: 1; }
.dshsm-tab-count {
  min-width: 17px; height: 17px; padding: 0 5px; border-radius: 999px;
  background: var(--dshsm-surface-2); color: var(--dshsm-text-3);
  font-size: 10.5px; font-weight: 600; line-height: 17px; text-align: center; font-variant-numeric: tabular-nums;
}
.dshsm-tab[data-active="true"] .dshsm-tab-count { background: var(--dshsm-surface-3); color: var(--dshsm-text-2); }
.dshsm-progress { height: 2px; margin-top: -6px; border-radius: 999px; background: var(--dshsm-surface-2); overflow: hidden; position: relative; }
.dshsm-progress::after {
  content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 38%; border-radius: inherit;
  background: var(--dshsm-accent); animation: dshsm-indeterminate 1.15s ease-in-out infinite;
}
.dshsm-panel-wrap { min-width: 0; display: flex; flex-direction: column; }

/* Panel chrome */
.dshsm-panel { display: flex; flex-direction: column; gap: 12px; min-width: 0; animation: dshsm-fade .18s ease both; }
.dshsm-panel-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dshsm-panel-bar .dshsm-button { flex: 0 0 auto; }
.dshsm-panel-meta { display: flex; align-items: center; gap: 6px 14px; flex-wrap: wrap; color: var(--dshsm-text-3); font-size: 11px; line-height: 1.5; }
.dshsm-source { display: inline-flex; align-items: center; gap: 5px; min-width: 0; max-width: 100%; }
.dshsm-source .dshsm-icon { color: var(--dshsm-text-3); opacity: .85; }
.dshsm-source code {
  max-width: 230px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-family: var(--dshsm-mono); font-size: 10.5px; color: var(--dshsm-text-3);
}
.dshsm-count { margin-left: auto; white-space: nowrap; color: var(--dshsm-text-3); font-size: 11px; font-variant-numeric: tabular-nums; }

.dshsm-details {
  border: 1px solid var(--dshsm-border-subtle); border-radius: 10px; background: var(--dshsm-surface-1);
  padding: 0 11px; color: var(--dshsm-text-3); font-size: 11.5px;
}
.dshsm-details summary {
  display: flex; align-items: center; gap: 6px; padding: 8px 0; cursor: pointer;
  color: var(--dshsm-text-2); list-style: none;
}
.dshsm-details summary::-webkit-details-marker { display: none; }
.dshsm-details summary::before { content: "\u203A"; color: var(--dshsm-text-3); font-size: 15px; line-height: 1; transition: transform .15s ease; }
.dshsm-details[open] summary::before { transform: rotate(90deg); }
.dshsm-details p { margin: 0 0 10px; line-height: 1.6; }

/* Search */
.dshsm-search {
  position: relative; flex: 1 1 200px; min-width: 0; height: 34px;
  display: flex; align-items: center;
  border: 1px solid var(--dshsm-border); border-radius: 12px; background: var(--dshsm-surface-1);
  color: var(--dshsm-text-3); transition: border-color .14s ease, background .14s ease, box-shadow .14s ease;
}
.dshsm-search:focus-within {
  border-color: var(--dshsm-border-strong); background: var(--dshsm-surface-2);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshsm-accent) 14%, transparent);
}
.dshsm-search > .dshsm-icon { position: absolute; left: 10px; pointer-events: none; }
.dshsm-search input {
  flex: 1 1 auto; min-width: 0; height: 100%; border: 0; outline: none; background: transparent;
  color: var(--dshsm-text); font: inherit; font-size: 12.5px; padding: 0 30px 0 32px;
}
.dshsm-search input::placeholder { color: var(--dshsm-text-3); }
.dshsm-search input::-webkit-search-cancel-button { display: none; }
.dshsm-search-clear {
  position: absolute; right: 4px; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center;
  border: 0; border-radius: 7px; background: transparent; color: var(--dshsm-text-3); cursor: pointer;
}
.dshsm-search-clear:hover { background: var(--dshsm-surface-3); color: var(--dshsm-text); }

/* Buttons */
.dshsm-button {
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  height: 32px; padding: 0 11px; border: 1px solid var(--dshsm-border); border-radius: 8px;
  background: transparent; color: var(--dshsm-text); font: inherit; font-size: 12px; font-weight: 500;
  line-height: 1; white-space: nowrap; cursor: pointer;
  transition: background .14s ease, border-color .14s ease, color .14s ease, filter .14s ease;
}
.dshsm-button:hover:not(:disabled) { background: var(--dshsm-hover); border-color: var(--dshsm-border-strong); }
.dshsm-button:disabled { opacity: .5; cursor: default; }
.dshsm-button[data-variant="primary"] {
  border-color: transparent; background: var(--dshsm-brand); color: var(--dshsm-brand-fg); font-weight: 600;
}
.dshsm-button[data-variant="primary"]:hover:not(:disabled) { background: var(--dshsm-brand); border-color: transparent; filter: brightness(.94); }
.dshsm-button[data-variant="danger"] {
  border-color: color-mix(in srgb, var(--dshsm-error) 30%, var(--dshsm-border)); color: var(--dshsm-error);
}
.dshsm-button[data-variant="danger"]:hover:not(:disabled) {
  background: color-mix(in srgb, var(--dshsm-error) 10%, transparent);
  border-color: color-mix(in srgb, var(--dshsm-error) 42%, var(--dshsm-border));
}
.dshsm-button[data-variant="ghost"] { border-color: transparent; color: var(--dshsm-text-3); }
.dshsm-button[data-variant="ghost"]:hover:not(:disabled) { color: var(--dshsm-text); background: var(--dshsm-hover); border-color: transparent; }

/* Inputs */
.dshsm-input, .dshsm-select, .dshsm-textarea {
  width: 100%; box-sizing: border-box; border: 1px solid var(--dshsm-border); border-radius: 10px;
  background: var(--dshsm-surface-2); color: var(--dshsm-text);
  font: inherit; font-size: 12.5px; line-height: 1.45; padding: 7px 10px; outline: none;
  transition: border-color .14s ease, background .14s ease, box-shadow .14s ease;
}
.dshsm-input { height: 32px; }
.dshsm-select { height: 32px; padding-right: 28px; appearance: none; cursor: pointer; }
.dshsm-textarea { resize: vertical; min-height: 86px; }
.dshsm-input:hover:not(:disabled), .dshsm-select:hover:not(:disabled), .dshsm-textarea:hover:not(:disabled) {
  border-color: var(--dshsm-border-strong);
}
.dshsm-input:focus, .dshsm-select:focus, .dshsm-textarea:focus {
  border-color: var(--dshsm-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshsm-accent) 20%, transparent);
}
.dshsm-input:disabled, .dshsm-select:disabled, .dshsm-textarea:disabled { opacity: .55; cursor: default; }
.dshsm-input::placeholder, .dshsm-textarea::placeholder { color: var(--dshsm-text-3); opacity: .9; }
.dshsm-select-wrap { position: relative; display: block; min-width: 0; }
.dshsm-select-wrap > .dshsm-icon {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  pointer-events: none; color: var(--dshsm-text-3);
}
.dshsm-mono { font-family: var(--dshsm-mono); font-size: 12px; }
.dshsm-textarea.dshsm-code { font-family: var(--dshsm-mono); font-size: 11.5px; line-height: 1.55; tab-size: 2; }
.dshsm-textarea.dshsm-code-lg { min-height: 340px; font-size: 12px; }

/* Fields */
.dshsm-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.dshsm-field > label, .dshsm-field-label { color: var(--dshsm-text-3); font-size: 11.5px; font-weight: 500; line-height: 1.4; }
.dshsm-hint { display: block; color: var(--dshsm-text-3); font-size: 10.5px; line-height: 1.5; }
.dshsm-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.dshsm-switch-field { flex-direction: row; align-items: center; justify-content: space-between; gap: 12px; }
.dshsm-switch-field > div { display: flex; flex-direction: column; gap: 3px; min-width: 0; }

/* Toggle */
.dshsm-switch {
  box-sizing: border-box; position: relative; flex: 0 0 auto; width: 36px; height: 20px; padding: 2px;
  border: 0; border-radius: 999px; background: var(--dshsm-switch-track); cursor: pointer;
  transition: background .16s ease;
}
.dshsm-switch[aria-checked="true"] { background: var(--dshsm-brand); }
.dshsm-switch-thumb {
  display: block; width: 16px; height: 16px; border-radius: 50%; background: var(--dshsm-switch-thumb);
  transition: transform .16s cubic-bezier(.2,.8,.2,1), background .16s ease;
}
.dshsm-switch[aria-checked="true"] .dshsm-switch-thumb { transform: translateX(16px); background: var(--dshsm-brand-fg); }
.dshsm-switch:disabled { opacity: .45; cursor: default; }

/* List */
.dshsm-list {
  display: flex; flex-direction: column; overflow: hidden;
  border: 1px solid var(--dshsm-border-subtle); border-radius: 14px; background: var(--dshsm-surface-1);
}
.dshsm-row { display: flex; align-items: flex-start; gap: 12px; padding: 11px 13px; min-width: 0; transition: background .14s ease; }
.dshsm-row + .dshsm-row { border-top: 1px solid var(--dshsm-border-subtle); }
.dshsm-row:hover { background: var(--dshsm-hover); }
.dshsm-row[data-disabled="true"] .dshsm-row-name { color: var(--dshsm-text-2); }
.dshsm-row-body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.dshsm-row-title { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; min-width: 0; line-height: 1.45; }
.dshsm-row-name { color: var(--dshsm-text); font-family: var(--dshsm-mono); font-size: 12.5px; font-weight: 600; letter-spacing: -.01em; overflow-wrap: anywhere; }
.dshsm-row-desc {
  margin: 2px 0 0; color: var(--dshsm-text-3); font-size: 11.5px; line-height: 1.5; overflow-wrap: anywhere;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.dshsm-row-target {
  margin-top: 1px; color: var(--dshsm-text-2); font-family: var(--dshsm-mono); font-size: 10.5px; line-height: 1.5;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dshsm-row-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 2px; color: var(--dshsm-text-3); font-size: 10.5px; line-height: 1.5; }
.dshsm-row-path {
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: var(--dshsm-text-3); font-family: var(--dshsm-mono); font-size: 10.5px;
}
.dshsm-row-tag {
  flex: 0 0 auto; padding: 0 5px; border-radius: 5px; border: 1px solid var(--dshsm-border-subtle);
  color: var(--dshsm-text-3); font-size: 9.5px; line-height: 15px;
}
.dshsm-row-count { color: var(--dshsm-text-3); font-size: 10.5px; font-variant-numeric: tabular-nums; }
.dshsm-row-actions { display: flex; align-items: center; gap: 2px; flex: 0 0 auto; padding-top: 1px; }
.dshsm-row-actions .dshsm-button { height: 28px; padding: 0 9px; font-size: 11.5px; }
.dshsm-row-actions .dshsm-switch { margin-left: 4px; }
.dshsm-row-note {
  display: flex; align-items: flex-start; gap: 5px; margin-top: 3px;
  color: var(--dshsm-error); font-size: 11px; line-height: 1.45; overflow-wrap: anywhere;
}
.dshsm-row-note .dshsm-icon { margin-top: 1px; }

/* Badges and chips */
.dshsm-badge {
  display: inline-flex; align-items: center; gap: 4px; height: 18px; padding: 0 7px; border-radius: 999px;
  background: var(--dshsm-surface-2); color: var(--dshsm-text-3);
  font-size: 10px; font-weight: 600; letter-spacing: .01em; white-space: nowrap;
}
.dshsm-badge[data-tone="accent"] { background: color-mix(in srgb, var(--dshsm-accent) 15%, transparent); color: var(--dshsm-accent); }
.dshsm-badge[data-tone="success"] { background: color-mix(in srgb, var(--dshsm-success) 14%, transparent); color: var(--dshsm-success); }
.dshsm-badge[data-tone="warn"] { background: color-mix(in srgb, var(--dshsm-warn) 15%, transparent); color: var(--dshsm-warn); }
.dshsm-badge[data-tone="error"] { background: color-mix(in srgb, var(--dshsm-error) 14%, transparent); color: var(--dshsm-error); }
.dshsm-dot { width: 6px; height: 6px; border-radius: 999px; background: var(--dshsm-text-3); display: inline-block; flex: 0 0 auto; }
.dshsm-dot[data-tone="success"] { background: var(--dshsm-success); }
.dshsm-dot[data-tone="warn"] { background: var(--dshsm-warn); }
.dshsm-dot[data-tone="error"] { background: var(--dshsm-error); }
.dshsm-chip {
  display: inline-flex; align-items: center; height: 17px; padding: 0 5px; border-radius: 5px;
  border: 1px solid var(--dshsm-border-subtle); color: var(--dshsm-text-3);
  font-family: var(--dshsm-mono); font-size: 9.5px; line-height: 1;
}

/* Groups */
.dshsm-group { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.dshsm-group-head { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; padding: 0 2px; }
.dshsm-group-head h4 { margin: 0; color: var(--dshsm-text-2); font-size: 11.5px; font-weight: 600; letter-spacing: .01em; }
.dshsm-group-count {
  min-width: 17px; height: 17px; padding: 0 5px; border-radius: 999px;
  background: var(--dshsm-surface-2); color: var(--dshsm-text-3);
  font-size: 10px; font-weight: 600; line-height: 17px; text-align: center; font-variant-numeric: tabular-nums;
}
.dshsm-group-hint { flex-basis: 100%; margin: 0; color: var(--dshsm-text-3); font-size: 11px; line-height: 1.5; }

/* Notices and issues */
.dshsm-notice {
  display: flex; align-items: flex-start; gap: 7px;
  border: 1px solid var(--dshsm-border); border-radius: 10px; padding: 9px 11px;
  background: var(--dshsm-surface-1); color: var(--dshsm-text-2);
  font-size: 11.5px; line-height: 1.55; overflow-wrap: anywhere;
  animation: dshsm-fade .16s ease both;
}
.dshsm-notice > .dshsm-icon { margin-top: 1px; color: var(--dshsm-text-3); }
.dshsm-notice-body { flex: 1 1 auto; min-width: 0; }
.dshsm-notice-body .dshsm-button { height: 26px; margin-left: 8px; padding: 0 9px; font-size: 11px; vertical-align: middle; }
.dshsm-notice[data-tone="success"] { border-color: color-mix(in srgb, var(--dshsm-success) 38%, var(--dshsm-border)); background: color-mix(in srgb, var(--dshsm-success) 8%, transparent); color: var(--dshsm-success); }
.dshsm-notice[data-tone="success"] > .dshsm-icon { color: var(--dshsm-success); }
.dshsm-notice[data-tone="warn"] { border-color: color-mix(in srgb, var(--dshsm-warn) 38%, var(--dshsm-border)); background: color-mix(in srgb, var(--dshsm-warn) 8%, transparent); color: var(--dshsm-warn); }
.dshsm-notice[data-tone="warn"] > .dshsm-icon { color: var(--dshsm-warn); }
.dshsm-notice[data-tone="error"] { border-color: color-mix(in srgb, var(--dshsm-error) 38%, var(--dshsm-border)); background: color-mix(in srgb, var(--dshsm-error) 8%, transparent); color: var(--dshsm-error); }
.dshsm-notice[data-tone="error"] > .dshsm-icon { color: var(--dshsm-error); }
.dshsm-issues {
  border: 1px solid color-mix(in srgb, var(--dshsm-warn) 30%, var(--dshsm-border));
  border-radius: 10px; background: color-mix(in srgb, var(--dshsm-warn) 7%, transparent); padding: 9px 11px;
}
.dshsm-issues-head { display: flex; align-items: center; gap: 6px; color: var(--dshsm-warn); font-size: 11.5px; font-weight: 600; }
.dshsm-issues ul { margin: 5px 0 0; padding-left: 16px; color: var(--dshsm-text-2); font-size: 11.5px; line-height: 1.55; }
.dshsm-issues li { overflow-wrap: anywhere; }

/* Empty and loading */
.dshsm-empty {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 28px 18px; border: 1px dashed var(--dshsm-border); border-radius: 14px;
  text-align: center; color: var(--dshsm-text-3);
}
.dshsm-empty-icon {
  display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px;
  margin-bottom: 2px; border-radius: 10px; background: var(--dshsm-surface-2); color: var(--dshsm-text-3);
}
.dshsm-empty strong { color: var(--dshsm-text-2); font-size: 12.5px; font-weight: 600; }
.dshsm-empty p { margin: 0; max-width: 46ch; font-size: 11.5px; line-height: 1.55; }
.dshsm-empty .dshsm-button { margin-top: 8px; }
.dshsm-skeleton-row { display: flex; flex-direction: column; gap: 7px; padding: 13px; }
.dshsm-skeleton-row + .dshsm-skeleton-row { border-top: 1px solid var(--dshsm-border-subtle); }
.dshsm-skeleton-line { height: 9px; border-radius: 999px; background: var(--dshsm-surface-3); animation: dshsm-pulse 1.3s ease-in-out infinite; }
.dshsm-skeleton-line:nth-child(2) { animation-delay: .08s; }
.dshsm-skeleton-line:nth-child(3) { animation-delay: .16s; }

/* Editor */
.dshsm-editor {
  display: flex; flex-direction: column; gap: 14px; min-width: 0;
  padding: 14px; border: 1px solid var(--dshsm-border-subtle); border-radius: 14px;
  background: transparent; animation: dshsm-rise .2s ease both;
}
.dshsm-back {
  align-self: flex-start; display: inline-flex; align-items: center; gap: 5px;
  border: 0; background: none; padding: 0; color: var(--dshsm-text-3);
  font: inherit; font-size: 11.5px; cursor: pointer; transition: color .14s ease;
}
.dshsm-back:hover:not(:disabled) { color: var(--dshsm-text); }
.dshsm-back:disabled { opacity: .5; cursor: default; }
.dshsm-editor-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.dshsm-editor-head h3 { margin: 0; color: var(--dshsm-text); font-size: 15px; font-weight: 600; letter-spacing: -.01em; }
.dshsm-editor-head p { margin: 4px 0 0; max-width: 56ch; color: var(--dshsm-text-3); font-size: 11.5px; line-height: 1.55; }
.dshsm-editor-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.dshsm-form { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.dshsm-form-section { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding-top: 13px; border-top: 1px solid var(--dshsm-border-subtle); }
.dshsm-form-section:first-of-type { padding-top: 0; border-top: 0; }
.dshsm-form-section > h4 {
  margin: 0; color: var(--dshsm-text-2); font-size: 11.5px; font-weight: 600; letter-spacing: .02em;
}
.dshsm-editor-footer {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  padding-top: 13px; border-top: 1px solid var(--dshsm-border-subtle);
}
.dshsm-editor-footer > .dshsm-hint { max-width: 44ch; }

/* Root picker */
.dshsm-radio-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.dshsm-radio-card {
  position: relative; display: flex; flex-direction: column; gap: 3px; min-width: 0;
  padding: 9px 11px; border: 1px solid var(--dshsm-border); border-radius: 10px;
  background: var(--dshsm-surface-2); cursor: pointer;
  transition: border-color .14s ease, background .14s ease;
}
.dshsm-radio-card:hover { border-color: var(--dshsm-border-strong); }
.dshsm-radio-card[data-active="true"] {
  border-color: var(--dshsm-accent);
  background: color-mix(in srgb, var(--dshsm-accent) 8%, var(--dshsm-surface-2));
}
.dshsm-radio-card[data-disabled="true"] { cursor: default; opacity: .65; }
.dshsm-radio-card[data-disabled="true"]:hover { border-color: var(--dshsm-border); }
.dshsm-radio-card input { position: absolute; opacity: 0; pointer-events: none; }
.dshsm-radio-card:has(input:focus-visible) { outline: 2px solid var(--dshsm-accent); outline-offset: 2px; }
.dshsm-radio-card-label { display: flex; align-items: center; justify-content: space-between; gap: 6px; color: var(--dshsm-text); font-size: 12px; font-weight: 600; }
.dshsm-radio-card code {
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: var(--dshsm-text-3); font-family: var(--dshsm-mono); font-size: 10px;
}
.dshsm-radio-check { display: none; color: var(--dshsm-accent); }
.dshsm-radio-card[data-active="true"] .dshsm-radio-check { display: inline-flex; }

/* Focus */
.dshsm-button:focus-visible, .dshsm-icon-button:focus-visible, .dshsm-tab:focus-visible,
.dshsm-segmented button:focus-visible, .dshsm-switch:focus-visible, .dshsm-back:focus-visible,
.dshsm-search-clear:focus-visible {
  outline: 2px solid var(--dshsm-accent); outline-offset: 2px;
}

/* Motion */
@keyframes dshsm-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes dshsm-rise { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes dshsm-spin { to { transform: rotate(360deg); } }
@keyframes dshsm-pulse { 0%, 100% { opacity: .45; } 50% { opacity: .9; } }
@keyframes dshsm-indeterminate { 0% { transform: translateX(-110%); } 100% { transform: translateX(310%); } }

/* Narrow settings pane */
@container (max-width: 520px) {
  .dshsm-heading h2 { font-size: 17px; }
  .dshsm-context-hint { flex-basis: 100%; margin-left: 0; }
  .dshsm-form-grid, .dshsm-radio-cards { grid-template-columns: minmax(0, 1fr); }
  .dshsm-row { flex-wrap: wrap; }
  .dshsm-row-actions { width: 100%; justify-content: flex-end; margin-top: 2px; }
  .dshsm-editor-head { flex-direction: column; }
  .dshsm-editor-head > .dshsm-editor-actions { align-self: flex-end; }
  .dshsm-source code { max-width: 100%; }
}

@container (max-width: 420px) {
  .dshsm-tabs { gap: 16px; }
  .dshsm-search { flex-basis: 100%; }
  .dshsm-panel-bar .dshsm-button { flex: 1 1 auto; }
  .dshsm-segmented--fluid { flex-direction: column; }
  .dshsm-source code { max-width: 170px; }
}

@media (prefers-reduced-motion: reduce) {
  .dshsm-section *, .dshsm-section *::before, .dshsm-section *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
`;
function injectStyles() {
  if (typeof document === "undefined") return;
  let style = document.getElementById(STYLE_ID);
  if (!(style instanceof HTMLStyleElement)) {
    style?.remove();
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.append(style);
  }
  if (style.textContent !== CSS) style.textContent = CSS;
}

// src/client/locales.ts
var zh = {
  nav: "Skills \u4E0E MCP",
  title: "Skills \u4E0E MCP",
  intro: "\u7EDF\u4E00\u7BA1\u7406\u7CFB\u7EDF\u7EA7\u4E0E\u9879\u76EE\u7EA7\u7684 Skills \u548C MCP \u670D\u52A1\u5668\u3002Skills \u5199\u5165 DSH \u539F\u751F\u76EE\u5F55\uFF1BMCP \u901A\u8FC7\u5B98\u65B9 dsh-mcp-client \u52A8\u6001\u6302\u8F7D\u3002",
  "scope.label": "\u4F5C\u7528\u57DF",
  "scope.system": "\u7CFB\u7EDF\u7EA7",
  "scope.project": "\u9879\u76EE\u7EA7",
  "scope.systemHint": "\u7CFB\u7EDF\u7EA7\u914D\u7F6E\u5BF9\u6240\u6709\u4F1A\u8BDD\u751F\u6548\u3002",
  "scope.projectHint": "\u9879\u76EE\u7EA7\u914D\u7F6E\u4EC5\u5728\u6240\u9009\u9879\u76EE\u7684\u4F1A\u8BDD\u4E2D\u751F\u6548\u3002",
  "project.label": "\u9879\u76EE",
  "project.choose": "\u9009\u62E9\u5DF2\u767B\u8BB0\u7684\u9879\u76EE\u2026",
  "project.none": "\u672A\u767B\u8BB0\u5DE5\u4F5C\u533A",
  "project.placeholder": "\u8F93\u5165\u9879\u76EE\u76EE\u5F55\u7684\u7EDD\u5BF9\u8DEF\u5F84",
  "project.refresh": "\u91CD\u65B0\u8BFB\u53D6\u5DE5\u4F5C\u533A",
  "project.root": "\u9879\u76EE\u6839",
  "tabs.skills": "Skills",
  "tabs.mcp": "MCP",
  "common.loading": "\u6B63\u5728\u8BFB\u53D6\u2026",
  "common.saving": "\u4FDD\u5B58\u4E2D\u2026",
  "common.refresh": "\u5237\u65B0",
  "common.retry": "\u91CD\u8BD5",
  "common.save": "\u4FDD\u5B58",
  "common.cancel": "\u53D6\u6D88",
  "common.delete": "\u5220\u9664",
  "common.edit": "\u7F16\u8F91",
  "common.add": "\u65B0\u589E",
  "common.clearSearch": "\u6E05\u9664\u641C\u7D22",
  "common.enabled": "\u5DF2\u542F\u7528",
  "common.disabled": "\u5DF2\u505C\u7528",
  "common.enable": "\u542F\u7528",
  "common.disable": "\u505C\u7528",
  "common.path": "\u8DEF\u5F84",
  "common.issues": "\u63D0\u793A",
  "skills.add": "\u65B0\u5EFA Skills",
  "skills.searchPlaceholder": "\u641C\u7D22 Skills \u540D\u79F0\u3001\u63CF\u8FF0\u6216\u8DEF\u5F84",
  "skills.empty": "\u8BE5\u4F5C\u7528\u57DF\u8FD8\u6CA1\u6709 Skills",
  "skills.emptyHint": "\u540C\u65F6\u626B\u63CF DSH \u4E0E Shared Agents \u76EE\u5F55\u3002\u6BCF\u4E2A Skills \u90FD\u662F\u5E26 YAML frontmatter \u7684 SKILL.md\uFF1B\u4FDD\u5B58\u540E\u539F\u751F watcher \u4F1A\u81EA\u52A8\u53D1\u73B0\u5B83\u3002",
  "skills.noMatch": "\u6CA1\u6709\u5339\u914D\u7684 Skills",
  "skills.noMatchHint": "\u6362\u4E2A\u5173\u952E\u8BCD\uFF0C\u6216\u6E05\u9664\u641C\u7D22\u3002",
  "skills.modelOnly": "\u4EC5\u6A21\u578B\u53EF\u8C03\u7528",
  "skills.userOnly": "\u4EC5\u7528\u6237\u53EF\u8C03\u7528",
  "skills.hidden": "\u53CC\u9762\u7981\u7528",
  "skills.invalid": "\u914D\u7F6E\u65E0\u6548",
  "skills.readOnly": "\u53EA\u8BFB \xB7 \u7B26\u53F7\u94FE\u63A5",
  "skills.flat": "\u5355\u6587\u4EF6",
  "skills.disabledInDsh": "DSH \u5DF2\u505C\u7528",
  "skills.disableInDsh": "\u5728 DSH \u505C\u7528",
  "skills.enableInDsh": "\u5728 DSH \u542F\u7528",
  "skills.enabledSwitch": "\u5728 DSH \u4E2D\u542F\u7528",
  "skills.toggleHint": "\u4EC5\u6539\u53D8 DSH \u8FD0\u884C\u65F6\u53EF\u89C1\u6027\uFF0C\u4E0D\u4FEE\u6539\u6E90\u6587\u4EF6\uFF0C\u4E5F\u4E0D\u5F71\u54CD Claude Code \u7B49\u5176\u4ED6 Agent\u3002",
  "skills.disabledInDshMessage": "\u5DF2\u5728 DSH \u505C\u7528\uFF1A{name}",
  "skills.enabledInDshMessage": "\u5DF2\u5728 DSH \u542F\u7528\uFF1A{name}",
  "skills.newTitle": "\u65B0\u5EFA Skills",
  "skills.editTitle": "\u7F16\u8F91 Skills\uFF1A{name}",
  "skills.backToList": "\u8FD4\u56DE Skills \u5217\u8868",
  "skills.editorIntro": "\u6BCF\u4E2A Skills \u90FD\u662F\u5E26 YAML frontmatter \u7684 SKILL.md\uFF1B\u4FDD\u5B58\u540E\u4F1A\u5199\u5165\u6240\u9009\u76EE\u5F55\uFF0C\u7531\u539F\u751F watcher \u81EA\u52A8\u53D1\u73B0\u3002",
  "skills.footerHint": "\u4FDD\u5B58\u524D\u4F1A\u6821\u9A8C frontmatter \u4E0E Skills \u540D\u79F0\u3002",
  "skills.name": "Skills \u540D\u79F0",
  "skills.namePlaceholder": "my-skill\uFF08kebab-case\uFF09",
  "skills.root": "\u4FDD\u5B58\u4F4D\u7F6E",
  "skills.rootHint": "DSH \u4E0E Shared Agents \u90FD\u4F1A\u8FDB\u5165 Skills \u76EE\u5F55\uFF1B\u540C\u540D Skills \u53EF\u4EE5\u5206\u522B\u5728\u4E24\u5904\u5B58\u5728\u3002",
  "skills.content": "SKILL.md \u5185\u5BB9",
  "skills.saveHint": "\u4FDD\u5B58\u4F1A\u5148\u6821\u9A8C frontmatter\uFF1Bname \u5FC5\u987B\u4E0E Skills \u540D\u79F0\u4E00\u81F4\u3002",
  "skills.deleteConfirm": "\u5C06 Skills\u300C{name}\u300D\u79FB\u5230\u56DE\u6536\u7AD9\uFF1F\u53EF\u5728 DSH home \u7684 .skills-mcp-trash \u4E0B\u627E\u56DE\u3002",
  "skills.saved": "Skills \u5DF2\u4FDD\u5B58",
  "skills.deleted": "Skills \u5DF2\u79FB\u5230\u56DE\u6536\u7AD9\uFF1A{path}",
  "skills.template": "---\nname: {name}\ndescription: \u8BF4\u660E\u8BE5 Skills \u7684\u7528\u9014\u4E0E\u89E6\u53D1\u65F6\u673A\u3002\nwhenToUse: \u53EF\u9009\uFF1A\u63CF\u8FF0\u89E6\u53D1\u573A\u666F\u3002\n---\n\n# {name}\n\n\u5728\u8FD9\u91CC\u5199 Skills \u6B63\u6587\u3002\n",
  "skills.truncated": "\u5185\u5BB9\u8F83\u957F\uFF0C\u7F16\u8F91\u6846\u53EA\u7528\u4E8E\u67E5\u770B\u4E0E\u4FEE\u6539\uFF1B\u4FDD\u5B58\u524D\u8BF7\u786E\u8BA4\u5B8C\u6574\u3002",
  "skillRoot.dsh": "DSH",
  "skillRoot.agents": "Shared Agents",
  "mcp.add": "\u65B0\u589E MCP \u670D\u52A1\u5668",
  "mcp.searchPlaceholder": "\u641C\u7D22\u670D\u52A1\u5668\u540D\u3001\u5730\u5740\u6216\u6765\u6E90",
  "mcp.empty": "\u8BE5\u4F5C\u7528\u57DF\u8FD8\u6CA1\u6709 MCP \u670D\u52A1\u5668",
  "mcp.emptyHint": "\u652F\u6301 stdio\uFF08\u672C\u5730\u547D\u4EE4\uFF09\u548C streamable-http\uFF08\u8FDC\u7A0B URL\uFF09\u3002\u672C\u9875\u4E5F\u4F1A\u53D1\u73B0 Claude Code \u7684\u7528\u6237/\u9879\u76EE MCP\uFF0C\u5916\u90E8\u6765\u6E90\u9ED8\u8BA4\u81EA\u52A8\u5728 DSH \u542F\u7528\u3002",
  "mcp.noMatch": "\u6CA1\u6709\u5339\u914D\u7684 MCP \u670D\u52A1\u5668",
  "mcp.noMatchHint": "\u6362\u4E2A\u5173\u952E\u8BCD\uFF0C\u6216\u6E05\u9664\u641C\u7D22\u3002",
  "mcp.newTitle": "\u65B0\u589E MCP \u670D\u52A1\u5668",
  "mcp.editTitle": "\u7F16\u8F91 MCP \u670D\u52A1\u5668\uFF1A{name}",
  "mcp.backToList": "\u8FD4\u56DE MCP \u5217\u8868",
  "mcp.formIntro": "\u4FDD\u5B58\u4F1A\u5199\u5165 {file}\uFF0C\u5E76\u7ACB\u5373\u91CD\u8F7D\u6302\u8F7D\u3002",
  "mcp.sectionBasic": "\u57FA\u672C",
  "mcp.sectionConnection": "\u8FDE\u63A5",
  "mcp.sectionAdvanced": "\u9AD8\u7EA7",
  "mcp.footerHint": "\u4FDD\u5B58\u540E\u4F1A\u5C1D\u8BD5\u7ACB\u5373\u52A0\u8F7D\uFF1B\u9519\u8BEF\u4F1A\u663E\u793A\u5728\u5BF9\u5E94\u670D\u52A1\u5668\u4E0A\u3002",
  "mcp.groupManaged": "DSH \u7BA1\u7406",
  "mcp.groupExternal": "Claude Code \u53D1\u73B0",
  "mcp.groupOther": "\u5176\u4ED6 Claude \u9879\u76EE",
  "mcp.groupOtherHint": "\u8FD9\u4E9B\u670D\u52A1\u5668\u5C5E\u4E8E\u5176\u4ED6\u9879\u76EE\uFF0C\u4E0D\u4F1A\u5728\u5F53\u524D\u4F5C\u7528\u57DF\u52A0\u8F7D\uFF1B\u5BFC\u5165\u540E\u4F1A\u590D\u5236\u5230\u5F53\u524D mcp.json\u3002",
  "mcp.externalHintTitle": "\u5916\u90E8 MCP \u662F\u5982\u4F55\u52A0\u8F7D\u7684\uFF1F",
  "mcp.nameRequired": "\u670D\u52A1\u5668\u540D\u4E0D\u80FD\u4E3A\u7A7A",
  "mcp.name": "\u670D\u52A1\u5668\u540D",
  "mcp.namePlaceholder": "github\uFF08\u5B57\u6BCD\u6570\u5B57_-\uFF0C1\u201332 \u4F4D\uFF09",
  "mcp.transport": "\u4F20\u8F93\u65B9\u5F0F",
  "mcp.stdio": "stdio\uFF08\u672C\u5730\u8FDB\u7A0B\uFF09",
  "mcp.http": "Streamable HTTP",
  "mcp.httpShort": "HTTP",
  "mcp.command": "\u547D\u4EE4",
  "mcp.commandPlaceholder": "npx",
  "mcp.args": "\u53C2\u6570\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF09",
  "mcp.argsHint": "\u4F8B\u5982 npx -y @modelcontextprotocol/server-filesystem /path\uFF1B\u6BCF\u884C\u4E00\u4E2A\u53C2\u6570\u3002",
  "mcp.env": "\u73AF\u5883\u53D8\u91CF\uFF08KEY=VALUE\uFF0C\u6BCF\u884C\u4E00\u4E2A\uFF09",
  "mcp.envHint": "\u73AF\u5883\u53D8\u91CF\u4EE5\u660E\u6587\u4FDD\u5B58\u5728 mcp.json\uFF1B\u8BF7\u9650\u5236\u8BE5\u6587\u4EF6\u6743\u9650\u3002",
  "mcp.cwd": "\u5DE5\u4F5C\u76EE\u5F55\uFF08\u53EF\u9009\uFF09",
  "mcp.cwdHint": "\u7559\u7A7A\uFF1A\u7CFB\u7EDF\u7EA7\u4F7F\u7528 DSH \u8FDB\u7A0B\u76EE\u5F55\uFF0C\u9879\u76EE\u7EA7\u4F7F\u7528\u9879\u76EE\u6839\u3002",
  "mcp.url": "MCP Endpoint URL",
  "mcp.headers": "HTTP Headers\uFF08KEY=VALUE\uFF0C\u6BCF\u884C\u4E00\u4E2A\uFF09",
  "mcp.headersHint": "Header \u503C\u4F1A\u4EE5\u660E\u6587\u4FDD\u5B58\u5728 mcp.json\u3002",
  "mcp.timeout": "\u5355\u6B21\u5DE5\u5177\u8C03\u7528\u8D85\u65F6\uFF08\u6BEB\u79D2\uFF0C\u53EF\u9009\uFF09",
  "mcp.timeoutHint": "\u7559\u7A7A\u4F7F\u7528\u5BA2\u6237\u7AEF\u9ED8\u8BA4\u503C\u3002",
  "mcp.enableLabel": "\u542F\u7528\u8FD9\u4E2A\u670D\u52A1\u5668",
  "mcp.enabledSwitch": "\u5728 DSH \u4E2D\u542F\u7528",
  "mcp.enableHint": "\u505C\u7528\u53EA\u5F71\u54CD DSH \u662F\u5426\u52A0\u8F7D\uFF0C\u4E0D\u4F1A\u5220\u9664\u914D\u7F6E\u3002",
  "mcp.target": "\u76EE\u6807",
  "mcp.tools": "\u5DE5\u5177",
  "mcp.toolsCount": "{count} \u4E2A\u5DE5\u5177",
  "mcp.reload": "\u91CD\u8F7D MCP",
  "mcp.deleteConfirm": "\u5220\u9664 MCP \u670D\u52A1\u5668\u300C{name}\u300D\uFF1F\u8BE5\u64CD\u4F5C\u4F1A\u4FEE\u6539 {file}\uFF0C\u4E0D\u8FDB\u5165\u56DE\u6536\u7AD9\u3002",
  "mcp.saved": "MCP \u914D\u7F6E\u5DF2\u4FDD\u5B58",
  "mcp.deleted": "MCP \u670D\u52A1\u5668\u5DF2\u5220\u9664",
  "mcp.enabled": "MCP \u670D\u52A1\u5668\u5DF2\u542F\u7528",
  "mcp.disabled": "MCP \u670D\u52A1\u5668\u5DF2\u505C\u7528",
  "mcp.reloaded": "MCP \u5DF2\u91CD\u8F7D",
  "mcp.file": "\u914D\u7F6E\u6587\u4EF6",
  "mcp.status": "\u72B6\u6001",
  "mcp.sourceDsh": "DSH",
  "mcp.sourceClaudeCode": "Claude Code",
  "mcp.externalReadOnly": "\u6765\u6E90\u53EA\u8BFB",
  "mcp.enableExternalInDsh": "\u5728 DSH \u542F\u7528",
  "mcp.disableExternalInDsh": "\u5728 DSH \u7981\u7528",
  "mcp.externalEnabled": "\u5DF2\u5728 DSH \u542F\u7528\u5916\u90E8 MCP\uFF1A{name}",
  "mcp.externalDisabled": "\u5DF2\u5728 DSH \u505C\u7528\u5916\u90E8 MCP\uFF1A{name}",
  "mcp.externalHint": "Claude Code \u7684\u5916\u90E8 MCP \u4F1A\u81EA\u52A8\u53D1\u73B0\u5E76\u5728 DSH \u542F\u7528\uFF08\u53EF\u5355\u72EC\u505C\u7528\uFF09\uFF1B\u300C\u5BFC\u5165\u300D\u4F1A\u628A\u914D\u7F6E\u590D\u5236\u5230 mcp.json\uFF0C\u6210\u4E3A\u53EF\u7F16\u8F91/\u5220\u9664\u7684 DSH \u6761\u76EE\u3002",
  "mcp.import": "\u5BFC\u5165",
  "mcp.importConfirm": "\u628A\u300C{name}\u300D\u590D\u5236\u4E3A DSH \u7BA1\u7406\u7684 MCP \u6761\u76EE\uFF1F\u4F1A\u5C06 URL / \u547D\u4EE4\u3001headers / env\uFF08\u53EF\u80FD\u542B\u5BC6\u94A5\uFF09\u5199\u5165 {file}\u3002\u5BFC\u5165\u540E\u540C\u540D\u5916\u90E8\u6761\u76EE\u7531 DSH \u6761\u76EE\u63A5\u7BA1\uFF1B\u5220\u9664 DSH \u6761\u76EE\u540E\u5916\u90E8\u6761\u76EE\u4F1A\u6062\u590D\u3002",
  "mcp.imported": "\u5DF2\u5BFC\u5165\u4E3A DSH MCP\uFF1A{name}",
  "mcp.importable": "\u53EF\u5BFC\u5165",
  "mcp.otherProject": "\u5176\u4ED6\u9879\u76EE",
  "mcp.projectRoot": "\u6765\u6E90\u9879\u76EE",
  "mcp.activeAgents": "{count} \u4E2A\u6D3B\u52A8\u4F1A\u8BDD\u6B63\u5728\u4F7F\u7528\u9879\u76EE\u7EA7 MCP",
  "status.disabled": "\u5DF2\u505C\u7528",
  "status.starting": "\u52A0\u8F7D\u4E2D",
  "status.ready": "\u5DF2\u52A0\u8F7D",
  "status.idle": "\u5F85\u4F1A\u8BDD\u52A0\u8F7D",
  "status.error": "\u9519\u8BEF",
  "errors.noProject": "\u8BF7\u5148\u9009\u62E9\u6216\u8F93\u5165\u9879\u76EE\u76EE\u5F55\uFF0C\u518D\u7BA1\u7406\u9879\u76EE\u7EA7\u80FD\u529B\u3002",
  "errors.noProjectSkills": "\u9879\u76EE\u7EA7 Skills \u9700\u8981\u9879\u76EE\u76EE\u5F55\u3002",
  "errors.noData": "\u6682\u65F6\u6CA1\u6709\u53EF\u663E\u793A\u7684\u6570\u636E",
  "errors.loadFailed": "\u8BFB\u53D6\u7BA1\u7406\u6570\u636E\u5931\u8D25\uFF1A{message}",
  "errors.actionFailed": "\u64CD\u4F5C\u5931\u8D25\uFF1A{message}",
  "errors.noTrash": "\u5220\u9664\u6210\u529F\uFF0C\u4F46\u5BBF\u4E3B\u672A\u8FD4\u56DE\u56DE\u6536\u7AD9\u8DEF\u5F84\u3002",
  "editor.nameRequired": "Skills \u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A",
  "editor.envInvalid": "\u7B2C {line} \u884C\u4E0D\u662F KEY=VALUE\uFF1A{text}",
  "editor.timeoutInvalid": "\u8D85\u65F6\u5FC5\u987B\u662F\u6B63\u6570\uFF08\u6BEB\u79D2\uFF09",
  "editor.saveFailed": "\u4FDD\u5B58\u5931\u8D25"
};
var en = {
  nav: "Skills & MCP",
  title: "Skills & MCP",
  intro: "Manage system and project-level skills and MCP servers. Skills stay in native DSH roots; MCP mounts through dsh-mcp-client.",
  "scope.label": "Scope",
  "scope.system": "System",
  "scope.project": "Project",
  "scope.systemHint": "System configuration applies to every session.",
  "scope.projectHint": "Applies only to sessions in the selected project.",
  "project.label": "Project",
  "project.choose": "Choose a registered project\u2026",
  "project.none": "No registered workspace",
  "project.placeholder": "Absolute project directory",
  "project.refresh": "Reload workspaces",
  "project.root": "Project root",
  "tabs.skills": "Skills",
  "tabs.mcp": "MCP",
  "common.loading": "Loading\u2026",
  "common.saving": "Saving\u2026",
  "common.refresh": "Refresh",
  "common.retry": "Retry",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.add": "Add",
  "common.clearSearch": "Clear search",
  "common.enabled": "Enabled",
  "common.disabled": "Disabled",
  "common.enable": "Enable",
  "common.disable": "Disable",
  "common.path": "Path",
  "common.issues": "Notes",
  "skills.add": "New skill",
  "skills.searchPlaceholder": "Search name, description, or path",
  "skills.empty": "No skills in this scope",
  "skills.emptyHint": "Discovers both DSH and Shared Agents roots. A skill is a SKILL.md with YAML frontmatter; native watchers pick it up after saving.",
  "skills.noMatch": "No matching skills",
  "skills.noMatchHint": "Try another keyword or clear the search.",
  "skills.modelOnly": "Model-only",
  "skills.userOnly": "User-only",
  "skills.hidden": "Both surfaces disabled",
  "skills.invalid": "Invalid",
  "skills.readOnly": "Read-only \xB7 symlink",
  "skills.flat": "Single file",
  "skills.disabledInDsh": "Disabled in DSH",
  "skills.disableInDsh": "Disable in DSH",
  "skills.enableInDsh": "Enable in DSH",
  "skills.enabledSwitch": "Enabled in DSH",
  "skills.toggleHint": "Changes DSH runtime visibility only. Source files and other agents such as Claude Code are untouched.",
  "skills.disabledInDshMessage": "Disabled in DSH: {name}",
  "skills.enabledInDshMessage": "Enabled in DSH: {name}",
  "skills.newTitle": "New skill",
  "skills.editTitle": "Edit skill: {name}",
  "skills.backToList": "Back to skills",
  "skills.editorIntro": "A skill is a SKILL.md file with YAML frontmatter. Saving writes it to the selected root; native watchers discover it automatically.",
  "skills.footerHint": "Frontmatter and the skill name are validated before saving.",
  "skills.name": "Skill name",
  "skills.namePlaceholder": "my-skill (kebab-case)",
  "skills.root": "Save location",
  "skills.rootHint": "DSH and Shared Agents both feed the skill catalog; the same name may exist in each root.",
  "skills.content": "SKILL.md content",
  "skills.saveHint": "Saving validates frontmatter; name must equal the skill name.",
  "skills.deleteConfirm": 'Move skill "{name}" to trash? It can be recovered under .skills-mcp-trash in DSH home.',
  "skills.saved": "Skill saved",
  "skills.deleted": "Skill moved to trash: {path}",
  "skills.template": "---\nname: {name}\ndescription: Describe what this skill does and when to use it.\nwhenToUse: Optional trigger guidance.\n---\n\n# {name}\n\nWrite the skill instructions here.\n",
  "skills.truncated": "The content is large; the editor holds the full file. Review before saving.",
  "skillRoot.dsh": "DSH",
  "skillRoot.agents": "Shared Agents",
  "mcp.add": "Add MCP server",
  "mcp.searchPlaceholder": "Search name, target, or origin",
  "mcp.empty": "No MCP servers in this scope",
  "mcp.emptyHint": "Supports stdio (local command) and streamable-http (remote URL). Claude Code user/project MCP servers are discovered too and are enabled in DSH automatically.",
  "mcp.noMatch": "No matching MCP servers",
  "mcp.noMatchHint": "Try another keyword or clear the search.",
  "mcp.newTitle": "New MCP server",
  "mcp.editTitle": "Edit MCP server: {name}",
  "mcp.backToList": "Back to MCP",
  "mcp.formIntro": "Saving writes {file} and reloads mounts immediately.",
  "mcp.sectionBasic": "Basics",
  "mcp.sectionConnection": "Connection",
  "mcp.sectionAdvanced": "Advanced",
  "mcp.footerHint": "After saving, the plugin immediately attempts to load the server; errors appear on the row.",
  "mcp.groupManaged": "DSH-managed",
  "mcp.groupExternal": "Discovered in Claude Code",
  "mcp.groupOther": "Other Claude projects",
  "mcp.groupOtherHint": "These servers belong to other projects and are not loaded in this scope. Import copies them into the current mcp.json.",
  "mcp.externalHintTitle": "How are external MCP servers loaded?",
  "mcp.nameRequired": "Server name is required",
  "mcp.name": "Server name",
  "mcp.namePlaceholder": "github (letters, digits, _, -, 1\u201332)",
  "mcp.transport": "Transport",
  "mcp.stdio": "stdio (local process)",
  "mcp.http": "Streamable HTTP",
  "mcp.httpShort": "HTTP",
  "mcp.command": "Command",
  "mcp.commandPlaceholder": "npx",
  "mcp.args": "Arguments (one per line)",
  "mcp.argsHint": "Example: npx -y @modelcontextprotocol/server-filesystem /path; one argument per line.",
  "mcp.env": "Environment (KEY=VALUE, one per line)",
  "mcp.envHint": "Values are stored in plain text in mcp.json; keep that file private.",
  "mcp.cwd": "Working directory (optional)",
  "mcp.cwdHint": "Empty: system scope uses the DSH process directory, project scope uses the project root.",
  "mcp.url": "MCP Endpoint URL",
  "mcp.headers": "HTTP headers (KEY=VALUE, one per line)",
  "mcp.headersHint": "Header values are stored in plain text in mcp.json.",
  "mcp.timeout": "Tool call timeout (ms, optional)",
  "mcp.timeoutHint": "Leave empty to use the client default.",
  "mcp.enableLabel": "Enable this server",
  "mcp.enabledSwitch": "Enabled in DSH",
  "mcp.enableHint": "Disabling affects the DSH runtime only and never deletes the configuration.",
  "mcp.target": "Target",
  "mcp.tools": "Tools",
  "mcp.toolsCount": "{count} tools",
  "mcp.reload": "Reload MCP",
  "mcp.deleteConfirm": 'Delete MCP server "{name}"? This edits {file} and does not use trash.',
  "mcp.saved": "MCP configuration saved",
  "mcp.deleted": "MCP server deleted",
  "mcp.enabled": "MCP server enabled",
  "mcp.disabled": "MCP server disabled",
  "mcp.reloaded": "MCP reloaded",
  "mcp.file": "Config file",
  "mcp.status": "Status",
  "mcp.sourceDsh": "DSH",
  "mcp.sourceClaudeCode": "Claude Code",
  "mcp.externalReadOnly": "Source is read-only",
  "mcp.enableExternalInDsh": "Enable in DSH",
  "mcp.disableExternalInDsh": "Disable in DSH",
  "mcp.externalEnabled": "External MCP enabled in DSH: {name}",
  "mcp.externalDisabled": "External MCP disabled in DSH: {name}",
  "mcp.externalHint": 'Claude Code MCP servers are discovered and enabled in DSH automatically (disable individually here). "Import" copies the config into mcp.json so it becomes a DSH-managed, editable entry.',
  "mcp.import": "Import",
  "mcp.importConfirm": 'Import "{name}" as a DSH-managed MCP server? Its URL/command and headers/env (which may contain secrets) will be written to {file}. The DSH entry takes over the same-named external entry; deleting it restores the external entry.',
  "mcp.imported": "Imported into DSH MCP: {name}",
  "mcp.importable": "Importable",
  "mcp.otherProject": "Other project",
  "mcp.projectRoot": "Source project",
  "mcp.activeAgents": "Project MCP is active in {count} live session(s)",
  "status.disabled": "Disabled",
  "status.starting": "Loading",
  "status.ready": "Loaded",
  "status.idle": "Loads with a session",
  "status.error": "Error",
  "errors.noProject": "Choose or enter a project directory before managing project capabilities.",
  "errors.noProjectSkills": "Project skills need a project directory.",
  "errors.noData": "Nothing to show yet",
  "errors.loadFailed": "Could not load management data: {message}",
  "errors.actionFailed": "Action failed: {message}",
  "errors.noTrash": "Deleted, but the host did not return a trash location.",
  "editor.nameRequired": "Skill name is required",
  "editor.envInvalid": "Line {line} is not KEY=VALUE: {text}",
  "editor.timeoutInvalid": "Timeout must be a positive number of milliseconds",
  "editor.saveFailed": "Save failed"
};

// src/client/index.ts
var inject = ["slots", "locale"];
var NS = "dsh-skills-mcp";
var SECTION_ID = "dsh-skills-mcp";
var SECTION_ORDER = 22;
function apply(ctx) {
  injectStyles();
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-skills-mcp: dictionaries");
  const t = ctx.locale.bind(NS);
  const getWorkspaces = () => {
    try {
      return ctx.get("workspaces");
    } catch {
      return void 0;
    }
  };
  const listProjects = () => {
    try {
      const items = getWorkspaces()?.list.getSnapshot().items ?? [];
      return items.map((item) => ({ title: item.title, path: item.path }));
    } catch {
      return [];
    }
  };
  const subscribeProjects = (listener) => {
    try {
      return getWorkspaces()?.list.subscribe(listener) ?? (() => {
      });
    } catch {
      return () => {
      };
    }
  };
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: SECTION_ID,
    order: SECTION_ORDER,
    label: () => t("nav"),
    locale: NS,
    inject: () => ({ listProjects, subscribeProjects })
  }, SkillsMcpSection));
}
    return module.exports;
  }
});
//# sourceMappingURL=client.js.map
