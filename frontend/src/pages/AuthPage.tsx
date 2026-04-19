import { useMemo, useState } from "react";
import type { AuthUser } from "@/store/auth";
import { getDemoCredentials, login, register } from "@/store/auth";

export function AuthPage({ onAuth }: { onAuth: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const demo = useMemo(() => getDemoCredentials(), []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "login") {
      const res = login(email, password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onAuth(res.user);
      return;
    }

    const res = register(name, email, password);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onAuth(res.user);
  }

  function fillDemo() {
    setMode("login");
    setEmail(demo.email);
    setPassword(demo.password);
    setError(null);
  }

  return (
    <div className="shell" style={{ minHeight: "calc(100vh - 80px)", display: "grid", placeItems: "center" }}>
      <div className="card" style={{ width: "100%", maxWidth: 520 }}>
        <div className="tag">{mode === "login" ? "Вход" : "Регистрация"}</div>
        <h1 style={{ margin: "0.55rem 0 0.35rem", fontSize: "1.45rem" }}>
          {mode === "login" ? "Войдите в платформу" : "Создайте аккаунт"}
        </h1>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          {mode === "login"
            ? "Чтобы продолжить обучение, авторизуйтесь."
            : "После регистрации вы сразу попадёте на карту курса."}
        </p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {mode === "register" && (
            <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Имя</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например, Катя"
                style={{
                  background: "#0a0e13",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  borderRadius: 10,
                  padding: "0.65rem 0.75rem",
                }}
              />
            </label>
          )}

          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                background: "#0a0e13",
                border: "1px solid var(--border)",
                color: "var(--text)",
                borderRadius: 10,
                padding: "0.65rem 0.75rem",
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              style={{
                background: "#0a0e13",
                border: "1px solid var(--border)",
                color: "var(--text)",
                borderRadius: 10,
                padding: "0.65rem 0.75rem",
              }}
            />
          </label>

          {error ? (
            <div style={{ color: "#fca5a5", border: "1px solid #7f1d1d", borderRadius: 10, padding: "0.5rem 0.65rem" }}>{error}</div>
          ) : null}

          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <button type="submit" className="btn btn-primary">
              {mode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
            <button type="button" className="btn" onClick={fillDemo}>
              Демо-вход
            </button>
          </div>
        </form>

        <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "0.8rem" }}>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
            {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: 0, border: "none", color: "var(--accent)" }}
              onClick={() => {
                setError(null);
                setMode(mode === "login" ? "register" : "login");
              }}
            >
              {mode === "login" ? "Зарегистрироваться" : "Войти"}
            </button>
          </p>
          <p style={{ margin: "0.45rem 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
            Демо-пример: email <code>{demo.email}</code>, пароль <code>{demo.password}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
