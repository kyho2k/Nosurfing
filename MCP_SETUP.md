# MCP Setup (Claude / Gemini)

This document centralizes Model Context Protocol (MCP) usage with Claude Code and Gemini CLI. See also: `GEMINI_CLI_BROWSER_MCP_GUIDE.md`.

## What is MCP?
MCP standardizes tool/server capabilities that AI clients can call (files, web, browser, db, etc.). Each client (e.g., Claude Desktop/Code, custom CLIs) can register local or remote MCP servers.

## Recommended Layout
- Server names: `mcp-<client>-<purpose>` (e.g., `mcp-gemini-browser`).
- Unique ports: Avoid collisions by assigning non‑overlapping ports per server.
- Keep config snippets in repo; place actual client configs in user config dirs.

## Claude (Desktop/Code) — Server Config
Claude stores MCP server definitions under your user config (varies by OS). Create one JSON file per server with a structure like below:

```json
{
  "name": "mcp-gemini-browser",
  "command": "/usr/local/bin/node",
  "args": ["/path/to/your/server.js"],
  "env": {
    "GOOGLE_API_KEY": "${GOOGLE_API_KEY}"
  },
  "transport": {
    "type": "stdio"
  }
}
```

Notes:
- Use `stdio` for local Node/Python servers; use `http(s)` only if necessary.
- Do not hardcode secrets; reference env vars.
- Give each server a distinct `name`.

## Gemini CLI — Browser MCP
Refer to `GEMINI_CLI_BROWSER_MCP_GUIDE.md` for the end‑to‑end setup. Key points:
- Use a dedicated port (e.g., 7311) that no other MCP server uses.
- Keep `GOOGLE_API_KEY` scoped to this tool.
- Document sample commands in the guide for repeatability.

## Conflict Avoidance Checklist
- Ports: Assign a unique port per MCP server and document it.
- Names: Use unique `name` per server; avoid generic names like `browser`.
- Env: Separate keys by provider (`ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`).
- Launch order: Prefer on‑demand startup to reduce long‑running background processes.

## Troubleshooting
- If a client can’t discover a server: verify path/permissions and transport.
- If calls hang: check for port conflicts or missing API keys.
- If tools overlap: disable one server at a time to isolate.

