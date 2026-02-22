# StackSprint Project Map

## Purpose
StackSprint generates starter backend project code (Go/Node/Python) and returns:
- `bash_script`
- `powershell_script`
- `file_paths`
- `warnings`
- `decisions`

## Repo Layout
- `backend/` Go Fiber API for generation
- `frontend/` Next.js App Router UI
- `templates/` language + architecture templates consumed by backend
- `docs/ai/` AI context + handoff docs (this folder)

## Runtime Entry Points
- Backend server: `backend/cmd/server/main.go`
- API handlers: `backend/internal/api/handler.go`
- Generator engine: `backend/internal/generator/engine.go`
- Frontend main page: `frontend/app/page.tsx`
- Frontend styles: `frontend/app/globals.css`

## Main API
- `GET /health`
- `POST /generate`
  - request type: `GenerateRequest` in `backend/internal/generator/types.go`
  - response type: `GenerateResponse` in `backend/internal/generator/types.go`

## Core Backend Modules
- Validation: `backend/internal/generator/validator.go`
- Rule corrections: `backend/internal/generator/rule_engine.go`
- Generation pipeline: `backend/internal/generator/engine.go`
- Script assembly: `backend/internal/generator/scripts.go`
- Decision output: `backend/internal/generator/explain.go`
- Scaffolds: `backend/internal/generator/scaffolds.go`
- Infra stubs: `backend/internal/generator/integration_scaffolds.go`
- Language architecture generators:
  - `go_architecture.go`
  - `node_architecture.go`
  - `python_architecture.go`

## Tests
- Rule tests: `backend/internal/generator/rule_engine_test.go`
- Decision tests: `backend/internal/generator/explain_test.go`
- Golden snapshots + smoke tests: `backend/internal/generator/golden_test.go`
- Regression tests: `backend/internal/generator/engine_regression_test.go`

## Important Current Working-Tree Note
Repo may contain unrelated local changes. Never reset/revert unrelated dirty files unless explicitly asked.
