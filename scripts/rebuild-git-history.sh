#!/usr/bin/env bash
# Пересобирает main в 35 коммитов (1 начальный + 34 тематических).
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree has changes — proceeding with soft reset."
fi

FIRST=$(git rev-list --max-parents=0 HEAD)
git reset --soft "$FIRST"
git reset

c() {
  git add "$@"
  if git diff --cached --quiet; then
    echo "skip empty: $MSG"
    return
  fi
  git commit -m "$MSG"
  echo "✓ $MSG"
}

MSG="chore: add root gitignore and project layout"
c .gitignore
[[ -f golandia ]] && c golandia || git rm -f golandia 2>/dev/null && c golandia || true

MSG="docs: add Golandia README"
c README.md

MSG="db: add PostgreSQL schema, triggers and backup script"
c db/

MSG="backend: initialize Go module and dependencies"
c backend/go.mod backend/go.sum backend/.gitignore backend/.env.example

MSG="backend: add course domain models"
c backend/internal/models/

MSG="backend: add course loader facade"
c backend/internal/course/loader.go

MSG="backend: implement checker strategy pattern"
c backend/internal/checker/

MSG="backend: add sandbox runners and factory"
c backend/internal/sandbox/

MSG="backend: add OpenAI tutor client"
c backend/internal/llm/

MSG="backend: add hero level computation"
c backend/internal/hero/hero.go

MSG="backend: add course and lesson HTTP handlers"
c backend/internal/handlers/course.go backend/internal/handlers/hero.go

MSG="backend: add sandbox run and lesson check handlers"
c backend/internal/handlers/sandbox.go backend/internal/handlers/check.go

MSG="backend: add tutor chat handler"
c backend/internal/handlers/chat.go

MSG="backend: add PostgreSQL pool and user repository"
c backend/internal/db/ backend/internal/repository/

MSG="backend: add user profile and progress REST handlers"
c backend/internal/handlers/user.go backend/internal/handlers/validation_response.go

MSG="backend: add shared validation for entity fields"
c backend/internal/validation/

MSG="backend: add response time middleware"
c backend/internal/middleware/

MSG="backend: wire HTTP server and API routes"
c backend/cmd/server/main.go

MSG="backend: add Docker build files"
c backend/docker/

MSG="backend: add course manifest and modules 1-3"
c backend/data/lessons/course_manifest.json backend/data/lessons/module_01.json backend/data/lessons/module_02.json backend/data/lessons/module_03.json backend/data/lessons/theory_html/

MSG="backend: add course modules 4-7"
c backend/data/lessons/module_04.json backend/data/lessons/module_05.json backend/data/lessons/module_06.json backend/data/lessons/module_07.json

MSG="backend: add unit and HTTP tests"
c backend/internal/course/loader_test.go backend/internal/course/testdata/ backend/internal/hero/hero_test.go backend/internal/handlers/check_http_test.go backend/internal/handlers/course_http_test.go backend/internal/handlers/hero_http_test.go backend/internal/handlers/testutil_test.go backend/internal/handlers/user_validation_test.go backend/internal/middleware/latency_test.go

MSG="frontend: add Vite React toolchain"
c frontend/package.json frontend/package-lock.json frontend/.gitignore frontend/index.html frontend/vite.config.ts frontend/tsconfig.json frontend/tsconfig.app.json frontend/tsconfig.node.json frontend/eslint.config.js frontend/README.md package-lock.json

MSG="frontend: add global styles and theme"
c frontend/src/index.css frontend/src/App.css frontend/src/theme/ frontend/css/

MSG="frontend: add course API and local progress helpers"
c frontend/src/lib/courseApi.ts frontend/src/lib/courseFinalLesson.ts frontend/src/lib/lessonProgressLocal.ts frontend/src/lib/progressMap.ts frontend/src/lib/progressMap.test.ts frontend/src/lib/finalProjectLocal.ts frontend/src/lib/localUser.ts frontend/src/lib/heroPortrait.ts

MSG="frontend: add validation library and API error parsing"
c frontend/src/lib/validation.ts frontend/src/lib/validation.test.ts frontend/src/lib/apiErrors.ts frontend/src/lib/userApi.ts frontend/src/test/

MSG="frontend: add profile forms with inline validation"
c frontend/src/forms/ frontend/src/lib/profileLocal.ts frontend/src/lib/profileLessonOrder.ts frontend/src/lib/profileLessonOrder.test.ts frontend/src/lib/resizeAvatar.ts frontend/src/lib/profileChat.ts frontend/src/lib/profileChatArchive.ts frontend/src/lib/profileResumeNavigation.ts

MSG="frontend: add main page layout and course hooks"
c frontend/src/pages/MainPage.tsx frontend/src/components/main-page/ frontend/src/hooks/useMainPageCourse.ts frontend/src/components/MainPage.css frontend/src/components/AppSiteHeader.tsx frontend/src/components/AppSiteHeader.css frontend/src/components/LinkWithRef.tsx

MSG="frontend: add lesson editor, sandbox and output panel"
c frontend/src/components/lesson/ frontend/src/forms/LessonSandboxForm.tsx frontend/src/hooks/useLessonSandbox.ts

MSG="frontend: add profile and achievements pages"
c frontend/src/pages/ProfilePage.tsx frontend/src/pages/AchievementsPage.tsx frontend/src/pages/AppPages.css frontend/src/pages/styles/ frontend/src/components/profile/ frontend/src/hooks/useProfilePage.ts frontend/src/hooks/useProfileChat.ts

MSG="frontend: add tutor chat panel"
c frontend/src/components/TutorChatPanel.tsx frontend/src/components/TutorChatPanel.css

MSG="frontend: add app shell, routing and public assets"
c frontend/src/App.tsx frontend/src/main.tsx frontend/src/vite-env.d.ts frontend/public/

MSG="frontend: add UI assets and quote tear animation"
c frontend/src/assets/ frontend/src/components/QuoteTearStrip.tsx frontend/src/components/QuoteTearStrip.css frontend/src/components/quoteTear/ frontend/src/components/AchievementHeroViewer.tsx

MSG="docs: add kursovaya documentation and test outputs"
c docs/

MSG="chore: add docker-compose for distributed monolith"
c docker-compose.yml

# Остаток
if [[ -n "$(git status --porcelain)" ]]; then
  MSG="chore: add remaining project files"
  c -A
fi

COUNT=$(git rev-list --count HEAD)
echo ""
echo "Total commits: $COUNT"
git log --oneline | head -40
