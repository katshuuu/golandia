# Golandia

Информационная система для изучения Go: React (Vite) + Go REST API + PostgreSQL + песочница для кода.

## Быстрый запуск

```bash
docker compose up --build
```

| Сервис    | URL |
|-----------|-----|
| Frontend  | http://localhost:5173 |
| Backend   | http://localhost:8080/api/health |
| PostgreSQL| `localhost:5432` (user/db: `golandia`) |

Локально без Docker:

```bash
# Бэкенд (нужен PostgreSQL и переменные из backend/.env.example)
cd backend && go run ./cmd/server

# Фронтенд
cd frontend && npm install && npm run dev
```

## Структура репозитория

```
kursovaya/
├── backend/                 # Go API
│   ├── cmd/server/          # точка входа, маршруты
│   ├── internal/
│   │   ├── course/        # загрузка манифеста и уроков (JSON)
│   │   ├── checker/       # стратегии автопроверки заданий
│   │   ├── handlers/      # HTTP-обработчики
│   │   ├── validation/    # валидация полей сущностей
│   │   ├── hero/          # расчёт уровня героя
│   │   ├── sandbox/       # запуск Go в контейнере
│   │   └── repository/    # профиль и прогресс в PostgreSQL
│   └── data/lessons/      # контент курса (см. ниже)
├── frontend/              # React SPA
│   ├── public/theory_html/  # картинки для HTML теории уроков
│   └── src/               # страницы, формы, хуки, тесты Vitest
├── db/migrations/         # схема PostgreSQL
├── docs/                  # материалы курсовой
└── docker-compose.yml     # postgres + backend + frontend + sandbox
```

Папка **`golandia/`** в корне (если есть локально) — старая копия проекта, **не входит в сдачу** (см. `.gitignore`).

## Редактирование уроков (JSON)

Контент курса лежит в `backend/data/lessons/`:

| Файл | Назначение |
|------|------------|
| `course_manifest.json` | оглавление: модули, список уроков, итоговый проект |
| `module_01.json` … `module_07.json` | полные уроки: теория, демо-код, задание |
| `theory_html/*.html` | опционально: HTML теории по id урока (перекрывает поле в JSON) |

Пример урока в `module_01.json`:

```json
{
  "lessons": [
    {
      "id": "tour-001",
      "title": "Урок 1: Добро пожаловать!",
      "theory_html": "<p>Текст теории…</p><img src=\"/theory_html/hello.png\" alt=\"\">",
      "task": {
        "description": "Описание задания",
        "starter_code": "package main\n\nfunc main() {\n}",
        "check": {
          "type": "contains",
          "contains": ["ожидаемая подстрока в выводе"]
        }
      },
      "module_id": "m1",
      "order": 1
    }
  ]
}
```

Типы проверки (`check.type`): `output`, `contains`, `regex`, `forbidden`.

**Картинки в теории:** файлы — в `frontend/public/theory_html/`, в HTML — путь `/theory_html/имя.png` (раздаёт Vite/nginx).

После правок JSON перезапустите backend (`docker compose restart backend`).

## Валидация профиля

На фронтенде и бэкенде согласованы ограничения:

| Поле | Ограничение | Сообщение пользователю |
|------|-------------|------------------------|
| Имя | 1–48 символов, буквы/цифры/`. _ -` | под полем имени, `role="alert"` |
| Цель | ≤ 500 символов | под полем цели |
| Аватар | только `image/*`, ≤ 2 МБ | при выборе файла; не-изображения отклоняются с текстом |

Формы: `maxLength` на input/textarea, проверка на `blur` и при сохранении на сервер. API при ошибке возвращает `{ "error": "…", "fields": [{ "field", "message" }] }`.

## Тесты

```bash
cd backend && go test ./...    # unit + HTTP (checker, course, handlers, hero, validation, middleware)
cd frontend && npm test        # Vitest: validation, progressMap, формы
```

В бэкенде более 20 тест-кейсов в пакетах `internal/checker`, `course`, `handlers`, `hero`, `validation`, `middleware`.

## Документация курсовой

См. [docs/KURSOVAYA.md](docs/KURSOVAYA.md) — паттерны, БД, тестирование, руководство пользователя.

## История коммитов

В ветке `main` — **35+ тематических коммитов** (backend по слоям, frontend по экранам, docs, docker). Восстановление: `scripts/rebuild-git-history.sh`.
