package handlers

import (
	"os"
	"path/filepath"
	"testing"

	"go-llm-tutor/backend/internal/course"
)

func newTestCourseService(t *testing.T) *course.Service {
	t.Helper()
	wd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	candidates := []string{
		filepath.Join(wd, "..", "course", "testdata"),
		filepath.Join(wd, "..", "..", "data", "lessons"),
	}
	for _, dir := range candidates {
		if _, err := os.Stat(filepath.Join(dir, "course_manifest.json")); err == nil {
			svc, err := course.NewService(dir)
			if err != nil {
				t.Fatalf("NewService(%s): %v", dir, err)
			}
			return svc
		}
	}
	t.Fatal("course test data not found")
	return nil
}
