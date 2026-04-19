interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={i} className="my-4 rounded-xl overflow-hidden border border-[var(--border-color)]">
          {lang && (
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-app)] border-b border-[var(--border-color)]">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <span className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
              <span className="text-[11px] text-[var(--text-muted)] ml-1">{lang}</span>
            </div>
          )}
          <pre className="bg-[var(--bg-app)] p-4 overflow-x-auto">
            <code className="text-sm font-mono text-[var(--text-primary)] leading-relaxed whitespace-pre">
              {codeLines.join('\n')}
            </code>
          </pre>
        </div>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-2xl font-bold text-[var(--text-primary)] mt-6 mb-3 first:mt-0">
          {renderInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-lg font-semibold text-[var(--text-primary)] mt-5 mb-2 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full inline-block" />
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-base font-semibold text-cyan-400 mt-4 mb-1.5">
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith('| ')) {
      const tableLines: string[] = [line];
      i++;
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines.filter(l => !l.match(/^\|[-| ]+\|$/));
      elements.push(
        <div key={i} className="my-4 overflow-x-auto rounded-xl border border-[var(--border-color)]">
          <table className="w-full text-sm">
            {rows.map((row, ri) => {
              const cells = row.split('|').filter(c => c.trim() !== '');
              return ri === 0 ? (
                <thead key={ri}>
                  <tr className="bg-[var(--bg-app)]">
                    {cells.map((c, ci) => (
                      <th key={ci} className="px-4 py-2.5 text-left text-[var(--text-secondary)] font-medium border-b border-[var(--border-color)]">
                        {renderInline(c.trim())}
                      </th>
                    ))}
                  </tr>
                </thead>
              ) : (
                ri === 1 ? (
                  <tbody key="body">
                    <tr className="hover:bg-[var(--bg-surface-hover)] transition-colors border-b border-[var(--border-color)]">
                      {cells.map((c, ci) => (
                        <td key={ci} className="px-4 py-2.5 text-[var(--text-primary)]">{renderInline(c.trim())}</td>
                      ))}
                    </tr>
                  </tbody>
                ) : (
                  <tr key={ri} className="hover:bg-[var(--bg-surface-hover)] transition-colors border-b border-[var(--border-color)] last:border-0">
                    {cells.map((c, ci) => (
                      <td key={ci} className="px-4 py-2.5 text-[var(--text-primary)]">{renderInline(c.trim())}</td>
                    ))}
                  </tr>
                )
              );
            })}
          </table>
        </div>
      );
      continue;
    } else if (line.startsWith('- ')) {
      const items: string[] = [line.slice(2)];
      i++;
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={i} className="my-3 space-y-1.5 ml-1">
          {items.map((item, ii) => (
            <li key={ii} className="flex items-start gap-2.5 text-[var(--text-secondary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
              <span className="text-sm leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-[var(--text-secondary)] text-sm leading-relaxed my-1.5">
          {renderInline(line)}
        </p>
      );
    }
    i++;
  }

  return <div className="prose-custom">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-[var(--bg-app)] border border-[var(--border-color)] text-cyan-400 px-1.5 py-0.5 rounded-md text-[0.85em] font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-[var(--text-primary)] font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
