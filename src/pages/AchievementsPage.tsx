import characterImage from '../../f0110365-c65d-4460-8025-f9e8dbdc7246/images/59a07bced51f57bc406823c1897b15a615aaf2d6.png';
import shadowImage from '../../f0110365-c65d-4460-8025-f9e8dbdc7246/images/34_411.svg';
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CourseModule, Lesson } from '../lib/types';

interface AchievementsPageProps {
  solvedCount: number;
  totalCount: number;
  lessons: Lesson[];
  modules: CourseModule[];
  tasksByLesson: Record<string, string[]>;
  solvedTaskIds: Set<string>;
  viewedLessonIds: Set<string>;
}

type LevelDef = {
  rank: number;
  title: string;
  moduleTarget: number;
};

const LEVELS: LevelDef[] = [
  { rank: 0, title: 'Стажер', moduleTarget: 0 },
  { rank: 1, title: 'Энтузиаст', moduleTarget: 1 },
  { rank: 2, title: 'Талант', moduleTarget: 2 },
  { rank: 3, title: 'Интеллектуал', moduleTarget: 3 },
  { rank: 4, title: 'Великий мастер', moduleTarget: 4 },
  { rank: 5, title: 'Укротитель', moduleTarget: 5 },
  { rank: 6, title: 'Профессор', moduleTarget: 6 },
  { rank: 7, title: 'Легенда Go', moduleTarget: 6 },
];

export default function AchievementsPage({
  solvedCount,
  totalCount,
  lessons,
  modules,
  tasksByLesson,
  solvedTaskIds,
  viewedLessonIds,
}: AchievementsPageProps) {
  const { user } = useAuth();
  const solvedPercent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;
  const viewedCount = viewedLessonIds.size;
  const lessonsTotal = lessons.length;

  const completedModules = useMemo(() => {
    return modules.reduce((acc, module) => {
      const lessonIds = module.lessons.map((lesson) => lesson.id);
      if (lessonIds.length === 0) return acc;
      const viewedDone = lessonIds.every((id) => viewedLessonIds.has(id));
      const tasks = lessonIds.flatMap((id) => tasksByLesson[id] || []);
      const solvedDone = tasks.length > 0 ? tasks.every((taskId) => solvedTaskIds.has(taskId)) : viewedDone;
      return viewedDone && solvedDone ? acc + 1 : acc;
    }, 0);
  }, [modules, viewedLessonIds, tasksByLesson, solvedTaskIds]);

  const backendLevelName = String(
    user?.user_metadata?.level_name || user?.user_metadata?.level || user?.user_metadata?.rank || ''
  ).trim();
  const backendFinalPassed = Boolean(
    user?.user_metadata?.final_project_passed || user?.user_metadata?.final_task_completed || user?.user_metadata?.course_completed
  );
  const fallbackLevelIndex = Math.min(completedModules, 6);
  const derivedLevelIndex = backendFinalPassed ? 7 : fallbackLevelIndex;
  const backendLevelIndex = LEVELS.findIndex((lvl) => lvl.title.toLowerCase() === backendLevelName.toLowerCase());
  const currentLevelIndex = backendLevelIndex >= 0 ? backendLevelIndex : derivedLevelIndex;
  const currentLevel = LEVELS[Math.max(0, currentLevelIndex)];
  const nextLevel = LEVELS[Math.min(currentLevel.rank + 1, LEVELS.length - 1)];
  const moduleProgressPercent = modules.length > 0 ? Math.round((completedModules / modules.length) * 100) : 0;
  const lessonsProgressPercent = lessonsTotal > 0 ? Math.round((viewedCount / lessonsTotal) * 100) : 0;
  const finalReady = completedModules >= 6;

  return (
    <section className="achievements-screen">
      <div className="achievements-grid">
        <div className="achievements-col-character">
          <div className="achievements-character-image-wrapper">
            <img src={characterImage} alt="Character" className="achievements-character-img" />
            <img src={shadowImage} alt="Shadow" className="achievements-character-shadow" />
          </div>
          <h1 className="achievements-character-role">{currentLevel.title}</h1>
          <div className="achievements-character-message">
            <p>
              До уровня "{nextLevel.title}" осталось закрыть модулей:
              <br />
              {Math.max(0, nextLevel.moduleTarget - completedModules)}
            </p>
          </div>
        </div>

        <div className="achievements-col-level">
          <h2 className="achievements-column-title">Мой уровень</h2>
          <div className="achievements-level-slots">
            {LEVELS.map((level) => {
              const state =
                level.rank < currentLevel.rank ? 'achievements-level-slot--completed' :
                level.rank === currentLevel.rank ? 'achievements-level-slot--current' :
                'achievements-level-slot--locked';
              return (
                <button key={level.title} className={`achievements-level-slot ${state}`} type="button">
                  <span>{level.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="achievements-col-achievements">
          <h2 className="achievements-column-title">Мои достижения</h2>
          <div className="achievements-panel">
            <div className="achievements-item">
              <span>Решено заданий</span>
              <strong>
                {solvedCount}/{totalCount}
              </strong>
            </div>
            <div className="achievements-item">
              <span>Прогресс</span>
              <strong>{solvedPercent}%</strong>
            </div>
            <div className="achievements-item">
              <span>Просмотрено уроков</span>
              <strong>{viewedCount}/{lessonsTotal}</strong>
            </div>
            <div className="achievements-item">
              <span>Закрыто модулей</span>
              <strong>{completedModules}/6</strong>
            </div>
            <div className="achievements-progress-group">
              <div className="achievements-progress-line">
                <span>Модули</span>
                <strong>{moduleProgressPercent}%</strong>
              </div>
              <div className="achievements-progress-bar">
                <div className="achievements-progress-fill" style={{ width: `${moduleProgressPercent}%` }} />
              </div>
              <div className="achievements-progress-line">
                <span>Уроки</span>
                <strong>{lessonsProgressPercent}%</strong>
              </div>
              <div className="achievements-progress-bar">
                <div className="achievements-progress-fill achievements-progress-fill--lessons" style={{ width: `${lessonsProgressPercent}%` }} />
              </div>
            </div>
            <div className="achievements-item achievements-item--final">
              <span>Финальное задание</span>
              <strong>{backendFinalPassed ? 'Сдано' : finalReady ? 'Можно сдавать' : 'Недоступно'}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
