package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go-llm-tutor/backend/internal/course"
	"go-llm-tutor/backend/internal/hero"
)

type HeroHandler struct {
	svc *course.Service
}

func NewHeroHandler(svc *course.Service) *HeroHandler {
	return &HeroHandler{svc: svc}
}

type heroLevelRequest struct {
	CompletedLessons   map[string]bool `json:"completed_lessons"`
	FinalProjectDone bool            `json:"final_project_done"`
}

// ComputeLevel POST /api/hero-level/compute — расчёт уровня героя по прогрессу клиента (формула hero.FormulaVersion).
func (h *HeroHandler) ComputeLevel(c *gin.Context) {
	var req heroLevelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
		return
	}
	m := h.svc.Manifest()
	out := hero.Compute(&m, req.CompletedLessons, req.FinalProjectDone)
	c.JSON(http.StatusOK, out)
}
