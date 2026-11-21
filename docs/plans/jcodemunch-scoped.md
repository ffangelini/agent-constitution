# Add jcodemunch with per-agent MCP permissions

Source of truth: https://github.com/ffangelini/agent-constitution/issues/4
Repo: `ffangelini/agent-constitution`.

## Decisions

- Local personal projects: jcodemunch free license is sufficient. No purchase.
- MCP server is global; access is gated by permissions.
- Allowed agents: coordinator, worker, worker-fast, planner-hard.
- Denied agents: reader, watchdog.
- No `jcodemunch-mcp init`: it would write project files and hooks. No `--policy` or `--guidance`.
- No pxpipe. No edits to project `AGENTS.md`.

## Changes

### 1. Baseline (before install)

Record one code-lookup task using current grep/read, e.g. "find `main()` and read its body" in a local project. Save rough tool-output size as `bytes` (proxy for tokens). Compare after install.

### 2. Global `~/.config/opencode/opencode.json`

- Add server under `mcp.servers`:

```jsonc
"jcodemunch": {
  "type": "local",
  "command": ["uvx", "jcodemunch-mcp==1.108.476"]
}
```

- Add global deny permission as the last rule in `permissions`:

```jsonc
{ "action": "jcodemunch_*", "resource": "*", "effect": "deny" }
```

- Preserve every existing key: `instructions`, 8 existing permissions, firecrawl MCP, providers, compaction, experimental, tool_output.

### 3. Per-agent allow rules in repo `agents/*.md`

Append to the `permissions:` list in coordinator.md, worker.md, worker-fast.md, planner-hard.md:

```yaml
  - action: jcodemunch_*
    resource: "*"
    effect: allow
```

Global rules apply first; agent-specific rules later, so allow wins for these four. Reader/watchdog get no allow.

### 4. `RULES.md`

Add one line under `## Navigation`:

```md
For code lookups, call `jcodemunch_guide` and use symbol tools; keep markdown and docs on plain read/grep.
```

### 5. `README.md`

Document fresh-laptop setup: MCP server entry, global deny, per-agent allow, and that `uvx` needs `uv` on PATH. No license key needed for local non-commercial use.

## Acceptance

- `opencode mcp list` shows jcodemunch connected.
- Allowed agents can see/call `jcodemunch_*`; reader/watchdog cannot.
- Denied agents do not receive jcodemunch server instructions.
- Fresh headless session with worker-fast performs a symbol lookup successfully.
- Global config remains valid; existing permissions unchanged except added deny.
- No project files or hooks written by install.
- Baseline vs post-install output size recorded.

## Out of scope

- pxpipe.
- Gemini-specific image context.
- Project `AGENTS.md` edits.
- Buying a license.
