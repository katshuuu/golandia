package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestPutProfileValidationDisplayName(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewUserHandler(nil)
	r := gin.New()
	r.PUT("/api/users/:id/profile", h.PutProfile)

	body, _ := json.Marshal(map[string]string{
		"display_name": "bad@name",
		"goal":         "",
		"avatar_data_url": "",
	})
	req := httptest.NewRequest(http.MethodPut, "/api/users/00000000-0000-0000-0000-000000000001/profile", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
	}
	var resp map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}
	fields, ok := resp["fields"].([]any)
	if !ok || len(fields) == 0 {
		t.Fatalf("expected fields, got %v", resp)
	}
}

func TestPutProfileValidationUserID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewUserHandler(nil)
	r := gin.New()
	r.PUT("/api/users/:id/profile", h.PutProfile)

	body, _ := json.Marshal(map[string]string{"display_name": "Анна", "goal": ""})
	req := httptest.NewRequest(http.MethodPut, "/api/users/not-a-uuid/profile", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status=%d", w.Code)
	}
}
