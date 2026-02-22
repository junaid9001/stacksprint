package generator

import (
	"errors"
	"slices"
	"strings"
)

// ApplyRuleEngine normalizes cross-field behavior and applies safe auto-corrections
// before strict validation runs.
func ApplyRuleEngine(req GenerateRequest) (GenerateRequest, []string, error) {
	warnings := make([]string, 0)

	// Only microservices should use service list customizations.
	if req.Architecture != "microservices" && len(req.Services) > 0 {
		req.Services = nil
		warnings = append(warnings, "Services list was ignored because architecture is not microservices.")
	}
	if req.Architecture != "microservices" && len(req.Custom.AddServiceNames) > 0 {
		req.Custom.AddServiceNames = nil
		warnings = append(warnings, "Custom service names were ignored because architecture is not microservices.")
	}

	// Keep request deterministic by de-duplicating path-based customizations.
	req.Custom.AddFolders = dedupeStrings(req.Custom.AddFolders)
	req.Custom.RemoveFolders = dedupeStrings(req.Custom.RemoveFolders)
	req.Custom.RemoveFiles = dedupeStrings(req.Custom.RemoveFiles)

	// Root mode existing should not initialize a git repo by default.
	if req.Root.Mode == "existing" && req.Root.GitInit {
		req.Root.GitInit = false
		warnings = append(warnings, "root.git_init was disabled because root.mode is existing.")
	}

	// ORM corrections.
	if req.UseORM && (req.Database == "none" || req.Database == "mongodb") {
		req.UseORM = false
		warnings = append(warnings, "use_orm was disabled because the selected database does not use SQL ORM in this generator.")
	}
	if req.Language == "python" && req.Framework == "django" && req.UseORM {
		req.UseORM = false
		warnings = append(warnings, "use_orm was disabled because Django already uses its built-in ORM.")
	}

	// Framework/database compatibility checks.
	if req.Language == "python" && req.Framework == "django" && req.Database == "mongodb" {
		return req, warnings, errors.New("django framework is not compatible with mongodb in this generator")
	}

	// Service communication defaults for microservices.
	if req.Architecture == "microservices" && strings.TrimSpace(req.ServiceCommunication) == "" {
		req.ServiceCommunication = "http"
		warnings = append(warnings, "service_communication defaulted to http for microservices.")
	}

	return req, warnings, nil
}

func dedupeStrings(in []string) []string {
	if len(in) == 0 {
		return in
	}
	out := make([]string, 0, len(in))
	seen := make(map[string]struct{}, len(in))
	for _, item := range in {
		trimmed := strings.TrimSpace(item)
		if trimmed == "" {
			continue
		}
		key := strings.ToLower(trimmed)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, trimmed)
	}
	return out
}

func mergeWarnings(base []string, extra []string) []string {
	if len(extra) == 0 {
		return base
	}
	if len(base) == 0 {
		return dedupeStrings(extra)
	}

	merged := make([]string, 0, len(base)+len(extra))
	merged = append(merged, base...)
	for _, w := range extra {
		if strings.TrimSpace(w) == "" {
			continue
		}
		if !slices.Contains(merged, w) {
			merged = append(merged, w)
		}
	}
	return merged
}
