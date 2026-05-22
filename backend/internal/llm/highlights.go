package llm

import (
	"encoding/json"
	"strings"
)

// CodeHighlight — диапазон строк для подсветки на странице урока.
type CodeHighlight struct {
	Target    string `json:"target"`
	LineStart int    `json:"line_start"`
	LineEnd   int    `json:"line_end"`
	Snippet   string `json:"snippet,omitempty"`
}

// TutorResult — ответ репетитора для чата и UI подсветки кода.
type TutorResult struct {
	Reply      string
	Highlights []CodeHighlight
}

type tutorJSONResponse struct {
	Reply      string          `json:"reply"`
	Highlights []CodeHighlight `json:"highlights"`
}

func parseTutorJSONContent(raw string) TutorResult {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return TutorResult{}
	}
	var parsed tutorJSONResponse
	if err := json.Unmarshal([]byte(raw), &parsed); err != nil {
		return TutorResult{Reply: raw, Highlights: nil}
	}
	reply := strings.TrimSpace(parsed.Reply)
	if reply == "" {
		reply = raw
	}
	return TutorResult{
		Reply:      reply,
		Highlights: normalizeHighlights(parsed.Highlights),
	}
}

func normalizeHighlights(in []CodeHighlight) []CodeHighlight {
	out := make([]CodeHighlight, 0, len(in))
	for _, h := range in {
		target := strings.TrimSpace(strings.ToLower(h.Target))
		switch target {
		case "user_code", "theory_demo", "theory_page":
		default:
			continue
		}
		start := h.LineStart
		end := h.LineEnd
		if start < 1 {
			start = 1
		}
		if end < start {
			end = start
		}
		if end-start > 80 {
			end = start + 80
		}
		out = append(out, CodeHighlight{
			Target:    target,
			LineStart: start,
			LineEnd:   end,
			Snippet:   strings.TrimSpace(h.Snippet),
		})
	}
	return out
}
