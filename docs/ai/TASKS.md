# Active Tasks

## Current
- None.

## Done (latest first)
- Title: Finalize V4 Autopilot snapshot/test state
- Outcome: Updated generator golden snapshots and verified `go test ./internal/generator/...` passes.
- Files changed:
  - `backend/internal/generator/testdata/golden/go_clean_postgres_orm_grpc.json`
  - `backend/internal/generator/testdata/golden/node_hexagonal_mysql_noorm_no_crud.json`
  - `backend/internal/generator/testdata/golden/python_django_mysql.json`
  - `backend/internal/generator/testdata/golden/python_microservices_fastapi_mongodb.json`

- Title: Autopilot regression coverage
- Outcome: Added focused regression tests for Go monolith, Node microservices (per-service), and Python Django monolith Autopilot file injection.
- Files changed:
  - `backend/internal/generator/engine_regression_test.go`

## Template For New Entries
- Title:
- Goal:
- Constraints:
- Acceptance Criteria:
- Files likely involved:

## Process Note
- Keep task entries idempotent: update existing task blocks in place, do not duplicate by rewording.
- Move completed tasks to a `Done` section (latest first) instead of leaving stale entries in `Current`.
