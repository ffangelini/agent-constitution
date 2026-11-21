# Fix plugin module resolution through symlink

Source of truth: https://github.com/ffangelini/agent-constitution/issues/3
Repo: `ffangelini/agent-constitution`.

## Problem

Background server loads the custom plugin through a symlink:
`/home/fed/.config/opencode/plugins/coordinator-ponytail-caveman/index.js`
→ `/home/fed/agent-constitution/plugins/coordinator-ponytail-caveman/index.js`.

The plugin uses top-level `require.resolve('@dietrichgebert/ponytail')`. Node resolves from the symlink path, finds `/home/fed/.config/opencode/node_modules` (no ponytail), and throws `MODULE_NOT_FOUND`. Fresh standalone sessions with cwd in the repo worked, which masked it.

Observed failure: `failed to load plugin ... Cannot find module '@dietrichgebert/ponytail'`, refs `err_0a602a8e`, `err_42c6a6ed`, etc.

## Fix

In `plugins/coordinator-ponytail-caveman/index.js`:

1. Replace top-level `require.resolve` with realpath-based resolution:
   - `import { fileURLToPath } from 'node:url'`
   - `const pluginFile = fs.realpathSync(fileURLToPath(import.meta.url))`
   - `const repoRoot = path.resolve(path.dirname(pluginFile), '../..')`
   - dependency root = `path.join(repoRoot, 'node_modules', '@dietrichgebert', 'ponytail')`
2. Move resolution inside `loadPonytail`'s try/catch so a missing dependency degrades to `null` instead of failing plugin load.
3. Keep `ponyModeFor`, `agentOf`, hooks, and caveman-free behavior unchanged.

## Acceptance

- `require.resolve` is not called at module top level.
- Simulated resolution from the symlink directory succeeds via realpath.
- Fresh headless session and background server: no `failed to load plugin` entries after fix.
- Ponytail per-agent injection still works: coordinator full, planner lite, workers ultra, reader/watchdog off.
- No absolute `/home/fed` paths in tracked files.

## Out of scope

- Changing symlink layout.
- Changing global config paths.
- jcodemunch / pxpipe.
