# agent-constitution

Versioned global rules, agent definitions, commands and the navigation skill for OpenCode.

## Setup

1. Clone to `~/agent-constitution`:

   ```sh
   git clone https://github.com/ffangelini/agent-constitution ~/agent-constitution
   ```

2. Load the global rules in `~/.config/opencode/opencode.json`, preserving every existing key:

   ```json
   "instructions": ["~/agent-constitution/RULES.md"]
   ```

3. Symlink into the global config locations:

   ```sh
   ln -sfn ~/agent-constitution/agents ~/.config/opencode/agents
   ln -sfn ~/agent-constitution/commands ~/.config/opencode/commands
   ln -sfn ~/agent-constitution/plugins/coordinator-ponytail-caveman ~/.config/opencode/plugins/coordinator-ponytail-caveman
   ln -sfn ~/agent-constitution/skills/project-map ~/.agents/skills/project-map
   ```

## Local AGENTS.md

`~/.config/opencode/AGENTS.md` is machine policy only (browser/desktop guard scope). Never put behavioral rules there — behavioral rules live in `RULES.md`, navigation lives in a repo-root `AGENTS.md`.

## Layout

- `RULES.md` — response contract and navigation rule (loaded globally).
- `agents/` — coordinator, worker, worker-fast, planner-hard, reader, watchdog.
- `commands/` — slash commands (ponytail, caveman opt-in).
- `plugins/coordinator-ponytail-caveman/` — per-agent ponytail mode injection.
- `skills/project-map/` — builds a navigation-only root `AGENTS.md` for a new project.
