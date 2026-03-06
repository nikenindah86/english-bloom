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

    const { topic, question_type, num_questions, difficulty_distribution, cognitive_levels, reading_passage, generate_passage } = await req.json();

    if (!topic) {
      return new Response(JSON.stringify({ error: "topic is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

    // Mode: generate reading passage only
    if (generate_passage) {
      const topicLower = topic.toLowerCase();
      const genreMap: Record<string, string> = {
        "narrative": "Write a short story (fable, myth, legend, or folktale) with Orientation (characters, setting, time), Complication (conflict/problem), and Resolution. Include a moral lesson. Do NOT explain what narrative text is.",
        "procedure": "Write a procedure text with a clear Goal/Title, a list of Materials/Ingredients, and numbered Steps explaining how to do or make something. Do NOT explain what procedure text is.",
        "descriptive": "Write a descriptive text about a specific person, place, or thing with vivid sensory details, using Identification and Description structure. Do NOT explain what descriptive text is.",
        "recount": "Write a recount of a past experience or event with Orientation, a sequence of Events in chronological order, and Re-orientation. Do NOT explain what recount text is.",
        "analytical exposition": "Write an argumentative text with a clear Thesis statement, supporting Arguments with evidence, and a Reiteration/conclusion. Do NOT explain what analytical exposition is.",
        "hortatory exposition": "Write a persuasive text with a Thesis, Arguments, and a Recommendation urging the reader to take action. Do NOT explain what hortatory exposition is.",
        "exposition": "Write an argumentative or persuasive text with a Thesis, Arguments, and Conclusion/Recommendation. Do NOT explain what exposition text is.",
        "explanation": "Write an explanation text describing how a natural or social process works, with a General Statement, step-by-step Explanation of the process, and a Conclusion. Do NOT explain what explanation text is.",
        "discussion": "Write a discussion text presenting two sides (pro and contra) of an issue, with Issue introduction, Arguments For, Arguments Against, and a balanced Conclusion. Do NOT explain what discussion text is.",
        "review": "Write a review of a book, film, or product with Identification (title, author/creator), Evaluation (strengths/weaknesses), and Interpretation/recommendation. Do NOT explain what review text is.",
        "news item": "Write a news article about an event with a Headline-worthy opening paragraph (newsworthy summary), Background events in detail, and Source/context. Do NOT explain what news item text is.",
      };

      let genreInstruction = "";
      for (const [keyword, instruction] of Object.entries(genreMap)) {
        if (topicLower.includes(keyword)) {
          genreInstruction = instruction;
          break;
        }
      }

      const passagePrompt = genreInstruction
        ? `${genreInstruction}\n\nTopic/theme: "${topic}".\nThe text should be 150-300 words, in English, well-structured with clear paragraphs, and appropriate for Indonesian high school students (SMA).\n${question_type === "true_false_statement" ? "Include enough specific factual details to support true/false statement questions.\n" : ""}\nReturn a JSON object with this exact structure:\n{\n  "reading_passage": "the full passage text here"\n}`
        : `Generate a reading passage about "${topic}" suitable for an English language assessment.\nThe passage should be 150-300 words, well-structured with clear paragraphs, educational, and appropriate for high school students.\n${question_type === "true_false_statement" ? "The passage should contain enough factual details to support true/false statement questions.\n" : ""}\nReturn a JSON object with this exact structure:\n{\n  "reading_passage": "the full passage text here"\n}`;

      for (const keyRow of keys) {
        for (const model of MODELS) {
          const result = await tryGenerate(keyRow.api_key, model, passagePrompt);
          if (result.ok && result.data?.reading_passage) {
            return new Response(JSON.stringify({ reading_passage: result.data.reading_passage, model_used: model }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (!result.rateLimited) continue;
        }
      }
      return new Response(JSON.stringify({ error: "All API keys and models exhausted for passage generation." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mode: generate questions
    if (!question_type || !num_questions) {
      return new Response(JSON.stringify({ error: "question_type and num_questions are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const typeLabel: Record<string, string> = {
      multiple_choice: "multiple choice with 4 options (A, B, C, D). Each question has exactly ONE correct answer.",
      mcma: "multiple choice with 4-5 options. Each question may have MULTIPLE correct answers (2-3 correct answers per question). The correct_answer field must be a JSON array of the correct options, e.g. [\"option A\", \"option C\"].",
      true_false: "true or false. Each question is a statement, and the correct_answer is either \"True\" or \"False\".",
      true_false_statement: "true or false statement categorization. Each question is a specific statement derived from the reading passage, and the correct_answer is either \"True\" or \"False\". Statements should test comprehension of specific details in the passage.",
      short_answer: "short answer (1-2 sentences)",
      essay: "essay (open-ended, requires a paragraph answer)",
    };

    const diffDist = difficulty_distribution || {};
    const diffInfo = Object.entries(diffDist)
      .filter(([, v]) => (v as number) > 0)
      .map(([k, v]) => `${v} ${k}`)
      .join(", ");

    const cogInfo = cognitive_levels?.length > 0
      ? `Bloom's taxonomy levels: ${cognitive_levels.join(", ")}`
      : "";

    const passageInfo = reading_passage
      ? `\n\nBase all questions on the following reading passage:\n"""\n${reading_passage}\n"""`
      : "";

    const optionsField = question_type === "multiple_choice" || question_type === "mcma"
      ? '"options": ["option A", "option B", "option C", "option D"],'
      : question_type === "true_false" || question_type === "true_false_statement"
        ? '"options": ["True", "False"],'
        : "";

    const correctAnswerNote = question_type === "mcma"
      ? 'The correct_answer must be a JSON array string of all correct options, e.g. \'["option A", "option C"]\'. Each question should have 2-3 correct answers.'
      : question_type === "multiple_choice"
        ? "The correct_answer must exactly match one of the options."
        : "";

    const prompt = `Generate exactly ${num_questions} assessment questions about "${topic}" in English.
Each question must be ${typeLabel[question_type] || question_type}.
${diffInfo ? `Difficulty distribution: ${diffInfo}.` : ""}
${cogInfo}
${passageInfo}

Return a JSON object with this exact structure:
{
  "questions": [
    {
      "question_text": "the question",
      ${optionsField}
      "correct_answer": "the correct answer",
      "difficulty": "easy" | "medium" | "hard",
      "cognitive_level": "C1" | "C2" | "C3" | "C4" | "C5" | "C6"
    }
  ]
}

Make questions educational, varied, and accurate. Each question must have exactly one correct answer.${correctAnswerNote ? " " + correctAnswerNote : ""}`;

    // Try each key, each model
    for (const keyRow of keys) {
      for (const model of MODELS) {
        console.log(`Trying key ...${keyRow.api_key.slice(-4)} with model ${model}`);
        const result = await tryGenerate(keyRow.api_key, model, prompt);
        if (result.ok && result.data?.questions) {
          const questions = result.data.questions.map((q: any, i: number) => ({
            question_text: q.question_text || "",
            options: q.options || null,
            correct_answer: typeof q.correct_answer === "object" ? JSON.stringify(q.correct_answer) : (q.correct_answer || ""),
            difficulty: q.difficulty || "medium",
            cognitive_level: q.cognitive_level || "C1",
            order_index: i,
          }));
          return new Response(JSON.stringify({ questions, model_used: model }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (!result.rateLimited) continue;
      }
    }

    return new Response(JSON.stringify({ error: "All API keys and models exhausted. Please try again later or add more API keys." }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-assessment error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
