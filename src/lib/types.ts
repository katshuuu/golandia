export interface Lesson {
  id: string;
  title: string;
  content: string;
  order_num: number;
  difficulty: number;
  created_at: string;
  module_id?: string;
}

export interface Task {
  id: string;
  lesson_id: string;
  description: string;
  starter_code: string;
  expected_output: string;
  hint: string;
  order_num: number;
}

export interface Solution {
  id: string;
  user_id: string;
  task_id: string;
  code: string;
  status: 'pending' | 'solved' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  lesson_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export type TaskCheck =
  | { type: 'output'; expected: string }
  | { type: 'contains'; contains: string[] }
  | { type: 'regex'; pattern: string }
  | {
      type: 'combined';
      expected_output?: string;
      output_contains?: string[];
      output_regex?: string;
      required_code?: string[];
      forbidden_substr?: string[];
    }
  | { type: 'forbidden'; forbidden_substr?: string[] };

export interface BackendLessonTask {
  description: string;
  starter_code: string;
  check: TaskCheck;
}

export interface BackendLesson {
  id: string;
  title: string;
  theory_html: string;
  demo_code: string;
  task: BackendLessonTask;
  module_id: string;
  order: number;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: Array<{
    id: string;
    title: string;
  }>;
  lesson_ids?: string[];
}

export interface CourseManifest {
  title: string;
  subtitle: string;
  intro_html: string;
  final_project: {
    title: string;
    goals: string[];
    starter_code: string;
    hints: string[];
    check: TaskCheck;
  };
  modules: CourseModule[];
}

export type Page = 'auth' | 'dashboard' | 'lesson' | 'profile' | 'achievements';
