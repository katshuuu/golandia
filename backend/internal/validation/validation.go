// Package validation — единые правила полей сущностей (синхронизированы с frontend/src/lib/validation.ts).
package validation

import (
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/google/uuid"
)

const (
	DisplayNameMin   = 1
	DisplayNameMax   = 48
	GoalMax          = 500
	AvatarDataURLMax = 350_000
	ChatMessageMax   = 4000
	ChatMessageMin   = 1
	SandboxCodeMax   = 50_000
	SandboxCodeMin   = 1
	LessonIDMax      = 64
	StdoutMax        = 100_000
	CheckCodeMax     = 100_000
	UserIDMax        = 64
)

var displayNameRe = regexp.MustCompile(`^[\p{L}\p{N}\s._-]+$`)
var lessonIDRe = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9._-]*$`)

// FieldError — ошибка одного поля для ответа API.
type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ErrorResponse — тело ответа при ошибке валидации (HTTP 400).
type ErrorResponse struct {
	Error  string       `json:"error"`
	Fields []FieldError `json:"fields"`
}

func NewErrorResponse(fields ...FieldError) ErrorResponse {
	return ErrorResponse{
		Error:  "ошибка валидации",
		Fields: fields,
	}
}

func ValidateUserID(id string) *FieldError {
	id = strings.TrimSpace(id)
	if id == "" {
		return &FieldError{Field: "user_id", Message: "Не указан идентификатор пользователя."}
	}
	if id == "anonymous" {
		return nil
	}
	if len(id) > UserIDMax {
		return &FieldError{Field: "user_id", Message: "Идентификатор слишком длинный."}
	}
	if _, err := uuid.Parse(id); err != nil {
		return &FieldError{Field: "user_id", Message: "Некорректный идентификатор пользователя (ожидается UUID)."}
	}
	return nil
}

func ValidateDisplayName(raw string) (string, *FieldError) {
	trimmed := strings.TrimSpace(raw)
	if utf8.RuneCountInString(trimmed) < DisplayNameMin {
		return "", &FieldError{Field: "display_name", Message: "Введите имя: минимум 1 символ."}
	}
	if utf8.RuneCountInString(trimmed) > DisplayNameMax {
		return "", &FieldError{Field: "display_name", Message: "Имя не длиннее 48 символов."}
	}
	if !displayNameRe.MatchString(trimmed) {
		return "", &FieldError{Field: "display_name", Message: "Имя: только буквы, цифры, пробел и символы . _ -"}
	}
	return trimmed, nil
}

func ValidateGoal(raw string) (string, *FieldError) {
	trimmed := strings.TrimSpace(raw)
	if utf8.RuneCountInString(trimmed) > GoalMax {
		return "", &FieldError{Field: "goal", Message: "Цель обучения: не более 500 символов."}
	}
	return trimmed, nil
}

func ValidateAvatarDataURL(raw string) *FieldError {
	if raw == "" {
		return nil
	}
	if !strings.HasPrefix(raw, "data:image/") {
		return &FieldError{Field: "avatar_data_url", Message: "Аватар: ожидается data URL изображения (JPEG, PNG, WebP)."}
	}
	if len(raw) > AvatarDataURLMax {
		return &FieldError{Field: "avatar_data_url", Message: "Аватар слишком большой (не более ~2 МБ после сжатия)."}
	}
	return nil
}

func ValidateChatMessage(raw string) (string, *FieldError) {
	trimmed := strings.TrimSpace(raw)
	if utf8.RuneCountInString(trimmed) < ChatMessageMin {
		return "", &FieldError{Field: "message", Message: "Введите сообщение для куратора."}
	}
	if utf8.RuneCountInString(trimmed) > ChatMessageMax {
		return "", &FieldError{Field: "message", Message: "Сообщение не длиннее 4000 символов."}
	}
	return trimmed, nil
}

func ValidateSandboxCode(raw string) (string, *FieldError) {
	trimmed := strings.TrimSpace(raw)
	if utf8.RuneCountInString(trimmed) < SandboxCodeMin {
		return "", &FieldError{Field: "code", Message: "Введите код программы для запуска."}
	}
	if len(trimmed) > SandboxCodeMax {
		return "", &FieldError{Field: "code", Message: "Код слишком длинный (не более 50 000 символов)."}
	}
	return trimmed, nil
}

func ValidateLessonID(id string) *FieldError {
	id = strings.TrimSpace(id)
	if id == "" {
		return &FieldError{Field: "lesson_id", Message: "Не указан идентификатор урока."}
	}
	if len(id) > LessonIDMax {
		return &FieldError{Field: "lesson_id", Message: "Идентификатор урока слишком длинный."}
	}
	if !lessonIDRe.MatchString(id) {
		return &FieldError{Field: "lesson_id", Message: "Идентификатор урока: латиница, цифры, «.», «-», «_»."}
	}
	return nil
}

func ValidateCheckPayload(stdout, code string) []FieldError {
	var out []FieldError
	if len(stdout) > StdoutMax {
		out = append(out, FieldError{Field: "stdout", Message: "Вывод программы слишком длинный."})
	}
	if len(code) > CheckCodeMax {
		out = append(out, FieldError{Field: "code", Message: "Исходный код слишком длинный."})
	}
	return out
}

func ValidateProgressLessonIDs(completed map[string]bool) []FieldError {
	var out []FieldError
	for id := range completed {
		if fe := ValidateLessonID(id); fe != nil {
			out = append(out, *fe)
		}
	}
	return out
}
