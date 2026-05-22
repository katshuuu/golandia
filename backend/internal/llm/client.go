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

// HistoryTurn — одно сообщение из истории чата с репетитором.
type HistoryTurn struct {
	Role    string
	Content string
}

type TutorInput struct {
	LessonID         string
	LessonTitle      string
	UserMessage      string
	UserCode         string
	CodeOutput       string
	History          []HistoryTurn
	RecentTranscript string // legacy, опционально
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

func (c *Client) TutorReply(ctx context.Context, in TutorInput) (TutorResult, error) {
	if c.apiKey == "" {
		return TutorResult{
			Reply: "На бэкенде не задан OPENAI_API_KEY. Добавь ключ и перезапусти сервер — тогда смогу отвечать как репетитор по Go.",
		}, nil
	}

	hasCodeContext := strings.TrimSpace(in.UserCode) != "" || strings.TrimSpace(in.CodeOutput) != ""
	system := tutorSystemPrompt(in.LessonTitle, in.UserCode, in.CodeOutput, hasCodeContext)

	messages := []map[string]string{
		{"role": "system", "content": system},
	}

	for _, h := range in.History {
		role := strings.ToLower(strings.TrimSpace(h.Role))
		if role != "user" && role != "assistant" {
			continue
		}
		content := strings.TrimSpace(h.Content)
		if content == "" {
			continue
		}
		messages = append(messages, map[string]string{"role": role, "content": content})
	}

	um := strings.TrimSpace(in.UserMessage)
	if um == "" {
		return TutorResult{}, fmt.Errorf("пустое сообщение")
	}
	messages = append(messages, map[string]string{"role": "user", "content": um})

	body := map[string]any{
		"model":           "gpt-4o-mini",
		"messages":        messages,
		"temperature":     0.65,
		"max_tokens":      520,
		"response_format": map[string]string{"type": "json_object"},
	}
	raw, _ := json.Marshal(body)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.openai.com/v1/chat/completions", bytes.NewReader(raw))
	if err != nil {
		return TutorResult{}, err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	res, err := c.http.Do(req)
	if err != nil {
		return TutorResult{}, err
	}
	defer res.Body.Close()
	b, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 300 {
		return TutorResult{}, fmt.Errorf("openai: %s", string(b))
	}
	var parsed struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(b, &parsed); err != nil {
		return TutorResult{}, err
	}
	if len(parsed.Choices) == 0 {
		return TutorResult{}, fmt.Errorf("пустой ответ модели")
	}
	return parseTutorJSONContent(parsed.Choices[0].Message.Content), nil
}

func tutorSystemPrompt(lessonTitle, userCode, codeOutput string, hasCodeContext bool) string {
	var sb strings.Builder
	sb.WriteString("Ты — дружелюбный AI-репетитор по языку программирования Go для подростков 12–18 лет.\n")
	sb.WriteString("Текущий урок: «")
	sb.WriteString(lessonTitle)
	sb.WriteString("».\n")
	if strings.TrimSpace(userCode) != "" {
		sb.WriteString("Код пользователя:\n```go\n")
		sb.WriteString(strings.TrimSpace(userCode))
		sb.WriteString("\n```\n")
	}
	if strings.TrimSpace(codeOutput) != "" {
		sb.WriteString("Вывод программы или ошибки компиляции/рантайма:\n")
		sb.WriteString(strings.TrimSpace(codeOutput))
		sb.WriteString("\n")
	}
	sb.WriteString("\nПравила:\n")
	sb.WriteString("1. Отвечай на русском языке, дружелюбно и с энтузиазмом.\n")
	sb.WriteString("2. НЕ выдавай готовое решение задания целиком — направляй сократовски, подсказками.\n")
	sb.WriteString("3. Объясняй просто; если есть ошибка компиляции — расшифруй её.\n")
	sb.WriteString("4. Ответ краткий: обычно 2–5 предложений.\n")
	sb.WriteString("5. Стиль можно чуть более «фановый», но без пошлости и без морализаторства.\n")
	sb.WriteString("\nФормат ответа: ТОЛЬКО валидный JSON (без markdown вокруг):\n")
	sb.WriteString(`{"reply":"текст для чата","highlights":[]}` + "\n")
	sb.WriteString("- reply: русский текст для ученика; в reply можно использовать `обратные кавычки` для коротких фрагментов кода.\n")
	sb.WriteString("- highlights: массив подсветки на странице урока. target:\n")
	sb.WriteString("  * user_code — код в песочнице задания;\n")
	sb.WriteString("  * theory_demo — демо-редактор под теорией;\n")
	sb.WriteString("  * theory_page — примеры в HTML теории (укажи snippet — точный фрагмент из теории).\n")
	sb.WriteString("- line_start и line_end — номера строк с 1; считай строки точно по переданному коду (пустая строка тоже строка).\n")
	sb.WriteString("- snippet — ОБЯЗАТЕЛЕН при подсветке user_code/theory_demo: точная подстрока из кода (например \"fmt.Println\" или \"import \\\"fmt\\\"\").\n")
	if hasCodeContext {
		sb.WriteString("Если ученик просит пояснить, разобрать или найти ошибку в коде — обязательно заполни highlights со snippet и корректными line_start/line_end.\n")
	} else {
		sb.WriteString("Если вопрос не про конкретный код на странице — highlights должен быть пустым массивом.\n")
	}
	return sb.String()
}
