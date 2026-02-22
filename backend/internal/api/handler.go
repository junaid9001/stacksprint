package api

import (
	"github.com/gofiber/fiber/v2"

	"stacksprint/backend/internal/generator"
)

type Handler struct {
	engine *generator.Engine
}

func NewHandler(engine *generator.Engine) *Handler {
	return &Handler{engine: engine}
}

func (h *Handler) Health(c *fiber.Ctx) error {
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"status": "ok"})
}

func (h *Handler) Generate(c *fiber.Ctx) error {
	var req generator.GenerateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid JSON body", "detail": err.Error()})
	}

	result, err := h.engine.Generate(c.Context(), req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(result)
}
