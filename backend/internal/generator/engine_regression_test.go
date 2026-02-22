package generator

import (
	"context"
	"strings"
	"testing"
)

func TestMicroservicesComposeRespectsEnvToggle(t *testing.T) {
	t.Parallel()

	engine := testEngine(t)
	req := GenerateRequest{
		Language:     "go",
		Framework:    "fiber",
		Architecture: "microservices",
		Database:     "none",
		Services: []ServiceConfig{
			{Name: "users", Port: 8081},
			{Name: "orders", Port: 8082},
		},
		FileToggles: FileToggleOptions{
			Env: boolPtr(false),
		},
		Root: RootOptions{
			Mode: "new",
			Name: "svc-env-off",
		},
	}

	got, err := engine.Generate(context.Background(), req)
	if err != nil {
		t.Fatalf("generate failed: %v", err)
	}

	if strings.Contains(got.BashScript, "./services/users/.env") || strings.Contains(got.BashScript, "./services/orders/.env") {
		t.Fatalf("expected compose output to omit microservice env_file references when env toggle is off")
	}
}

func TestMySQLMigrationsUseMySQLIdentitySyntax(t *testing.T) {
	t.Parallel()

	req := GenerateRequest{
		Language:     "go",
		Framework:    "fiber",
		Architecture: "mvp",
		Database:     "mysql",
	}
	sql := sampleMigration(req.Database, nil) + sampleDBInit(req.Database, nil)
	if strings.Contains(sql, "SERIAL PRIMARY KEY") {
		t.Fatalf("mysql SQL should not use postgres SERIAL syntax")
	}
	if !strings.Contains(sql, "AUTO_INCREMENT") {
		t.Fatalf("mysql SQL should include AUTO_INCREMENT identity syntax")
	}
}

func TestNATSInfraGeneratesLanguageBoilerplate(t *testing.T) {
	t.Parallel()

	engine := testEngine(t)
	req := GenerateRequest{
		Language:     "node",
		Framework:    "express",
		Architecture: "mvp",
		Database:     "none",
		Infra: InfraOptions{
			NATS: true,
		},
		Root: RootOptions{
			Mode: "new",
			Name: "node-nats",
		},
	}

	got, err := engine.Generate(context.Background(), req)
	if err != nil {
		t.Fatalf("generate failed: %v", err)
	}

	found := false
	for _, p := range got.FilePaths {
		if p == "src/messaging/natsClient.js" {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("expected nats boilerplate file in output paths")
	}
}

func TestAutopilotGeneratesGoMonolithBoilerplate(t *testing.T) {
	t.Parallel()

	engine := testEngine(t)
	req := GenerateRequest{
		Language:     "go",
		Framework:    "gin",
		Architecture: "mvp",
		Database:     "postgresql",
		Root: RootOptions{
			Mode: "new",
			Name: "go-autopilot",
		},
	}

	got, err := engine.Generate(context.Background(), req)
	if err != nil {
		t.Fatalf("generate failed: %v", err)
	}

	expected := []string{
		"internal/middleware/request_id.go",
		"internal/middleware/request_logging.go",
		"internal/pagination/pagination.go",
		"internal/db/retry.go",
	}
	for _, path := range expected {
		if !hasPath(got.FilePaths, path) {
			t.Fatalf("expected autopilot file %q in output", path)
		}
	}
}

func TestAutopilotGeneratesNodeMicroserviceBoilerplatePerService(t *testing.T) {
	t.Parallel()

	engine := testEngine(t)
	req := GenerateRequest{
		Language:     "node",
		Framework:    "express",
		Architecture: "microservices",
		Database:     "mysql",
		Services: []ServiceConfig{
			{Name: "users", Port: 8081},
			{Name: "orders", Port: 8082},
		},
		Root: RootOptions{
			Mode: "new",
			Name: "node-ms-autopilot",
		},
	}

	got, err := engine.Generate(context.Background(), req)
	if err != nil {
		t.Fatalf("generate failed: %v", err)
	}

	expected := []string{
		"services/users/src/middleware/requestId.js",
		"services/users/src/middleware/requestLogging.js",
		"services/users/src/utils/pagination.js",
		"services/users/src/db/retry.js",
		"services/orders/src/middleware/requestId.js",
		"services/orders/src/middleware/requestLogging.js",
		"services/orders/src/utils/pagination.js",
		"services/orders/src/db/retry.js",
	}
	for _, path := range expected {
		if !hasPath(got.FilePaths, path) {
			t.Fatalf("expected per-service autopilot file %q in output", path)
		}
	}
}

func TestAutopilotGeneratesDjangoMonolithBoilerplate(t *testing.T) {
	t.Parallel()

	engine := testEngine(t)
	req := GenerateRequest{
		Language:     "python",
		Framework:    "django",
		Architecture: "mvp",
		Database:     "mysql",
		Root: RootOptions{
			Mode: "new",
			Name: "django-autopilot",
		},
	}

	got, err := engine.Generate(context.Background(), req)
	if err != nil {
		t.Fatalf("generate failed: %v", err)
	}

	expected := []string{
		"api/middleware/request_id.py",
		"api/middleware/request_logging.py",
		"api/utils/pagination.py",
		"api/db/retry.py",
	}
	for _, path := range expected {
		if !hasPath(got.FilePaths, path) {
			t.Fatalf("expected autopilot file %q in output", path)
		}
	}
}

func hasPath(paths []string, target string) bool {
	for _, p := range paths {
		if p == target {
			return true
		}
	}
	return false
}
