package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go-llm-tutor/backend/internal/course"
)

type CourseHandler struct {
	svc *course.Service
}

func NewCourseHandler(svc *course.Service) *CourseHandler {
	return &CourseHandler{svc: svc}
}

func (h *CourseHandler) Manifest(c *gin.Context) {
	c.JSON(http.StatusOK, h.svc.Manifest())
}

func (h *CourseHandler) Lesson(c *gin.Context) {
	id := c.Param("id")
	l, ok := h.svc.Lesson(id)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "урок не найден"})
		return
	}
	c.JSON(http.StatusOK, l)
}
