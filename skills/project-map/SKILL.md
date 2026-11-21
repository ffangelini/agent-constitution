---
name: project-map
description: Build a navigation-only repo-root AGENTS.md for a new project — detect the stack from manifests, list 3-6 entry points, main directories, and the test command/location.
---

# project-map

Triggered at the start of work in a new project, or on request. Navigation only: no behavioral rules.

1. Detect the stack from manifests (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, etc.).
2. List 3–6 entry points (main files, servers, CLIs, app roots).
3. List the main directories.
4. Find the test command and test location.
5. Write the repo-root `AGENTS.md` containing only a `## Navigation` section with those facts.
6. If `AGENTS.md` already exists, append the `## Navigation` section; add no rules. Report any existing local rules to the user for manual removal.
