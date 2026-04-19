package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type TutorInput struct {
	LessonID         string
	LessonTitle      string
	UserMessage      string
	RecentTranscript string
}

type Client struct {
	apiKey string
	http   *http.Client
}

func NewClient(apiKey string) *Client {
	return &Client{
		apiKey: strings.TrimSpace(apiKey),
		http:   &http.Client{Timeout: 45 * time.Second},
	}
}

func (c *Client) TutorReply(ctx context.Context, in TutorInput) (string, error) {
	if c.apiKey == "" {
		return "Режим без API-ключа: задай себе вопрос из списка наводящих слева и попробуй сам ответить вслух. " +
			"Если включишь OPENAI_API_KEY на бэкенде, я оживу как настоящий сократовский репетитор.", nil
	}

	system := socraticSystemPrompt(in.LessonTitle)

	body := map[string]any{
		"model": "gpt-4o-mini",
		"messages": []map[string]string{
			{"role": "system", "content": system},
			{"role": "user", "content": buildUserPayload(in)},
		},
		"temperature": 0.6,
	}
	raw, _ := json.Marshal(body)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.openai.com/v1/chat/completions", bytes.NewReader(raw))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	res, err := c.http.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	b, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 300 {
		return "", fmt.Errorf("openai: %s", string(b))
	}
	var parsed struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(b, &parsed); err != nil {
		return "", err
	}
	if len(parsed.Choices) == 0 {
		return "", fmt.Errorf("пустой ответ модели")
	}
	return strings.TrimSpace(parsed.Choices[0].Message.Content), nil
}

func socraticSystemPrompt(lessonTitle string) string {
	return "Ты — весёлый LLM-репетитор по Go для подростков 12–18 лет. Язык: русский. " +
		"Стиль: дружелюбный, с лёгким мемным юмором, без снисхождения и морали. " +
		"Метод: сократовский — наводящие вопросы, маленькие подсказки, никогда не выдавай готовый код целиком и не переписывай задание за ученика. " +
		"Если просят «дай код», откажись мягко и предложи шаг: «что должна сделать программа в первую строку?». " +
		"Текущий урок: " + lessonTitle + ". " +
		"Не используй нецензурную лексику."
}

func buildUserPayload(in TutorInput) string {
	var sb strings.Builder
	sb.WriteString("lesson_id: ")
	sb.WriteString(in.LessonID)
	sb.WriteString("\n")
	if strings.TrimSpace(in.RecentTranscript) != "" {
		sb.WriteString("контекст диалога:\n")
		sb.WriteString(in.RecentTranscript)
		sb.WriteString("\n")
	}
	sb.WriteString("сообщение ученика:\n")
	sb.WriteString(in.UserMessage)
	return sb.String()
}
