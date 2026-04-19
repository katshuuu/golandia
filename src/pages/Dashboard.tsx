import { ArrowRight, CheckCircle2, Code2, Zap, Layers, Cpu, Star, TrendingUp } from 'lucide-react';
import { Lesson } from '../lib/types';

interface Props {
  lessons: Lesson[];
  solvedTaskIds: Set<string>;
  tasksByLesson: Record<string, string[]>;
  onSelectLesson: (id: string) => void;
}

const lessonIcons = [Code2, Zap, Layers, Cpu];
const difficultyLabel = ['', 'Легко', 'Средне', 'Сложно'];
const difficultyBg = ['', 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', 'bg-pink-500/10 text-pink-400 border-pink-500/20'];

export default function Dashboard({ lessons, solvedTaskIds, tasksByLesson, onSelectLesson }: Props) {
  const totalTasks = Object.values(tasksByLesson).flat().length;
  const solved = solvedTaskIds.size;
  const progress = totalTasks > 0 ? Math.round((solved / totalTasks) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-cyan-500/10 via-[var(--bg-surface)] to-pink-500/5 border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Добро пожаловать!</h1>
                <p className="text-[var(--text-secondary)] text-sm">Изучай Go с AI-помощником. Теория + практика + мгновенная обратная связь.</p>
              </div>
              <div className="shrink-0 flex items-center gap-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl px-4 py-2">
                <TrendingUp size={16} className="text-cyan-400" />
                <div>
                  <p className="text-[var(--text-primary)] text-sm font-bold">{progress}%</p>
                  <p className="text-[var(--text-muted)] text-[10px]">прогресс</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1.5">
                <span>Выполнено {solved} из {totalTasks} заданий</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-[var(--bg-app)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star size={14} className="text-yellow-400" />
            <h2 className="text-[var(--text-primary)] font-semibold text-base">Программа курса</h2>
            <span className="text-[var(--text-muted)] text-xs ml-1">{lessons.length} урока</span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm mb-3">Выберите модуль и двигайтесь по шагам от теории к практике.</p>

          <div className="grid gap-3">
            {lessons.map((lesson, idx) => {
              const Icon = lessonIcons[idx % lessonIcons.length];
              const taskIds = tasksByLesson[lesson.id] || [];
              const solvedInLesson = taskIds.filter(id => solvedTaskIds.has(id)).length;
              const total = taskIds.length;
              const allSolved = total > 0 && solvedInLesson === total;

              return (
                <button
                  key={lesson.id}
                  onClick={() => onSelectLesson(lesson.id)}
                  className={`w-full text-left bg-[var(--bg-surface)] border rounded-2xl p-5 hover:border-cyan-500/30 transition-all duration-200 group relative overflow-hidden ${
                    allSolved ? 'border-emerald-500/20' : 'border-[var(--border-color)]'
                  }`}
                >
                  {allSolved && (
                    <div className="absolute inset-0 bg-emerald-500/3 pointer-events-none" />
                  )}

                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                      allSolved
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-[var(--bg-app)] text-[var(--text-muted)] border border-[var(--border-color)] group-hover:text-cyan-400 group-hover:border-cyan-500/30'
                    }`}>
                      <Icon size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[var(--text-primary)] font-semibold text-lg">
                          {lesson.order_num}. {lesson.title}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${difficultyBg[lesson.difficulty]}`}>
                          {difficultyLabel[lesson.difficulty]}
                        </span>
                        {allSolved && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 size={9} />
                            Пройдено
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        {total > 0 && (
                          <>
                            <div className="flex-1 max-w-32 h-1.5 bg-[var(--bg-app)] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${allSolved ? 'bg-emerald-400' : 'bg-gradient-to-r from-cyan-500 to-cyan-400'}`}
                                style={{ width: `${(solvedInLesson / total) * 100}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-[var(--text-muted)]">
                              {solvedInLesson}/{total} заданий
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <ArrowRight size={16} className="text-[var(--border-color)] group-hover:text-cyan-400 transition-colors shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Code2, label: 'Песочница', desc: 'Запускай Go прямо в браузере', color: 'text-cyan-400' },
            { icon: Zap, label: 'AI-репетитор', desc: 'Задавай вопросы на русском', color: 'text-yellow-400' },
            { icon: CheckCircle2, label: 'Прогресс', desc: 'Сохраняется автоматически', color: 'text-emerald-400' },
          ].map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4">
              <Icon size={18} className={`${color} mb-2`} />
              <p className="text-[var(--text-primary)] text-sm font-medium">{label}</p>
              <p className="text-[var(--text-muted)] text-xs mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
