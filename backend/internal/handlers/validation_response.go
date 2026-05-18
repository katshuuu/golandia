package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go-llm-tutor/backend/internal/validation"
)

func writeValidationError(c *gin.Context, fields ...validation.FieldError) {
	if len(fields) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ошибка валидации"})
		return
	}
	c.JSON(http.StatusBadRequest, validation.NewErrorResponse(fields...))
}
