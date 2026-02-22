# Invariants And Risks

## Invariants (Do Not Break)
- API response must keep:
  - `bash_script`
  - `powershell_script`
  - `file_paths`
  - `warnings`
  - `decisions`
- Rule engine runs before validation.
- Generator remains stateless.
- Paths from user customizations must remain relative and safe.
- Microservices must remain 2-5 services.
- Golden snapshots are authoritative for intentional output.

## High-Risk Areas
- `backend/internal/generator/scaffolds.go`
  - shared compose/SQL/output logic
- `backend/internal/generator/engine.go`
  - orchestration and customization ordering
- `frontend/app/page.tsx`
  - large stateful file; easy to regress payload behavior

## Common Regression Patterns
- UI payload drift from backend `GenerateRequest`.
- Toggle behavior mismatch between generated files and compose references.
- Template additions not covered by tests/goldens.
- Dirty working tree accidental overwrite.

## Safety Checklist Before Finalizing
- Backend: `go test ./...`
- Frontend: `npm.cmd run lint` (and optionally `npm.cmd run build`)
- If output changed intentionally: update goldens and mention why.
