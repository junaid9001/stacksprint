package generator

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"text/template"
)

type TemplateRegistry struct {
	root string
}

func NewTemplateRegistry(root string) (*TemplateRegistry, error) {
	if root == "" {
		return nil, fmt.Errorf("template root cannot be empty")
	}
	if _, err := os.Stat(root); err != nil {
		return nil, fmt.Errorf("template root is not accessible: %w", err)
	}
	return &TemplateRegistry{root: root}, nil
}

func (r *TemplateRegistry) Render(path string, data any) (string, error) {
	fullPath := filepath.Join(r.root, filepath.FromSlash(path))
	tpl, err := template.ParseFiles(fullPath)
	if err != nil {
		return "", fmt.Errorf("failed to parse template %s: %w", path, err)
	}
	var buf bytes.Buffer
	if err := tpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to render template %s: %w", path, err)
	}
	return buf.String(), nil
}
