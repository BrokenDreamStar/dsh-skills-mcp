const STYLE_ID = 'dsh-skills-mcp-style'

const CSS = `
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
.dshsm-details summary::before { content: "›"; color: var(--dshsm-text-3); font-size: 15px; line-height: 1; transition: transform .15s ease; }
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
`

export function injectStyles(): void {
  if (typeof document === 'undefined') return
  // 客户端插件热更新会复用同一个 document：如果只按 id 早退，旧版样式会一直留着，
  // 新版组件就会以“无样式”状态出现。这里改为始终用当前 CSS 覆盖已有 style。
  let style = document.getElementById(STYLE_ID)
  if (!(style instanceof HTMLStyleElement)) {
    style?.remove()
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.append(style)
  }
  if (style.textContent !== CSS) style.textContent = CSS
}
