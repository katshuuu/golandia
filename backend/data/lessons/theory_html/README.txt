Теория уроков
=============

Основной источник текста уроков — поле theory_html в module_*.json
(каталог backend/data/lessons).

Файлы tour-XXX.html здесь больше не используются.

Опционально: _intro.html подменяет intro_html из course_manifest.json
(введение курса на дашборде), если файл существует и не пустой.

После правки JSON перезапустите бэкенд: go run ./cmd/server
