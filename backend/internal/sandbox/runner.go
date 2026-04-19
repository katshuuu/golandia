package sandbox

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

type Runner interface {
	Run(ctx context.Context, code string) (string, error)
}

// LocalRunner — локальный go run (не для продакшена без ограничений).
type LocalRunner struct {
	Timeout time.Duration
}

func (r LocalRunner) Run(ctx context.Context, code string) (string, error) {
	if r.Timeout <= 0 {
		r.Timeout = 8 * time.Second
	}
	ctx, cancel := context.WithTimeout(ctx, r.Timeout)
	defer cancel()

	tmpDir, err := os.MkdirTemp("", "gosandbox-*")
	if err != nil {
		return "", err
	}
	defer os.RemoveAll(tmpDir)

	mod := `module sandboxtmp

go 1.22
`
	if err := os.WriteFile(filepath.Join(tmpDir, "go.mod"), []byte(mod), 0o600); err != nil {
		return "", err
	}
	mainPath := filepath.Join(tmpDir, "main.go")
	if err := os.WriteFile(mainPath, []byte(code), 0o600); err != nil {
		return "", err
	}
	cmd := exec.CommandContext(ctx, "go", "run", ".")
	cmd.Dir = tmpDir
	out, err := cmd.CombinedOutput()
	return string(out), err
}

// DockerRunner — изолированный запуск кода в отдельном контейнере.
type DockerRunner struct {
	Image   string
	Timeout time.Duration
}

func (r DockerRunner) Run(ctx context.Context, code string) (string, error) {
	if r.Timeout <= 0 {
		r.Timeout = 8 * time.Second
	}
	if strings.TrimSpace(r.Image) == "" {
		r.Image = "go-llm-sandbox:latest"
	}

	ctx, cancel := context.WithTimeout(ctx, r.Timeout)
	defer cancel()

	tmpDir, err := os.MkdirTemp("", "gosandbox-docker-*")
	if err != nil {
		return "", err
	}
	defer os.RemoveAll(tmpDir)

	mod := `module sandboxtmp

go 1.22
`
	if err := os.WriteFile(filepath.Join(tmpDir, "go.mod"), []byte(mod), 0o600); err != nil {
		return "", err
	}
	if err := os.WriteFile(filepath.Join(tmpDir, "main.go"), []byte(code), 0o600); err != nil {
		return "", err
	}

	args := []string{
		"run", "--rm",
		"--network", "none",
		"--cpus", "0.50",
		"--memory", "128m",
		"--pids-limit", "64",
		"--security-opt", "no-new-privileges",
		"--read-only",
		"--tmpfs", "/tmp:rw,noexec,nosuid,size=64m",
		"-e", "GOCACHE=/tmp/go-cache",
		"-e", "GOMODCACHE=/tmp/go-mod",
		"-e", "GOTMPDIR=/tmp/go-tmp",
		"-v", fmt.Sprintf("%s:/workspace:rw", tmpDir),
		"-w", "/workspace",
		r.Image,
		"sh", "-lc", "go run .",
	}

	cmd := exec.CommandContext(ctx, "docker", args...)
	out, err := cmd.CombinedOutput()
	if ctx.Err() == context.DeadlineExceeded {
		return string(out), fmt.Errorf("sandbox timeout exceeded")
	}
	if err != nil {
		return string(out), err
	}
	return string(out), nil
}

func NewRunnerFromEnv() Runner {
	mode := strings.ToLower(strings.TrimSpace(os.Getenv("SANDBOX_MODE")))
	if mode == "local" {
		return LocalRunner{}
	}
	return DockerRunner{
		Image:   os.Getenv("SANDBOX_IMAGE"),
		Timeout: 8 * time.Second,
	}
}
