<div align="center">

# Golandia

**Интерактивная платформа для изучения Go с AI-репетитором**

Уроки по мотивам A Tour of Go · запуск кода в изолированной песочнице · автопроверка заданий · LLM-чат в контексте урока

![Go](https://img.shields.io/badge/Go-1.22-00ADD8?logo=go&logoColor=white)
![Gin](https://img.shields.io/badge/Gin-REST_API-00ADD8)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?logo=docker&logoColor=white)

<img src="docs/ui/task-and-ai-tutor.png" alt="Практическое задание в редакторе и ответ AI-репетитора" width="100%">

<sub>Практическое задание: студент пишет код в браузере, запускает его в песочнице, а AI-помощник подсказывает в контексте текущего урока</sub>

</div>

---

## О проекте

**Golandia** — веб-платформа для изучения языка Go: интерактивные уроки, песочница для кода, автоматическая проверка заданий, профиль студента, система уровней героя и чат-репетитор на базе LLM.

Проект реализован как распределённый монолит: React SPA, Go REST API, PostgreSQL и изолированная среда выполнения Go-кода. Контент курса хранится в JSON и версионируется в Git; персональные данные — в базе данных.

### Ключевые решения на бэкенде

- **Изолированный запуск пользовательского кода** — Go-программы выполняются в отдельном Docker-контейнере; режим выбирается фабрикой (`docker` / `local`).
- **Расширяемая автопроверка** — паттерн «Стратегия»: точный вывод, подстроки, regex, запрещённые конструкции; новый тип проверки добавляется без изменения обработчиков.
- **Слой данных через Repository** — профиль и прогресс в PostgreSQL (pgx/v5), миграции применяются при старте контейнера.
- **Устойчивость к отказу БД** — без PostgreSQL курс, песочница и проверка заданий продолжают работать, отключаются только пользовательские маршруты.
- **Единые правила валидации** на фронтенде и бэкенде, ошибки API в формате `{ error, fields[] }`.
- **Middleware для логирования latency** с отдельной пометкой медленных запросов.
- **Тесты**: `go test ./...` для checker, course, handlers, hero, validation; Vitest для фронтенда.

---

## Содержание

- [Возможности](#возможности)
- [Интерфейс](#интерфейс)
- [Технологический стек](#технологический-стек)
- [Архитектура](#архитектура)
- [Требования](#требования)
- [Быстрый запуск (Docker)](#быстрый-запуск-docker)
- [Локальная разработка](#локальная-разработка)
- [Переменные окружения](#переменные-окружения)
- [Структура репозитория](#структура-репозитория)
- [REST API](#rest-api)
- [Контент курса](#контент-курса)
- [Иллюстрации в теории уроков](#иллюстрации-в-теории-уроков)
- [Валидация данных](#валидация-данных)
- [Тестирование](#тестирование)
- [Документация курсовой работы](#документация-курсовой-работы)
- [Сопровождение](#сопровождение)

---

## Возможности

| Область | Описание |
|---------|----------|
| **Курс** | 7 модулей, уроки по мотивам [A Tour of Go](https://go.dev/tour/): теория (HTML), демо-код, практические задания |
| **Редактор** | Встроенный редактор на главной странице: запуск кода в песочнице и автопроверка результата |
| **Песочница** | Выполнение Go в Docker-контейнере или локально (`SANDBOX_MODE=local`) |
| **Автопроверка** | Стратегии: точное совпадение вывода, подстроки, regex, запрещённые конструкции |
| **Профиль** | Имя, аватар (JPEG data URL), кольцо прогресса по урокам, архив чатов с репетитором |
| **Достижения** | 7 уровней героя (от «Стажёра» до «Легенды Go») по числу полностью пройденных модулей |
| **Чат-репетитор** | `POST /api/chat/tutor` — ответы OpenAI в контексте текущего урока |
| **Темы оформления** | Светлая и тёмная тема, единая дизайн-система на CSS-переменных |

Маршруты фронтенда:

| URL | Экран |
|-----|--------|
| `/` | Главная: модули, урок, теория / задание, AI-помощник |
| `/profile` | Профиль студента (scrapbook-макет) |
| `/achievements` | Достижения и уровень героя |

---

## Интерфейс

### Уроки и практика

Слева — навигация по модулям, в центре — теория с примерами кода, которые можно запустить прямо на странице. Во вкладке «Задание» — стартовый код, кнопки «Запустить» и «Проверить», вывод программы.

<table>
  <tr>
    <td width="50%"><img src="docs/ui/welcome-lesson.png" alt="Вводный урок и список уроков модуля"></td>
    <td width="50%"><img src="docs/ui/task-editor.png" alt="Практическое задание с редактором кода"></td>
  </tr>
  <tr>
    <td align="center"><sub>Вводный урок и список уроков модуля</sub></td>
    <td align="center"><sub>Задание с редактором, запуском и автопроверкой</sub></td>
  </tr>
</table>

### AI-репетитор

Чат открывается поверх урока и получает его контекст, поэтому отвечает про текущую тему, а не «в общем». История диалогов сохраняется в архиве на странице профиля.

<table>
  <tr>
    <td width="50%"><img src="docs/ui/ai-tutor-answer.png" alt="Ответ AI-репетитора по теме урока"></td>
    <td width="50%"><img src="docs/ui/chat-archive.png" alt="Архив чатов с репетитором в профиле"></td>
  </tr>
  <tr>
    <td align="center"><sub>Вопрос по теме урока «Методы и косвенность указателей»</sub></td>
    <td align="center"><sub>Архив чатов с привязкой к уроку</sub></td>
  </tr>
</table>

### Профиль и достижения

Прогресс по 93 урокам, ID-карточка студента с аватаром и уровень героя, который растёт по мере закрытия модулей.

<table>
  <tr>
    <td width="50%"><img src="docs/ui/profile.png" alt="Профиль студента"></td>
    <td width="50%"><img src="docs/ui/achievements.png" alt="Достижения и уровень героя"></td>
  </tr>
  <tr>
    <td align="center"><sub>Профиль: прогресс по курсу и следующий урок</sub></td>
    <td align="center"><sub>Уровни героя и статистика</sub></td>
  </tr>
</table>

### Светлая и тёмная тема

<table>
  <tr>
    <td width="50%"><img src="docs/ui/theme-light.png" alt="Светлая тема"></td>
    <td width="50%"><img src="docs/ui/theme-dark.png" alt="Тёмная тема"></td>
  </tr>
</table>

---

## Технологический стек

| Слой | Технологии |
|------|------------|
| **Frontend** | React 18, TypeScript, Vite 4, React Router 7, Vitest, Testing Library |
| **Backend** | Go 1.22, Gin, pgx/v5, godotenv |
| **БД** | PostgreSQL 16 (профиль, прогресс, аудит) |
| **Контент** | JSON (`backend/data/lessons/`) |
| **Песочница** | Docker-образ `go-llm-sandbox` или локальный `go run` |
| **LLM** | OpenAI API (опционально, для чата) |
| **Инфраструктура** | Docker Compose |

---

## Архитектура

```mermaid
flowchart LR
  subgraph client [Браузер]
    SPA[React SPA\nlocalhost:5173]
  end
  subgraph server [Backend Go]
    API[Gin REST\n:8080]
    Course[Загрузчик курса\nJSON]
    Checker[Стратегии проверки]
    Sandbox[Песочница Go]
    Hero[Расчёт уровня героя]
  end
  subgraph data [Данные]
    PG[(PostgreSQL)]
    Files[module_*.json\ncourse_manifest.json]
  end
  LLM[OpenAI API]

  SPA -->|/api/* proxy| API
  API --> Course
  API --> Files
  API --> Checker
  API --> Sandbox
  API --> Hero
  API --> PG
  API --> LLM
```

**Паттерны проектирования** (подробнее в [docs/03-design-patterns.md](docs/03-design-patterns.md)):

- **Стратегия** — автопроверка заданий (`internal/checker`)
- **Фабрика** — выбор режима песочницы Docker / local (`internal/sandbox`)
- **Repository** — доступ к профилю и прогрессу в PostgreSQL

---

## Требования

**Для Docker (рекомендуется):**

- Docker Engine и Docker Compose v2
- ~4 ГБ свободной RAM (сборка sandbox-образа)

**Для локальной разработки:**

| Компонент | Версия |
|-----------|--------|
| Node.js | 20+ |
| Go | 1.22+ |
| PostgreSQL | 16 (или контейнер `postgres` из Compose) |
| Docker | только если `SANDBOX_MODE=docker` |

---

## Быстрый запуск (Docker)

Из **корня репозитория**:

```bash
docker compose up --build
```

| Сервис | URL / параметры |
|--------|-----------------|
| **Frontend** | http://localhost:5173 |
| **Backend** | http://localhost:8080/api/health |
| **PostgreSQL** | `localhost:5432`, user/db/password: `golandia` |

Сервисы: `postgres`, `backend`, `frontend` (Vite dev), `sandbox` (образ для запуска кода).

Остановка: `Ctrl+C` в терминале или `docker compose down`.

Для чата-репетитора создайте `backend/.env` (см. [`.env.example`](backend/.env.example)) и задайте `OPENAI_API_KEY` — Compose подхватывает переменные из окружения хоста.

---

## Локальная разработка

### 1. База данных

Вариант A — только PostgreSQL в Docker:

```bash
docker compose up -d postgres
```

Вариант B — локальный PostgreSQL с БД `golandia` и пользователем `golandia`.

Схема применяется автоматически при первом старте контейнера из [`db/migrations/001_init.sql`](db/migrations/001_init.sql).

### 2. Backend

```bash
cp backend/.env.example backend/.env
# Отредактируйте backend/.env: DATABASE_URL, SANDBOX_MODE=local для работы без Docker-песочницы

cd backend
go run ./cmd/server
```

Ожидаемый вывод: `listening on :8080`.

<details>
<summary>Пример логов backend: загрузка конфигурации, подключение к PostgreSQL, latency запросов</summary>

<img src="docs/ui/backend-logs.png" alt="Логи Gin: запросы к API и пометка медленного запроса к чату-репетитору">

Middleware фиксирует время ответа каждого запроса; запросы к LLM, превышающие порог, помечаются как `slow request`.

</details>

Проверка: http://localhost:8080/api/health → `{"ok":true}`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Откройте http://localhost:5173. Запросы к `/api/*` проксируются на `http://127.0.0.1:8080` ([`frontend/vite.config.ts`](frontend/vite.config.ts)).

### Перезагрузка после изменений кода

| Что изменили | Действие |
|--------------|----------|
| `frontend/src/**`, CSS | Обычно достаточно обновить страницу (F5 / Cmd+Shift+R); при сбое — перезапуск `npm run dev` |
| `backend/data/lessons/**` | Перезапуск backend (`Ctrl+C` → `go run ./cmd/server`) |
| Go-код в `backend/**` | Перезапуск backend |
| Изменения в Docker/backend-образе | `docker compose up --build backend` |

---

## Переменные окружения

Файл-образец: [`backend/.env.example`](backend/.env.example).

| Переменная | Назначение | По умолчанию |
|------------|------------|--------------|
| `OPENAI_API_KEY` | Ключ OpenAI для чата-репетитора | — (чат недоступен без ключа) |
| `SANDBOX_MODE` | `local` или `docker` | `docker` в Compose |
| `SANDBOX_IMAGE` | Образ для docker-песочницы | `go-llm-sandbox:latest` |
| `PORT` | HTTP-порт API | `:8080` |
| `COURSE_DATA_DIR` | Каталог с `course_manifest.json` | `backend/data/lessons` |
| `DATABASE_URL` | PostgreSQL | `postgres://golandia:golandia@localhost:5432/golandia?sslmode=disable` |

При недоступной БД маршруты `/api/users/:id/*` не регистрируются; курс, песочница и проверка заданий работают.

---

## Структура репозитория

```
kursovaya/
├── backend/
│   ├── cmd/server/           # Точка входа, маршруты Gin
│   ├── internal/
│   │   ├── course/           # Загрузка манифеста и модулей
│   │   ├── checker/          # Стратегии автопроверки
│   │   ├── handlers/         # HTTP-обработчики
│   │   ├── hero/             # Уровень героя по прогрессу
│   │   ├── sandbox/          # Запуск Go-кода
│   │   ├── validation/       # Валидация полей API
│   │   ├── repository/       # PostgreSQL: users, progress
│   │   ├── middleware/       # Логирование latency
│   │   └── llm/              # Клиент OpenAI
│   ├── data/lessons/         # Контент курса (JSON)
│   └── docker/               # Dockerfile backend и sandbox
├── frontend/
│   ├── public/theory_html/   # Статические иллюстрации для HTML теории
│   ├── src/
│   │   ├── pages/            # MainPage, ProfilePage, AchievementsPage
│   │   ├── components/       # UI: урок, чат, шапка, профиль
│   │   ├── forms/            # Формы с валидацией
│   │   ├── hooks/            # Логика страниц
│   │   ├── lib/              # API-клиенты, прогресс, валидация
│   │   └── theme/            # Токены, тёмная тема, scrapbook
│   └── package.json
├── db/
│   ├── migrations/           # Схема PostgreSQL
│   └── backup.sh             # Резервное копирование
├── docs/                     # Материалы курсовой работы
├── scripts/
│   └── rebuild-git-history.sh
└── docker-compose.yml
```

> Папка `golandia/` в корне (если присутствует локально) — устаревшая копия, **не входит в репозиторий** (см. `.gitignore`).

---

## REST API

Базовый URL: `http://localhost:8080`.

| Метод | Путь | Назначение |
|-------|------|------------|
| `GET` | `/api/health` | Проверка работоспособности |
| `GET` | `/api/course` | Манифест курса (модули, уроки) |
| `GET` | `/api/lessons/:id` | Полный урок по id |
| `POST` | `/api/sandbox/run` | Запуск кода в песочнице |
| `POST` | `/api/lessons/check` | Автопроверка задания |
| `POST` | `/api/chat/tutor` | Сообщение чат-репетитору |
| `POST` | `/api/hero-level/compute` | Расчёт уровня героя |
| `GET/PUT` | `/api/users/:id/profile` | Профиль (имя, аватар; поле `goal` в API сохраняется) |
| `GET/PUT` | `/api/users/:id/progress` | Прогресс по урокам |

Ошибки валидации: HTTP 400, тело `{ "error": "…", "fields": [{ "field", "message" }] }`.

---

## Контент курса

Каталог: [`backend/data/lessons/`](backend/data/lessons/).

| Файл | Назначение |
|------|------------|
| `course_manifest.json` | Оглавление: модули, список id уроков, итоговый проект |
| `module_01.json` … `module_07.json` | Уроки: теория, демо-код, задание, проверка |
| `theory_html/<lesson-id>.html` | Опционально: HTML теории, перекрывает поле `theory_html` в JSON |

Пример фрагмента урока:

```json
{
  "id": "tour-001",
  "title": "Урок 1: Добро пожаловать!",
  "theory_html": "<p>Текст теории…</p><img class='lesson-welcome-gif' src='/theory_html/hello.gif' alt='hello'>",
  "demo_code": "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tfmt.Println(\"demo\")\n}\n",
  "task": {
    "description": "Описание задания",
    "starter_code": "package main\n\nfunc main() {\n}",
    "check": {
      "type": "contains",
      "contains": ["ожидаемая подстрока в stdout"]
    }
  }
}
```

**Типы проверки** (`task.check.type`):

| Тип | Описание |
|-----|----------|
| `output` | Точное совпадение stdout |
| `contains` | Все подстроки из `contains` присутствуют в выводе |
| `regex` | Вывод соответствует регулярному выражению |
| `forbidden` | В коде нет запрещённых фрагментов |

После правок JSON **перезапустите backend**.

---

## Иллюстрации в теории уроков

Два способа подключения медиа в `theory_html`:

1. **Статика из `public/`** — файл в `frontend/public/theory_html/`, в HTML путь `/theory_html/имя.png` (раздаёт Vite в dev и попадает в `dist` при сборке).

2. **Сборка через Vite** — ассет в `frontend/src/assets/images/`, путь в JSON вида `/theory_html/hello.gif`; при рендере [`resolveTheoryHtmlAssets`](frontend/src/lib/theoryHtmlAssets.ts) подменяет URL на bundled-версию (удобно для GIF и оптимизации).

Добавление нового bundled-ассета: импорт в `theoryHtmlAssets.ts` и запись в `THEORY_HTML_ASSET_URLS`.

---

## Валидация данных

Согласованные правила на фронтенде ([`frontend/src/lib/validation.ts`](frontend/src/lib/validation.ts)) и бэкенде ([`backend/internal/validation/`](backend/internal/validation/)).

| Поле | Ограничение | Где отображается ошибка |
|------|-------------|-------------------------|
| **Имя** (`display_name`) | 1–48 символов; буквы, цифры, пробел, `._-` | Под полем имени в профиле |
| **Аватар** | Только `image/*`, ≤ 2 МБ; сохранение как JPEG data URL | При выборе файла |
| **Цель** (`goal`) | ≤ 500 символов | Только API (поле в UI профиля не выводится) |

Формы используют `maxLength`, проверку на `blur` и разбор ответа API с `fields[]`.

---

## Тестирование

```bash
# Backend — unit- и HTTP-тесты
cd backend && go test ./...

# Frontend — Vitest
cd frontend && npm test

# Production-сборка фронтенда
cd frontend && npm run build
```

| Пакет / область | Что покрыто |
|-----------------|-------------|
| `internal/checker` | Стратегии автопроверки |
| `internal/course` | Загрузка манифеста |
| `internal/handlers` | HTTP course, hero, check, user validation |
| `internal/hero` | Расчёт уровня |
| `internal/validation` | Правила полей |
| `frontend/src/lib` | validation, progressMap, profileLessonOrder |
| `frontend/src/forms` | ProfileDisplayNameForm |

Примеры вывода тестов для отчёта: [`docs/screenshots/`](docs/screenshots/).

---

## Документация курсовой работы

Полный комплект материалов — в каталоге [`docs/`](docs/):

| Документ | Тема |
|----------|------|
| [KURSOVAYA.md](docs/KURSOVAYA.md) | Оглавление курсовой |
| [03-design-patterns.md](docs/03-design-patterns.md) | Паттерны, распределённый монолит |
| [04-database.md](docs/04-database.md) | PostgreSQL, запросы, аудит |
| [05-frontend-testing.md](docs/05-frontend-testing.md) | Тестирование React |
| [06-backend-testing.md](docs/06-backend-testing.md) | Тестирование Go |
| [07-manual.md](docs/07-manual.md) | Руководство пользователя |
| [08-ui-design.md](docs/08-ui-design.md) | Дизайн-система и токены |
| [CONCLUSION.md](docs/CONCLUSION.md) | Заключение |

---

## Сопровождение

| Задача | Команда / действие |
|--------|-------------------|
| Резервная копия БД | `./db/backup.sh` |
| Обновление уроков | Правка `backend/data/lessons/*.json` → перезапуск backend |
| Ключ OpenAI | `OPENAI_API_KEY` в `backend/.env` |
| Логи backend | stdout процесса `go run` или `docker compose logs backend` |
| Пересборка sandbox | `docker compose build sandbox` |
