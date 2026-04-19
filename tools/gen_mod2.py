#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "backend" / "data" / "lessons"


def lesson(
    lid, title, order, module_id, summary, theory, demo, task_desc, starter, check, questions, keypoints
):
    return {
        "id": lid,
        "title": title,
        "summary": summary,
        "theory_html": theory,
        "demo_code": demo,
        "task": {"description": task_desc, "starter_code": starter, "check": check},
        "socratic_questions": questions,
        "check_key_points": keypoints,
        "module_id": module_id,
        "order": order,
    }


def main():
    m2 = [
        lesson(
            "m2-for",
            "Цикл for: листаем ленту до упора",
            1,
            "m2",
            "Единственный цикл в Go — for. Как бесконечный скролл, только под контролем.",
            "<p>Три части: init; condition; post. Любую можно опустить. Без условия — вечный цикл (осторожно!).</p>",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tfor i := 0; i < 3; i++ {\n\t\tfmt.Println(i)\n\t}\n}\n",
            "Выведи числа 1 2 3 каждое с новой строки (через for).",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "output", "expected": "1\n2\n3"},
            [
                "С какого значения стартанёшь, если нужен вывод с 1?",
                "Какое условие цикла остановит его на 3 включительно?",
                "Что обычно пишут в post-части for?",
            ],
            ["for", "три строки", "1 2 3"],
        ),
        lesson(
            "m2-for-continued",
            "for как while: «пока есть интернет»",
            2,
            "m2",
            "Можно опустить init и post — получится while. Удобно, когда не знаешь число шагов заранее.",
            "<p>Классика: читать ввод, пока пользователь не сказал стоп.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tn := 3\n\tfor n > 0 {\n\t\tfmt.Println(n)\n\t\tn--\n\t}\n}\n",
            "Используй for как while: начни power:=1 и удваивай, пока power < 20; выводи power каждый раз. Последняя строка должна быть 16.",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "contains", "contains": ["1", "2", "4", "8", "16"]},
            [
                "Как записать while на языке Go?",
                "Какое условие остановит цикл до перехода на 32?",
                "Где лучше удваивать — в начале или в конце тела?",
            ],
            ["нет бесконечности", "есть 16", "удвоения печатаются"],
        ),
        lesson(
            "m2-forever",
            "Бесконечный цикл: как автоплей шортсов",
            3,
            "m2",
            "for { } крутится вечно, пока не break/return/panic. Серверы и боты часто так живут.",
            "<p>Добавь break по условию, иначе песочница зависнет.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tfor {\n\t\tfmt.Println(\"tick\")\n\t\tbreak\n\t}\n}\n",
            "Сделай вечный for, но выведи once и сразу break.",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "output", "expected": "once"},
            [
                "Как выглядит условие бесконечного for в Go?",
                "Как безопасно выйти из первого же прохода?",
                "Чем return отличается от break здесь?",
            ],
            ["for {", "break", "вывод once"],
        ),
        lesson(
            "m2-if",
            "if: вилка «онлайн или нет»",
            4,
            "m2",
            "Условный оператор как выбор: если температура выше 30 — мороженое, иначе позже.",
            "<p>Условие bool. Фигурные скобки обязательны, даже для одной строки.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tif 2+2 == 4 {\n\t\tfmt.Println(\"math not clickbait\")\n\t}\n}\n",
            "Если x:=10; x больше 3 — выведи yes иначе no. Для x=10 вывод yes.",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "output", "expected": "yes"},
            [
                "Какое условие сравнивает x и 3?",
                "Нужны ли скобки вокруг условия как в C?",
                "Где поставить fmt.Println для ветки true?",
            ],
            ["if", "yes"],
        ),
        lesson(
            "m2-if-short-statement",
            "if с коротким оператором: объявил и сразу проверил",
            5,
            "m2",
            "if v := compute(); v != nil { ... } — v живёт только внутри if/else. Как временный стикер на зонтик.",
            "<p>Часто так открывают файл/ответ HTTP и сразу проверяют ошибку.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc score() int { return 11 }\n\nfunc main() {\n\tif s := score(); s > 10 {\n\t\tfmt.Println(\"carry\")\n\t}\n}\n",
            "Напиши if n := 7; n%2 == 0 { fmt.Println(\"even\") } else { fmt.Println(\"odd\") } — должно напечатать odd.",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "output", "expected": "odd"},
            [
                "Какая область видимости у n?",
                "Как взять остаток от деления в Go?",
                "Почему else примыкает к if на той же строке?",
            ],
            ["короткое объявление в if", "odd"],
        ),
        lesson(
            "m2-if-and-else",
            "if/else: два сценария, один день",
            6,
            "m2",
            "Вторая ветка else — когда if не сработал. Как выбор между домашкой и сериалом.",
            "<p>Можно лесенкой if else if. Не забывай читаемость.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tif false {\n\t\tfmt.Println(\"A\")\n\t} else {\n\t\tfmt.Println(\"B\")\n\t}\n}\n",
            "Переменная mood:=\"sad\"; если mood==\"happy\" выведи party иначе tea.",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "output", "expected": "tea"},
            [
                "Как сравнить строки?",
                "Зачем нужен else, если есть только два исхода?",
                "Можно ли вкладывать if внутрь else?",
            ],
            ["else", "tea"],
        ),
        lesson(
            "m2-ex-loops-and-functions",
            "Упражнение: циклы и функции — sqrt как у Ньютона",
            7,
            "m2",
            "Классика тура Go: приблизить sqrt(x) итерациями. Тренирует for и функции.",
            "<p>Используй z -= (z*z - x) / (2*z) несколько раз, стартуя с z=1.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tz := 1.0\n\tfmt.Println(\"start\", z)\n}\n",
            "Реализуй func Sqrt(x float64) float64 для x=2 с 10 итерациями, z начинается с 1. Выведи результат — автопроверка ищет подстроку 1.41 в выводе.",
            "package main\n\nimport \"fmt\"\n\nfunc Sqrt(x float64) float64 {\n\t// TODO\n\treturn 0\n}\n\nfunc main() {\n\tfmt.Println(Sqrt(2))\n}\n",
            {"type": "regex", "pattern": r"1\.41"},
            [
                "Какая стартовая точка z обычно берётся?",
                "Как выразить одну итерацию Ньютона через текущее z и x?",
                "Сколько повторений достаточно для float64 на бытовых задачах?",
            ],
            ["цикл for", "нет math.Sqrt", "результат около sqrt(2)"],
        ),
        lesson(
            "m2-switch",
            "switch: меню столовой на неделю",
            8,
            "m2",
            "switch сравнивает значение с ветками case. Автоматически break между case.",
            "<p>Можно switch по строкам — удобно для команд бота.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc mood(m string) {\n\tswitch m {\n\tcase \"ok\":\n\t\tfmt.Println(1)\n\tcase \"wow\":\n\t\tfmt.Println(2)\n\tdefault:\n\t\tfmt.Println(0)\n\t}\n}\n\nfunc main() { mood(\"wow\") }\n",
            "switch по cmd:=\"/ping\": /start -> hello, /ping -> pong, иначе unknown. Для /ping выведи pong.",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tcmd := \"/ping\"\n\t// TODO switch\n}\n",
            {"type": "output", "expected": "pong"},
            [
                "Нужен ли break в конце case в Go?",
                "Как обработать неожиданные команды?",
                "Чем switch удобнее длинной цепочки if?",
            ],
            ["switch", "pong"],
        ),
        lesson(
            "m2-switch-evaluation-order",
            "Порядок case сверху вниз",
            9,
            "m2",
            "Первое подходящее case побеждает. Если диапазоны пересекаются — порядок важен.",
            "<p>Как очередь за сникерсом: кто первый встал — того и тапок.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tx := 5\n\tswitch {\n\tcase x > 10:\n\t\tfmt.Println(\"A\")\n\tcase x > 0:\n\t\tfmt.Println(\"B\")\n\t}\n}\n",
            "switch без тега: для age=15 должно напечатать teen. Подсказка: сначала проверь диапазон teen, потом adult.",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tage := 15\n\t// TODO\n}\n",
            {"type": "output", "expected": "teen"},
            [
                "Какой case должен быть выше, если диапазоны пересекаются?",
                "Почему switch без условия удобен для диапазонов?",
                "Что делает default?",
            ],
            ["teen для 15", "корректный порядок"],
        ),
        lesson(
            "m2-switch-no-condition",
            "switch без условия = switch true",
            10,
            "m2",
            "switch { case cond: } заменяет длинные if-else. Читается как список правил.",
            "<p>Отлично для валидации форм и статусов заказа.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tt := 21\n\tswitch {\n\tcase t < 12:\n\t\tfmt.Println(\"morning\")\n\tdefault:\n\t\tfmt.Println(\"day\")\n\t}\n}\n",
            "switch без значения: если coins<50 печатает poor иначе rich. Для coins=60 выведи rich.",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tcoins := 60\n\t// TODO\n}\n",
            {"type": "output", "expected": "rich"},
            [
                "Как записать switch без выражения после switch?",
                "Где поставить default?",
                "Чем это чище, чем if-else if-else?",
            ],
            ["rich"],
        ),
        lesson(
            "m2-defer",
            "defer: уборка при выходе из комнаты",
            11,
            "m2",
            "defer откладывает вызов до return функции. Часто закрывают ресурсы.",
            "<p>Аргументы defer вычисляются сразу, выполнение — позже.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tdefer fmt.Println(\"world\")\n\tfmt.Println(\"hello\")\n}\n",
            "Выведи A, затем defer печатает B в конце main. Итог: A потом B.",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "output", "expected": "A\nB"},
            [
                "Когда выполнится defer относительно return?",
                "Если два defer подряд, какой первый выполнится?",
                "Зачем defer для Close()?",
            ],
            ["defer", "порядок A потом B"],
        ),
        lesson(
            "m2-stacking-defers",
            "Стек defer: LIFO",
            12,
            "m2",
            "Несколько defer — стопка. Последний зарегистрированный выполнится первым.",
            "<p>Как стопка стикеров: снимаешь сверху.</p>",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tdefer fmt.Println(\"1\")\n\tdefer fmt.Println(\"2\")\n\tfmt.Println(\"3\")\n}\n",
            "fmt.Println(\"zero\") затем три defer печатают 1,2,3 — итог построчно: zero затем 3 2 1.",
            "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t// TODO\n}\n",
            {"type": "output", "expected": "zero\n3\n2\n1"},
            [
                "В каком порядке выполняются defer при выходе?",
                "Когда печатается строка без defer относительно них?",
                "Почему это называют стеком?",
            ],
            ["LIFO", "zero первая строка"],
        ),
    ]
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "module_02.json").write_text(
        json.dumps({"lessons": m2}, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("wrote module_02.json", len(m2))


if __name__ == "__main__":
    main()
