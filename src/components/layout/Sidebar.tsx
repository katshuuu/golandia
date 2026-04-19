import { CheckCircle2, Circle, Lock, Zap, Code2, Layers, Cpu } from 'lucide-react';
import { Lesson } from '../../lib/types';

interface SidebarProps {
  lessons: Lesson[];
  solvedTaskIds: Set<string>;
  tasksByLesson: Record<string, string[]>;
  currentLessonId: string | null;
  onSelectLesson: (id: string) => void;
}

const lessonIcons = [Code2, Zap, Layers, Cpu];
const difficultyLabel = ['', 'Легко', 'Средне', 'Сложно'];
const difficultyColor = ['', 'text-emerald-400', 'text-yellow-400', 'text-pink-400'];

export default function Sidebar({ lessons, solvedTaskIds, tasksByLesson, currentLessonId, onSelectLesson }: SidebarProps) {
  return (
    <aside className="w-72 shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border-color)] flex flex-col overflow-y-auto transition-colors">
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border-color)]">
        <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Модули курса</h2>
      </div>

      <nav className="p-3 flex flex-col gap-1 flex-1">
        {lessons.map((lesson, idx) => {
          const Icon = lessonIcons[idx % lessonIcons.length];
          const taskIds = tasksByLesson[lesson.id] || [];
          const solved = taskIds.filter(id => solvedTaskIds.has(id)).length;
          const total = taskIds.length;
          const allSolved = total > 0 && solved === total;
          const isActive = lesson.id === currentLessonId;

          return (
            <button
              key={lesson.id}
              onClick={() => onSelectLesson(lesson.id)}
              className={`w-full text-left rounded-xl p-3 transition-all duration-200 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 to-cyan-400/5 border border-cyan-500/30'
                  : 'hover:bg-[var(--bg-surface-hover)] border border-transparent hover:border-[var(--border-color)]'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-r-full" />
              )}

              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : allSolved
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-[var(--bg-app)] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'
                }`}>
                  <Icon size={14} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-semibold truncate ${
                      isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                    }`}>
                      {lesson.order_num}. {lesson.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] ${difficultyColor[lesson.difficulty]}`}>
                      {difficultyLabel[lesson.difficulty]}
                    </span>
                    {total > 0 && (
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {solved}/{total} задан.
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {allSolved ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : isActive ? (
                    <Circle size={16} className="text-cyan-400" />
                  ) : (
                    <Lock size={14} className="text-[var(--border-color)]" />
                  )}
                </div>
              </div>

              {total > 0 && (
                <div className="mt-2 ml-11">
                  <div className="h-1 bg-[var(--bg-app)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        allSolved ? 'bg-emerald-400' : 'bg-gradient-to-r from-cyan-500 to-cyan-400'
                      }`}
                      style={{ width: `${total > 0 ? (solved / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--border-color)]">
        <div className="bg-gradient-to-br from-cyan-500/10 to-pink-500/5 border border-cyan-500/20 rounded-xl p-3 text-center">
          <p className="text-xs text-[var(--text-secondary)]">Нужна помощь?</p>
          <p className="text-xs text-cyan-400 font-medium mt-0.5">Спроси AI-помощника!</p>
        </div>
      </div>
    </aside>
  );
}
