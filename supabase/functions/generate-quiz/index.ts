import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite", 
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function tryGenerate(apiKey: string, model: string, prompt: string): Promise<{ ok: boolean; data?: any; rateLimited?: boolean }> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      }),
    });

    if (res.status === 429 || res.status === 503) {
      await res.text();
      return { ok: false, rateLimited: true };
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Model ${model} error ${res.status}:`, errText);
      return { ok: false, rateLimited: false };
    }

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { ok: false };

    const parsed = JSON.parse(text);
    return { ok: true, data: parsed };
  } catch (e) {
    console.error(`Model ${model} exception:`, e);
    return { ok: false };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { topic, num_questions = 5, question_type = "multiple_choice", language = "Indonesian" } = await req.json();
    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch active API keys
    const { data: keys, error: keysError } = await supabase
      .from("gemini_api_keys")
      .select("api_key")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (keysError || !keys?.length) {
      return new Response(JSON.stringify({ error: "No active API keys configured. Please add a Gemini API key first." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Generate exactly ${num_questions} quiz questions about "${topic}" in ${language} language.
Each question must be ${question_type === "multiple_choice" ? "multiple choice with 4 options" : "text input (short answer)"}.

Return a JSON object with this exact structure:
{
  "questions": [
    {
      "question_text": "the question",
      ${question_type === "multiple_choice" ? '"options": ["option A", "option B", "option C", "option D"],' : ""}
      "correct_answer": "the correct answer"
    }
  ]
}

Make the questions educational, varied in difficulty, and accurate. Each question must have exactly one correct answer.${question_type === "multiple_choice" ? " The correct_answer must exactly match one of the options. IMPORTANT: Vary the position of the correct answer randomly across questions. Do not always place it as the first or second option." : ""}`;

    // Try each key, each model
    for (const keyRow of keys) {
      for (const model of MODELS) {
        console.log(`Trying key ...${keyRow.api_key.slice(-4)} with model ${model}`);
        const result = await tryGenerate(keyRow.api_key, model, prompt);
        if (result.ok && result.data?.questions) {
          const questions = result.data.questions.map((q: any, i: number) => ({
            question_text: q.question_text || "",
            question_type: question_type,
            options: question_type === "multiple_choice" && q.options ? shuffleArray(q.options) : (q.options || ["", ""]),
            correct_answer: q.correct_answer || "",
            media_url: "",
            order_index: i,
          }));
          return new Response(JSON.stringify({ questions, model_used: model }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (!result.rateLimited) {
          // Non-rate-limit error on this model, try next model
          continue;
        }
        // Rate limited, try next model
      }
    }

    return new Response(JSON.stringify({ error: "All API keys and models exhausted. Please try again later or add more API keys." }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-quiz error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
