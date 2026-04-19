import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import LessonPage from './pages/LessonPage';
import { Lesson, Page } from './lib/types';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });
  const [page, setPage] = useState<Page>('dashboard');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tasksByLesson, setTasksByLesson] = useState<Record<string, string[]>>({});
  const [solvedTaskIds, setSolvedTaskIds] = useState<Set<string>>(new Set());
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, user]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  async function loadData() {
    setDataLoading(true);

    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('*')
      .order('order_num');

    if (lessonsData) {
      setLessons(lessonsData as Lesson[]);
    }

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('id, lesson_id')
      .order('order_num');

    if (tasksData) {
      const byLesson: Record<string, string[]> = {};
      tasksData.forEach(t => {
        if (!byLesson[t.lesson_id]) byLesson[t.lesson_id] = [];
        byLesson[t.lesson_id].push(t.id);
      });
      setTasksByLesson(byLesson);

      if (user) {
        await loadSolutions(tasksData.map(t => t.id));
      }
    }

    setDataLoading(false);
  }

  async function loadSolutions(taskIds: string[]) {
    if (!user || taskIds.length === 0) return;

    const { data } = await supabase
      .from('solutions')
      .select('task_id, status')
      .eq('user_id', user.id)
      .in('task_id', taskIds)
      .eq('status', 'solved');

    if (data) {
      setSolvedTaskIds(new Set(data.map(s => s.task_id)));
    }
  }

  function handleSelectLesson(id: string) {
    setCurrentLessonId(id);
    setPage('lesson');
  }

  function handleGoHome() {
    setPage('dashboard');
    setCurrentLessonId(null);
  }

  function handleSolutionUpdate() {
    const allTaskIds = Object.values(tasksByLesson).flat();
    loadSolutions(allTaskIds);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center">
        <Loader2 size={24} className="text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const currentLesson = lessons.find(l => l.id === currentLessonId) || null;
  const totalTasks = Object.values(tasksByLesson).flat().length;

  return (
    <div className="h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col overflow-hidden transition-colors">
      <Header
        solvedCount={solvedTaskIds.size}
        totalCount={totalTasks}
        onGoHome={handleGoHome}
        theme={theme}
        onToggleTheme={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
      />

      <div className="flex flex-1 overflow-hidden">
        {!dataLoading && (
          <Sidebar
            lessons={lessons}
            solvedTaskIds={solvedTaskIds}
            tasksByLesson={tasksByLesson}
            currentLessonId={currentLessonId}
            onSelectLesson={handleSelectLesson}
          />
        )}

        <main className="flex-1 overflow-hidden flex flex-col">
          {dataLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 size={32} className="text-cyan-400 animate-spin mx-auto mb-3" />
                <p className="text-[var(--text-secondary)] text-sm">Загружаем курс...</p>
              </div>
            </div>
          ) : page === 'lesson' && currentLesson ? (
            <LessonPage
              lesson={currentLesson}
              onBack={handleGoHome}
              onSolutionUpdate={handleSolutionUpdate}
            />
          ) : (
            <Dashboard
              lessons={lessons}
              solvedTaskIds={solvedTaskIds}
              tasksByLesson={tasksByLesson}
              onSelectLesson={handleSelectLesson}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
