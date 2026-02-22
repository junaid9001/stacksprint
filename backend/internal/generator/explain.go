package generator

import (
	"fmt"
	"sort"
	"strings"
)

func buildDecisionEntries(req GenerateRequest, tree FileTree, ruleWarnings []string) []DecisionEntry {
	out := make([]DecisionEntry, 0, 16)

	for i, w := range ruleWarnings {
		out = append(out, DecisionEntry{
			Code:     fmt.Sprintf("rule.%02d", i+1),
			Category: "rule",
			Message:  w,
		})
	}

	out = append(out, DecisionEntry{
		Code:     "stack.core",
		Category: "stack",
		Message:  fmt.Sprintf("Language=%s, Framework=%s, Architecture=%s.", req.Language, req.Framework, req.Architecture),
	})

	if req.Architecture == "microservices" {
		out = append(out, DecisionEntry{
			Code:     "arch.microservices",
			Category: "architecture",
			Message:  fmt.Sprintf("Generated %d services with %s communication.", len(req.Services), req.ServiceCommunication),
		})
	} else {
		out = append(out, DecisionEntry{
			Code:     "arch.monolith",
			Category: "architecture",
			Message:  "Generated a single-service project structure.",
		})
	}

	if req.Database == "none" {
		out = append(out, DecisionEntry{
			Code:     "db.none",
			Category: "database",
			Message:  "No database boilerplate generated.",
		})
	} else {
		orm := "disabled"
		if req.UseORM {
			orm = "enabled"
		}
		out = append(out, DecisionEntry{
			Code:     "db.selected",
			Category: "database",
			Message:  fmt.Sprintf("Database=%s with ORM %s.", req.Database, orm),
		})
	}

	infra := enabledInfra(req.Infra)
	if len(infra) > 0 {
		out = append(out, DecisionEntry{
			Code:     "infra.enabled",
			Category: "infra",
			Message:  fmt.Sprintf("Enabled infra: %s.", strings.Join(infra, ", ")),
		})
	}

	features := enabledFeatures(req.Features)
	if len(features) > 0 {
		out = append(out, DecisionEntry{
			Code:     "features.enabled",
			Category: "features",
			Message:  fmt.Sprintf("Enabled features: %s.", strings.Join(features, ", ")),
		})
	}

	if isEnabled(req.FileToggles.Compose) {
		out = append(out, DecisionEntry{
			Code:     "output.compose",
			Category: "output",
			Message:  "docker-compose.yaml included.",
		})
	}
	if isEnabled(req.FileToggles.Dockerfile) {
		out = append(out, DecisionEntry{
			Code:     "output.dockerfile",
			Category: "output",
			Message:  "Dockerfile boilerplate included.",
		})
	}
	if isEnabled(req.FileToggles.Readme) {
		out = append(out, DecisionEntry{
			Code:     "output.readme",
			Category: "output",
			Message:  "README.md included.",
		})
	}

	out = append(out, DecisionEntry{
		Code:     "output.tree",
		Category: "output",
		Message:  fmt.Sprintf("Generated %d files and %d directories.", len(tree.Files), countMaterializedDirs(tree.Dirs)),
	})

	return out
}

func countMaterializedDirs(dirs map[string]struct{}) int {
	n := 0
	for d := range dirs {
		if d == "." || d == "" {
			continue
		}
		n++
	}
	return n
}

func enabledInfra(infra InfraOptions) []string {
	out := make([]string, 0, 3)
	if infra.Redis {
		out = append(out, "redis")
	}
	if infra.Kafka {
		out = append(out, "kafka")
	}
	if infra.NATS {
		out = append(out, "nats")
	}
	sort.Strings(out)
	return out
}

func enabledFeatures(features FeatureOptions) []string {
	out := make([]string, 0, 8)
	if features.JWTAuth {
		out = append(out, "jwt_auth")
	}
	if features.Swagger {
		out = append(out, "swagger")
	}
	if features.GitHubActions {
		out = append(out, "github_actions_ci")
	}
	if features.Makefile {
		out = append(out, "makefile")
	}
	if features.Logger {
		out = append(out, "logger")
	}
	if features.GlobalError {
		out = append(out, "global_error_handler")
	}
	if features.Health {
		out = append(out, "health_endpoint")
	}
	if features.SampleTest {
		out = append(out, "sample_test")
	}
	sort.Strings(out)
	return out
}
