package generator

import "testing"

func TestApplyRuleEngine(t *testing.T) {
	t.Parallel()

	t.Run("clears service customization for monolith", func(t *testing.T) {
		req := GenerateRequest{
			Language:     "go",
			Framework:    "fiber",
			Architecture: "mvp",
			Services: []ServiceConfig{
				{Name: "users", Port: 8081},
			},
			Custom: CustomOptions{
				AddServiceNames: []string{"users", "orders"},
			},
		}

		got, warnings, err := ApplyRuleEngine(req)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(got.Services) != 0 {
			t.Fatalf("expected services to be cleared, got: %+v", got.Services)
		}
		if len(got.Custom.AddServiceNames) != 0 {
			t.Fatalf("expected custom add service names to be cleared, got: %+v", got.Custom.AddServiceNames)
		}
		if len(warnings) < 2 {
			t.Fatalf("expected warnings for service cleanup, got: %+v", warnings)
		}
	})

	t.Run("disables git init for existing root", func(t *testing.T) {
		req := GenerateRequest{
			Language:     "go",
			Framework:    "fiber",
			Architecture: "mvp",
			Root: RootOptions{
				Mode:    "existing",
				Path:    ".",
				GitInit: true,
			},
		}

		got, _, err := ApplyRuleEngine(req)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.Root.GitInit {
			t.Fatalf("expected git_init to be false for existing root")
		}
	})

	t.Run("disables orm for mongodb", func(t *testing.T) {
		req := GenerateRequest{
			Language:     "node",
			Framework:    "express",
			Architecture: "mvp",
			Database:     "mongodb",
			UseORM:       true,
		}
		got, _, err := ApplyRuleEngine(req)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.UseORM {
			t.Fatalf("expected use_orm false for mongodb")
		}
	})

	t.Run("defaults microservices communication", func(t *testing.T) {
		req := GenerateRequest{
			Language:             "python",
			Framework:            "fastapi",
			Architecture:         "microservices",
			ServiceCommunication: "",
		}
		got, _, err := ApplyRuleEngine(req)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.ServiceCommunication != "http" {
			t.Fatalf("expected service_communication=http, got %q", got.ServiceCommunication)
		}
	})

	t.Run("rejects django mongodb", func(t *testing.T) {
		req := GenerateRequest{
			Language:     "python",
			Framework:    "django",
			Architecture: "mvp",
			Database:     "mongodb",
		}
		_, _, err := ApplyRuleEngine(req)
		if err == nil {
			t.Fatalf("expected incompatibility error")
		}
	})
}
