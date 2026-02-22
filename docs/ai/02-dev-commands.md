# Dev Commands

## Full Stack
```bash
docker compose up --build
```

## Backend
```bash
cd backend
go test ./...
```

Update golden snapshots intentionally:
```bash
cd backend
UPDATE_GOLDEN=1 go test ./internal/generator -run TestGenerateGoldenSnapshots
```

PowerShell:
```powershell
cd backend
$env:UPDATE_GOLDEN='1'
go test ./internal/generator -run TestGenerateGoldenSnapshots
Remove-Item Env:UPDATE_GOLDEN
```

## Frontend
```bash
cd frontend
npm run lint
npm run build
```

PowerShell execution-policy-safe npm call:
```powershell
cd frontend
npm.cmd run lint
npm.cmd run build
```
