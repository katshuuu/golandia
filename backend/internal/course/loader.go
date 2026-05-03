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

const theoryOverlayDirName = "theory_html"

// readTheoryOverlay returns HTML из theory_html/<name>, если файл существует (удобнее, чем длинная строка в JSON).
func readTheoryOverlay(dataDir string, filename string) (string, bool) {
	path := filepath.Join(dataDir, theoryOverlayDirName, filename)
	b, err := os.ReadFile(path)
	if err != nil {
		return "", false
	}
	return strings.TrimSpace(string(b)), true
}

// lessonModulePaths supports either:
// - legacy layout: dataDir/lessons/module_*.json
// - flat layout (repo-root lessons/): dataDir/module_*.json
func lessonModulePaths(dataDir string) ([]string, error) {
	nested := filepath.Join(dataDir, "lessons")
	if st, err := os.Stat(nested); err == nil && st.IsDir() {
		entries, err := os.ReadDir(nested)
		if err != nil {
			return nil, fmt.Errorf("read lessons dir: %w", err)
		}
		var out []string
		for _, e := range entries {
			if e.IsDir() || !strings.HasSuffix(strings.ToLower(e.Name()), ".json") {
				continue
			}
			out = append(out, filepath.Join(nested, e.Name()))
		}
		return out, nil
	}

	entries, err := os.ReadDir(dataDir)
	if err != nil {
		return nil, fmt.Errorf("read course data dir: %w", err)
	}
	var out []string
	for _, e := range entries {
		name := e.Name()
		if e.IsDir() || !strings.HasSuffix(strings.ToLower(name), ".json") {
			continue
		}
		if strings.HasPrefix(strings.ToLower(name), "module_") {
			out = append(out, filepath.Join(dataDir, name))
		}
	}
	return out, nil
}

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
	if intro, ok := readTheoryOverlay(dataDir, "_intro.html"); ok && intro != "" {
		manifest.IntroHTML = intro
	}

	lessonPaths, err := lessonModulePaths(dataDir)
	if err != nil {
		return nil, err
	}

	lessons := make(map[string]models.Lesson)
	for _, path := range lessonPaths {
		b, err := os.ReadFile(path)
		if err != nil {
			return nil, err
		}
		var wrap struct {
			Lessons []models.Lesson `json:"lessons"`
		}
		if err := json.Unmarshal(b, &wrap); err != nil {
			return nil, fmt.Errorf("%s: %w", filepath.Base(path), err)
		}
		for _, l := range wrap.Lessons {
			lessons[l.ID] = l
		}
	}

	for id, l := range lessons {
		if html, ok := readTheoryOverlay(dataDir, id+".html"); ok && html != "" {
			l.TheoryHTML = html
			lessons[id] = l
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
