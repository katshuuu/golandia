package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go-llm-tutor/backend/internal/sandbox"
	"go-llm-tutor/backend/internal/validation"
)

type SandboxHandler struct {
	runner sandbox.Runner
}

func NewSandboxHandler(runner sandbox.Runner) *SandboxHandler {
	return &SandboxHandler{runner: runner}
}

type runRequest struct {
	Code string `json:"code"`
}

func (h *SandboxHandler) Run(c *gin.Context) {
	var req runRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "некорректный JSON"})
		return
	}
	code, fe := validation.ValidateSandboxCode(req.Code)
	if fe != nil {
		writeValidationError(c, *fe)
		return
	}

	out, err := h.runner.Run(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"ok": false, "stderr": err.Error(), "stdout": out})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "stdout": out, "stderr": ""})
}
