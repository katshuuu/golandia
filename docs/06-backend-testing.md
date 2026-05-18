# 6. Тестирование бэкенда

## 6.1 Инструменты автоматизированного тестирования

| Тип | Инструмент | Пакеты |
|-----|------------|--------|
| Unit | `testing` (Go) | `internal/checker`, `internal/hero`, `internal/course` |
| HTTP / интеграция | `net/http/httptest`, Gin | `internal/handlers` |
| Middleware | `httptest` | `internal/middleware` |
| Mock | заглушка Runner (при расширении) | `internal/sandbox` |

Команда: `cd backend && go test ./... -v`

## 6.2 Результаты тестов (скриншот)

Вывод сохранён в `docs/screenshots/backend-test-output.txt`:

```
ok  	go-llm-tutor/backend/internal/checker
ok  	go-llm-tutor/backend/internal/course
ok  	go-llm-tutor/backend/internal/handlers
ok  	go-llm-tutor/backend/internal/hero
ok  	go-llm-tutor/backend/internal/middleware
```

Покрытие бизнес-логики:

- стратегии проверки заданий (4 типа + regex + нормализация вывода + неизвестный тип);
- загрузка манифеста и уроков из `testdata`;
- HTTP `GET /api/course`, `GET /api/lessons/:id`, `POST /api/lessons/check`, `POST /api/hero-level/compute`;
- расчёт уровня героя, прогресса и последовательности модулей;
- заголовок `X-Response-Time-Ms` в middleware.

## 6.3 Время реакции (ГОСТ 34.602-89, § 3.2.4.6)

| Механизм | Описание |
|----------|----------|
| Middleware `ResponseTimeLog` | Заголовок `X-Response-Time-Ms`, лог при > 3 с |
| Кэш манифеста | `Cache-Control: private, max-age=120` на `GET /api/course` |
| Таймаут песочницы | 8 с (`context.WithTimeout` в `LocalRunner` / `DockerRunner`) |
| Ограничения Docker | `--cpus 0.5`, `--memory 128m`, `--network none` |

Допустимое время отклика для интерактивных запросов (манифест, проверка, профиль): **≤ 3 с** (песочница — до 8 с из-за компиляции Go).

Проверка вручную:

```bash
curl -s -D - http://localhost:8080/api/health -o /dev/null | grep -i x-response-time
```

## 6.4 Ручная проверка API (бизнес-процессы)

```bash
# Манифест курса
curl -s http://localhost:8080/api/course | head -c 200

# Проверка задания
curl -s -X POST http://localhost:8080/api/lessons/check \
  -H 'Content-Type: application/json' \
  -d '{"stdout":"42","code":"package main","check":{"type":"output","expected":"42"}}'

# Профиль (при запущенном PostgreSQL)
curl -s -X PUT http://localhost:8080/api/users/00000000-0000-0000-0000-000000000001/profile \
  -H 'Content-Type: application/json' \
  -d '{"display_name":"Тест","goal":"Изучить Go","avatar_data_url":""}'
```
