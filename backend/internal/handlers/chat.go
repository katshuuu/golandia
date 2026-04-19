package handlers

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"go-llm-tutor/backend/internal/llm"
)

type ChatHandler struct {
	client *llm.Client
}

func NewChatHandler() *ChatHandler {
	return &ChatHandler{client: llm.NewClient(os.Getenv("OPENAI_API_KEY"))}
}

type chatRequest struct {
	LessonID        string `json:"lesson_id"`
	LessonTitle     string `json:"lesson_title"`
	UserMessage     string `json:"user_message"`
	RecentTranscript string `json:"recent_transcript"`
}

func (h *ChatHandler) Tutor(c *gin.Context) {
	var req chatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad json"})
		return
	}
	if strings.TrimSpace(req.UserMessage) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "пустое сообщение"})
		return
	}
	reply, err := h.client.TutorReply(c.Request.Context(), llm.TutorInput{
		LessonID:         req.LessonID,
		LessonTitle:      req.LessonTitle,
		UserMessage:      req.UserMessage,
		RecentTranscript: req.RecentTranscript,
	})
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"ok": false, "reply": "", "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "reply": reply, "error": ""})
}
