# Иллюстрации для theory_html в уроках

Картинки из HTML уроков подключаются от корня сайта, например:

```html
<img src="/theory_html/hello.png" alt="Приветствие">
```

Vite раздаёт файлы из `frontend/public/` по URL `/…`. При добавлении нового изображения положите файл сюда и укажите тот же путь в `backend/data/lessons/module_*.json` или в overlay `backend/data/lessons/theory_html/<lesson-id>.html`.
