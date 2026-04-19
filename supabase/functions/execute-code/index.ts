import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PlaygroundCompileRequest {
  body: string;
  version: number;
}

interface PlaygroundEvent {
  Kind: string;
  Delay: number;
  Message: string;
}

interface PlaygroundCompileResponse {
  Errors: string;
  Events: PlaygroundEvent[];
  Status: number;
  IsTest: boolean;
  TestsFailed: number;
  VetErrors: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ error: "Код не предоставлен" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (code.length > 50000) {
      return new Response(
        JSON.stringify({ error: "Код слишком большой (максимум 50,000 символов)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const compileRequest: PlaygroundCompileRequest = {
      body: code,
      version: 2,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let playgroundResponse: Response;
    try {
      playgroundResponse = await fetch("https://go.dev/play/compile", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `version=${compileRequest.version}&body=${encodeURIComponent(compileRequest.body)}`,
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      return new Response(
        JSON.stringify({ error: "Не удалось подключиться к песочнице. Попробуйте ещё раз." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    clearTimeout(timeout);

    if (!playgroundResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Ошибка песочницы: ${playgroundResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result: PlaygroundCompileResponse = await playgroundResponse.json();

    if (result.Errors) {
      return new Response(
        JSON.stringify({ error: result.Errors, output: "" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const output = (result.Events || [])
      .filter((e) => e.Kind === "stdout" || e.Kind === "stderr")
      .map((e) => e.Message)
      .join("");

    return new Response(
      JSON.stringify({ output, error: "" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Внутренняя ошибка сервера: ${err}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
