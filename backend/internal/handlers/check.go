package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"go-llm-tutor/backend/internal/checker"
	"go-llm-tutor/backend/internal/models"
	"go-llm-tutor/backend/internal/validation"
)

var checkRegistry = checker.NewRegistry()

type checkRequest struct {
	Stdout string           `json:"stdout"`
	Code   string           `json:"code"`
	Check  models.TaskCheck `json:"check"`
}

func CheckLesson(c *gin.Context) {
	var req checkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "reason": "bad json"})
		return
	}
	if fields := validation.ValidateCheckPayload(req.Stdout, req.Code); len(fields) > 0 {
		writeValidationError(c, fields...)
		return
	}
	ok, reason := evaluateCheck(strings.TrimSpace(req.Stdout), req.Code, req.Check)
	c.JSON(http.StatusOK, gin.H{"ok": ok, "reason": reason})
}

func evaluateCheck(stdout, code string, ch models.TaskCheck) (bool, string) {
	return checkRegistry.Evaluate(stdout, code, ch)
}
