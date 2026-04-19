package handlers

import (
	"net/http"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"go-llm-tutor/backend/internal/models"
)

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
	ok, reason := evaluateCheck(strings.TrimSpace(req.Stdout), req.Code, req.Check)
	c.JSON(http.StatusOK, gin.H{"ok": ok, "reason": reason})
}

func evaluateCheck(stdout, code string, ch models.TaskCheck) (bool, string) {
	switch ch.Type {
	case "output":
		if normalize(ch.Expected) == normalize(stdout) {
			return true, ""
		}
		return false, "вывод не совпадает с ожидаемым"
	case "contains":
		for _, s := range ch.Contains {
			if !strings.Contains(stdout, s) {
				return false, "в выводе не хватает: " + s
			}
		}
		return true, ""
	case "regex":
		if ch.Pattern == "" {
			return false, "пустой regex"
		}
		re, err := regexp.Compile(ch.Pattern)
		if err != nil {
			return false, "ошибка regex"
		}
		if !re.MatchString(stdout) {
			return false, "вывод не прошёл regex-проверку"
		}
		return true, ""
	case "forbidden":
		for _, s := range ch.ForbiddenSubstr {
			if strings.Contains(code, s) {
				return false, "в коде не должно быть: " + s
			}
		}
		return true, ""
	default:
		return false, "неизвестный тип проверки"
	}
}

func normalize(s string) string {
	s = strings.ReplaceAll(s, "\r\n", "\n")
	return strings.TrimSpace(s)
}
