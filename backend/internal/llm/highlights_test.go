package llm

import "testing"

func TestParseTutorJSONContent(t *testing.T) {
	raw := `{"reply":"Смотри импорт.","highlights":[{"target":"user_code","line_start":3,"line_end":3,"snippet":"import fmt"}]}`
	got := parseTutorJSONContent(raw)
	if got.Reply != "Смотри импорт." {
		t.Fatalf("reply=%q", got.Reply)
	}
	if len(got.Highlights) != 1 || got.Highlights[0].Target != "user_code" {
		t.Fatalf("highlights=%+v", got.Highlights)
	}
}

func TestParseTutorJSONContentPlainFallback(t *testing.T) {
	got := parseTutorJSONContent("Просто текст без JSON")
	if got.Reply != "Просто текст без JSON" || len(got.Highlights) != 0 {
		t.Fatalf("got=%+v", got)
	}
}

func TestNormalizeHighlightsSkipsUnknownTarget(t *testing.T) {
	got := normalizeHighlights([]CodeHighlight{{Target: "sandbox", LineStart: 1, LineEnd: 2}})
	if len(got) != 0 {
		t.Fatalf("got=%+v", got)
	}
}
