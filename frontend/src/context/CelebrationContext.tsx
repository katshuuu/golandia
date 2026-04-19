import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import type { GamificationEvent } from "@/lib/gamificationEvents";

type CelebrationContextValue = {
  enqueue: (events: GamificationEvent[]) => void;
};

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

export function useCelebrate() {
  const v = useContext(CelebrationContext);
  if (!v) throw new Error("useCelebrate must be used within CelebrationProvider");
  return v.enqueue;
}

function fireConfetti() {
  const colors = ["#ffa552", "#0d9488", "#7c3aed", "#f472b6", "#38bdf8"];
  const count = 160;
  confetti({
    particleCount: Math.floor(count * 0.45),
    spread: 70,
    origin: { y: 0.58 },
    colors,
    ticks: 220,
    gravity: 1.05,
    scalar: 1.05,
  });
  confetti({
    particleCount: Math.floor(count * 0.35),
    spread: 100,
    startVelocity: 38,
    origin: { y: 0.62, x: 0.25 },
    colors,
    ticks: 200,
  });
  confetti({
    particleCount: Math.floor(count * 0.35),
    spread: 100,
    startVelocity: 38,
    origin: { y: 0.62, x: 0.75 },
    colors,
    ticks: 200,
  });
}

function CelebrationModal({
  event,
  onClose,
}: {
  event: GamificationEvent;
  onClose: () => void;
}) {
  const isHero = event.type === "hero_level";

  return (
    <div className="celebration-overlay" role="presentation">
      <div
        className="celebration-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-modal-title"
      >
        <button
          type="button"
          className="celebration-modal__close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>
        <p className="celebration-modal__kicker">
          {isHero ? "Новый уровень героя" : "Достижение"}
        </p>
        {isHero ? (
          <>
            <div className="celebration-modal__level-ring" aria-hidden>
              <span className="celebration-modal__level-num">{event.level}</span>
            </div>
            <h2 id="celebration-modal-title" className="celebration-modal__title">
              {event.title}
            </h2>
            <p className="celebration-modal__sub">Ты продвинулся по курсу — так держать.</p>
          </>
        ) : (
          <>
            <div className="celebration-modal__emoji" aria-hidden>
              {event.achievement.icon}
            </div>
            <h2 id="celebration-modal-title" className="celebration-modal__title">
              {event.achievement.title}
            </h2>
            <p className="celebration-modal__sub">{event.achievement.requirement}</p>
          </>
        )}
      </div>
    </div>
  );
}

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<GamificationEvent[]>([]);
  const lastKeyRef = useRef<string>("");

  const enqueue = useCallback((events: GamificationEvent[]) => {
    if (!events.length) return;
    setQueue((q) => [...q, ...events]);
  }, []);

  const current = queue[0] ?? null;

  const dismiss = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  useEffect(() => {
    if (!current) {
      lastKeyRef.current = "";
      return;
    }
    const key =
      current.type === "hero_level"
        ? `h-${current.level}`
        : `a-${current.achievement.id}`;
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;
    fireConfetti();
  }, [current]);

  useEffect(() => {
    if (!current) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, dismiss]);

  const value = useMemo(() => ({ enqueue }), [enqueue]);

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      {typeof document !== "undefined" && current
        ? createPortal(<CelebrationModal event={current} onClose={dismiss} />, document.body)
        : null}
    </CelebrationContext.Provider>
  );
}
