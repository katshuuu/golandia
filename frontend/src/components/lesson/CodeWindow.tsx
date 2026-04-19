/**
 * Блок кода в стиле окна редактора (как на макетах): панель с «светофором» и меткой языка.
 */
export function CodeWindow({ code, lang = "go" }: { code: string; lang?: string }) {
  return (
    <div className="code-window">
      <div className="code-window__chrome" aria-hidden="true">
        <span className="code-window__dots">
          <span className="code-window__dot code-window__dot--r" />
          <span className="code-window__dot code-window__dot--y" />
          <span className="code-window__dot code-window__dot--g" />
        </span>
        <span className="code-window__lang">{lang}</span>
      </div>
      <pre className="code-window__pre">
        <code className="code-window__code">{code}</code>
      </pre>
    </div>
  );
}
