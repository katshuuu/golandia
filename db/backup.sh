#!/usr/bin/env sh
# Резервное копирование БД Golandia (ГОСТ 34.201-89, хранение и восстановление)
set -eu

BACKUP_DIR="${BACKUP_DIR:-./db/backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FILE="${BACKUP_DIR}/golandia_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-golandia}"
PGDATABASE="${PGDATABASE:-golandia}"

echo "Создание резервной копии ${FILE} ..."
pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" --no-owner --format=plain | gzip -9 > "$FILE"
echo "Готово: ${FILE}"
