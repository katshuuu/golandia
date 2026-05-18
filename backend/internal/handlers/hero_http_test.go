package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHeroComputeLevelHTTP(t *testing.T) {
	gin.SetMode(gin.TestMode)
	svc := newTestCourseService(t)
	h := NewHeroHandler(svc)

	r := gin.New()
	r.POST("/api/hero-level/compute", h.ComputeLevel)

	body, _ := json.Marshal(map[string]any{
		"completed_lessons": map[string]bool{"l1": true},
		"final_project_done": false,
	})
	req := httptest.NewRequest(http.MethodPost, "/api/hero-level/compute", bytes.NewReader(body))
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
	if resp["formula_version"] != "v1" {
		t.Fatalf("formula_version=%v", resp["formula_version"])
	}
	if resp["novice_title"] != "Стажёр" {
		t.Fatalf("novice_title=%v", resp["novice_title"])
	}
}

func TestHeroComputeLevelBadJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewHeroHandler(newTestCourseService(t))
	r := gin.New()
	r.POST("/api/hero-level/compute", h.ComputeLevel)

	req := httptest.NewRequest(http.MethodPost, "/api/hero-level/compute", bytes.NewReader([]byte("{")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status=%d", w.Code)
	}
}
