package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go-llm-tutor/backend/internal/course"
	"go-llm-tutor/backend/internal/db"
	"go-llm-tutor/backend/internal/handlers"
	"go-llm-tutor/backend/internal/middleware"
	"go-llm-tutor/backend/internal/repository"
	"go-llm-tutor/backend/internal/sandbox"
)

// tryLoadEnv загружает один файл .env; true если успешно прочитали и применили.
func tryLoadEnv(path string) bool {
	st, err := os.Stat(path)
	if err != nil || st.IsDir() {
		return false
	}
	if err := godotenv.Load(path); err != nil {
		log.Printf("env: не удалось прочитать %s: %v", path, err)
		return false
	}
	log.Printf("env: загружен %s", path)
	return true
}

// loadEnvFile ищет .env так, чтобы находить backend/.env из корня монорепо и из cmd/server при go run.
func loadEnvFile() {
	wd, err := os.Getwd()
	if err != nil {
		return
	}

	ordered := []string{
		filepath.Join(wd, "backend", ".env"),
		filepath.Join(wd, ".env"),
	}
	dir := wd
	for i := 0; i < 10; i++ {
		ordered = append(ordered, filepath.Join(dir, ".env"))
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}

	seen := map[string]struct{}{}
	for _, p := range ordered {
		if p == "" {
			continue
		}
		if abs, err := filepath.Abs(p); err == nil {
			p = abs
		}
		if _, ok := seen[p]; ok {
			continue
		}
		seen[p] = struct{}{}
		if tryLoadEnv(p) {
			return
		}
	}
}

func main() {
	loadEnvFile()

	gin.SetMode(gin.ReleaseMode)

	dataDir := os.Getenv("COURSE_DATA_DIR")
	if dataDir == "" {
		wd, _ := os.Getwd()
		// backend/data/lessons или вложение dataDir/lessons (см. internal/course/loader.go)
		for _, try := range []string{
			filepath.Join(wd, "data", "lessons"),
			filepath.Join(wd, "..", "data", "lessons"),
			filepath.Join(wd, "..", "..", "data", "lessons"),
			filepath.Join(wd, "..", "lessons"),
			filepath.Join(wd, "lessons"),
			filepath.Join(wd, "data"),
			filepath.Join(wd, "backend", "data", "lessons"),
		} {
			if st, err := os.Stat(filepath.Join(try, "course_manifest.json")); err == nil && !st.IsDir() {
				dataDir = try
				break
			}
		}
		if dataDir == "" {
			dataDir = filepath.Join(wd, "data", "lessons")
		}
	}

	svc, err := course.NewService(dataDir)
	if err != nil {
		log.Fatal(err)
	}

	ch := handlers.NewCourseHandler(svc)
	sh := handlers.NewSandboxHandler(sandbox.NewRunnerFromEnv())
	tutor := handlers.NewChatHandler()
	hh := handlers.NewHeroHandler(svc)

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery(), middleware.ResponseTimeLog())
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173", "http://127.0.0.1:5173",
			"http://localhost:5174", "http://127.0.0.1:5174",
		},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	r.GET("/api/health", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) })
	r.GET("/api/course", ch.Manifest)
	r.GET("/api/lessons/:id", ch.Lesson)
	r.POST("/api/sandbox/run", sh.Run)
	r.POST("/api/lessons/check", handlers.CheckLesson)
	r.POST("/api/chat/tutor", tutor.Tutor)
	r.POST("/api/hero-level/compute", hh.ComputeLevel)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if pool, err := db.OpenPool(ctx); err == nil {
		defer pool.Close()
		userRepo := repository.NewUserRepository(pool)
		uh := handlers.NewUserHandler(userRepo)
		api := r.Group("/api/users/:id")
		{
			api.GET("/profile", uh.GetProfile)
			api.PUT("/profile", uh.PutProfile)
			api.GET("/progress", uh.GetProgress)
			api.PUT("/progress", uh.PutProgress)
		}
		log.Println("postgres: подключено, API профиля и прогресса активен")
	} else {
		log.Printf("postgres: не подключено (%v), работа без персистентного профиля", err)
	}

	addr := ":8080"
	if v := os.Getenv("PORT"); v != "" {
		addr = ":" + v
	}
	log.Println("listening on", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}
