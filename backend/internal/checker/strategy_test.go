package checker

import (
	"testing"

	"go-llm-tutor/backend/internal/models"
)

func TestOutputStrategy(t *testing.T) {
	reg := NewRegistry()
	ok, reason := reg.Evaluate("Hello\n", "", models.TaskCheck{
		Type:     "output",
		Expected: "Hello",
	})
	if !ok || reason != "" {
		t.Fatalf("expected ok, got ok=%v reason=%q", ok, reason)
	}
}

func TestContainsStrategy(t *testing.T) {
	reg := NewRegistry()
	ok, _ := reg.Evaluate("fmt.Println(42)", "", models.TaskCheck{
		Type:     "contains",
		Contains: []string{"42"},
	})
	if !ok {
		t.Fatal("expected contains pass")
	}
	ok, reason := reg.Evaluate("x", "", models.TaskCheck{
		Type:     "contains",
		Contains: []string{"missing"},
	})
	if ok || reason == "" {
		t.Fatalf("expected fail, ok=%v reason=%q", ok, reason)
	}
}

func TestForbiddenStrategy(t *testing.T) {
	reg := NewRegistry()
	ok, reason := reg.Evaluate("", `import "os"`, models.TaskCheck{
		Type:            "forbidden",
		ForbiddenSubstr: []string{"os"},
	})
	if ok {
		t.Fatal("expected forbidden fail")
	}
	if reason == "" {
		t.Fatal("expected reason")
	}
}

func TestUnknownType(t *testing.T) {
	reg := NewRegistry()
	ok, reason := reg.Evaluate("", "", models.TaskCheck{Type: "unknown"})
	if ok || reason != "неизвестный тип проверки" {
		t.Fatalf("got ok=%v reason=%q", ok, reason)
	}
}

func TestRegexStrategy(t *testing.T) {
	reg := NewRegistry()
	ok, _ := reg.Evaluate("answer: 42", "", models.TaskCheck{
		Type:    "regex",
		Pattern: `answer:\s*\d+`,
	})
	if !ok {
		t.Fatal("expected regex pass")
	}
	ok, reason := reg.Evaluate("nope", "", models.TaskCheck{Type: "regex", Pattern: `^\d+$`})
	if ok || reason == "" {
		t.Fatalf("expected fail, ok=%v reason=%q", ok, reason)
	}
}

func TestOutputNormalizesWhitespace(t *testing.T) {
	reg := NewRegistry()
	ok, reason := reg.Evaluate("  Hello \r\n", "", models.TaskCheck{
		Type:     "output",
		Expected: "Hello",
	})
	if !ok || reason != "" {
		t.Fatalf("expected ok, got ok=%v reason=%q", ok, reason)
	}
}
