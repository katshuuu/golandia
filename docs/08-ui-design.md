# UI и согласованность интерфейса Golandia

## Дизайн-система

Единые токены объявлены в `frontend/src/theme/tokens.css` и подключаются в `main.tsx` до `dark-theme.css`.

| Группа | Примеры переменных | Назначение |
|--------|-------------------|------------|
| Бренд | `--golia-brand`, `--golia-brand-soft` | Бордовый `#5b2330`, текст, акценты |
| Поверхности | `--golia-surface-sky`, `--golia-surface-yellow` | Scrapbook-панели профиля и достижений |
| Типографика | `--golia-font-body`, `--golia-font-display`, `--golia-font-module` | Unageo, Dudu, NAURYZREDKEDS |
| Радиусы | `--golia-radius-pill`, `--golia-radius-panel`, `--golia-radius-slot` | Пилюли, карточки, слоты |
| Навигация | `--golia-nav-active-bg`, `--golia-nav-active-glow` | Активная ссылка в шапке |
| Чат/урок | `--lesson-*` | Рабочая область урока и TutorChatPanel |

## Области приложения

1. **Курс (главная)** — `MainPage.css`, алиасы `--mainpage-*` → `--golia-*`.
2. **Scrapbook (профиль, достижения)** — `theme/scrapbook-scope.css`, алиасы `--sp-*`.
3. **Шапка** — `AppSiteHeader.css`, алиасы `--app-site-header-*`.
4. **Тёмная тема** — `theme/dark-theme.css` переопределяет токены по `[data-theme='dark']`.

## Согласованность

- Один брендовый цвет на всех экранах (ранее профиль использовал `#5b3323`).
- Достижения в светлой теме используют те же токены, что профиль (не чистый `#000`).
- Чат на профиле наследует тёплую палитру scrapbook; на главной — cyan-акцент AI в контексте кода.
- Кнопки: пилюли навигации (`--golia-radius-pill`), первичное действие — `--golia-brand`, отправка в профиле — `--sp-yellow`.

## Файлы стилей страниц

```
frontend/src/pages/styles/
  index.css           — импорт profile + achievements
  profile-page.css    — макет профиля
  achievements-page.css
```

Переиспользуемые примитивы: `theme/ui-primitives.css` (модалки, `.golia-btn-primary`, фокус).
