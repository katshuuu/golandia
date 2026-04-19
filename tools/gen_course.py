#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Генерирует backend/data/lessons/module_XX.json из компактных описаний."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "backend" / "data" / "lessons"


def lesson(
    lid: str,
    title: str,
    order: int,
    module_id: str,
    summary: str,
    theory: str,
    demo: str,
    task_desc: str,
    starter: str,
    check: dict,
    questions: list[str],
    keypoints: list[str],
) -> dict:
    return {
        "id": lid,
        "title": title,
        "summary": summary,
        "theory_html": theory,
        "demo_code": demo,
        "task": {
            "description": task_desc,
            "starter_code": starter,
            "check": check,
        },
        "socratic_questions": questions,
        "check_key_points": keypoints,
        "module_id": module_id,
        "order": order,
    }


def write_module(name: str, lessons: list[dict]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / name
    path.write_text(json.dumps({"lessons": lessons}, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote", path, "lessons", len(lessons))


def main() -> None:
    m1: list[dict] = []

    # --- Module 1 ---
    m1.append(
        lesson(
            "m1-packages",
            "Пакеты: твой рюкзак с инструментами",
            1,
            "m1",
            "Каждая Go-программа живёт в пакете main. Это как комната в общаге: у неё есть имя, и из неё можно выходить в коридор функций.",
            "<p>Пакет <code>main</code> — точка входа. Функция <code>main()</code> стартует первой. Остальные пакеты — библиотеки, как приложения в телефоне: подключил — пользуешься.</p>",
            'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("go go power rangers")\n}\n',
            "Выведи ровно одну строку: <code>chat online</code> (как будто бот проснулся).",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "output", "expected": "chat online"},
            [
                "Где в файле объявляют, что это исполняемая программа, а не библиотека?",
                "Какой пакет чаще всего импортируют для печати в консоль?",
                "Что должно произойти сразу после запуска бинарника?",
                "Почему важно, чтобы у тебя была функция main именно в пакете main?",
            ],
            ["Есть package main", "Есть func main()", "Вывод совпадает построчно"],
        )
    )
    m1.append(
        lesson(
            "m1-imports",
            "Импорты: подключаем «приложения» стандартной библиотеки",
            2,
            "m1",
            "Импорт — как скачать мод к игре: строка import даёт доступ к чужим суперсилам, например fmt для вывода текста.",
            "<p>Несколько путей импорта группируют в скобках. Неиспользуемый импорт — ошибка компиляции: Go не любит мусор в рюкзаке.</p>",
            "package main\n\nimport (\n\t\"fmt\"\n\t\"time\"\n)\n\nfunc main() {\n\tfmt.Println(\"now:\", time.Now().Format(\"15:04\"))\n}\n",
            "Импортируй fmt и выведи слово <code>meme</code> (одной строкой).",
            "package main\n\nfunc main() {\n\t// TODO: import + Println\n}\n",
            {"type": "output", "expected": "meme"},
            [
                "Где компилятор узнаёт, откуда взять Println?",
                "Что будет, если импортировать пакет, но не использовать?",
                "Как назвать пакет, который умеет печатать в stdout?",
            ],
            ["import присутствует", "fmt.Println используется", "вывод ровно meme"],
        )
    )
    m1.append(
        lesson(
            "m1-exported-names",
            "Экспортируемые имена: заглавная буква = публичный сторис",
            3,
            "m1",
            "Если имя начинается с большой буквы — его видят из других пакетов. С маленькой — только «для своих», как закрытый чат.",
            "<p>Это не про приватность в рантайме, а про контракт модулей: <code>fmt.Println</code> экспортируется, внутренние helper-функции часто пишут с маленькой.</p>",
            "package main\n\nimport \"fmt\"\n\ntype mood struct {\n\tPublicEmoji  string\n\tsecretVendor string\n}\n\nfunc main() {\n\tm := mood{PublicEmoji: \"🔥\", secretVendor: \"mom\"}\n\tfmt.Println(m.PublicEmoji)\n}\n",
            "Создай переменную с экспортируемым именем User (строка) и выведи её значение <code>anon</code>.",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO: var User string = ...\n}\n",
            {"type": "contains", "contains": ["anon"]},
            [
                "Как по первой букве понять, доступно ли имя снаружи пакета?",
                "Где в стандартной библиотеке ты уже видел 'большие' имена?",
                "Почему secret-поля структур часто пишут с маленькой буквы?",
            ],
            ["Имя User с большой буквы", "вывод содержит anon"],
        )
    )
    m1.append(
        lesson(
            "m1-functions",
            "Функции: рецепт, который можно вызывать много раз",
            4,
            "m1",
            "Функция — именованный кусок логики. Как макрос в мессенджере: один тап — готовая фраза для друзей.",
            "<p>Сигнатура: имя, параметры, (опционально) результаты. Тело в фигурных скобках. Возврат через return.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc ping() string {\n\treturn \"pong\"\n}\n\nfunc main() {\n\tfmt.Println(ping())\n}\n",
            "Напиши функцию greet(name string) string, которая возвращает строку Hi, <name>!. В main выведи результат для name=\"Ada\".",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO: объявить greet и вызвать\n}\n",
            {"type": "output", "expected": "Hi, Ada!"},
            [
                "Что у функции должно быть слева от имени, если она возвращает строку?",
                "Как соединить константу \"Hi, \" и переменную?",
                "Где лучше вызвать greet — внутри main или внутри другой функции?",
            ],
            ["есть func greet", "fmt.Println в main", "точный вывод Hi, Ada!"],
        )
    )
    m1.append(
        lesson(
            "m1-multiple-results",
            "Несколько результатов: как обмен вещами в шкатулке",
            5,
            "m1",
            "Go любит возвращать пару значение+ошибка. Это как открыть лутбокс: внутри и приз, и записка «удачи не было».",
            "<p>Частый паттерн: (T, error). Вызывающий обязан хотя бы подумать про ошибку — мем про игнор ошибок не прокатит.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc split(sum int) (x, y int) {\n\tx = sum * 4 / 9\n\ty = sum - x\n\treturn\n}\n\nfunc main() {\n\tfmt.Println(split(17))\n}\n",
            "Сделай функцию div10(n int) (int, int), которая возвращает частное и остаток от деления n на 10. Для n=47 выведи два числа через пробел: 4 7",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "output", "expected": "4 7"},
            [
                "Какие арифметические операторы дают частное и остаток?",
                "Как объявить, что функция возвращает два int?",
                "Как красиво напечатать два int подряд?",
            ],
            ["два return значения", "корректная математика", "вывод 4 7"],
        )
    )
    m1.append(
        lesson(
            "m1-named-return-values",
            "Именованные результаты: ленивый return",
            6,
            "m1",
            "Можно дать имена возвращаемым переменным — они объявятся в начале функции. return без аргументов вернёт их текущие значения.",
            "<p>Не злоупотребляй: если функция длинная, именованные результаты ухудшают читаемость. Но для коротких хелперов — ок.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc stats() (sum int, count int) {\n\tsum = 10 + 20\n\tcount = 2\n\treturn\n}\n\nfunc main() {\n\tfmt.Println(stats())\n}\n",
            "Напиши func cart() (items int, price int) где items=3, price=90 и выведи пару через пробел: 3 90",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "output", "expected": "3 90"},
            [
                "Где объявляются именованные возвращаемые переменные по времени?",
                "Что делает голый return в такой функции?",
                "Как назвать результаты, чтобы было понятно без комментариев?",
            ],
            ["именованные return параметры", "return без значений допустим", "вывод 3 90"],
        )
    )
    m1.append(
        lesson(
            "m1-variables",
            "Переменные: коробки с наклейками",
            7,
            "m1",
            "var объявляет переменную с типом и, опционально, значением. Как стикер на контейнере с соком: видно, что внутри string или int.",
            "<p>Нулевые значения: int→0, string→\"\", bool→false. Это не баг, это «пустой стакан».</p>",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tvar nickname string\n\tvar level int\n\tfmt.Println(nickname, level)\n}\n",
            "Объяви var coins int и присвой 100, затем выведи coins.",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "output", "expected": "100"},
            [
                "Чем var отличается от короткого объявления внутри функции?",
                "Какое нулевое значение у int?",
                "Нужен ли тип, если ты сразу присваиваешь литерал?",
            ],
            ["использован var", "coins == 100", "вывод 100"],
        )
    )
    m1.append(
        lesson(
            "m1-variables-with-initializers",
            "Инициализаторы: сразу кладём в коробку вкусняшку",
            8,
            "m1",
            "Если при объявлении var есть инициализатор, тип можно опустить — компилятор выведет его сам.",
            "<p>Как заказ с доставкой: ты говоришь значение, Go сам понимает, это int или rune-литерал и т.д.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tvar chat = \"tg\"\n\tvar unread = 12\n\tfmt.Println(chat, unread)\n}\n",
            "var theme = \"dark\" и выведи theme одной строкой.",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "output", "expected": "dark"},
            [
                "Можно ли не писать тип, если справа очевидный литерал?",
                "Как компилятор выводит тип для целочисленного литерала?",
                "Что будет, если справа смешать типы несовместимо?",
            ],
            ["var theme =", "вывод dark"],
        )
    )
    m1.append(
        lesson(
            "m1-short-var-declarations",
            "Короткое := — экспресс-лайн в коде",
            9,
            "m1",
            "Внутри функций часто пишут nick := \"neo\". Это быстро и по-зумерски лаконично, но только внутри func.",
            "<p>:= объявляет новые переменные. Если хоть одна новая — можно смешивать с присваиванием существующим в многострочной форме, но обычно держи просто.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tmsg := \"lol\"\n\tfmt.Println(msg)\n}\n",
            "Используй := чтобы создать xp:=5 и вывести xp.",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "output", "expected": "5"},
            [
                "Почему := нельзя на верхнем уровне пакета?",
                "Что слева и что справа у := ?",
                "Как переименовать, если компилятор ругается 'no new variables'?",
            ],
            ["есть :=", "переменная xp", "вывод 5"],
        )
    )
    m1.append(
        lesson(
            "m1-basic-types",
            "Базовые типы: int, float, bool, string — атрибуты персонажа",
            10,
            "m1",
            "bool для флагов, string для текста, числа для счётчиков лайков. Выбирай тип осмысленно: не храни возраст как string, если считаешь.",
            "<p>Есть int, int32, uint и др. В большинстве задач достаточно int. float64 для дробей.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tvar online bool = true\n\tvar rate float64 = 0.99\n\tfmt.Println(online, rate)\n}\n",
            "Объяви likes uint = 42 и выведи likes.",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "output", "expected": "42"},
            [
                "Почему для счётчика лайков иногда берут uint?",
                "Чем bool отличается от строки \"true\"?",
                "Какой тип у литерала 3.14 по умолчанию?",
            ],
            ["uint", "42 в выводе"],
        )
    )
    m1.append(
        lesson(
            "m1-zero-values",
            "Нулевые значения: пустой инвентарь до первого лута",
            11,
            "m1",
            "Неинициализированные переменные получают zero value. Это как новый аккаунт: 0 друзей, пустой ник, false на «онлайн».",
            "<p>Указатели, слайсы, мапы, каналы, интерфейсы — нулевое значение nil. С ними аккуратно: вызов методов на nil интерфейсе иногда ок, на nil указателе — паника.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tvar s string\n\tvar ok bool\n\tfmt.Printf(\"%q %v\\n\", s, ok)\n}\n",
            "Выведи нулевое значение int переменной через fmt.Println (одна строка с числом 0).",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tvar score int\n\t// TODO: Println(score)\n}\n",
            {"type": "output", "expected": "0"},
            [
                "Какое нулевое значение у string и как оно выглядит в Printf как %q?",
                "Почему int по умолчанию безопасен для суммирования?",
                "Чем nil отличается от 0?",
            ],
            ["Println печатает 0"],
        )
    )
    m1.append(
        lesson(
            "m1-type-conversions",
            "Преобразование типов: явный каст, без магии как в кино",
            12,
            "m1",
            "Go не любит неявные numeric conversions. Нужно писать T(x), как будто ты говоришь: «считай это int32».",
            "<p>Строки и числа не конвертируются простым (int)\"123\". Для этого есть strconv, но здесь только числа.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tvar x int32 = 9\n\tvar y int64 = int64(x) + 1\n\tfmt.Println(y)\n}\n",
            "var a uint8 = 200; var b int = int(a); выведи b.",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "output", "expected": "200"},
            [
                "Почему Go заставляет писать преобразование явно?",
                "Что может пойти не так при uint→int для огромных значений?",
                "Нужно ли преобразование int→int?",
            ],
            ["int(a)", "вывод 200"],
        )
    )
    m1.append(
        lesson(
            "m1-type-inference",
            "Вывод типов: компилятор — тихий детектив",
            13,
            "m1",
            "Когда тип очевиден из правой части или литерала, компилятор сам подставит. Ты пишешь меньше — он думает больше.",
            "<p>В полях структур и в сигнатурах типы всё равно нужны явно. Inference — в основном для локальных переменных.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tv := 42 // int\n\tfmt.Printf(\"%T\\n\", v)\n}\n",
            "Используй := с литералом 8.8 и выведи его тип через fmt.Printf(\"%T\\n\", x)",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "contains", "contains": ["float64"]},
            [
                "Какой тип у вещественного литерала по умолчанию?",
                "Чем %T поможет в отладке?",
                "Почему нельзя сменить тип переменной v просто присваиванием другого литерала?",
            ],
            ["%T", "float64 в выводе"],
        )
    )
    m1.append(
        lesson(
            "m1-constants",
            "Константы: правила сервера, которые не меняются за матч",
            14,
            "m1",
            "const задаёт неизменяемое значение на этапе компиляции (для базовых типов). Как правило чата: «спам запрещён навсегда».",
            "<p>Константы можно группировать в блок const ( ). iota помогает нумеровать, но это в другом уроке-соседе.</p>",
            "package main\n\nimport \"fmt\"\n\nconst MaxUploadMB = 50\n\nfunc main() {\n\tfmt.Println(MaxUploadMB)\n}\n",
            "const app = \"shoplist\"; выведи app.",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "output", "expected": "shoplist"},
            [
                "Чем const отличается от var для строки?",
                "Можно ли изменить const во время выполнения?",
                "Где удобно хранить версию приложения?",
            ],
            ["const app", "вывод shoplist"],
        )
    )
    m1.append(
        lesson(
            "m1-numeric-constants",
            "Числовые константы и iota: автонумерация как очередь в столовой",
            15,
            "m1",
            "iota внутри const-блока растёт на 1 каждую строку. Удобно для enum-стиля: статус онлайн/оффлайн/залип.",
            "<p>Высокая точность констант — пока они остаются «константным миром», Go может держать их как большие рациональные числа.</p>",
            "package main\n\nimport \"fmt\"\n\nconst (\n\tA = iota\n\tB\n\tC\n)\n\nfunc main() {\n\tfmt.Println(A, B, C)\n}\n",
            "Сделай const блок с iota: первый 10, дальше +1 (10,11,12). Выведи три числа через пробел.",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "output", "expected": "10 11 12"},
            [
                "Как задать первое значение iota не с нуля?",
                "Почему следующая строка без выражения продолжает последовательность?",
                "Чем iota удобнее ручных 0,1,2?",
            ],
            ["iota", "10 11 12"],
        )
    )

    write_module("module_01.json", m1)


if __name__ == "__main__":
    main()
