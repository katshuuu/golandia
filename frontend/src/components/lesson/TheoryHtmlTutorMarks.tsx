import { useEffect, useRef } from 'react'

type TheoryHtmlTutorMarksProps = {
  snippets: string[]
  /** Меняется при новой подсветке от репетитора. */
  markKey: number
}

export function TheoryHtmlTutorMarks({ snippets, markKey }: TheoryHtmlTutorMarksProps) {
  const ranKey = useRef(-1)

  useEffect(() => {
    if (markKey === ranKey.current) return
    ranKey.current = markKey

    document.querySelectorAll('.lesson-theory-html .tutor-theory-mark').forEach((el) => {
      const parent = el.parentNode
      if (!parent) return
      parent.replaceChild(document.createTextNode(el.textContent ?? ''), el)
      parent.normalize()
    })

    if (snippets.length === 0) return

    const root = document.querySelector('.lesson-theory-html')
    if (!root) return

    for (const snippet of snippets) {
      if (!snippet || snippet.length < 2) continue
      walkAndMark(root, snippet)
    }
  }, [snippets, markKey])

  return null
}

function walkAndMark(root: Element, snippet: string) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    const text = node.textContent ?? ''
    const idx = text.indexOf(snippet)
    if (idx < 0) continue
    const range = document.createRange()
    range.setStart(node, idx)
    range.setEnd(node, idx + snippet.length)
    const mark = document.createElement('mark')
    mark.className = 'tutor-theory-mark'
    try {
      range.surroundContents(mark)
    } catch {
      /* overlapping marks — skip */
    }
    return
  }
}
