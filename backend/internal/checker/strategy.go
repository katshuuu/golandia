package checker

import (
	"regexp"
	"strings"

	"go-llm-tutor/backend/internal/models"
)

// Strategy — паттерн «Стратегия»: разные алгоритмы проверки задания.
type Strategy interface {
	Evaluate(stdout, code string, ch models.TaskCheck) (ok bool, reason string)
}

type outputStrategy struct{}

func (outputStrategy) Evaluate(stdout, _ string, ch models.TaskCheck) (bool, string) {
	if normalize(ch.Expected) == normalize(stdout) {
		return true, ""
	}
	return false, "вывод не совпадает с ожидаемым"
}

type containsStrategy struct{}

func (containsStrategy) Evaluate(stdout, _ string, ch models.TaskCheck) (bool, string) {
	for _, s := range ch.Contains {
		if !strings.Contains(stdout, s) {
			return false, "в выводе не хватает: " + s
		}
	}
	return true, ""
}

type regexStrategy struct{}

func (regexStrategy) Evaluate(stdout, _ string, ch models.TaskCheck) (bool, string) {
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
}

type forbiddenStrategy struct{}

func (forbiddenStrategy) Evaluate(_, code string, ch models.TaskCheck) (bool, string) {
	for _, s := range ch.ForbiddenSubstr {
		if strings.Contains(code, s) {
			return false, "в коде не должно быть: " + s
		}
	}
	return true, ""
}

// Registry выбирает стратегию по типу проверки (фабрика стратегий).
type Registry struct {
	byType map[string]Strategy
}

func NewRegistry() *Registry {
	return &Registry{
		byType: map[string]Strategy{
			"output":    outputStrategy{},
			"contains":  containsStrategy{},
			"regex":     regexStrategy{},
			"forbidden": forbiddenStrategy{},
		},
	}
}

func (r *Registry) Evaluate(stdout, code string, ch models.TaskCheck) (bool, string) {
	s, ok := r.byType[ch.Type]
	if !ok {
		return false, "неизвестный тип проверки"
	}
	return s.Evaluate(stdout, code, ch)
}

func normalize(s string) string {
	s = strings.ReplaceAll(s, "\r\n", "\n")
	return strings.TrimSpace(s)
}
