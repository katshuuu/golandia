import { useState, useEffect, useRef } from 'react';
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
import { readLocalSandboxDoneLessonIds, LESSON_PROGRESS_EVENT } from './lib/lessonProgressLocal';

const TASKS_CACHE_KEY = 'go_tutor_tasks_by_lesson_v1';
const SOLVED_CACHE_KEY = (userId: string) => `go_tutor_solved_task_ids_v1_${userId}`;
const GOAL_CACHE_KEY = (userId: string) => `go_tutor_goal_v1_${userId}`;
const DISPLAY_NAME_CACHE_KEY = (userId: string) => `go_tutor_display_name_v1_${userId}`;
const AVATAR_CACHE_KEY = (userId: string) => `go_tutor_avatar_v1_${userId}`;
const VIEWED_LESSONS_CACHE_KEY = (userId: string) => `go_tutor_viewed_lessons_v1_${userId}`;

const MAX_AVATAR_IN_METADATA_CHARS = 48_000;

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

function readCachedDisplayName(userId: string): string {
  try {
    return (localStorage.getItem(DISPLAY_NAME_CACHE_KEY(userId)) || '').trim();
  } catch {
    return '';
  }
}

function writeCachedDisplayName(userId: string, name: string) {
  try {
    localStorage.setItem(DISPLAY_NAME_CACHE_KEY(userId), name);
  } catch {
    // ignore
  }
}

function readCachedAvatar(userId: string): string {
  try {
    return localStorage.getItem(AVATAR_CACHE_KEY(userId)) || '';
  } catch {
    return '';
  }
}

function writeCachedAvatar(userId: string, dataUrl: string) {
  try {
    if (dataUrl) {
      localStorage.setItem(AVATAR_CACHE_KEY(userId), dataUrl);
    } else {
      localStorage.removeItem(AVATAR_CACHE_KEY(userId));
    }
  } catch {
    // ignore quota
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
  const [localSandboxDoneIds, setLocalSandboxDoneIds] = useState<Set<string>>(() => new Set());
  const [dataLoading, setDataLoading] = useState(true);
  const [userGoal, setUserGoal] = useState('');
  const [userDisplayName, setUserDisplayName] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState('');
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState('');
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalError, setGoalError] = useState('');
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  const userIdForData = user?.id;
  const manifestLoadedOnce = useRef(false);
  const dataFetchInProgress = useRef(false); // ← ДОБАВИТЬ ФЛАГ

  /** Загрузка курса + фон Supabase без гонки */
  useEffect(() => {
    // ★★★ ГЛАВНОЕ ИЗМЕНЕНИЕ ★★★
    if (authLoading || !userIdForData || dataFetchInProgress.current) {
      return;
    }

    // Отмечаем, что начали загрузку
    dataFetchInProgress.current = true;
    let cancelled = false;
    const uid = userIdForData;

    void (async () => {
      if (!manifestLoadedOnce.current) {
        setDataLoading(true);
      }

      try {
        const manifestData = await fetchManifest();
        if (cancelled) return;

        const lessonList: Lesson[] = [];
        let order = 1;
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

        setManifest(manifestData);
        setLessons(lessonList);
        manifestLoadedOnce.current = true;
      } catch (err) {
        console.error('Failed to load manifest:', err);
        if (!cancelled) {
          setLessons([]);
          setManifest(null);
          manifestLoadedOnce.current = false;
        }
      } finally {
        if (!cancelled) {
          setDataLoading(false);
        }
      }

      if (cancelled) {
        dataFetchInProgress.current = false; // ← СБРОСИТЬ ФЛАГ
        return;
      }

      // Загружаем кэшированные данные
      const cachedTasks = readCachedTasksByLesson();
      if (Object.keys(cachedTasks).length > 0) {
        setTasksByLesson(cachedTasks);
      }

      setSolvedTaskIds(readCachedSolvedTaskIds(uid));
      setViewedLessonIds(readCachedViewedLessons(uid));

      // Загружаем задачи из Supabase
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, lesson_id')
        .order('order_num');

      if (cancelled) {
        dataFetchInProgress.current = false;
        return;
      }

      if (tasksData && tasksData.length > 0) {
        const byLesson: Record<string, string[]> = {};
        tasksData.forEach((t) => {
          if (!byLesson[t.lesson_id]) byLesson[t.lesson_id] = [];
          byLesson[t.lesson_id].push(t.id);
        });
        setTasksByLesson(byLesson);
        writeCachedTasksByLesson(byLesson);
        
        // ★★★ ИСПРАВЛЕНИЕ: передаём tasksData как есть, не маппим лишний раз ★★★
        await loadSolutionsForUser(uid, tasksData.map((t) => t.id));
      }
      
      // Загрузка завершена - сбрасываем флаг
      dataFetchInProgress.current = false;
    })();

    return () => {
      cancelled = true;
      //при размонтировании НЕ сбрасываем флаг мгновенно,
      // так как другой эффект может запуститься сразу после размонтирования
      // При монтировании нового экземпляра флаг всё равно будет сброшен в useState
    };
  }, [authLoading, userIdForData]); // ← зависимости не изменились

  useEffect(() => {
    return () => {
      // Сбрасываем флаг при размонтировании компонента
      dataFetchInProgress.current = false;
    };
  }, []);


  useEffect(() => {
    if (!user) {
      setUserGoal('');
      setUserDisplayName('');
      setAvatarDataUrl('');
      setGoalModalOpen(false);
      setNameModalOpen(false);
      setGoalDraft('');
      setNameDraft('');
      setGoalError('');
      setNameError('');
      setGoalSaving(false);
      setNameSaving(false);
      setViewedLessonIds(new Set());
      return;
    }

    const metadataName = String(user.user_metadata?.display_name || '').trim();
    const cachedName = readCachedDisplayName(user.id);
    const savedName = metadataName || cachedName;
    setUserDisplayName(savedName);

    const metadataGoal = String(user.user_metadata?.goal || '').trim();
    const cachedGoal = readCachedGoal(user.id);
    const savedGoal = metadataGoal || cachedGoal;
    setUserGoal(savedGoal);

    const fromStorage = readCachedAvatar(user.id);
    const rawMetaAvatar =
      typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : '';
    const metaAvatar =
      rawMetaAvatar.startsWith('data:image/') || rawMetaAvatar.startsWith('http://') || rawMetaAvatar.startsWith('https://')
        ? rawMetaAvatar
        : '';
    setAvatarDataUrl(fromStorage || metaAvatar || '');

    if (!savedName) {
      setNameDraft('');
      setNameModalOpen(true);
      setGoalModalOpen(false);
      setGoalDraft('');
    } else if (!savedGoal) {
      setNameModalOpen(false);
      setGoalModalOpen(true);
      setGoalDraft('');
    } else {
      setNameModalOpen(false);
      setGoalModalOpen(false);
      setGoalDraft(savedGoal);
    }
  }, [user]);

  async function loadSolutionsForUser(forUserId: string, taskIds: string[]) {
    if (!forUserId || taskIds.length === 0) return;
  
    // Добавить проверку - компонент ещё смонтирован?
    const { data } = await supabase
      .from('solutions')
      .select('task_id, status')
      .eq('user_id', forUserId)
      .in('task_id', taskIds)
      .eq('status', 'solved');
  
    // ★★★ ПРОВЕРКА: если userIdForData изменился - не обновляем состояние ★★★
    if (data && userIdForData === forUserId) {
      const solved = new Set(data.map((s) => s.task_id));
      setSolvedTaskIds(solved);
      writeCachedSolvedTaskIds(forUserId, solved);
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
    if (user) {
      void loadSolutionsForUser(user.id, allTaskIds);
      trackLearningEvent({
        userId: user.id,
        type: 'solution_progress_updated',
        meta: { solvedCount: solvedTaskIds.size, totalTasks: allTaskIds.length },
      });
    }
  }

  async function saveDisplayName(name: string) {
    if (!user || nameSaving) return;
    const value = name.trim();
    if (!value) return;
    setNameSaving(true);
    setNameError('');
    writeCachedDisplayName(user.id, value);
    setUserDisplayName(value);
    const { data, error } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        display_name: value,
      },
    });
    if (error) {
      console.error('Не удалось сохранить имя:', error.message);
      setNameError('Не удалось сохранить. Проверь интернет и попробуй снова.');
      setNameSaving(false);
      return;
    }
    setNameModalOpen(false);
    setNameSaving(false);
    const nextGoal = String(data.user?.user_metadata?.goal || readCachedGoal(user.id) || '').trim();
    if (!nextGoal) {
      setGoalDraft('');
      setGoalModalOpen(true);
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

  async function saveUserAvatar(dataUrl: string) {
    if (!user) return;
    writeCachedAvatar(user.id, dataUrl);
    setAvatarDataUrl(dataUrl);

    const nextMeta: Record<string, unknown> = {
      ...user.user_metadata,
      display_name: userDisplayName,
      goal: userGoal,
    };
    if (dataUrl && dataUrl.length <= MAX_AVATAR_IN_METADATA_CHARS) {
      nextMeta.avatar_url = dataUrl;
    } else {
      nextMeta.avatar_url = '';
    }

    const { error } = await supabase.auth.updateUser({
      data: nextMeta as Record<string, unknown>,
    });
    if (error) {
      console.error('Не удалось сохранить аватар в профиле:', error.message);
    }
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
        localSandboxDoneIds={localSandboxDoneIds}
        currentLessonId={currentLessonId}
        onSelectLesson={handleSelectLesson}
      />

      <div className="main-wrapper">
      <Header
        solvedCount={solvedTaskIds.size}
        totalCount={totalTasks}
        displayName={userDisplayName || user.email?.split('@')[0] || ''}
        avatarUrl={avatarDataUrl}
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
              displayName={userDisplayName || user.email?.split('@')[0] || 'студент'}
              avatarUrl={avatarDataUrl}
              solvedCount={solvedTaskIds.size}
              totalCount={totalTasks}
              goal={userGoal}
              onSaveGoal={saveUserGoal}
              onSaveDisplayName={saveDisplayName}
              onAvatarChange={saveUserAvatar}
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
            <Dashboard
              modules={modules}
              tasksByLesson={tasksByLesson}
              solvedTaskIds={solvedTaskIds}
              localSandboxDoneIds={localSandboxDoneIds}
              onOpenLesson={handleSelectLesson}
            />
          )}
        </main>
      </div>

      {nameModalOpen && (
        <div className="goal-modal-backdrop">
          <div className="goal-modal-card">
            <h2>Как я могу к тебе обращаться?</h2>
            <p>Имя будет показываться в приветствии в профиле.</p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const next = nameDraft.trim();
                if (!next) return;
                void saveDisplayName(next);
              }}
            >
              <input
                value={nameDraft}
                onChange={(event) => {
                  setNameDraft(event.target.value);
                  if (nameError) setNameError('');
                }}
                placeholder="Например: Иван"
                autoFocus
              />
              <button type="submit" disabled={!nameDraft.trim() || nameSaving}>
                {nameSaving ? 'Сохраняем...' : 'Продолжить'}
              </button>
              {nameError && (
                <p className="text-xs text-red-500 mt-2">{nameError}</p>
              )}
            </form>
          </div>
        </div>
      )}

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
