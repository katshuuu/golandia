import traineePortrait from '../assets/achievements/hero-character.png'
import enthusiastPortrait from '../assets/images/enthusiast.png'
import intellectualPortrait from '../assets/images/intellectual.png'
import professorPortrait from '../assets/images/professor.png'
import magistrPortrait from '../assets/images/magistr.png'
import academicPortrait from '../assets/images/academic.png'
import legendPortrait from '../assets/images/legend.png'

/** Индекс = hero.level (0 — стажёр, 1…6 — ранги из hero.go LevelTitles). */
export const HERO_PORTRAITS_BY_LEVEL = [
  traineePortrait,
  enthusiastPortrait,
  intellectualPortrait,
  professorPortrait,
  magistrPortrait,
  academicPortrait,
  legendPortrait,
] as const

export function heroPortraitForLevel(level: number): string {
  const idx = Math.min(Math.max(0, Math.floor(level)), HERO_PORTRAITS_BY_LEVEL.length - 1)
  return HERO_PORTRAITS_BY_LEVEL[idx]
}
