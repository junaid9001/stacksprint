# New Chat Bootstrap Prompt (Copy/Paste)

Use this at the start of every new chat before asking for a feature:

```text
Read only these files first for context:
- docs/ai/00-project-map.md
- docs/ai/01-architecture.md
- docs/ai/02-dev-commands.md
- docs/ai/03-invariants-and-risks.md
- docs/ai/04-open-issues.md
- docs/ai/HANDOFF.md
- docs/ai/TASKS.md

Rules:
1) Do not scan the full repo.
2) Do not re-analyze unrelated files.
3) After reading the docs above, read only files directly needed for my request.
4) Keep bootstrap minimal and start implementation quickly.
5) Preserve unrelated dirty files.

Now my task is:
[PASTE TASK HERE]
```

## After Feature Is Done
Use this follow-up prompt:

```text
Update only these files:
- docs/ai/HANDOFF.md
- docs/ai/04-open-issues.md
- docs/ai/TASKS.md

Rules:
1) Add only items directly caused by work done in this turn.
2) If an item already exists, update it in place instead of adding a new bullet.
3) Remove or move items that are now completed:
   - move completed unresolved items from `04-open-issues.md` into `HANDOFF.md` only if resolved in this turn
   - mark completed tasks in `TASKS.md` instead of duplicating them
4) Do not add generic/process-wide suggestions unless I explicitly ask.
5) Keep entries short, factual, and non-duplicated.
```

## Recommended Stable Structure
- `docs/ai/TASKS.md`: keep two sections only: `Current` and `Done (latest first)`.
- `docs/ai/04-open-issues.md`: unresolved items only, one bullet per topic.
