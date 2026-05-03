import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { fetchManifest, readCachedManifest } from "@/lib/api";
import type { CourseManifest } from "@/lib/types";
import { AuthPage } from "@/pages/AuthPage";
import { getCurrentUser, logout, type AuthUser } from "@/store/auth";
import { ManifestProvider } from "@/context/ManifestContext";
import { CelebrationProvider } from "@/context/CelebrationContext";
import { AppShell } from "@/components/layout/AppShell";
import { reloadApplication } from "@/lib/appLifecycle";

const Dashboard = lazy(() => import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const LessonPage = lazy(() => import("@/pages/LessonPage").then((m) => ({ default: m.LessonPage })));
const FinalProject = lazy(() => import("@/pages/FinalProject").then((m) => ({ default: m.FinalProject })));
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const AchievementsPage = lazy(() => import("@/pages/AchievementsPage").then((m) => ({ default: m.AchievementsPage })));

function LoadingManifest() {
  return (
    <div className="shell">
      <p>Загружаем манифест курса… Если долго — подними бэкенд на :8080.</p>
    </div>
  );
}

function ManifestFetchError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="shell shell--wide">
      <h1 style={{ fontSize: "1.2rem", margin: "0 0 0.5rem" }}>Не удалось загрузить курс</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.5, maxWidth: "36rem" }}>
        Проверь, что бэкенд запущен (обычно <code style={{ fontSize: "0.9em" }}>go run ./cmd/server</code> в папке{" "}
        <code style={{ fontSize: "0.9em" }}>backend</code>
        , порт 8080) и что dev-сервер проксирует <code style={{ fontSize: "0.9em" }}>/api</code>. Вход и прогресс в
        браузере сохраняются — можно безопасно обновить страницу.
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Повторить запрос
        </button>
        <button type="button" className="btn" onClick={() => reloadApplication()}>
          Перезагрузить страницу
        </button>
      </div>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="shell shell--wide" style={{ padding: "2rem 1.25rem" }}>
      <p style={{ margin: 0, color: "var(--muted)" }}>Загрузка…</p>
    </div>
  );
}

function AuthenticatedApp({
  user,
  manifest,
  onLogout,
}: {
  user: AuthUser;
  manifest: CourseManifest;
  onLogout: () => void;
}) {
  return (
    <ManifestProvider value={manifest}>
      <CelebrationProvider>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route element={<AppShell user={user} onLogout={onLogout} />}>
              <Route path="course" element={<Dashboard />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="achievements" element={<AchievementsPage />} />
              <Route path="lesson/:id" element={<LessonPage />} />
              <Route path="final" element={<FinalProject />} />
            </Route>
            <Route path="*" element={<Navigate to="/course" replace />} />
          </Routes>
        </Suspense>
      </CelebrationProvider>
    </ManifestProvider>
  );
}

function RequireUser({
  user,
  manifest,
  manifestFetchSettled,
  manifestFetchFailed,
  onRetryManifest,
  onLogout,
}: {
  user: AuthUser | null;
  manifest: CourseManifest | null;
  manifestFetchSettled: boolean;
  manifestFetchFailed: boolean;
  onRetryManifest: () => void;
  onLogout: () => void;
}) {
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  if (!manifest) {
    if (!manifestFetchSettled) {
      return <LoadingManifest />;
    }
    if (manifestFetchFailed) {
      return <ManifestFetchError onRetry={onRetryManifest} />;
    }
    return <LoadingManifest />;
  }
  return <AuthenticatedApp user={user} manifest={manifest} onLogout={onLogout} />;
}

export default function App() {
  const [manifest, setManifest] = useState<CourseManifest | null>(() => readCachedManifest());
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [manifestFetchSettled, setManifestFetchSettled] = useState(false);
  const [manifestFetchFailed, setManifestFetchFailed] = useState(false);
  const [manifestRetryKey, setManifestRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setManifestFetchSettled(false);
    setManifestFetchFailed(false);

    fetchManifest()
      .then((m) => {
        if (!cancelled) {
          setManifest(m);
          setManifestFetchFailed(false);
        }
      })
      .catch(() => {
        if (cancelled) return;
        const cached = readCachedManifest();
        setManifest((prev) => prev ?? cached);
        setManifestFetchFailed(!cached);
      })
      .finally(() => {
        if (!cancelled) {
          setManifestFetchSettled(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [manifestRetryKey]);

  function handleLogout() {
    logout();
    setUser(null);
  }

  function retryManifest() {
    setManifestRetryKey((k) => k + 1);
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/course" replace /> : <AuthPage onAuth={setUser} />} />
        <Route path="/" element={<Navigate to={user ? "/course" : "/auth"} replace />} />
        <Route
          path="*"
          element={
            <RequireUser
              user={user}
              manifest={manifest}
              manifestFetchSettled={manifestFetchSettled}
              manifestFetchFailed={manifestFetchFailed}
              onRetryManifest={retryManifest}
              onLogout={handleLogout}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
