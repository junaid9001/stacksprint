# Agent Working Rules (Repo-Local)

## Context Bootstrap Policy
- On a fresh chat, read only:
  - `docs/ai/00-project-map.md`
  - `docs/ai/01-architecture.md`
  - `docs/ai/02-dev-commands.md`
  - `docs/ai/03-invariants-and-risks.md`
  - `docs/ai/04-open-issues.md`
  - `docs/ai/HANDOFF.md`
  - `docs/ai/TASKS.md`
- Do not do full-repo analysis unless explicitly asked.
- After bootstrap docs, open only files directly needed for the task.

## Working Style
- Prefer minimal context usage and fast execution.
- Preserve unrelated dirty files.
- Validate changes with relevant tests/checks.

## Handoff Discipline
- When user asks, update:
  - `docs/ai/HANDOFF.md`
  - `docs/ai/04-open-issues.md`
  - `docs/ai/TASKS.md`
