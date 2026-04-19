import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { fetchManifest } from "@/lib/api";
import type { CourseManifest } from "@/lib/types";
import { Dashboard } from "@/pages/Dashboard";
import { LessonPage } from "@/pages/LessonPage";
import { FinalProject } from "@/pages/FinalProject";
import { ProfilePage } from "@/pages/ProfilePage";
import { AchievementsPage } from "@/pages/AchievementsPage";
import { AuthPage } from "@/pages/AuthPage";
import { getCurrentUser, logout, type AuthUser } from "@/store/auth";
import { ManifestProvider } from "@/context/ManifestContext";
import { CelebrationProvider } from "@/context/CelebrationContext";
import { AppShell } from "@/components/layout/AppShell";

function LoadingManifest() {
  return (
    <div className="shell">
      <p>Загружаем манифест курса… Если долго — подними бэкенд на :8080.</p>
    </div>
  );
}

export default function App() {
  const [manifest, setManifest] = useState<CourseManifest | null>(null);
  const [tick, setTick] = useState(0);
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());

  useEffect(() => {
    fetchManifest().then(setManifest).catch(() => setManifest(null));
  }, [tick]);

  function handleLogout() {
    logout();
    setUser(null);
  }

  return (
    <BrowserRouter>
      {!manifest ? (
        <LoadingManifest />
      ) : (
        <ManifestProvider value={manifest}>
          <CelebrationProvider>
          <Routes>
            <Route path="/auth" element={user ? <Navigate to="/course" replace /> : <AuthPage onAuth={setUser} />} />
            <Route path="/" element={<Navigate to={user ? "/course" : "/auth"} replace />} />
            <Route
              element={
                user ? (
                  <AppShell user={user} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            >
              <Route path="/course" element={<Dashboard />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/lesson/:id" element={<LessonPage onProgress={() => setTick((t) => t + 1)} />} />
              <Route path="/final" element={<FinalProject />} />
            </Route>
            <Route path="*" element={<Navigate to={user ? "/course" : "/auth"} replace />} />
          </Routes>
          </CelebrationProvider>
        </ManifestProvider>
      )}
    </BrowserRouter>
  );
}
