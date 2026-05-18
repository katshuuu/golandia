# Курсовая работа: информационная система **Golandia**

Интерактивный курс по языку Go: распределённый монолит (React + Go REST API + PostgreSQL).

## Содержание

1. [Архитектура и паттерны проектирования](03-design-patterns.md)
2. [База данных](04-database.md)
3. [Тестирование фронтенда](05-frontend-testing.md)
4. [Тестирование бэкенда](06-backend-testing.md)
5. [Инструкция по эксплуатации](07-manual.md)
6. [Заключение](CONCLUSION.md)

## Цель и задачи (этап «Анализ»)

| Цель | Реализация |
|------|------------|
| Обучающая ИС по Go с практикой в песочнице | Уроки (теория + редактор + автопроверка), чат-репетитор |
| Распределённый монолит | `frontend/` (Vite + React), `backend/` (Gin REST JSON), `postgres` |
| Учёт прогресса и профиля | localStorage + синхронизация REST `/api/users/:id/*` в PostgreSQL |
| Надёжность и ГОСТ-требования | Валидация форм, сообщения об ошибках, аудит БД, резервное копирование |

## Быстрый запуск

```bash
# из корня репозитория
docker compose up --build
# Frontend: http://localhost:5173
# Backend:  http://localhost:8080/api/health
```

Локально без Docker:

```bash
# PostgreSQL + миграция (или docker compose up postgres -d)
cd backend && SANDBOX_MODE=local go run ./cmd/server
cd frontend && npm run dev
```

Тесты:

```bash
cd backend && go test ./...
cd frontend && npm test
```

Скриншоты вывода тестов: `docs/screenshots/`.
