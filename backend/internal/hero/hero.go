package hero

import "go-llm-tutor/backend/internal/models"

// Сайдбар совпадает с фронтом: модули курса + финал как «модуль 6».
type sidebarDef struct {
	key         string
	manifestIDs []string
	isFinal     bool
}

var sidebars = []sidebarDef{
	{key: "m1", manifestIDs: []string{"m1"}, isFinal: false},
	{key: "m2", manifestIDs: []string{"m2_1", "m2_2", "m2_3"}, isFinal: false},
	{key: "m3", manifestIDs: []string{"m3"}, isFinal: false},
	{key: "m4", manifestIDs: []string{"m4"}, isFinal: false},
	{key: "m5", manifestIDs: []string{"m5"}, isFinal: false},
	{key: "m6", manifestIDs: nil, isFinal: true},
}

// LevelTitles — шесть уровней героя (по одному на завершённый модуль слева направо).
var LevelTitles = []string{
	"Маэстро",
	"Интеллектуал",
	"Профессор",
	"Чемпион",
	"Академик",
	"Легенда Go",
}

const FormulaVersion = "v1"

func findModule(manifest *models.CourseManifest, id string) *models.Module {
	for i := range manifest.Modules {
		if manifest.Modules[i].ID == id {
			return &manifest.Modules[i]
		}
	}
	return nil
}

func lessonIDsForSidebar(def sidebarDef, manifest *models.CourseManifest) []string {
	if def.isFinal {
		return nil
	}
	var out []string
	for _, mid := range def.manifestIDs {
		mod := findModule(manifest, mid)
		if mod == nil {
			continue
		}
		for _, lr := range mod.Lessons {
			out = append(out, lr.ID)
		}
	}
	return out
}

func sidebarComplete(def sidebarDef, completed map[string]bool, manifest *models.CourseManifest, finalDone bool) bool {
	if def.isFinal {
		return finalDone
	}
	for _, id := range lessonIDsForSidebar(def, manifest) {
		if !completed[id] {
			return false
		}
	}
	return true
}

// MaxConsecutiveSidebarCleared — сколько модулей подряд с начала закрыто (0…6).
func MaxConsecutiveSidebarCleared(manifest *models.CourseManifest, completed map[string]bool, finalDone bool) int {
	n := 0
	for _, def := range sidebars {
		if !sidebarComplete(def, completed, manifest, finalDone) {
			break
		}
		n++
	}
	return n
}

func countLessonsPassed(completed map[string]bool) int {
	c := 0
	for _, v := range completed {
		if v {
			c++
		}
	}
	return c
}

// ProgressToNextLevelPct — процент прохождения текущего (первого незакрытого) модуля.
func ProgressToNextLevelPct(manifest *models.CourseManifest, completed map[string]bool, finalDone bool) int {
	for _, def := range sidebars {
		if sidebarComplete(def, completed, manifest, finalDone) {
			continue
		}
		if def.isFinal {
			if finalDone {
				return 100
			}
			return 0
		}
		ids := lessonIDsForSidebar(def, manifest)
		if len(ids) == 0 {
			return 0
		}
		done := 0
		for _, id := range ids {
			if completed[id] {
				done++
			}
		}
		return (done * 100) / len(ids)
	}
	return 100
}

// Result — ответ API расчёта уровня (формула v1: последовательное прохождение m1…m6).
type Result struct {
	Level               int    `json:"level"`
	LevelTitle          string `json:"level_title"`
	LessonsPassed       int    `json:"lessons_passed"`
	TasksPassed         int    `json:"tasks_passed"`
	MaxLevel            int    `json:"max_level"`
	NextLevelTitle      string `json:"next_level_title"`
	ProgressToNextPct   int    `json:"progress_to_next_pct"`
	BossGolangDefeated  bool   `json:"boss_golang_defeated"`
	FormulaVersion      string `json:"formula_version"`
	NoviceTitle         string `json:"novice_title"`
}

// Compute формула уровня: ключ — число подряд завершённых модулей сайдбара; задание = успешная песочница урока.
func Compute(manifest *models.CourseManifest, completed map[string]bool, finalDone bool) Result {
	if completed == nil {
		completed = map[string]bool{}
	}
	n := MaxConsecutiveSidebarCleared(manifest, completed, finalDone)
	lp := countLessonsPassed(completed)
	pct := ProgressToNextLevelPct(manifest, completed, finalDone)

	res := Result{
		LessonsPassed:      lp,
		TasksPassed:        lp,
		MaxLevel:           6,
		ProgressToNextPct:  pct,
		BossGolangDefeated: n >= 6,
		FormulaVersion:     FormulaVersion,
		NoviceTitle:        "Стажёр тура",
		Level:              n,
	}

	if n == 0 {
		res.LevelTitle = ""
		if len(sidebars) > 0 && !sidebars[0].isFinal {
			res.NextLevelTitle = LevelTitles[0]
		}
		return res
	}
	if n <= len(LevelTitles) {
		res.LevelTitle = LevelTitles[n-1]
	}
	if n < 6 {
		res.NextLevelTitle = LevelTitles[n]
	}
	return res
}
