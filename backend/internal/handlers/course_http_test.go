package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestCourseManifestHTTP(t *testing.T) {
	gin.SetMode(gin.TestMode)
	svc := newTestCourseService(t)
	h := NewCourseHandler(svc)

	r := gin.New()
	r.GET("/api/course", h.Manifest)

	req := httptest.NewRequest(http.MethodGet, "/api/course", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
	}
	if cc := w.Header().Get("Cache-Control"); cc != "private, max-age=120" {
		t.Fatalf("cache-control=%q", cc)
	}
	var body map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body["title"] == nil || body["title"] == "" {
		t.Fatalf("unexpected body: %v", body)
	}
}

func TestCourseLessonHTTP(t *testing.T) {
	gin.SetMode(gin.TestMode)
	svc := newTestCourseService(t)
	h := NewCourseHandler(svc)

	r := gin.New()
	r.GET("/api/lessons/:id", h.Lesson)

	req := httptest.NewRequest(http.MethodGet, "/api/lessons/l1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
	}

	req404 := httptest.NewRequest(http.MethodGet, "/api/lessons/no-such-lesson", nil)
	w404 := httptest.NewRecorder()
	r.ServeHTTP(w404, req404)
	if w404.Code != http.StatusNotFound {
		t.Fatalf("status=%d", w404.Code)
	}
}
