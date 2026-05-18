package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"go-llm-tutor/backend/internal/models"
)

func TestCheckLessonHTTP(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/api/lessons/check", CheckLesson)

	body, _ := json.Marshal(map[string]any{
		"stdout": "42",
		"code":   "package main",
		"check":  models.TaskCheck{Type: "output", Expected: "42"},
	})
	req := httptest.NewRequest(http.MethodPost, "/api/lessons/check", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
	}
	var resp map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}
	if resp["ok"] != true {
		t.Fatalf("resp=%v", resp)
	}
}

func TestCheckLessonHTTPFail(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/api/lessons/check", CheckLesson)

	body, _ := json.Marshal(map[string]any{
		"stdout": "wrong",
		"code":   "package main",
		"check":  models.TaskCheck{Type: "output", Expected: "42"},
	})
	req := httptest.NewRequest(http.MethodPost, "/api/lessons/check", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status=%d", w.Code)
	}
	var resp map[string]any
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["ok"] != false {
		t.Fatalf("resp=%v", resp)
	}
}

func TestCheckLessonHTTPBadJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/api/lessons/check", CheckLesson)

	req := httptest.NewRequest(http.MethodPost, "/api/lessons/check", bytes.NewReader([]byte("not-json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
	}
}
