import { CourseModule, Lesson } from '../../lib/types';
import moduleIcon from '../../../8c8693f6-d925-4da1-9848-66491718ece0/images/4bdb859d46b7031a5ae125bf2dbb85ea80ec2514.png';
import { useEffect, useMemo, useRef, useState } from 'react';

interface SidebarProps {
  lessons: Lesson[];
  modules: CourseModule[];
  solvedTaskIds: Set<string>;
  tasksByLesson: Record<string, string[]>;
  currentLessonId: string | null;
  onSelectLesson: (id: string) => void;
}

type ModuleKey = 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6';

const MODULE_HEADER_TITLE: Record<ModuleKey, string> = {
  m1: 'МОДУЛЬ ПЕРВЫЙ',
  m2: 'МОДУЛЬ ВТОРОЙ',
  m3: 'МОДУЛЬ ТРЕТИЙ',
  m4: 'МОДУЛЬ ЧЕТВЁРТЫЙ',
  m5: 'МОДУЛЬ ПЯТЫЙ',
  m6: 'МОДУЛЬ ШЕСТОЙ',
};

function deriveModuleKey(moduleId: string): ModuleKey {
  const base = moduleId.split('_')[0];
  if (base === 'm1' || base === 'm2' || base === 'm3' || base === 'm4' || base === 'm5') {
    return base;
  }
  return 'm6';
}

export default function Sidebar({ lessons, modules, solvedTaskIds, tasksByLesson, currentLessonId, onSelectLesson }: SidebarProps) {
  const sidebarRef = useRef<HTMLElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const lessonsByModule = useMemo(() => {
    const initial: Record<ModuleKey, Lesson[]> = {
      m1: [],
      m2: [],
      m3: [],
      m4: [],
      m5: [],
      m6: [],
    };

    const lessonMap = new Map(lessons.map((lesson) => [lesson.id, lesson]));
    for (const module of modules) {
      const key = deriveModuleKey(module.id);
      for (const ref of module.lessons) {
        const lesson = lessonMap.get(ref.id);
        if (lesson) {
          initial[key].push(lesson);
        }
      }
    }

    for (const key of Object.keys(initial) as ModuleKey[]) {
      initial[key].sort((a, b) => a.order_num - b.order_num);
    }

    return initial;
  }, [lessons, modules]);

  const [openModuleKey, setOpenModuleKey] = useState<ModuleKey | null>(null);

  const isPanelOpen = openModuleKey !== null;
  const panelLessons = openModuleKey ? lessonsByModule[openModuleKey] : [];

  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenModuleKey(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isPanelOpen]);

  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (drawerRef.current?.contains(target)) return;
      if (sidebarRef.current?.contains(target)) return;
      setOpenModuleKey(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isPanelOpen]);

  function closePanel() {
    setOpenModuleKey(null);
  }

  return (
    <>
      <aside ref={sidebarRef} className="sidebar" aria-label="Модули курса">
        <nav className="module-list">
          {(['m1', 'm2', 'm3', 'm4', 'm5', 'm6'] as ModuleKey[]).map((key) => {
            const title = `${key.replace('m', '')} модуль`;
            const moduleLessons = lessonsByModule[key];
            const taskIds = moduleLessons.flatMap(lesson => tasksByLesson[lesson.id] || []);
            const solved = taskIds.filter(taskId => solvedTaskIds.has(taskId)).length;
            const activeInModule = moduleLessons.some(lesson => lesson.id === currentLessonId);
            const isOpen = openModuleKey === key;
            return (
              <div key={key} className="module-group">
                <button
                  onClick={() => {
                    setOpenModuleKey((prev) => (prev === key ? null : key));
                  }}
                  className={`module-card ${activeInModule || isOpen ? 'is-active' : ''}`}
                  type="button"
                  aria-expanded={isOpen}
                  title={`${title} • ${solved}/${taskIds.length} выполнено`}
                >
                  <img src={moduleIcon} alt="" className="module-icon" />
                  <span className="module-title">{title}</span>
                </button>
              </div>
            );
          })}
        </nav>
      </aside>

      <div
        ref={drawerRef}
        className={`module-drawer ${isPanelOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="false"
        aria-label={openModuleKey ? MODULE_HEADER_TITLE[openModuleKey] : undefined}
      >
        {openModuleKey && (
          <>
            <header className="module-drawer-header">
              <button type="button" className="module-drawer-close" onClick={closePanel} aria-label="Закрыть список уроков">
                ×
              </button>
              <h2 className="module-drawer-title">{MODULE_HEADER_TITLE[openModuleKey]}</h2>
            </header>
            <div className="module-drawer-body">
              {panelLessons.length === 0 ? (
                <p className="module-drawer-empty">уроки скоро появятся</p>
              ) : (
                <ul className="module-drawer-list">
                  {panelLessons.map((lesson, index) => {
                    const lessonTaskIds = tasksByLesson[lesson.id] || [];
                    const solvedInLesson = lessonTaskIds.filter(taskId => solvedTaskIds.has(taskId)).length;
                    const isLessonActive = lesson.id === currentLessonId;
                    const line =
                      lesson.title.trim().toLowerCase().startsWith('урок') ? lesson.title : `Урок ${index + 1}: ${lesson.title}`;
                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectLesson(lesson.id);
                            closePanel();
                          }}
                          className={`module-drawer-item ${isLessonActive ? 'is-active' : ''}`}
                        >
                          <span className="module-drawer-item-text">{line}</span>
                          {lessonTaskIds.length > 0 && (
                            <span className="module-drawer-item-progress">
                              {solvedInLesson}/{lessonTaskIds.length}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      {isPanelOpen && <div className="module-drawer-backdrop" onClick={closePanel} aria-hidden />}
    </>
  );
}
