import shadowImage from '../assets/achievements/hero-shadow.svg'
import { AchievementHeroViewer } from '../components/AchievementHeroViewer'
import { heroPortraitForLevel } from '../lib/heroPortrait'
import { useEffect, useMemo, useState } from 'react'
import { AppSiteHeader } from '../components/AppSiteHeader'
import {
  computeHeroLevel,
  type CourseManifest,
  fetchManifest,
  type HeroLevelResult,
} from '../lib/courseApi'
import { FINAL_COURSE_LESSON_ID } from '../lib/courseFinalLesson'
import { readFinalProjectDone } from '../lib/finalProjectLocal'
import { LESSON_PROGRESS_EVENT, markLocalSandboxLessonDone, readLocalSandboxDoneLessonIds } from '../lib/lessonProgressLocal'
import { getOrCreateLocalUserId } from '../lib/localUser'
import { buildCompletedLessonsMap, countLessonsInManifest } from '../lib/progressMap'
import './AppPages.css'
import './styles/index.css'

/** Совпадает с internal/hero/hero.go LevelTitles + стажёр. */
const HERO_SIDEBAR_TITLES = ['Энтузиаст', 'Интеллектуал', 'Профессор', 'Магистр', 'Академик', 'Легенда Go'] as const

const LEVEL_ROWS: { rank: number; title: string }[] = [
  { rank: 0, title: 'Стажёр' },
  ...HERO_SIDEBAR_TITLES.map((title, index) => ({ rank: index + 1, title })),
]

/** Мотивационное описание для текущего ранга героя. */
const LEVEL_MOTIVATION: Record<number, string> = {
  0: 'Ты только начал путь покорения Go, начало положено! Помни: дорогу осилит идущий :)',
  1: 'Первые победы за плечами — энтузиазм горит ярче compile error! Не останавливайся на достигнутом.',
  2: 'Ты уже мыслишь как Go-разработчик: просто, ясно и по делу. Продолжай углублять мастерство.',
  3: 'Знания складываются в систему — ты готов объяснять другим, как устроен язык. Так держать!',
  4: 'Магистр кода: сложные темы даются легче, а проекты собираются увереннее. Финишная прямая близко.',
  5: 'Академический уровень — редкая высота. Ты почти у вершины курса, остался последний рывок.',
  6: 'Легенда Go в Golandia! Ты прошёл путь от стажёра до мастера — Boss Golang повержен.',
}

function levelMotivationText(heroLevel: number): string {
  const rank = Math.min(Math.max(0, Math.floor(heroLevel)), LEVEL_ROWS.length - 1)
  return LEVEL_MOTIVATION[rank] ?? LEVEL_MOTIVATION[0]
}

/** Подписи рангов для текста и заголовка — из того же списка, что слоты; не из строк API (на старом backend мог остаться «Маэстро»). */
function heroDisplayTitles(level: number): { role: string; next: string } {
  if (level <= 0) {
    return { role: 'Стажёр', next: HERO_SIDEBAR_TITLES[0] ?? '' }
  }
  if (level > HERO_SIDEBAR_TITLES.length) {
    return {
      role: HERO_SIDEBAR_TITLES[HERO_SIDEBAR_TITLES.length - 1] ?? '…',
      next: '',
    }
  }
  return {
    role: HERO_SIDEBAR_TITLES[level - 1] ?? '…',
    next: level < HERO_SIDEBAR_TITLES.length ? (HERO_SIDEBAR_TITLES[level] ?? '') : '',
  }
}

/** Совпадает с группировкой в MainPage: номер модуля из id вроде m2, m2_1, m2_2. */
function manifestSectionsForLogicalModule(manifest: CourseManifest, logicalModule: number) {
  return manifest.modules.filter((module) => {
    const match = module.id.match(/^m(\d+)(?:_|$)/)
    if (!match) return false
    return Number.parseInt(match[1], 10) === logicalModule
  })
}

/** Сколько логических модулей 1…N полностью закрыты (все уроки всех подразделов сданы). */
function countFullyCompletedLogicalModules(
  manifest: CourseManifest,
  doneLessonIds: Set<string>,
  logicalModuleCount: number,
): number {
  let closed = 0
  for (let n = 1; n <= logicalModuleCount; n += 1) {
    if (n === logicalModuleCount && manifest.final_project?.title) {
      if (doneLessonIds.has(FINAL_COURSE_LESSON_ID)) closed += 1
      continue
    }
    const sections = manifestSectionsForLogicalModule(manifest, n)
    if (sections.length === 0) continue
    const allDone = sections.every(
      (module) => module.lessons.length > 0 && module.lessons.every((l) => doneLessonIds.has(l.id)),
    )
    if (allDone) closed += 1
  }
  return closed
}

/** Число модулей в боковой навигации курса (не число записей в JSON манифеста). */
const LOGICAL_COURSE_MODULE_COUNT = 6

function levelSlotClass(rank: number, heroLevel: number): string {
  if (heroLevel > rank) return 'achievements-level-slot--completed'
  if (heroLevel === rank) return 'achievements-level-slot--current'
  return 'achievements-level-slot--locked'
}

export function AchievementsPage() {
  const userId = useMemo(() => getOrCreateLocalUserId(), [])
  const [manifest, setManifest] = useState<CourseManifest | null>(null)
  const [hero, setHero] = useState<HeroLevelResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [doneTick, setDoneTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchManifest()
      .then((m) => {
        if (!cancelled) setManifest(m)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Ошибка загрузки курса')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onProgress = () => setDoneTick((t) => t + 1)
    window.addEventListener(LESSON_PROGRESS_EVENT, onProgress)
    return () => window.removeEventListener(LESSON_PROGRESS_EVENT, onProgress)
  }, [])

  const doneIds = useMemo(() => readLocalSandboxDoneLessonIds(userId), [userId, doneTick])

  /** Ручная отметка убрана; старый флаг в localStorage переносим в набор сданных уроков. */
  useEffect(() => {
    if (!manifest?.final_project?.title || !userId || userId === 'anonymous') return
    if (!readFinalProjectDone(userId)) return
    if (readLocalSandboxDoneLessonIds(userId).has(FINAL_COURSE_LESSON_ID)) return
    markLocalSandboxLessonDone(FINAL_COURSE_LESSON_ID, userId)
  }, [manifest?.final_project?.title, userId])

  const finalDone = !!(
    manifest?.final_project?.title &&
    (doneIds.has(FINAL_COURSE_LESSON_ID) || readFinalProjectDone(userId))
  )

  useEffect(() => {
    if (!manifest) return
    const completed = buildCompletedLessonsMap(manifest, doneIds)
    computeHeroLevel(completed, !!finalDone)
      .then(setHero)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Ошибка расчёта уровня'))
  }, [manifest, doneIds, finalDone])

  const totalLessons = manifest ? countLessonsInManifest(manifest) : 0
  const solvedCount = doneIds.size
  const solvedPercent = totalLessons > 0 ? Math.round((solvedCount / totalLessons) * 100) : 0
  const completedModules = manifest
    ? countFullyCompletedLogicalModules(manifest, doneIds, LOGICAL_COURSE_MODULE_COUNT)
    : 0
  const moduleTotal = LOGICAL_COURSE_MODULE_COUNT
  const moduleProgressPercent =
    moduleTotal > 0 ? Math.round((completedModules / moduleTotal) * 100) : 0
  const lessonsProgressPercent = totalLessons > 0 ? Math.round((solvedCount / totalLessons) * 100) : 0

  const heroLevel = hero?.level ?? 0
  const heroPortrait = useMemo(() => heroPortraitForLevel(heroLevel), [heroLevel])
  const { role: roleTitle } = hero ? heroDisplayTitles(hero.level) : { role: '…', next: '' }

  const motivationText = useMemo(
    () => (hero ? levelMotivationText(hero.level) : ''),
    [hero],
  )

  return (
    <div className="app-page app-page--full app-page--achievements">
      <AppSiteHeader />

      {error ? <div className="app-page-banner-error">{error}</div> : null}

      <section className="achievements-screen">
        <div className="achievements-grid-outer">
          <div className="achievements-grid">
            <div className="achievements-col-character">
              <div className="achievements-character-image-wrapper">
                <AchievementHeroViewer key={heroLevel} src={heroPortrait} alt={roleTitle} />
                <img src={shadowImage} alt="" className="achievements-character-shadow" />
              </div>
              <h1 className="achievements-character-role">{roleTitle}</h1>
              {motivationText ? (
                <div className="achievements-character-message">
                  <p className="achievements-character-message__motivation">{motivationText}</p>
                </div>
              ) : null}
            </div>

            <div className="achievements-col-level">
              <h2 className="achievements-column-title">Мой уровень</h2>
              <div className="achievements-level-slots">
                {LEVEL_ROWS.map((level) => (
                  <div
                    key={level.title}
                    className={`achievements-level-slot ${levelSlotClass(level.rank, heroLevel)}`}
                    role="img"
                    aria-label={level.title}
                  >
                    <span>{level.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="achievements-col-achievements">
              <h2 className="achievements-column-title">Мои достижения</h2>
              <div className="achievements-panel">
                <div className="achievements-item">
                  <span>Пройдено уроков (успешная автопроверка)</span>
                  <strong>
                    {solvedCount}/{totalLessons || '…'}
                  </strong>
                </div>
                <div className="achievements-item">
                  <span>Прогресс по урокам</span>
                  <strong>{solvedPercent}%</strong>
                </div>
                <div className="achievements-item">
                  <span>Закрыто модулей</span>
                  <strong>
                    {completedModules}/{moduleTotal || '…'}
                  </strong>
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
                    <div
                      className="achievements-progress-fill achievements-progress-fill--lessons"
                      style={{ width: `${lessonsProgressPercent}%` }}
                    />
                  </div>
                </div>
                <div className="achievements-item achievements-item--final">
                  <span>Финальное задание</span>
                  <strong>{finalDone ? 'Сдано (автопроверка)' : 'Не сдано'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
