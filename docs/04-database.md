# 4. База данных информационной системы

## 4.1 СУБД и библиотеки

| Компонент | Выбор |
|-----------|--------|
| СУБД | **PostgreSQL 16** (ACID, ограничения, триггеры, JSONB для аудита) |
| Драйвер Go | **github.com/jackc/pgx/v5** (`pgxpool`) — пул соединений, контекстные запросы |
| Миграции | SQL-скрипт `db/migrations/001_init.sql` (initdb в Docker) |
| Клиент фронтенда | REST API (не прямое подключение к БД) |

Контент курса (уроки) хранится в JSON (`backend/data/lessons/`) — редко меняется, удобно версионировать в Git. Персональные данные — в PostgreSQL.

## 4.2 Основные SQL-запросы

```sql
-- Профиль пользователя
SELECT id, display_name, goal, avatar_data_url, updated_at
FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Прогресс по урокам
SELECT lesson_id, completed_at
FROM lesson_progress
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY completed_at;

-- Статистика завершений по курсу
SELECT lesson_id, COUNT(*) AS students
FROM lesson_progress
GROUP BY lesson_id
ORDER BY students DESC;

-- Аудит действий (триггеры пишут сюда)
SELECT action, payload, created_at
FROM audit_log
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC
LIMIT 20;
```

Эквиваленты в Go — `internal/repository/user.go`.

## 4.3 Структурированное хранение, безопасность, резервное копирование (ГОСТ 34.201-89, § 2.2)

| Требование | Реализация |
|------------|------------|
| Структурированная модель | Таблицы `users`, `lesson_progress`, `final_project_status`, `audit_log` с PK/FK |
| Целостность | `REFERENCES users(id) ON DELETE CASCADE`, CHECK на длину имени и цели |
| Конфиденциальность | Доступ только через backend; пароль БД в `.env`, не в репозитории |
| Аудит изменений | Триггеры `users_audit_profile`, `lesson_progress_audit` → `audit_log` |
| Резервное копирование | Скрипт `db/backup.sh` (`pg_dump` + gzip в `db/backups/`) |
| Восстановление | `gunzip -c backup.sql.gz \| psql -U golandia -d golandia` |

Рекомендуемый регламент: ежедневный дамп + хранение копий не менее 7 суток (настройка cron на сервере эксплуатации).

## 4.4 Ограничения и триггеры

**Ограничения (constraints):**

- `users_display_name_nonempty`, `users_display_name_max` (1–48 символов)
- `users_goal_max` (≤ 500 символов)
- `lesson_progress_lesson_id_nonempty`
- внешние ключи `user_id → users(id)`

**Триггеры:**

| Триггер | Событие | Действие |
|---------|---------|----------|
| `users_updated_at` | BEFORE UPDATE ON users | `updated_at := NOW()` |
| `users_audit_profile` | AFTER INSERT/UPDATE display_name, goal | запись в `audit_log` |
| `lesson_progress_audit` | AFTER INSERT ON lesson_progress | запись в `audit_log` |

Полный DDL: `db/migrations/001_init.sql`.
