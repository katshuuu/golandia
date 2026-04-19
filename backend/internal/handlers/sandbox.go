package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"go-llm-tutor/backend/internal/sandbox"
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
	if strings.TrimSpace(req.Code) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "пустой код"})
		return
	}
	out, err := h.runner.Run(c.Request.Context(), req.Code)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"ok": false, "stderr": err.Error(), "stdout": out})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "stdout": out, "stderr": ""})
}
