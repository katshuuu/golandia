import { useRef, useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  starterCode: string;
}

export default function CodeEditor({ value, onChange, starterCode }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(1);

  useEffect(() => {
    setLineCount(value.split('\n').length);
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const ta = textareaRef.current!;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;

    if (e.key === 'Tab') {
      e.preventDefault();
      const newVal = val.substring(0, start) + '    ' + val.substring(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }

    if (e.key === 'Enter') {
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const currentLine = val.substring(lineStart, start);
      const indent = currentLine.match(/^(\s*)/)?.[1] || '';
      const trimmed = currentLine.trim();
      const extraIndent = trimmed.endsWith('{') ? '    ' : '';
      e.preventDefault();
      const newVal = val.substring(0, start) + '\n' + indent + extraIndent + val.substring(end);
      onChange(newVal);
      const newPos = start + 1 + indent.length + extraIndent.length;
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = newPos;
      });
    }
  }

  function syncScroll() {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  function handleReset() {
    onChange(starterCode);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-app)] border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <span className="text-[11px] text-[var(--text-muted)] ml-1 font-mono">main.go</span>
        </div>
        <button
          onClick={handleReset}
          title="Сбросить код"
          className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1 rounded-lg hover:bg-[var(--bg-surface)]"
        >
          <RotateCcw size={11} />
          Сбросить
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden flex">
        <div
          ref={lineNumbersRef}
          className="select-none py-4 px-3 bg-[var(--bg-app)] text-[var(--text-muted)] text-sm font-mono leading-6 text-right min-w-[3rem] overflow-hidden shrink-0"
          style={{ userSelect: 'none', lineHeight: '1.5rem' }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          spellCheck={false}
          className="flex-1 bg-[var(--bg-app)] text-[var(--text-primary)] text-sm font-mono leading-6 p-4 resize-none focus:outline-none caret-cyan-400 selection:bg-cyan-500/20"
          style={{ lineHeight: '1.5rem', tabSize: 4 }}
        />
      </div>
    </div>
  );
}
