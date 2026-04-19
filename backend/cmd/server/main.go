package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go-llm-tutor/backend/internal/course"
	"go-llm-tutor/backend/internal/handlers"
	"go-llm-tutor/backend/internal/sandbox"
)

func main() {
	gin.SetMode(gin.ReleaseMode)

	dataDir := os.Getenv("COURSE_DATA_DIR")
	if dataDir == "" {
		wd, _ := os.Getwd()
		dataDir = filepath.Join(wd, "data")
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
	r.Use(gin.Logger(), gin.Recovery())
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"},
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

	addr := ":8080"
	if v := os.Getenv("PORT"); v != "" {
		addr = ":" + v
	}
	log.Println("listening on", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}
