package course

import (
	"path/filepath"
	"testing"
)

func TestNewServiceFromTestdata(t *testing.T) {
	dir := filepath.Join("testdata")
	svc, err := NewService(dir)
	if err != nil {
		t.Fatalf("NewService: %v", err)
	}

	m := svc.Manifest()
	if m.Title != "Test course" {
		t.Fatalf("title=%q", m.Title)
	}
	if len(m.Modules) != 1 || m.Modules[0].ID != "m1" {
		t.Fatalf("modules=%+v", m.Modules)
	}

	lesson, ok := svc.Lesson("l1")
	if !ok {
		t.Fatal("lesson l1 not found")
	}
	if lesson.Task.Check.Type != "output" {
		t.Fatalf("check type=%q", lesson.Task.Check.Type)
	}

	final, ok := svc.Lesson(FinalLessonID)
	if !ok {
		t.Fatal("final lesson not found")
	}
	if final.Title != "Финальный проект" {
		t.Fatalf("final title=%q", final.Title)
	}

	ordered := svc.AllLessonsOrdered()
	if len(ordered) < 2 {
		t.Fatalf("expected at least 2 lessons, got %d", len(ordered))
	}
}

func TestLessonNotFound(t *testing.T) {
	svc, err := NewService(filepath.Join("testdata"))
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := svc.Lesson("missing-id"); ok {
		t.Fatal("expected missing lesson")
	}
}
