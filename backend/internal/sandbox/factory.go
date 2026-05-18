package sandbox

import (
	"os"
	"strings"
	"time"
)

// RunnerFactory — паттерн «Фабричный метод»: создание Runner по конфигурации окружения.
type RunnerFactory struct{}

func NewRunnerFactory() RunnerFactory {
	return RunnerFactory{}
}

func (RunnerFactory) Create() Runner {
	mode := strings.ToLower(strings.TrimSpace(os.Getenv("SANDBOX_MODE")))
	if mode == "local" {
		return LocalRunner{Timeout: 8 * time.Second}
	}
	return DockerRunner{
		Image:   os.Getenv("SANDBOX_IMAGE"),
		Timeout: 8 * time.Second,
	}
}

// NewRunnerFromEnv сохраняет совместимость с существующим кодом.
func NewRunnerFromEnv() Runner {
	return NewRunnerFactory().Create()
}
