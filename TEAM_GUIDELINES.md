# Team Guidelines

## Working Agreements
- Communication: Prefer short, async updates in issue threads; escalate blockers in <channel>.
- Decisions: Record key decisions in issues/PRs with rationale and links.
- Timeboxes: Default 2‑day timebox on investigations unless extended explicitly.

## Branching & PRs
- Branches: `type/short-topic` (types: feat, fix, chore, docs, refactor, test).
- PR Size: Aim < 300 LOC diff; split otherwise. Include screenshots for UI.
- Reviews: 1 reviewer minimum; use checklist in `QA_CHECKLIST.md` before request.
- Commits: Conventional commits. Example: `feat(feed): add optimistic like`.

## Testing & Quality
- Unit: Co‑locate tests; run locally before PR.
- E2E: Run smoke scripts in `test-*.sh` when touching affected areas.
- Definition of Done: tests pass, docs updated, feature flagged as needed.

## Environments & Secrets
- Env files: Use `.env.local` only for local; never commit secrets.
- Keys: `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `OPENAI_API_KEY` kept separate; avoid generic `API_KEY` to prevent tool confusion.

## AI Tooling Usage
- Codex CLI (this assistant): Use for code edits, scaffolding, and repo‑aware tasks.
- Claude Code: Prefer for in‑editor refactors and MCP‑enabled workflows.
- Gemini CLI: Use for browser automation/tests per `GEMINI_CLI_*` guides.
- Logging: Note AI‑assisted changes in PR description when material.

## MCP Conventions
- Server naming: `mcp-<tool>-<purpose>` (e.g., `mcp-gemini-browser`).
- Ports: Reserve unique ports per server to avoid conflicts (e.g., 7311+).
- Config: Keep client/server config snippets in `MCP_SETUP.md` and link from PRs.

## Issue Hygiene
- Labels: `type/*`, `area/*`, `priority/*`.
- Templates: Use PRD template (`doc/PRD_TEMPLATE.md`) for feature epics.

