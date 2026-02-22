# StackSprint V2

StackSprint is a backend project initialization engine that removes repetitive setup work when starting new services. It generates production-ready starter code and executable Bash/PowerShell bootstrap scripts.

## Highlights

- Multi-language support: Go, Node.js, Python
- Framework support:
  - Go: Gin, Fiber
  - Node.js: Express, Fastify
  - Python: FastAPI, Django (API mode)
- Architecture modes:
  - MVP
  - Clean Architecture
  - Hexagonal
  - Modular Monolith
  - Microservices (2-5 services)
- Database options: PostgreSQL, MySQL, MongoDB, None
- Optional infra/features:
  - Redis, Kafka, NATS
  - JWT auth boilerplate
  - Swagger/OpenAPI
  - GitHub Actions CI
  - Makefile, logger, global error handler, health endpoint, sample tests
- Dynamic customization:
  - Add/remove folders
  - Add/remove files
  - Add/remove services
- Rule engine before generation:
  - Cross-field compatibility checks
  - Safe auto-corrections for invalid/risky combinations
  - Deterministic warning output for corrected inputs
- Output format:
  - Bash script
  - PowerShell script
  - Live file tree preview paths
  - Explainable `decisions` metadata in API response

## V2 Improvements

- True architecture-aware generation for Go, Node.js, and Python
- ORM toggle (`use_orm`) for SQL stacks:
  - Go: GORM or `database/sql`
  - Node.js: Prisma or SQL driver setup
  - Python: SQLAlchemy (FastAPI) or Django ORM
- Stronger script generation:
  - Empty directory preservation with `.gitkeep`
  - Safer bash heredoc delimiter
- Live frontend preview with debounce:
  - Auto-refresh script preview
  - Project Explorer from backend `file_paths`
- Explainable generation:
  - Structured `decisions` explaining why files/boilerplate were included
  - Rule-driven warnings merged into response
- Reliability testing:
  - Golden snapshot tests for generator output
  - Smoke execution tests for generated scripts

## Project Structure

```text
stacksprint/
  frontend/      # Next.js App Router UI
  backend/       # Go Fiber stateless generation API
  templates/     # Architecture + language templates
  docker-compose.yaml
  README.md
```

## Run StackSprint

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`

## API

### `POST /generate`

Request body includes:

- `language`, `framework`, `architecture`
- `services` (for microservices)
- `db`, `use_orm`
- `service_communication`
- `infra`, `features`
- `file_toggles`
- `custom` (add/remove folders/files/services)
- `root`

Response:

```json
{
  "bash_script": "...",
  "powershell_script": "...",
  "file_paths": ["..."],
  "warnings": ["..."],
  "decisions": [
    {
      "code": "stack.core",
      "category": "stack",
      "message": "Language=go, Framework=fiber, Architecture=clean."
    }
  ]
}
```

`decisions` gives explainable generation metadata (rules applied, architecture path, database behavior, and output composition).

## Development

Backend:

```bash
cd backend
go test ./...
```

Refresh generator golden snapshots (only when output changes intentionally):

```bash
cd backend
UPDATE_GOLDEN=1 go test ./internal/generator -run TestGenerateGoldenSnapshots
```

PowerShell equivalent:

```powershell
cd backend
$env:UPDATE_GOLDEN='1'
go test ./internal/generator -run TestGenerateGoldenSnapshots
Remove-Item Env:UPDATE_GOLDEN
```

Frontend:

```bash
cd frontend
npm run build
```

## Notes

- Generated projects are designed to run with `docker compose up --build`.
- StackSprint itself is stateless and does not require its own app database.
- Frontend uses live preview; scripts auto-refresh as configuration changes.
