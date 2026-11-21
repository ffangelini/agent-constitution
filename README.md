# agent-constitution

Versioned global rules, agent definitions, commands and the navigation skill for OpenCode.

## Setup

1. Clone to `~/agent-constitution`:

   ```sh
   git clone https://github.com/ffangelini/agent-constitution ~/agent-constitution
   ```

2. Install dependencies (the ponytail plugin):

   ```sh
   cd ~/agent-constitution && npm install
   ```

3. Load the global rules in `~/.config/opencode/opencode.json`, preserving every existing key:

   ```json
   "instructions": ["~/agent-constitution/RULES.md"]
   ```

   And point the plugins entry at the copy inside this repo, so no separate
   ponytail checkout is needed on the machine:

   ```json
   "plugins": [
     "{env:HOME}/agent-constitution/node_modules/@dietrichgebert/ponytail/.opencode/plugins",
     "github:vercel/vercel-plugin"
   ]
   ```

   OpenCode expands `{env:HOME}` in plugin paths; `~` does not work there.

4. Symlink into the global config locations:

   ```sh
   ln -sfn ~/agent-constitution/agents ~/.config/opencode/agents
   ln -sfn ~/agent-constitution/commands ~/.config/opencode/commands
   ln -sfn ~/agent-constitution/plugins/coordinator-ponytail-caveman ~/.config/opencode/plugins/coordinator-ponytail-caveman
   ln -sfn ~/agent-constitution/skills/project-map ~/.agents/skills/project-map
   ```

5. Set up the jcodemunch MCP server for symbol-aware code lookups. Add the server
   under `mcp.servers` in `~/.config/opencode/opencode.json` (leave the existing
   firecrawl server untouched):

   ```json
   "mcp": {
     "servers": {
       "jcodemunch": {
         "type": "local",
         "command": ["uvx", "jcodemunch-mcp==1.108.476"]
       }
     }
   }
   ```

   `uvx` comes from [`uv`](https://docs.astral.sh/uv/), so `uv` must be installed
   and on your `PATH`. For local, non-commercial use the free license is enough —
   no license key to buy or configure.

   The server is global and all agents get its tools by default. Deny them only
   for the agents that should not have them: append the following to the
   `permissions:` list in `agents/reader.md` and `agents/watchdog.md`:

   ```yaml
     - action: jcodemunch_*
       resource: "*"
       effect: deny
   ```

   All other agents (coordinator, worker, worker-fast, planner-hard) keep access.
   Do not add a global `jcodemunch_*` deny to `opencode.json` — a global deny
   hides the tools from *every* agent, even ones with a per-agent allow rule.

   Do not run `jcodemunch-mcp init` — it would write project files and hooks. No
   `--policy` or `--guidance` flags either. Verify with `opencode mcp list`.

## Local AGENTS.md

`~/.config/opencode/AGENTS.md` is machine policy only (browser/desktop guard scope). Never put behavioral rules there — behavioral rules live in `RULES.md`, navigation lives in a repo-root `AGENTS.md`.

## Layout

- `RULES.md` — response contract and navigation rule (loaded globally).
- `agents/` — coordinator, worker, worker-fast, planner-hard, reader, watchdog.
- `commands/` — slash commands (ponytail, caveman opt-in).
- `plugins/coordinator-ponytail-caveman/` — per-agent ponytail mode injection.
- `skills/project-map/` — builds a navigation-only root `AGENTS.md` for a new project.
