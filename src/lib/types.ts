export interface Lesson {
  id: string;
  title: string;
  content: string;
  order_num: number;
  difficulty: number;
  created_at: string;
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

export type Page = 'auth' | 'dashboard' | 'lesson';
