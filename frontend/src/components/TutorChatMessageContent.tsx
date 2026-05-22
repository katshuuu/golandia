import { Fragment } from 'react'

const GO_KEYWORDS =
  /\b(package|import|func|var|const|type|struct|interface|map|chan|go|defer|return|if|else|for|range|switch|case|default|break|continue|nil|true|false|int|string|bool|float64|fmt|main)\b/g

function highlightGoLine(line: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  const re = new RegExp(GO_KEYWORDS.source, 'g')
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) parts.push(line.slice(last, m.index))
    parts.push(
      <span key={`${m.index}-${m[0]}`} className="tutor-chat-code-kw">
        {m[0]}
      </span>,
    )
    last = m.index + m[0].length
  }
  if (last < line.length) parts.push(line.slice(last))
  return parts.length ? parts : [line]
}

function InlineCode({ text }: { text: string }) {
  return <code className="tutor-chat-inline-code">{text}</code>
}

type Block = { type: 'text'; value: string } | { type: 'code'; lang: string; lines: string[] }

function splitMessageBlocks(content: string): Block[] {
  const blocks: Block[] = []
  const re = /```(\w*)\n?([\s\S]*?)```/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) {
      blocks.push({ type: 'text', value: content.slice(last, m.index) })
    }
    blocks.push({
      type: 'code',
      lang: (m[1] || 'go').toLowerCase(),
      lines: m[2].replace(/\n$/, '').split('\n'),
    })
    last = m.index + m[0].length
  }
  if (last < content.length) blocks.push({ type: 'text', value: content.slice(last) })
  if (blocks.length === 0) blocks.push({ type: 'text', value: content })
  return blocks
}

function renderTextWithInlineCode(text: string, keyPrefix: string) {
  const parts = text.split(/(`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return <InlineCode key={`${keyPrefix}-i-${i}`} text={part.slice(1, -1)} />
    }
    const lines = part.split('\n')
    return (
      <Fragment key={`${keyPrefix}-t-${i}`}>
        {lines.map((line, li) => (
          <Fragment key={`${keyPrefix}-l-${i}-${li}`}>
            {li > 0 ? <br /> : null}
            {line}
          </Fragment>
        ))}
      </Fragment>
    )
  })
}

type TutorChatMessageContentProps = {
  content: string
  role: 'user' | 'assistant'
}

export function TutorChatMessageContent({ content, role }: TutorChatMessageContentProps) {
  if (role === 'user') {
    return <>{renderTextWithInlineCode(content, 'u')}</>
  }

  const blocks = splitMessageBlocks(content)
  return (
    <>
      {blocks.map((block, bi) => {
        if (block.type === 'text') {
          const trimmed = block.value.trim()
          if (!trimmed) return null
          return (
            <p key={`t-${bi}`} className="tutor-chat-msg-text">
              {renderTextWithInlineCode(block.value, `a-${bi}`)}
            </p>
          )
        }
        return (
          <pre key={`c-${bi}`} className="tutor-chat-code-block">
            <code>
              {block.lines.map((line, li) => (
                <div key={li} className="tutor-chat-code-line">
                  {highlightGoLine(line)}
                </div>
              ))}
            </code>
          </pre>
        )
      })}
    </>
  )
}
