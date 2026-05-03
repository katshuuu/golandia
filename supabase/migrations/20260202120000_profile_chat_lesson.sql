-- Виртуальный урок для истории чата из страницы профиля (FK chat_messages.lesson_id).
INSERT INTO lessons (id, title, content, order_num, difficulty) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Личный кабинет',
  E'# Личный кабинет\n\nВопросы из страницы профиля.',
  9999,
  1
) ON CONFLICT (id) DO NOTHING;
