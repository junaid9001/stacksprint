package generator

import (
	"slices"
	"testing"
)

func TestBuildDecisionEntries(t *testing.T) {
	t.Parallel()

	req := GenerateRequest{
		Language:             "go",
		Framework:            "fiber",
		Architecture:         "microservices",
		ServiceCommunication: "grpc",
		Services: []ServiceConfig{
			{Name: "users", Port: 8081},
			{Name: "orders", Port: 8082},
		},
		Database: "postgresql",
		UseORM:   true,
		Infra: InfraOptions{
			Redis: true,
		},
		Features: FeatureOptions{
			Swagger:  true,
			Makefile: true,
		},
		FileToggles: FileToggleOptions{
			Compose:    boolPtr(true),
			Dockerfile: boolPtr(true),
			Readme:     boolPtr(true),
		},
	}
	tree := FileTree{
		Files: map[string]string{
			"README.md": "ok",
		},
		Dirs: map[string]struct{}{
			".":        {},
			"services": {},
		},
	}

	got := buildDecisionEntries(req, tree, []string{"rule warning sample"})
	if len(got) == 0 {
		t.Fatalf("expected decision entries")
	}

	codes := make([]string, 0, len(got))
	for _, d := range got {
		codes = append(codes, d.Code)
	}

	mustContain := []string{
		"rule.01",
		"stack.core",
		"arch.microservices",
		"db.selected",
		"infra.enabled",
		"features.enabled",
		"output.compose",
		"output.dockerfile",
		"output.readme",
		"output.tree",
	}
	for _, code := range mustContain {
		if !slices.Contains(codes, code) {
			t.Fatalf("expected code %q in decisions; got=%v", code, codes)
		}
	}
}
