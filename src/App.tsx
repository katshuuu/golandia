import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import PasswordRecoveryPage from './components/auth/PasswordRecoveryPage';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import LessonPage from './pages/LessonPage';
import ProfilePage from './pages/ProfilePage';
import AchievementsPage from './pages/AchievementsPage';
import { CourseManifest, Lesson, Page } from './lib/types';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';
import { fetchManifest } from './lib/courseApi';
import { trackLearningEvent } from './lib/analytics';

const TASKS_CACHE_KEY = 'go_tutor_tasks_by_lesson_v1';
const SOLVED_CACHE_KEY = (userId: string) => `go_tutor_solved_task_ids_v1_${userId}`;
const GOAL_CACHE_KEY = (userId: string) => `go_tutor_goal_v1_${userId}`;
const VIEWED_LESSONS_CACHE_KEY = (userId: string) => `go_tutor_viewed_lessons_v1_${userId}`;

function readCachedTasksByLesson(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(TASKS_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeCachedTasksByLesson(value: Record<string, string[]>) {
  try {
    localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(value));
  } catch {
    // ignore cache write failures (private mode, quota)
  }
}

function readCachedSolvedTaskIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(SOLVED_CACHE_KEY(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeCachedSolvedTaskIds(userId: string, value: Set<string>) {
  try {
    localStorage.setItem(SOLVED_CACHE_KEY(userId), JSON.stringify(Array.from(value)));
  } catch {
    // ignore cache write failures (private mode, quota)
  }
}

function readCachedViewedLessons(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(VIEWED_LESSONS_CACHE_KEY(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeCachedViewedLessons(userId: string, value: Set<string>) {
  try {
    localStorage.setItem(VIEWED_LESSONS_CACHE_KEY(userId), JSON.stringify(Array.from(value)));
  } catch {
    // ignore cache write failures
  }
}

function readCachedGoal(userId: string): string {
  try {
    return (localStorage.getItem(GOAL_CACHE_KEY(userId)) || '').trim();
  } catch {
    return '';
  }
}

function writeCachedGoal(userId: string, goal: string) {
  try {
    localStorage.setItem(GOAL_CACHE_KEY(userId), goal);
  } catch {
    // ignore cache write failures
  }
}

function AppContent() {
  const { user, loading: authLoading, passwordRecoveryPending } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [manifest, setManifest] = useState<CourseManifest | null>(null);
  const [tasksByLesson, setTasksByLesson] = useState<Record<string, string[]>>({});
  const [solvedTaskIds, setSolvedTaskIds] = useState<Set<string>>(new Set());
  const [viewedLessonIds, setViewedLessonIds] = useState<Set<string>>(new Set());
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [userGoal, setUserGoal] = useState('');
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState('');
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalError, setGoalError] = useState('');

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) {
      setUserGoal('');
      setGoalModalOpen(false);
      setGoalDraft('');
      setGoalError('');
      setGoalSaving(false);
      setViewedLessonIds(new Set());
      return;
    }

    const metadataGoal = String(user.user_metadata?.goal || '').trim();
    const cachedGoal = readCachedGoal(user.id);
    const savedGoal = metadataGoal || cachedGoal;
    setUserGoal(savedGoal);
    if (!savedGoal) {
      setGoalDraft('');
      setGoalModalOpen(true);
    } else {
      setGoalModalOpen(false);
      setGoalDraft(savedGoal);
    }
  }, [user]);

  async function loadData() {
    setDataLoading(true);
    try {
      const manifestData = await fetchManifest();
      setManifest(manifestData);

      let order = 1;
      const lessonList: Lesson[] = [];
      for (const module of manifestData.modules) {
        for (const lesson of module.lessons) {
          lessonList.push({
            id: lesson.id,
            title: lesson.title,
            content: '',
            order_num: order,
            difficulty: 1,
            created_at: '',
            module_id: module.id,
          });
          order += 1;
        }
      }
      setLessons(lessonList);
      // Показываем интерфейс сразу после локального манифеста,
      // не блокируя экран ожиданием сетевых запросов в Supabase.
      setDataLoading(false);
    } catch {
      setLessons([]);
      setManifest(null);
      setDataLoading(false);
      return;
    }

    // stale-while-revalidate: сразу показываем кэш, затем обновляем из сети
    const cachedTasks = readCachedTasksByLesson();
    if (Object.keys(cachedTasks).length > 0) {
      setTasksByLesson(cachedTasks);
    }
    if (user) {
      setSolvedTaskIds(readCachedSolvedTaskIds(user.id));
      setViewedLessonIds(readCachedViewedLessons(user.id));
    } else {
      setSolvedTaskIds(new Set());
      setViewedLessonIds(new Set());
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
      writeCachedTasksByLesson(byLesson);

      if (user) {
        await loadSolutions(tasksData.map(t => t.id));
      }
    }
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
      const solved = new Set(data.map(s => s.task_id));
      setSolvedTaskIds(solved);
      writeCachedSolvedTaskIds(user.id, solved);
    }
  }

  function handleSelectLesson(id: string) {
    setCurrentLessonId(id);
    setPage('lesson');
    if (!user) return;
    trackLearningEvent({ userId: user.id, type: 'lesson_opened', meta: { lessonId: id } });
    setViewedLessonIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      writeCachedViewedLessons(user.id, next);
      return next;
    });
  }

  function handleGoHome() {
    setPage('dashboard');
    setCurrentLessonId(null);
  }

  function handleOpenProfile() {
    setPage('profile');
  }

  function handleOpenAchievements() {
    setPage('achievements');
    if (user) {
      trackLearningEvent({ userId: user.id, type: 'achievements_opened' });
    }
  }

  function handleSolutionUpdate() {
    const allTaskIds = Object.values(tasksByLesson).flat();
    loadSolutions(allTaskIds);
    if (user) {
      trackLearningEvent({
        userId: user.id,
        type: 'solution_progress_updated',
        meta: { solvedCount: solvedTaskIds.size, totalTasks: allTaskIds.length },
      });
    }
  }

  async function saveUserGoal(goal: string) {
    if (!user || goalSaving) return;
    const value = goal.trim();
    if (!value) return;
    setGoalSaving(true);
    setGoalError('');

    // optimistic local cache so modal does not get stuck
    writeCachedGoal(user.id, value);
    setUserGoal(value);
    setGoalDraft(value);
    const { data, error } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        goal: value,
      },
    });
    if (error) {
      console.error('Не удалось сохранить цель:', error.message);
      setGoalError('Не удалось сохранить цель. Проверь интернет и попробуй снова.');
      setGoalSaving(false);
      return;
    }

    if (data.user) {
      const refreshedGoal = String(data.user.user_metadata?.goal || value).trim();
      setUserGoal(refreshedGoal);
      setGoalDraft(refreshedGoal);
      writeCachedGoal(user.id, refreshedGoal);
    }
    setGoalModalOpen(false);
    setGoalSaving(false);
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

  if (passwordRecoveryPending) {
    return <PasswordRecoveryPage />;
  }

  const currentLesson = lessons.find(l => l.id === currentLessonId) || null;
  const totalTasks = Object.values(tasksByLesson).flat().length;
  const modules = manifest?.modules || [];

  return (
    <div className="dashboard-container">
      <Sidebar
        lessons={lessons}
        modules={manifest?.modules || []}
        solvedTaskIds={solvedTaskIds}
        tasksByLesson={tasksByLesson}
        currentLessonId={currentLessonId}
        onSelectLesson={handleSelectLesson}
      />

      <div className="main-wrapper">
      <Header
        solvedCount={solvedTaskIds.size}
        totalCount={totalTasks}
        onGoHome={handleGoHome}
        onOpenProfile={handleOpenProfile}
        onOpenAchievements={handleOpenAchievements}
      />

        <main className="content-area flex flex-col overflow-hidden">
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
          ) : page === 'profile' ? (
            <ProfilePage
              userName={user.email?.split('@')[0] || 'Иван'}
              solvedCount={solvedTaskIds.size}
              totalCount={totalTasks}
              goal={userGoal}
              onSaveGoal={saveUserGoal}
            />
          ) : page === 'achievements' ? (
            <AchievementsPage
              solvedCount={solvedTaskIds.size}
              totalCount={totalTasks}
              lessons={lessons}
              modules={modules}
              tasksByLesson={tasksByLesson}
              solvedTaskIds={solvedTaskIds}
              viewedLessonIds={viewedLessonIds}
            />
          ) : (
            <Dashboard />
          )}
        </main>
      </div>

      {goalModalOpen && (
        <div className="goal-modal-backdrop">
          <div className="goal-modal-card">
            <h2>Твоя цель на платформе</h2>
            <p>Укажи, чего хочешь достичь. Это можно изменить позже в профиле.</p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const nextGoal = goalDraft.trim();
                if (!nextGoal) return;
                void saveUserGoal(nextGoal);
              }}
            >
              <input
                value={goalDraft}
                onChange={(event) => {
                  setGoalDraft(event.target.value);
                  if (goalError) setGoalError('');
                }}
                placeholder="Например: найти работу Go-разработчиком"
                autoFocus
              />
              <button type="submit" disabled={!goalDraft.trim() || goalSaving}>
                {goalSaving ? 'Сохраняем...' : 'Сохранить цель'}
              </button>
              {goalError && (
                <p className="text-xs text-red-500 mt-2">{goalError}</p>
              )}
            </form>
          </div>
        </div>
      )}
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
