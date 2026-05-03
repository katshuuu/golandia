import { useEffect } from "react";

/**
 * Полная перезагрузка вкладки. Сессия в localStorage (аккаунт, прогресс) сохраняется браузером.
 */
export function reloadApplication(): void {
  if (typeof window === "undefined") return;
  window.location.reload();
}

/**
 * Стандартное предупреждение браузера при закрытии вкладки/перезагрузке с несохранённым черновиком.
 * Современные браузеры часто игнорируют произвольный текст и показывают свой диалог.
 */
export function useBeforeUnloadWhen(dirty: boolean, enabled = true): void {
  useEffect(() => {
    if (!enabled || !dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, enabled]);
}
