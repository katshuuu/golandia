import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  message: string;
  lessonTitle: string;
  userCode?: string;
  codeOutput?: string;
  history?: { role: string; content: string }[];
}

function getMockResponse(message: string, lessonTitle: string, userCode?: string, codeOutput?: string): string {
  const lowerMsg = message.toLowerCase();

  if (codeOutput && codeOutput.toLowerCase().includes("error")) {
    const errorLines = codeOutput.split("\n").filter((l: string) => l.trim());
    const firstError = errorLines[0] || "";

    if (firstError.includes("undefined")) {
      return "Вижу ошибку «undefined»! Скорее всего, ты используешь переменную или функцию, которую ещё не объявил. Проверь: все ли переменные объявлены через := или var? Все ли нужные пакеты импортированы?";
    }
    if (firstError.includes("imported and not used") || firstError.includes("declared but not used")) {
      return "Go очень строгий: если ты что-то импортировал или объявил, но не использовал — это ошибка компиляции! Удали неиспользуемые импорты или переменные. В Go нет «мусора» в коде.";
    }
    if (firstError.includes("syntax error")) {
      return "Синтаксическая ошибка! Это значит, что Go не может «прочитать» твой код. Проверь: все ли скобки закрыты? Нет ли лишних запятых? Посмотри на строку, которую указывает ошибка.";
    }
    if (firstError.includes("cannot use") || firstError.includes("cannot convert")) {
      return "Ошибка типов! Go строго следит за типами данных. Убедись, что не смешиваешь строки и числа без явного преобразования. Например, strconv.Itoa(число) для int в string.";
    }
    return "Есть ошибка! Посмотри внимательно на сообщение об ошибке — оно обычно указывает на конкретную строку кода. Попробуй разобраться что именно Go говорит не так, и напиши мне если нужна подсказка!";
  }

  if (lowerMsg.includes("помоги") || lowerMsg.includes("не понимаю") || lowerMsg.includes("объясни")) {
    if (lessonTitle.includes("Переменные")) {
      return "Конечно помогу! В уроке про переменные главное запомнить: для объявления используй :=, например name := \"Алекс\". Go сам поймёт тип. Что конкретно непонятно? Расскажи подробнее, и я объясню на примере!";
    }
    if (lessonTitle.includes("Функции")) {
      return "Функции в Go выглядят так: func имя(параметры) типВозврата { ... }. Ключевое слово return возвращает результат. Попробуй написать простую функцию и запусти — я помогу разобраться с ошибками!";
    }
    if (lessonTitle.includes("Срез") || lessonTitle.includes("Slice")) {
      return "Срезы — это как список! Создаёшь так: items := []string{\"раз\", \"два\", \"три\"}. Индексы начинаются с 0, поэтому второй элемент — это items[1]. Попробуй и посмотри что получится!";
    }
    if (lessonTitle.includes("Горутин") || lessonTitle.includes("Goroutine")) {
      return "Горутины запускаются через 'go функция()'. Но main() не ждёт их! Поэтому используй sync.WaitGroup: сначала wg.Add(количество), в горутине defer wg.Done(), а в main вызови wg.Wait(). Попробуй!";
    }
    return "Расскажи подробнее что именно непонятно в теме «" + lessonTitle + "»? Я постараюсь объяснить максимально просто! Можешь также показать свой код, и я помогу найти проблему.";
  }

  if (lowerMsg.includes("подсказ") || lowerMsg.includes("hint")) {
    return "Вот тебе подсказка (но не готовый ответ!): попробуй разбить задачу на маленькие шаги. Сначала убедись, что код компилируется без ошибок — запусти его. Потом постепенно добавляй нужную логику. Шаг за шагом!";
  }

  if (lowerMsg.includes("привет") || lowerMsg.includes("hello") || lowerMsg.includes("начнём") || lowerMsg.includes("начнем")) {
    return "Привет! Рад тебя видеть! Я твой AI-помощник по Go. Сейчас мы изучаем тему «" + lessonTitle + "». Прочитай теорию, попробуй написать код в редакторе и запусти его. Если что-то непонятно или будет ошибка — пиши мне, помогу разобраться!";
  }

  if (lowerMsg.includes("зачем") || lowerMsg.includes("почему") || lowerMsg.includes("для чего")) {
    return "Отличный вопрос! Понимание смысла важнее заучивания синтаксиса. В теме «" + lessonTitle + "» — это фундаментальная концепция Go, которая используется в реальных проектах каждый день. Хочешь узнать конкретный пример из практики?";
  }

  const responses = [
    "Хороший вопрос! В теме «" + lessonTitle + "» самое важное — практика. Попробуй запустить код в редакторе и посмотри что получится. Не бойся ошибок — они учат лучше всего!",
    "Попробуй писать код по шагам: сначала базовую структуру package main и func main(), потом добавляй логику постепенно. Так легче найти где именно возникает проблема.",
    "В Go есть отличный принцип: код должен быть простым и понятным. Если что-то кажется сложным — значит есть более простой способ. Напиши что именно пытаешься сделать, и разберёмся вместе!",
    "Это один из ключевых моментов в «" + lessonTitle + "»! Главное — не пытаться запомнить синтаксис наизусть, а понять логику. Попробуй поэкспериментировать с примерами из теории — измени значения, посмотри что изменится.",
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: ChatRequest = await req.json();
    const { message, lessonTitle, userCode, codeOutput, history } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Сообщение не предоставлено" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (openaiKey) {
      const systemPrompt = "Ты — дружелюбный AI-репетитор по языку программирования Go для подростков 12-18 лет.\n" +
        "Текущий урок: «" + lessonTitle + "».\n" +
        (userCode ? "Код пользователя:\n```go\n" + userCode + "\n```\n" : "") +
        (codeOutput ? "Вывод/ошибки:\n" + codeOutput + "\n" : "") +
        "\nПравила:\n" +
        "1. Отвечай на русском языке, дружелюбно и с энтузиазмом\n" +
        "2. НЕ давай готовый код-решение — направляй к ответу подсказками\n" +
        "3. Объясняй просто, как другу, а не как учебник\n" +
        "4. Если есть ошибка компиляции — объясни что она означает\n" +
        "5. Хвали за попытки, поддерживай когда сложно\n" +
        "6. Ответ должен быть коротким (2-4 предложения)";

      const messages = [
        { role: "system", content: systemPrompt },
        ...(history || []).slice(-6),
        { role: "user", content: message },
      ];

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + openaiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (openaiResponse.ok) {
        const data = await openaiResponse.json();
        const reply = data.choices?.[0]?.message?.content || getMockResponse(message, lessonTitle, userCode, codeOutput);
        return new Response(
          JSON.stringify({ reply }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));

    const reply = getMockResponse(message, lessonTitle, userCode, codeOutput);
    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Ошибка: " + err }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
