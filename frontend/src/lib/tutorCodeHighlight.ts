export type TutorCodeHighlightTarget = 'user_code' | 'theory_demo' | 'theory_page'

export type TutorCodeHighlight = {
  target: TutorCodeHighlightTarget
  line_start: number
  line_end: number
  snippet?: string
}

export function parseTutorCodeHighlights(raw: unknown): TutorCodeHighlight[] {
  if (!Array.isArray(raw)) return []
  const out: TutorCodeHighlight[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const target = String(o.target ?? '').toLowerCase()
    if (target !== 'user_code' && target !== 'theory_demo' && target !== 'theory_page') continue
    const lineStart = Number(o.line_start ?? o.lineStart ?? 1)
    const lineEnd = Number(o.line_end ?? o.lineEnd ?? lineStart)
    const start = Number.isFinite(lineStart) && lineStart >= 1 ? Math.floor(lineStart) : 1
    const end = Number.isFinite(lineEnd) && lineEnd >= start ? Math.floor(lineEnd) : start
    const snippet = typeof o.snippet === 'string' ? o.snippet.trim() : undefined
    out.push({
      target: target as TutorCodeHighlightTarget,
      line_start: start,
      line_end: end,
      snippet: snippet || undefined,
    })
  }
  return out
}

function normalizeForMatch(text: string): string {
  return text.replace(/\t/g, '    ').replace(/\s+/g, ' ').trim()
}

function isBlankLine(lines: string[], lineNum: number): boolean {
  return !lines[lineNum - 1]?.trim()
}

/** Извлекает идентификаторы кода из вопроса ученика (fmt.Println, `import "fmt"`). */
export function searchTermsFromUserMessage(message: string): string[] {
  const terms = new Set<string>()
  const trimmed = message.trim()
  if (!trimmed) return []

  for (const m of trimmed.matchAll(/`([^`]+)`/g)) {
    const t = m[1].trim()
    if (t.length >= 2) terms.add(t)
  }

  for (const m of trimmed.matchAll(/\b(fmt\.\w+|func\s+main|import(?:\s+"[^"]+")?)\b/g)) {
    terms.add(m[1].trim())
  }

  for (const m of trimmed.matchAll(/\b([A-Za-z_][\w]*\.[A-Za-z_]\w*)\b/g)) {
    terms.add(m[1])
  }

  return [...terms].filter((t) => t.length >= 3)
}

function findLinesForSnippet(lines: string[], snippet: string): number[] {
  const needle = snippet.trim()
  if (!needle) return []

  const found = new Set<number>()
  const normalizedNeedle = normalizeForMatch(needle)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.includes(needle) || normalizeForMatch(line).includes(normalizedNeedle)) {
      found.add(i + 1)
    }
  }

  if (found.size === 0 && needle.includes('\n')) {
    const parts = needle.split('\n').map((p) => p.trim()).filter(Boolean)
    for (let i = 0; i <= lines.length - parts.length; i++) {
      let ok = true
      for (let j = 0; j < parts.length; j++) {
        if (!lines[i + j]?.includes(parts[j])) {
          ok = false
          break
        }
      }
      if (ok) {
        for (let j = 0; j < parts.length; j++) found.add(i + j + 1)
      }
    }
  }

  if (found.size === 0) {
    const core = needle.replace(/[`'"]/g, '').trim()
    if (core.length >= 3) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(core)) found.add(i + 1)
      }
    }
  }

  return [...found].sort((a, b) => a - b)
}

const FALLBACK_PROBES = ['fmt.Println', 'fmt.Print', 'func main', 'import ']

/**
 * Определяет номера строк для подсветки по реальному тексту редактора.
 * Приоритет: snippet из API → непустые строки из line_start/end → поиск по вопросу ученика.
 */
export function resolveHighlightLinesInSource(
  sourceCode: string,
  highlights: TutorCodeHighlight[],
  target: TutorCodeHighlightTarget,
  extraSearchTerms: string[] = [],
): number[] {
  if (!sourceCode.trim() || highlights.length === 0) return []

  const lines = sourceCode.split('\n')
  const out = new Set<number>()
  const probes = [...extraSearchTerms, ...FALLBACK_PROBES]

  for (const h of highlights) {
    if (h.target !== target) continue

    if (h.snippet?.trim()) {
      findLinesForSnippet(lines, h.snippet).forEach((n) => out.add(n))
      continue
    }

    const rangeNums: number[] = []
    for (let n = h.line_start; n <= h.line_end && n <= lines.length; n++) {
      if (n >= 1) rangeNums.push(n)
    }

    const nonBlank = rangeNums.filter((n) => !isBlankLine(lines, n))
    if (nonBlank.length > 0) {
      nonBlank.forEach((n) => out.add(n))
      continue
    }

    let matched = false
    for (const probe of probes) {
      const found = findLinesForSnippet(lines, probe)
      if (found.length > 0) {
        found.forEach((n) => out.add(n))
        matched = true
        break
      }
    }
    if (!matched && rangeNums.length > 0) {
      rangeNums.forEach((n) => out.add(n))
    }
  }

  return [...out].sort((a, b) => a - b)
}

/** @deprecated Используйте resolveHighlightLinesInSource с текстом редактора. */
export function lineNumbersFromHighlights(
  highlights: TutorCodeHighlight[],
  target: TutorCodeHighlightTarget,
): number[] {
  const lines = new Set<number>()
  for (const h of highlights) {
    if (h.target !== target) continue
    for (let n = h.line_start; n <= h.line_end; n++) lines.add(n)
  }
  return [...lines].sort((a, b) => a - b)
}

export function snippetsForTheoryPage(highlights: TutorCodeHighlight[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const h of highlights) {
    if (h.target !== 'theory_page') continue
    const s = h.snippet?.trim()
    if (!s || seen.has(s)) continue
    seen.add(s)
    out.push(s)
  }
  return out
}
