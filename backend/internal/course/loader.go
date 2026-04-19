package course

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"go-llm-tutor/backend/internal/models"
)

type Service struct {
	manifest models.CourseManifest
	lessons  map[string]models.Lesson
}

func NewService(dataDir string) (*Service, error) {
	manifestPath := filepath.Join(dataDir, "course_manifest.json")
	raw, err := os.ReadFile(manifestPath)
	if err != nil {
		return nil, fmt.Errorf("read manifest: %w", err)
	}
	var manifest models.CourseManifest
	if err := json.Unmarshal(raw, &manifest); err != nil {
		return nil, fmt.Errorf("manifest json: %w", err)
	}

	lessonsDir := filepath.Join(dataDir, "lessons")
	entries, err := os.ReadDir(lessonsDir)
	if err != nil {
		return nil, fmt.Errorf("read lessons dir: %w", err)
	}

	lessons := make(map[string]models.Lesson)
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(strings.ToLower(e.Name()), ".json") {
			continue
		}
		b, err := os.ReadFile(filepath.Join(lessonsDir, e.Name()))
		if err != nil {
			return nil, err
		}
		var wrap struct {
			Lessons []models.Lesson `json:"lessons"`
		}
		if err := json.Unmarshal(b, &wrap); err != nil {
			return nil, fmt.Errorf("%s: %w", e.Name(), err)
		}
		for _, l := range wrap.Lessons {
			lessons[l.ID] = l
		}
	}

	return &Service{manifest: manifest, lessons: lessons}, nil
}

func (s *Service) Manifest() models.CourseManifest { return s.manifest }

func (s *Service) Lesson(id string) (models.Lesson, bool) {
	l, ok := s.lessons[id]
	return l, ok
}

func (s *Service) AllLessonsOrdered() []models.Lesson {
	out := make([]models.Lesson, 0, len(s.lessons))
	for _, l := range s.lessons {
		out = append(out, l)
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].ModuleID != out[j].ModuleID {
			return out[i].ModuleID < out[j].ModuleID
		}
		return out[i].Order < out[j].Order
	})
	return out
}
