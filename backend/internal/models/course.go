package models

// TaskCheck описывает автоматическую проверку задания.
type TaskCheck struct {
	Type            string   `json:"type"` // "output" | "contains" | "regex" | "forbidden"
	Expected        string   `json:"expected,omitempty"`
	Contains        []string `json:"contains,omitempty"`
	Pattern         string   `json:"pattern,omitempty"`
	ForbiddenSubstr []string `json:"forbidden_substr,omitempty"`
}

// LessonTask — практика в песочнице.
type LessonTask struct {
	Description string    `json:"description"`
	StarterCode string    `json:"starter_code"`
	Check       TaskCheck `json:"check"`
}

// Lesson — одно занятие курса.
type Lesson struct {
	ID                string     `json:"id"`
	Title             string     `json:"title"`
	Summary           string     `json:"summary"`
	TheoryHTML        string     `json:"theory_html"`
	DemoCode          string     `json:"demo_code"`
	Task              LessonTask `json:"task"`
	SocraticQuestions []string   `json:"socratic_questions"`
	CheckKeyPoints    []string   `json:"check_key_points"`
	ModuleID          string     `json:"module_id"`
	Order             int        `json:"order"`
}

// LessonRef — ссылка на урок в оглавлении.
type LessonRef struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}

// Module — раздел курса.
type Module struct {
	ID          string            `json:"id"`
	Title       string            `json:"title"`
	Description string            `json:"description"`
	Lessons     []LessonRef       `json:"lessons"`
	LessonIDs   []string          `json:"lesson_ids,omitempty"`
	MiniProject ModuleMiniProject `json:"mini_project"`
}

// ModuleMiniProject — мини-проект после завершения модуля.
type ModuleMiniProject struct {
	Title        string   `json:"title"`
	WhyItMatters string   `json:"why_it_matters"`
	Scenario     string   `json:"scenario"`
	Steps        []string `json:"steps"`
	Deliverable  string   `json:"deliverable"`
}

// CourseManifest — дерево курса без полного текста уроков (для оглавления).
type CourseManifest struct {
	Title        string           `json:"title"`
	Subtitle     string           `json:"subtitle"`
	IntroHTML    string           `json:"intro_html"`
	FinalProject FinalMiniProject `json:"final_project"`
	Modules      []Module         `json:"modules"`
}

// FinalMiniProject — итоговый мини-проект.
type FinalMiniProject struct {
	Title       string    `json:"title"`
	Summary     string    `json:"summary"`
	Goals       []string  `json:"goals"`
	StarterCode string    `json:"starter_code"`
	Hints       []string  `json:"hints"`
	Check       TaskCheck `json:"check"`
}
