/*
  # Go Tutor Platform - Initial Schema

  ## Overview
  Full schema for the LLM-powered Go programming tutor MVP.

  ## New Tables

  ### lessons
  - Stores course lessons with Markdown content
  - Fields: id, title, content (Markdown), order_num, difficulty (1-3)

  ### tasks
  - Programming tasks linked to lessons
  - Fields: id, lesson_id, description, starter_code, expected_output, hint, order_num

  ### solutions
  - Tracks user solutions per task
  - Fields: id, user_id, task_id, code, status (pending/solved/failed), timestamps
  - Unique constraint on (user_id, task_id)

  ### chat_messages
  - Chat history between user and AI tutor per lesson
  - Fields: id, user_id, lesson_id, role (user/assistant), content, created_at

  ## Security
  - RLS enabled on all tables
  - Public read access to lessons and tasks (no auth required to browse)
  - Users can only read/write their own solutions and chat messages

  ## Seed Data
  - 4 pre-built lessons with tasks covering: variables, functions, slices, goroutines
*/

-- ============================================================
-- LESSONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  order_num integer NOT NULL,
  difficulty integer DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lessons"
  ON lessons FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================
-- TASKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  description text NOT NULL,
  starter_code text DEFAULT '',
  expected_output text DEFAULT '',
  hint text DEFAULT '',
  order_num integer DEFAULT 1
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tasks"
  ON tasks FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================
-- SOLUTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  code text NOT NULL DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'solved', 'failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, task_id)
);

ALTER TABLE solutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own solutions"
  ON solutions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own solutions"
  ON solutions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own solutions"
  ON solutions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- CHAT MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SEED DATA: LESSONS AND TASKS
-- ============================================================

-- LESSON 1: Variables and Types
INSERT INTO lessons (id, title, content, order_num, difficulty) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Переменные и типы данных',
  E'# Переменные и типы данных\n\n## Что такое переменная?\n\nПеременная — это именованное хранилище, в котором можно сохранить значение. Представь, что это ящик с ценником. На ценнике написано имя переменной, а внутри ящика — её значение.\n\n## Объявление переменных в Go\n\nВ Go есть несколько способов объявить переменную:\n\n### Способ 1: ключевое слово `var`\n```go\nvar age int = 17\nvar name string = "Алекс"\nvar isStudent bool = true\n```\n\n### Способ 2: короткое объявление `:=`\n```go\nage := 17\nname := "Алекс"\nisStudent := true\n```\n\nКороткое объявление `:=` — самый популярный способ! Go сам угадывает тип переменной.\n\n## Основные типы данных\n\n| Тип | Пример | Описание |\n|-----|--------|----------|\n| `int` | `42` | Целое число |\n| `float64` | `3.14` | Число с плавающей точкой |\n| `string` | `"привет"` | Строка текста |\n| `bool` | `true` | Истина или ложь |\n\n## Вывод переменной\n\n```go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    city := "Москва"\n    fmt.Println(city)\n}\n```\n\nЗапусти этот код и увидишь: `Москва`\n\n## Важные правила\n\n- Имена переменных начинаются с буквы или `_`\n- Go — строго типизированный язык: нельзя положить в `int` строку\n- Объявленная, но неиспользованная переменная — **ошибка компиляции**!',
  1,
  1
);

INSERT INTO tasks (lesson_id, description, starter_code, expected_output, hint, order_num) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Объяви переменную `name` со своим именем (строка) и переменную `age` со своим возрастом (число). Выведи их на экран в формате: **Имя: Алекс, Возраст: 16**',
  E'package main\n\nimport "fmt"\n\nfunc main() {\n    // Объяви переменные здесь\n\n    // Выведи их на экран\n}',
  'Имя: Алекс, Возраст: 16',
  'Используй fmt.Printf("Имя: %s, Возраст: %d", name, age) или fmt.Println. Не забудь объявить переменные с помощью := !',
  1
);

-- LESSON 2: Functions
INSERT INTO lessons (id, title, content, order_num, difficulty) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Функции',
  E'# Функции в Go\n\n## Зачем нужны функции?\n\nФункции — это как рецепты. Ты один раз описываешь, что делать, а потом вызываешь когда нужно.\n\n## Синтаксис функции\n\n```go\nfunc имяФункции(параметр тип) типВозврата {\n    // тело функции\n    return результат\n}\n```\n\n## Простой пример\n\n```go\npackage main\n\nimport "fmt"\n\nfunc greet(name string) string {\n    return "Привет, " + name + "!"\n}\n\nfunc main() {\n    message := greet("Алекс")\n    fmt.Println(message)\n}\n```\n\n## Функция с двумя параметрами\n\n```go\nfunc add(a int, b int) int {\n    return a + b\n}\n\n// Сокращённая запись (одинаковый тип):\nfunc multiply(a, b int) int {\n    return a * b\n}\n```\n\n## Несколько возвращаемых значений\n\nЭто суперсила Go — функция может вернуть несколько значений!\n\n```go\nfunc divide(a, b float64) (float64, error) {\n    if b == 0 {\n        return 0, fmt.Errorf("делить на ноль нельзя!")\n    }\n    return a / b, nil\n}\n```\n\n## Пример использования\n\n```go\npackage main\n\nimport "fmt"\n\nfunc sum(a, b int) int {\n    return a + b\n}\n\nfunc main() {\n    result := sum(10, 32)\n    fmt.Println(result) // 42\n}\n```',
  2,
  1
);

INSERT INTO tasks (lesson_id, description, starter_code, expected_output, hint, order_num) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Напиши функцию `add`, которая принимает два целых числа и возвращает их сумму. Вызови её с числами 15 и 27, результат выведи на экран.',
  E'package main\n\nimport "fmt"\n\n// Напиши функцию add здесь\n\nfunc main() {\n    // Вызови функцию add с числами 15 и 27\n    // Выведи результат\n}',
  '42',
  'Функция должна выглядеть так: func add(a, b int) int { ... }. Внутри верни a + b. В main() сохрани результат в переменную и выведи через fmt.Println.',
  1
);

-- LESSON 3: Slices
INSERT INTO lessons (id, title, content, order_num, difficulty) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Срезы (Slices)',
  E'# Срезы (Slices) в Go\n\n## Что такое срез?\n\nСрез — это динамический массив. В отличие от обычного массива, срез может меняться в размере. Представь это как список покупок, который можно дополнять.\n\n## Создание среза\n\n```go\n// Литеральный срез\nfruits := []string{"яблоко", "банан", "вишня"}\n\n// Пустой срез\nnumbers := []int{}\n\n// make() - создать срез заданного размера\nscores := make([]int, 5) // срез из 5 нулей\n```\n\n## Обращение к элементам\n\n```go\nfruits := []string{"яблоко", "банан", "вишня"}\n\nfmt.Println(fruits[0]) // яблоко (первый элемент)\nfmt.Println(fruits[1]) // банан (второй элемент)\nfmt.Println(fruits[2]) // вишня (третий элемент)\n```\n\n**Внимание!** Индексация начинается с **0**, не с 1!\n\n## Добавление элементов — `append`\n\n```go\nhobbies := []string{"программирование", "музыка"}\nhobbies = append(hobbies, "gaming")\nfmt.Println(hobbies) // [программирование музыка gaming]\n```\n\n## Длина среза — `len`\n\n```go\ncities := []string{"Москва", "СПб", "Казань"}\nfmt.Println(len(cities)) // 3\n```\n\n## Перебор среза — `range`\n\n```go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    langs := []string{"Go", "Python", "Rust"}\n    for i, lang := range langs {\n        fmt.Printf("%d: %s\\n", i, lang)\n    }\n}\n```',
  3,
  2
);

INSERT INTO tasks (lesson_id, description, starter_code, expected_output, hint, order_num) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Создай срез из трёх строк: "Go", "Python", "Rust". Выведи на экран **только второй элемент** среза (по индексу 1).',
  E'package main\n\nimport "fmt"\n\nfunc main() {\n    // Создай срез из трёх строк\n\n    // Выведи второй элемент (индекс 1)\n}',
  'Python',
  'Срез создаётся так: langs := []string{"Go", "Python", "Rust"}. Второй элемент — это индекс 1, то есть langs[1]. Выведи его через fmt.Println.',
  1
);

-- LESSON 4: Goroutines
INSERT INTO lessons (id, title, content, order_num, difficulty) VALUES (
  '44444444-4444-4444-4444-444444444444',
  'Горутины (Goroutines)',
  E'# Горутины — конкурентность в Go\n\n## Что такое горутина?\n\nГорутина — это лёгкий поток выполнения. Go позволяет запускать тысячи горутин одновременно! Это одна из суперсил языка.\n\n## Запуск горутины\n\nПросто добавь `go` перед вызовом функции:\n\n```go\ngo myFunction()\n```\n\n## Простой пример\n\n```go\npackage main\n\nimport (\n    "fmt"\n    "time"\n)\n\nfunc sayHello(name string) {\n    fmt.Printf("Привет от %s!\\n", name)\n}\n\nfunc main() {\n    go sayHello("Алекс")\n    go sayHello("Бот")\n    \n    time.Sleep(100 * time.Millisecond) // ждём горутины\n}\n```\n\n## Важно: main не ждёт горутины!\n\nЕсли `main()` завершится раньше горутин — программа завершится. Поэтому нужно использовать:\n- `time.Sleep()` — простое (но грубое) ожидание\n- `sync.WaitGroup` — правильный способ\n\n## Правильный способ — WaitGroup\n\n```go\npackage main\n\nimport (\n    "fmt"\n    "sync"\n)\n\nfunc printMessage(msg string, wg *sync.WaitGroup) {\n    defer wg.Done() // сообщаем что горутина завершилась\n    fmt.Println(msg)\n}\n\nfunc main() {\n    var wg sync.WaitGroup\n    \n    wg.Add(2) // ждём 2 горутины\n    go printMessage("Горутина 1 работает!", &wg)\n    go printMessage("Горутина 2 работает!", &wg)\n    \n    wg.Wait() // ждём завершения всех горутин\n}\n```\n\n## Каналы (preview)\n\nГорутины общаются через каналы (`chan`). Это тема следующего урока!\n\n```go\nch := make(chan string)\ngo func() { ch <- "сообщение" }()\nmsg := <-ch\nfmt.Println(msg)\n```',
  4,
  3
);

INSERT INTO tasks (lesson_id, description, starter_code, expected_output, hint, order_num) VALUES (
  '44444444-4444-4444-4444-444444444444',
  'Запусти две горутины. Первая должна вывести "Горутина 1: Привет!", вторая — "Горутина 2: Привет!". Используй sync.WaitGroup чтобы main() дождался обеих горутин.',
  E'package main\n\nimport (\n    "fmt"\n    "sync"\n)\n\nfunc printGreeting(msg string, wg *sync.WaitGroup) {\n    defer wg.Done()\n    // Выведи msg здесь\n}\n\nfunc main() {\n    var wg sync.WaitGroup\n    \n    // Запусти две горутины\n    // wg.Add(...)\n    // go printGreeting(..., &wg)\n    \n    wg.Wait()\n}',
  '',
  'Добавь wg.Add(2) перед запуском горутин. Вызови go printGreeting("Горутина 1: Привет!", &wg) и аналогично для второй. Внутри функции добавь fmt.Println(msg).',
  1
);
