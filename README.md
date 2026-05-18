# Golandia

Информационная система для изучения Go: React + Go REST API + PostgreSQL.

## Документация курсовой

См. **[docs/KURSOVAYA.md](docs/KURSOVAYA.md)** — паттерны, БД, тестирование, инструкция, заключение.

## Запуск

```bash
docker compose up --build
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:8080/api/health  

## Тесты

```bash
cd backend && go test ./...
cd frontend && npm test
```
