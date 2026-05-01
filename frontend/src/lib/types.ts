export type TaskCheck =
  | { type: "output"; expected: string }
  | { type: "contains"; contains: string[] }
  | { type: "regex"; pattern: string }
  | { type: "forbidden"; forbidden_substr?: string[] };

export interface LessonTask {
  description: string;
  starter_code: string;
  check: TaskCheck;
}

export interface Lesson {
  id: string;
  title: string;
  theory_html: string;
  demo_code: string;
  task: LessonTask;
  module_id: string;
  order: number;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  mini_project: {
    title: string;
    why_it_matters: string;
    scenario: string;
    steps: string[];
    deliverable: string;
  };
  lessons: Array<{
    id: string;
    title: string;
  }>;
  lesson_ids?: string[];
}

export interface FinalMiniProject {
  title: string;
  goals: string[];
  starter_code: string;
  hints: string[];
  check: TaskCheck;
}

export interface CourseManifest {
  title: string;
  subtitle: string;
  intro_html: string;
  final_project: FinalMiniProject;
  modules: CourseModule[];
}

/** Ответ POST /api/hero-level/compute */
export interface HeroLevelResult {
  level: number;
  level_title: string;
  lessons_passed: number;
  tasks_passed: number;
  max_level: number;
  next_level_title: string;
  progress_to_next_pct: number;
  boss_golang_defeated: boolean;
  formula_version: string;
  novice_title: string;
}
