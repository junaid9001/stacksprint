package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"

	"stacksprint/backend/internal/api"
	"stacksprint/backend/internal/generator"
)

func main() {
	templateRoot := os.Getenv("TEMPLATE_ROOT")
	if templateRoot == "" {
		templateRoot = "../templates"
	}

	registry, err := generator.NewTemplateRegistry(templateRoot)
	if err != nil {
		log.Fatalf("failed to initialize template registry: %v", err)
	}

	eng := generator.NewEngine(registry)
	handler := api.NewHandler(eng)

	app := fiber.New(fiber.Config{AppName: "StackSprint Generator API"})
	app.Use(logger.New())
	app.Use(cors.New())

	app.Get("/health", handler.Health)
	app.Post("/generate", handler.Generate)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Fatal(app.Listen(":" + port))
}
