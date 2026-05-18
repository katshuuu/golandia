package hero

import (
	"testing"

	"go-llm-tutor/backend/internal/models"
)

func TestComputeLevelZero(t *testing.T) {
	m := &models.CourseManifest{
		Modules: []models.Module{
			{ID: "m1", Lessons: []models.LessonRef{{ID: "l1"}}},
		},
	}
	r := Compute(m, map[string]bool{}, false)
	if r.Level != 0 {
		t.Fatalf("level=%d", r.Level)
	}
	if r.NoviceTitle != "Стажёр" {
		t.Fatalf("novice=%q", r.NoviceTitle)
	}
}

func TestComputeLevelAfterModule(t *testing.T) {
	// Все модули сайдбара должны присутствовать, иначе пустой список уроков считается «закрытым».
	m := &models.CourseManifest{
		Modules: []models.Module{
			{ID: "m1", Lessons: []models.LessonRef{{ID: "l1"}}},
			{ID: "m2_1", Lessons: []models.LessonRef{{ID: "l2"}}},
			{ID: "m3", Lessons: []models.LessonRef{{ID: "l3"}}},
			{ID: "m4", Lessons: []models.LessonRef{{ID: "l4"}}},
			{ID: "m5", Lessons: []models.LessonRef{{ID: "l5"}}},
		},
	}
	r := Compute(m, map[string]bool{"l1": true}, false)
	if r.Level != 1 || r.LevelTitle != LevelTitles[0] {
		t.Fatalf("level=%d title=%q", r.Level, r.LevelTitle)
	}
}

func TestComputeNilCompletedMap(t *testing.T) {
	m := &models.CourseManifest{
		Modules: []models.Module{{ID: "m1", Lessons: []models.LessonRef{{ID: "l1"}}}},
	}
	r := Compute(m, nil, false)
	if r.Level != 0 || r.FormulaVersion != FormulaVersion {
		t.Fatalf("level=%d formula=%q", r.Level, r.FormulaVersion)
	}
}

func TestProgressToNextLevelPctPartial(t *testing.T) {
	m := &models.CourseManifest{
		Modules: []models.Module{
			{ID: "m1", Lessons: []models.LessonRef{{ID: "l1"}, {ID: "l2"}}},
		},
	}
	pct := ProgressToNextLevelPct(m, map[string]bool{"l1": true}, false)
	if pct != 50 {
		t.Fatalf("pct=%d want 50", pct)
	}
}

func TestMaxConsecutiveSidebarCleared(t *testing.T) {
	m := &models.CourseManifest{
		Modules: []models.Module{
			{ID: "m1", Lessons: []models.LessonRef{{ID: "l1"}}},
			{ID: "m2_1", Lessons: []models.LessonRef{{ID: "l2"}}},
		},
	}
	n := MaxConsecutiveSidebarCleared(m, map[string]bool{"l1": true}, false)
	if n != 1 {
		t.Fatalf("n=%d want 1", n)
	}
}
