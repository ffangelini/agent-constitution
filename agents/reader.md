---
description: Trivial reader for reading, searching, and summarizing (lowest cost)
mode: subagent
model: opencode-go/longcat-2.5-free
steps: 5
permissions:
  - action: edit
    resource: "*"
    effect: deny
  - action: shell
    resource: "*"
    effect: deny
  - action: websearch
    resource: "*"
    effect: deny
  - action: webfetch
    resource: "*"
    effect: deny
  - action: skill
    resource: "*"
    effect: deny
  - action: "firecrawl_*"
    resource: "*"
    effect: deny
  - action: opencode_list_mcp_resources
    resource: "*"
    effect: deny
  - action: opencode_read_mcp_resource
    resource: "*"
    effect: deny
  - action: jcodemunch_*
    resource: "*"
    effect: deny
---

Ponytail stays off for this agent — do not run `/ponytail` (it flips global state for parallel sessions).

You read and summarize. Do not edit files. Use the lowest effort needed.