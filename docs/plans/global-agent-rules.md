# Global agent rules — implementation plan

Repo: `ffangelini/agent-constitution`. Source of truth: https://github.com/ffangelini/agent-constitution/issues/1
Goal: one versioned, portable place for how agents talk and how they navigate code.

## Decisions locked

- Global rules only. Do not edit any project `AGENTS.md`. The 7 files found earlier are out of scope.
- Caveman dropped: no auto-injection, no first-reply marker. Slash commands stay available as opt-in.
- Ponytail stays: coordinator `full`, planner-hard `lite`, workers `ultra`, reader/watchdog off.
- Rules load via global `opencode.json`: `"instructions": ["~/agent-constitution/RULES.md"]`.
- Local `~/.config/opencode/AGENTS.md` stays machine policy only (browser guard). No behavioral rules there.
- Public repo, no GitHub Pages.

## Changes

### 1. `RULES.md` (new, repo root)

```md
## Response contract

Questions: verdict first (yes/no), then one reason. Details only when asked.
Actions: one-line list before work; ponytail scope analysis still applies.
Status: first line Done / Blocked: reason / Partial: what. No recap. Relay = status + issue link.
Ponytail skipped/risk footer stays last.

## Navigation

Start every codebase task from the repo-root AGENTS.md; it holds only entry points, main dirs and test locations. If absent, run the project-map skill. Never put behavioral rules there — global rules here win.
```

### 2. `skills/project-map/SKILL.md` (new)

- Triggered at new-project start or on request.
- Detect stack from manifests; list 3–6 entry points, main dirs, test command/location.
- Write root `AGENTS.md` containing only `## Navigation`.
- If file exists: append `## Navigation`, add no rules, report existing local rules for manual removal.
- Mirror into `~/.agents/skills/project-map` (global skills dir).

### 3. `plugins/coordinator-ponytail-caveman/index.js`

- Remove `loadCaveman` and the caveman injection / first-reply marker.
- Keep `ponyModeFor` mapping and `context` + `compaction` hooks.
- Rename internal log/service strings only if trivial; no behavior change beyond caveman removal.

### 4. `agents/*.md`

- Move the six existing definitions into repo `agents/`: coordinator, worker, worker-fast, planner-hard, reader, watchdog.
- worker/worker-fast: first line of GH issue comment = `Done` / `Blocked` / `Partial`.
- coordinator: relay worker result as status line + issue link only, no summary of summary.
- No other rule text added.

### 5. `README.md`

- Clone to `~/agent-constitution`.
- Add `instructions` entry to `~/.config/opencode/opencode.json`.
- Symlink `agents/`, `commands/`, `plugins/coordinator-ponytail-caveman/`, `skills/project-map/`.
- Note: local `AGENTS.md` is machine-only; never add behavioral rules to it.

### 6. Local machine config

- Add `"instructions": ["~/agent-constitution/RULES.md"]` to global `~/.config/opencode/opencode.json` and document it in README.

## Out of scope / deferred

- jcodemunch MCP install (license decision first: free non-commercial only).
- pxpipe Gemini trial (baseline tokens + latency first).
- Any existing project `AGENTS.md` edits.

## Acceptance

- `RULES.md` contains the response contract and navigation rule.
- Plugin contains no caveman injection or marker strings.
- Skill file exists and is navigation-only.
- README has clone + symlink + instructions setup.
- Six agent files present, worker status contract applied.
- No files changed outside this repo except global `opencode.json` instructions entry.
