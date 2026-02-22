package generator

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"slices"
	"testing"
)

func TestGenerateGoldenSnapshots(t *testing.T) {
	t.Parallel()

	engine := testEngine(t)
	update := os.Getenv("UPDATE_GOLDEN") == "1"

	cases := []struct {
		name string
		req  GenerateRequest
	}{
		{
			name: "go_clean_postgres_orm_grpc",
			req: GenerateRequest{
				Language:             "go",
				Framework:            "fiber",
				Architecture:         "clean",
				Database:             "postgresql",
				UseORM:               true,
				ServiceCommunication: "grpc",
				Features: FeatureOptions{
					Swagger:       true,
					Makefile:      true,
					GitHubActions: true,
					Logger:        true,
					GlobalError:   true,
					Health:        true,
					SampleTest:    true,
				},
				Infra: InfraOptions{
					Redis: true,
					Kafka: true,
				},
				Root: RootOptions{
					Mode:    "new",
					Name:    "golden-go-clean",
					Module:  "github.com/acme/golden-go-clean",
					GitInit: true,
				},
				Custom: CustomOptions{
					Models: []DataModel{
						{
							Name: "Order",
							Fields: []DataField{
								{Name: "id", Type: "int"},
								{Name: "total", Type: "float"},
							},
						},
					},
				},
			},
		},
		{
			name: "node_hexagonal_mysql_noorm_no_crud",
			req: GenerateRequest{
				Language:     "node",
				Framework:    "express",
				Architecture: "hexagonal",
				Database:     "mysql",
				UseORM:       false,
				FileToggles: FileToggleOptions{
					ExampleCRUD: boolPtr(false),
				},
				Root: RootOptions{
					Mode:    "new",
					Name:    "golden-node-hex",
					GitInit: true,
				},
			},
		},
		{
			name: "python_django_mysql",
			req: GenerateRequest{
				Language:     "python",
				Framework:    "django",
				Architecture: "mvp",
				Database:     "mysql",
				UseORM:       true,
				Root: RootOptions{
					Mode:    "new",
					Name:    "golden-django",
					GitInit: true,
				},
			},
		},
		{
			name: "python_microservices_fastapi_mongodb",
			req: GenerateRequest{
				Language:             "python",
				Framework:            "fastapi",
				Architecture:         "microservices",
				Database:             "mongodb",
				ServiceCommunication: "http",
				Services: []ServiceConfig{
					{Name: "users", Port: 9001},
					{Name: "orders", Port: 9002},
				},
				Root: RootOptions{
					Mode:    "new",
					Name:    "golden-py-ms",
					GitInit: true,
				},
				Custom: CustomOptions{
					AddServiceNames: []string{"users", "orders"},
				},
			},
		},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			got, err := engine.Generate(context.Background(), tc.req)
			if err != nil {
				t.Fatalf("generate failed: %v", err)
			}

			snapshot := mustJSON(t, got)
			goldenPath := filepath.Join("testdata", "golden", tc.name+".json")

			if update {
				if err := os.MkdirAll(filepath.Dir(goldenPath), 0o755); err != nil {
					t.Fatalf("mkdir golden dir: %v", err)
				}
				if err := os.WriteFile(goldenPath, snapshot, 0o644); err != nil {
					t.Fatalf("write golden file: %v", err)
				}
				return
			}

			want, err := os.ReadFile(goldenPath)
			if err != nil {
				t.Fatalf("read golden file %q: %v (run with UPDATE_GOLDEN=1 to create)", goldenPath, err)
			}
			if string(snapshot) != string(want) {
				t.Fatalf("golden mismatch for %s; run with UPDATE_GOLDEN=1 to update", tc.name)
			}
		})
	}
}

func TestSmokeGeneratedScripts(t *testing.T) {
	t.Parallel()

	engine := testEngine(t)

	rootDir := t.TempDir()
	req := GenerateRequest{
		Language:     "python",
		Framework:    "fastapi",
		Architecture: "mvp",
		Database:     "none",
		Root: RootOptions{
			Mode:    "existing",
			Path:    rootDir,
			GitInit: false,
		},
	}

	got, err := engine.Generate(context.Background(), req)
	if err != nil {
		t.Fatalf("generate failed: %v", err)
	}

	t.Run("powershell", func(t *testing.T) {
		runPowerShellSmoke(t, got.PowerShellScript)
		verifySmokeOutput(t, rootDir)
	})

	t.Run("bash", func(t *testing.T) {
		runBashSmoke(t, got.BashScript)
		verifySmokeOutput(t, rootDir)
	})
}

func testEngine(t *testing.T) *Engine {
	t.Helper()
	reg, err := NewTemplateRegistry(testTemplateRoot(t))
	if err != nil {
		t.Fatalf("new template registry: %v", err)
	}
	return NewEngine(reg)
}

func testTemplateRoot(t *testing.T) string {
	t.Helper()
	_, currentFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatalf("failed to get current file path")
	}
	return filepath.Clean(filepath.Join(filepath.Dir(currentFile), "..", "..", "..", "templates"))
}

func mustJSON(t *testing.T, v any) []byte {
	t.Helper()
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		t.Fatalf("marshal json: %v", err)
	}
	return append(b, '\n')
}

func runPowerShellSmoke(t *testing.T, script string) {
	t.Helper()
	exe, args, ok := powershellCommand()
	if !ok {
		t.Skip("PowerShell not found in PATH")
	}

	scriptPath := filepath.Join(t.TempDir(), "generated.ps1")
	if err := os.WriteFile(scriptPath, []byte(script), 0o644); err != nil {
		t.Fatalf("write powershell script: %v", err)
	}

	cmd := exec.Command(exe, append(args, scriptPath)...)
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("powershell smoke failed: %v\n%s", err, out)
	}
}

func runBashSmoke(t *testing.T, script string) {
	t.Helper()
	if runtime.GOOS == "windows" {
		t.Skip("bash smoke test is skipped on Windows")
	}
	if _, err := exec.LookPath("bash"); err != nil {
		t.Skip("bash not found in PATH")
	}

	scriptPath := filepath.Join(t.TempDir(), "generated.sh")
	if err := os.WriteFile(scriptPath, []byte(script), 0o755); err != nil {
		t.Fatalf("write bash script: %v", err)
	}

	cmd := exec.Command("bash", scriptPath)
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("bash smoke failed: %v\n%s", err, out)
	}
}

func powershellCommand() (string, []string, bool) {
	candidates := []struct {
		exe  string
		args []string
	}{
		{exe: "pwsh", args: []string{"-NoProfile", "-File"}},
		{exe: "powershell", args: []string{"-NoProfile", "-ExecutionPolicy", "Bypass", "-File"}},
	}
	for _, c := range candidates {
		if _, err := exec.LookPath(c.exe); err == nil {
			return c.exe, c.args, true
		}
	}
	return "", nil, false
}

func verifySmokeOutput(t *testing.T, rootDir string) {
	t.Helper()
	expected := []string{
		"app/main.py",
		"requirements.txt",
		"Dockerfile",
		"docker-compose.yaml",
		".env",
	}

	for _, rel := range expected {
		full := filepath.Join(rootDir, filepath.FromSlash(rel))
		if _, err := os.Stat(full); err != nil {
			t.Fatalf("expected %s to exist after smoke run: %v", rel, err)
		}
	}

	paths := collectRelativePaths(t, rootDir)
	if !slices.Contains(paths, filepath.ToSlash("app/main.py")) {
		t.Fatalf("smoke output tree missing app/main.py")
	}
}

func collectRelativePaths(t *testing.T, rootDir string) []string {
	t.Helper()
	paths := make([]string, 0)
	err := filepath.WalkDir(rootDir, func(p string, d os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if p == rootDir {
			return nil
		}
		rel, err := filepath.Rel(rootDir, p)
		if err != nil {
			return err
		}
		paths = append(paths, filepath.ToSlash(rel))
		return nil
	})
	if err != nil {
		t.Fatalf("walk dir: %v", err)
	}
	return paths
}

func boolPtr(v bool) *bool {
	return &v
}
