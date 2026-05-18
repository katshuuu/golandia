package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go-llm-tutor/backend/internal/repository"
	"go-llm-tutor/backend/internal/validation"
)

type UserHandler struct {
	repo *repository.UserRepository
}

func NewUserHandler(repo *repository.UserRepository) *UserHandler {
	return &UserHandler{repo: repo}
}

type profileBody struct {
	DisplayName   string `json:"display_name"`
	Goal          string `json:"goal"`
	AvatarDataURL string `json:"avatar_data_url"`
}

type progressBody struct {
	CompletedLessons map[string]bool `json:"completed_lessons"`
	FinalProjectDone bool            `json:"final_project_done"`
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	id := c.Param("id")
	if fe := validation.ValidateUserID(id); fe != nil {
		writeValidationError(c, *fe)
		return
	}
	p, err := h.repo.GetProfile(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "пользователь не найден"})
		return
	}
	c.JSON(http.StatusOK, p)
}

func (h *UserHandler) PutProfile(c *gin.Context) {
	id := c.Param("id")
	if fe := validation.ValidateUserID(id); fe != nil {
		writeValidationError(c, *fe)
		return
	}
	var body profileBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "некорректный JSON"})
		return
	}

	var fieldErrors []validation.FieldError
	name, fe := validation.ValidateDisplayName(body.DisplayName)
	if fe != nil {
		fieldErrors = append(fieldErrors, *fe)
	}
	goal, fe := validation.ValidateGoal(body.Goal)
	if fe != nil {
		fieldErrors = append(fieldErrors, *fe)
	}
	if fe := validation.ValidateAvatarDataURL(body.AvatarDataURL); fe != nil {
		fieldErrors = append(fieldErrors, *fe)
	}
	if len(fieldErrors) > 0 {
		writeValidationError(c, fieldErrors...)
		return
	}

	if err := h.repo.EnsureUser(c.Request.Context(), id, name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка БД"})
		return
	}
	if err := h.repo.UpsertProfile(c.Request.Context(), id, name, goal, body.AvatarDataURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сохранения"})
		return
	}
	p, _ := h.repo.GetProfile(c.Request.Context(), id)
	c.JSON(http.StatusOK, p)
}

func (h *UserHandler) GetProgress(c *gin.Context) {
	id := c.Param("id")
	if fe := validation.ValidateUserID(id); fe != nil {
		writeValidationError(c, *fe)
		return
	}
	if err := h.repo.EnsureUser(c.Request.Context(), id, "Студент"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка БД"})
		return
	}
	p, err := h.repo.GetProgress(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка чтения прогресса"})
		return
	}
	c.JSON(http.StatusOK, p)
}

func (h *UserHandler) PutProgress(c *gin.Context) {
	id := c.Param("id")
	if fe := validation.ValidateUserID(id); fe != nil {
		writeValidationError(c, *fe)
		return
	}
	var body progressBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "некорректный JSON"})
		return
	}
	if body.CompletedLessons == nil {
		body.CompletedLessons = map[string]bool{}
	}
	if fields := validation.ValidateProgressLessonIDs(body.CompletedLessons); len(fields) > 0 {
		writeValidationError(c, fields...)
		return
	}
	if err := h.repo.EnsureUser(c.Request.Context(), id, "Студент"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка БД"})
		return
	}
	if err := h.repo.SaveProgress(c.Request.Context(), id, body.CompletedLessons, body.FinalProjectDone); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сохранения прогресса"})
		return
	}
	p, _ := h.repo.GetProgress(c.Request.Context(), id)
	c.JSON(http.StatusOK, p)
}
