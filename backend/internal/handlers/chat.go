package handlers

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"go-llm-tutor/backend/internal/llm"
	"go-llm-tutor/backend/internal/validation"
)

type ChatHandler struct {
	client *llm.Client
}

func NewChatHandler() *ChatHandler {
	return &ChatHandler{client: llm.NewClient(cleanOpenAIAPIKey(os.Getenv("OPENAI_API_KEY")))}
}

// cleanEnvValue убирает типичный CR/LF после ключа в .env
func cleanEnvValue(v string) string {
	return strings.TrimSpace(strings.TrimSuffix(strings.TrimSuffix(v, "\r"), "\n"))
}

// cleanOpenAIAPIKey исправляет частую ошибку: в значение подставили ключ целиком,
// но перед ним ещё дописали префикс "sk-" (получается "sk-sk-...").
func cleanOpenAIAPIKey(v string) string {
	v = cleanEnvValue(v)
	if strings.HasPrefix(v, "sk-sk-") {
		v = "sk-" + strings.TrimPrefix(v, "sk-sk-")
	}
	return v
}

type tutorHistMsg struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// tutorRequest совместим с телом запроса из фронта (как экс-Edge chat-tutor) и короткими полями Go-клиента.
type tutorRequest struct {
	Message          string         `json:"message"`
	UserMessage      string         `json:"user_message"`
	LessonTitle      string         `json:"lessonTitle"`
	LessonID         string         `json:"lesson_id"`
	UserCode         string         `json:"userCode"`
	CodeOutput       string         `json:"codeOutput"`
	History          []tutorHistMsg `json:"history"`
	RecentTranscript string         `json:"recent_transcript"`
}

func (h *ChatHandler) Tutor(c *gin.Context) {
	var req tutorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "reply": "", "error": "bad json"})
		return
	}
	msg := strings.TrimSpace(req.Message)
	if msg == "" {
		msg = strings.TrimSpace(req.UserMessage)
	}
	validatedMsg, fe := validation.ValidateChatMessage(msg)
	if fe != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"ok":     false,
			"reply":  "",
			"error":  fe.Message,
			"fields": []validation.FieldError{*fe},
		})
		return
	}
	msg = validatedMsg
	if lid := strings.TrimSpace(req.LessonID); lid != "" {
		if fe := validation.ValidateLessonID(lid); fe != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"ok": false, "reply": "", "error": fe.Message, "fields": []validation.FieldError{*fe},
			})
			return
		}
	}
	title := strings.TrimSpace(req.LessonTitle)
	if title == "" {
		title = "урок"
	}

	hist := make([]llm.HistoryTurn, 0, len(req.History)+2)
	for _, m := range req.History {
		hist = append(hist, llm.HistoryTurn{Role: m.Role, Content: m.Content})
	}

	reply, err := h.client.TutorReply(c.Request.Context(), llm.TutorInput{
		LessonID:         strings.TrimSpace(req.LessonID),
		LessonTitle:      title,
		UserMessage:      msg,
		UserCode:         req.UserCode,
		CodeOutput:       req.CodeOutput,
		History:          hist,
		RecentTranscript: req.RecentTranscript,
	})
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"ok": false, "reply": "", "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "reply": reply, "error": ""})
}
