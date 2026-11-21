# Portable dependency manifest

Source of truth: https://github.com/ffangelini/agent-constitution/issues/2
Repo: `ffangelini/agent-constitution`.

## Problem

Two absolute paths break a fresh-laptop setup:

1. `opencode.json` plugins entry now points at `/home/fed/ponytail/.opencode/plugins` (fixed from the `.mjs` file, but still machine-specific).
2. `plugins/coordinator-ponytail-caveman/index.js` calls `require('/home/fed/ponytail/hooks/ponytail-instructions')` directly.

A clone alone cannot restore the plugin or its per-agent instruction injection.

## Decision

Use npm `package.json` + `package-lock.json` as the requirements equivalent. Pin `@dietrichgebert/ponytail` at `5.3.3` (published on npm; local repo matches). Vercel plugin stays declared in `opencode.json` — OpenCode resolves that itself. No new dependencies.

## Changes

### 1. `package.json` + `package-lock.json` (new, repo root)

- `name`: `agent-constitution`, `private`: true.
- `dependencies`: `"@dietrichgebert/ponytail": "5.3.3"` (exact pin).
- Generate lockfile via `npm install`.
- Add `.gitignore` with `node_modules/`.

### 2. `plugins/coordinator-ponytail-caveman/index.js`

- Remove absolute `/home/fed/ponytail/...` require.
- Resolve the installed package from this repo:
  - `require.resolve('@dietrichgebert/ponytail')` → package entry `.opencode/plugins/ponytail.mjs`
  - go up one level to package root, then `hooks/ponytail-instructions`
  - keep `getPonytailInstructions(mode)` and all fallback behavior.
- Keep `ponyModeFor` map and caveman-free behavior unchanged.

### 3. Local machine config

- Change `opencode.json` plugins[0] to `~/agent-constitution/node_modules/@dietrichgebert/ponytail/.opencode/plugins`.
- Keep `instructions`, 8 permissions, MCP and provider settings intact.

### 4. `README.md`

- Setup order: clone → `npm install` → `instructions` entry → plugin path → symlinks.
- Note the plugin path is inside the repo's `node_modules`, so no machine-specific ponytail checkout is needed.

## Acceptance

- `npm ci` from a clean clone installs ponytail 5.3.3.
- No `/home/fed/ponytail` string remains in tracked repo files.
- Fresh headless session loads ponytail plugin (skills available), no `configured plugin path must be a directory` warning.
- Per-agent modes still work: coordinator full, planner-hard lite, workers ultra, reader/watchdog off.
- Local `opencode.json` validates; permissions count still 8.
- No jcodemunch or pxpipe install.

## Out of scope

- Merging issue #1 branch into main (separate decision).
- Activating symlinks locally.
- jcodemunch / pxpipe.
