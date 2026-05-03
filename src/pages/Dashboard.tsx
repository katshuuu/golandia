import { CourseModule } from '../lib/types';
import { isLessonDoneForSidebar } from '../lib/lessonProgressLocal';

type DashboardProps = {
  modules: CourseModule[];
  tasksByLesson: Record<string, string[]>;
  solvedTaskIds: Set<string>;
  localSandboxDoneIds: Set<string>;
  onOpenLesson: (id: string) => void;
};

export default function Dashboard({
  modules,
  tasksByLesson,
  solvedTaskIds,
  localSandboxDoneIds,
  onOpenLesson,
}: DashboardProps) {
  return (
    <div className="dashboard-home">
      <header className="dashboard-home-header">
        <h1 className="dashboard-home-title">Оглавление</h1>
        <p className="dashboard-home-lead">
          Продолжай совершенствовать навыки, прогресс <i>сам не накодится!</i><br/> Открой модуль в боковой панели или выбери урок ниже.
        </p>
      </header>

      <div className="dashboard-home-outline">
        {modules.map((module) => (
          <section key={module.id} className="dashboard-home-mod">
            <h2 className="dashboard-home-mod-title">{module.title}</h2>
            <ul className="dashboard-home-lessons">
              {module.lessons.map((ref) => {
                const taskIds = tasksByLesson[ref.id] || [];
                const done = isLessonDoneForSidebar(ref.id, taskIds, solvedTaskIds, localSandboxDoneIds);
                return (
                  <li key={ref.id}>
                    <button
                      type="button"
                      className="dashboard-home-lesson-btn"
                      onClick={() => onOpenLesson(ref.id)}
                    >
                      <span
                        className={`lesson-pass-dot${done ? ' lesson-pass-dot--done' : ''}`}
                        title={
                          done
                            ? 'Задание выполнено (автопроверка)'
                            : 'Не сдано — открой урок и пройди проверку в песочнице'
                        }
                        aria-hidden
                      />
                      <span className="dashboard-home-lesson-title">{ref.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
