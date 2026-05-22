import { describe, expect, it } from 'vitest'
import {
  resolveHighlightLinesInSource,
  searchTermsFromUserMessage,
  type TutorCodeHighlight,
} from './tutorCodeHighlight'

const SAMPLE = `package main

import "fmt"

func main() {
\t// TODO: напиши здесь своё приветствие
\tfmt.Println("Привет, мир!")
}
`

describe('resolveHighlightLinesInSource', () => {
  it('finds fmt.Println line by snippet', () => {
    const highlights: TutorCodeHighlight[] = [
      { target: 'user_code', line_start: 4, line_end: 4, snippet: 'fmt.Println' },
    ]
    const lines = resolveHighlightLinesInSource(SAMPLE, highlights, 'user_code')
    expect(lines).toContain(7)
    expect(lines).not.toContain(4)
  })

  it('ignores blank LLM line range and uses question terms', () => {
    const highlights: TutorCodeHighlight[] = [
      { target: 'user_code', line_start: 4, line_end: 4 },
    ]
    const lines = resolveHighlightLinesInSource(SAMPLE, highlights, 'user_code', [
      'fmt.Println',
    ])
    expect(lines).toEqual([7])
  })

  it('searchTermsFromUserMessage extracts fmt.Println', () => {
    expect(searchTermsFromUserMessage('подсвети функцию fmt.Println')).toContain('fmt.Println')
  })
})
