# StackSprint Architecture

## End-to-End Flow
1. Frontend builds config payload from wizard state (`frontend/app/page.tsx`).
2. Frontend calls `POST /generate`.
3. Backend pipeline (`Engine.Generate`) runs:
   - normalize
   - rule engine (safe autocorrections + warnings)
   - strict validation
   - core generation (templates + scaffolds)
   - custom add/remove mutations
   - script + file tree + decision assembly

## Backend Design
- Stateless API; no app DB required for StackSprint itself.
- Template-driven architecture-specific generation.
- Deterministic warnings and decisions for explainability.
- File toggles and feature flags influence generated output.

## Frontend Design
- Single-page wizard in `frontend/app/page.tsx`.
- Live preview with debounce.
- Presets stored in browser localStorage.
- Output tabs: scripts, decisions, files.

## Key Data Contract
`GenerateRequest` includes:
- `language`, `framework`, `architecture`
- `services` for microservices
- `db`, `use_orm`
- `infra`, `features`, `file_toggles`
- `custom` modifications
- `root` options
- `service_communication`

## Recent Stability Fixes (already implemented)
- Microservices compose now respects env toggle.
- MySQL migration syntax now DB-correct.
- NATS infra now includes app boilerplate stubs.
- Added backend regressions for these cases.
- Frontend root `git_init` is explicit (not always forced true).
