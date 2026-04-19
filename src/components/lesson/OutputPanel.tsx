import { Terminal, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Props {
  output: string;
  error: string;
  running: boolean;
  solved: boolean;
}

export default function OutputPanel({ output, error, running, solved }: Props) {
  return (
    <div className="flex flex-col h-full bg-[var(--bg-app)]">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-app)]">
        <Terminal size={13} className="text-[var(--text-muted)]" />
        <span className="text-[11px] text-[var(--text-muted)] font-mono">вывод программы</span>
        {running && <Loader2 size={12} className="text-cyan-400 animate-spin ml-auto" />}
        {!running && solved && (
          <div className="ml-auto flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 size={12} />
            <span className="text-[10px] font-medium">Решено!</span>
          </div>
        )}
        {!running && error && !solved && (
          <div className="ml-auto flex items-center gap-1.5 text-red-400">
            <XCircle size={12} />
            <span className="text-[10px]">Ошибка</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed">
        {running && (
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Loader2 size={14} className="animate-spin" />
            <span>Компилируем и запускаем...</span>
          </div>
        )}

        {!running && !output && !error && (
          <p className="text-[var(--border-color)] text-xs">
            Нажми «Запустить» чтобы выполнить код
          </p>
        )}

        {!running && error && (
          <pre className="text-red-400 whitespace-pre-wrap text-xs leading-relaxed">{error}</pre>
        )}

        {!running && output && (
          <pre className={`whitespace-pre-wrap text-xs leading-relaxed ${solved ? 'text-emerald-400' : 'text-cyan-400'}`}>
            {output}
          </pre>
        )}
      </div>
    </div>
  );
}
