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

// Full TKA framework text — verbatim from official source
const TKA_FRAMEWORK_PROMPT = `
KERANGKA ASESMEN TKA BAHASA INGGRIS SMA/SEDERAJAT

Definisi: TKA Bahasa Inggris mengukur keterampilan membaca beragam jenis teks berbahasa Inggris dalam berbagai situasi komunikasi sehari-hari, vokasional, dan akademik.

Jenis Teks: descriptive, recount, narrative, procedure, analytical exposition

Kompetensi dan Subkompetensi:

1. PEMAHAMAN TEKSTUAL — mampu memahami informasi yang eksplisit, mengelompokkan, menyusun ulang, dan menyajikan kembali informasi eksplisit dari teks
   a. Menemukan/mengidentifikasi informasi penting yang disebutkan secara eksplisit dalam teks.
   b. Mengklasifikasi orang, benda, tempat, atau peristiwa dalam teks berdasarkan kategori tertentu.
   c. Menyusun poin-poin utama dari teks dalam bentuk kerangka atau daftar.
   d. Meringkas isi teks secara ringkas dengan mengutip bagian penting.
   e. Mensintesis informasi dari sumber lain untuk memperoleh pemahaman yang lebih komprehensif.

2. PEMAHAMAN INFERENSIAL — mampu menarik kesimpulan berdasarkan informasi tersirat dalam teks, pengalaman pribadi, serta intuisi untuk memahami isi teks
   a. Menyimpulkan detail pendukung dengan menentukan fakta tambahan yang membuat teks lebih informatif, menarik, atau persuasif.
   b. Menyimpulkan topik, ide pokok/gagasan utama, makna, target pembaca, tujuan penulisan teks, atau pesan moral yang tidak secara eksplisit dinyatakan.
   c. Menyimpulkan urutan kejadian atau memperkirakan kelanjutan isi teks.
   d. Menyimpulkan perbandingan antara tokoh, waktu, tempat, benda, atau gagasan dalam teks.
   e. Menyimpulkan hubungan sebab-akibat antar gagasan atau tindakan dalam teks.
   f. Menyimpulkan karakter tokoh berdasarkan petunjuk eksplisit dalam teks.
   g. Memprediksi akhir cerita setelah membaca bagian awal.

3. EVALUASI DAN APRESIASI — mampu membuat penilaian terhadap ide, menanggapi teks secara emosional dan estetis
   a. Menilai realitas atau fantasi suatu peristiwa dalam teks berdasarkan pengalaman atau pengetahuan pribadi.
   b. Menilai fakta atau opini yang diberikan penulis untuk mendukung pendapatnya atau memengaruhi pembaca.
   c. Menilai kecukupan dan validitas informasi dalam teks (dengan membandingkan dengan sumber lain).
   d. Menilai kesesuaian bagian teks dalam menggambarkan karakter utama atau aspek lain dari bacaan.
   e. Menanggapi isi teks dengan mengungkapkan perasaan atau kesan seperti ketertarikan, kebosanan, kegembiraan, ketakutan, kebencian, atau kesenangan.

Bentuk Soal:
- PG (Pilihan Ganda): 4-5 opsi, 1 jawaban benar
- PGK Kategori: pernyataan yang dikategorikan (misal Similarity/Difference, Fact/Opinion)
- PGK MCMA: pilihan ganda dengan beberapa jawaban benar
`;

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

async function runWithKeys(keys: any[], prompt: string, validator: (data: any) => boolean) {
  for (const keyRow of keys) {
    for (const model of MODELS) {
      console.log(`Trying key ...${keyRow.api_key.slice(-4)} with model ${model}`);
      const result = await tryGenerate(keyRow.api_key, model, prompt);
      if (result.ok && validator(result.data)) {
        return { data: result.data, model };
      }
      if (!result.rateLimited) continue;
    }
  }
  return null;
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

    const body = await req.json();
    const { mode } = body;

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

    // ============ TKA MODE ============
    if (mode === "tka") {
      return handleTkaMode(body, keys);
    }

    // ============ FORMATIVE MODE (existing) ============
    return handleFormativeMode(body, keys);

  } catch (e) {
    console.error("generate-assessment error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleTkaMode(body: any, keys: any[]) {
  const { generate_outline, jenis_teks, tingkat, topic, basket_items, outline, generate_passage } = body;

  if (generate_outline) {
    // Generate outline from basket
    const totalQuestions = basket_items.reduce((s: number, b: any) => s + b.num_questions, 0);
    
    const basketDesc = basket_items.map((b: any, i: number) => {
      return `Grup ${i+1}: ${b.num_questions} soal, bentuk=${b.bentuk_soal}, ${b.num_options || 5} opsi, kompetensi="${b.kompetensi}", subkompetensi: ${b.subkompetensi.map((s: string) => `"${s}"`).join(", ")}`;
    }).join("\n");

    const prompt = `${TKA_FRAMEWORK_PROMPT}

You are creating an OUTLINE (not full questions) for a TKA assessment.

Jenis teks: ${jenis_teks}
Tingkat kemahiran: ${tingkat}
Topic/Title: ${topic || jenis_teks}

Question basket:
${basketDesc}

Generate exactly ${totalQuestions} outline items. For each item, assign a subkompetensi from the basket's subkompetensi list. Distribute evenly across the provided subkompetensi.

Each outline item should have:
- no (sequential number starting from 1)
- kompetensi (the parent kompetensi name, e.g. "Pemahaman Tekstual")
- subkompetensi (exact text from the framework above)
- bentuk_soal (from basket: "pg", "pgk_kategori", or "pgk_mcma")
- num_options (from basket: 4 or 5)
- deskripsi_soal (a brief 1-sentence description in Indonesian of what the question will test, specific to the jenis teks "${jenis_teks}")

You MUST use ONLY subkompetensi from the basket. Do NOT invent new ones.

Return JSON:
{
  "outline": [
    {
      "no": 1,
      "kompetensi": "...",
      "subkompetensi": "...",
      "bentuk_soal": "pg",
      "num_options": 5,
      "deskripsi_soal": "..."
    }
  ]
}`;

    const result = await runWithKeys(keys, prompt, (d) => Array.isArray(d?.outline));
    if (!result) {
      return new Response(JSON.stringify({ error: "All API keys exhausted for outline generation." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ outline: result.data.outline, model_used: result.model }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Generate actual questions from approved outline
  if (!outline || !Array.isArray(outline) || outline.length === 0) {
    return new Response(JSON.stringify({ error: "outline is required for question generation" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const tingkatInfo = tingkat === "B1"
    ? "B1 level: 250-350 words, high-frequency vocabulary (up to 3000 words), simple and complex sentence structures"
    : "A2 level: 200-300 words, high-frequency vocabulary (up to 2000 words), simple sentences and basic compound forms";

  // Build passage prompt if needed
  let passageText = "";
  if (generate_passage) {
    const genreMap: Record<string, string> = {
      "narrative": "Write a short story (fable, myth, legend, or folktale) with Orientation (characters, setting, time), Complication (conflict/problem), and Resolution. Include a moral lesson.",
      "procedure": "Write a procedure text with a clear Goal/Title, a list of Materials/Ingredients, and numbered Steps.",
      "descriptive": "Write a descriptive text about a specific person, place, or thing with vivid sensory details.",
      "recount": "Write a recount of a past experience or event with Orientation, sequence of Events, and Re-orientation.",
      "analytical exposition": "Write an argumentative text with a clear Thesis statement, supporting Arguments with evidence, and a Reiteration/conclusion.",
    };
    const genreInstruction = genreMap[jenis_teks?.toLowerCase()] || `Write a ${jenis_teks} text.`;

    const passagePrompt = `${genreInstruction}

The text should be appropriate for ${tingkatInfo}.
Write in English. The text is for Indonesian SMA students.
Topic: "${topic || jenis_teks}"

Return JSON: { "reading_passage": "the full passage text" }`;

    const passageResult = await runWithKeys(keys, passagePrompt, (d) => !!d?.reading_passage);
    if (passageResult) {
      passageText = passageResult.data.reading_passage;
    }
  }

  // Generate questions based on outline
  const outlineDesc = outline.map((item: any) => {
    let format = "";
    if (item.bentuk_soal === "pg") {
      format = `Multiple choice with ${item.num_options} options and exactly 1 correct answer. Return "options" as array and "correct_answer" as the correct option text.`;
    } else if (item.bentuk_soal === "pgk_kategori") {
      format = `Categorization question: provide 3-5 statements and a correct_answer object mapping each statement to its category (e.g. {"statement1": "Category A", "statement2": "Category B"}). Return "options" as the list of statements and "correct_answer" as a JSON string of the mapping.`;
    } else if (item.bentuk_soal === "pgk_mcma") {
      format = `Multiple choice with ${item.num_options} options and MULTIPLE correct answers (2-3). Return "options" as array and "correct_answer" as a JSON array string of correct options.`;
    }
    return `Question #${item.no}:
  - Kompetensi: ${item.kompetensi}
  - Subkompetensi: ${item.subkompetensi}
  - Description: ${item.deskripsi_soal}
  - Format: ${format}`;
  }).join("\n\n");

  const questionsPrompt = `${TKA_FRAMEWORK_PROMPT}

You are generating TKA assessment questions for Bahasa Inggris SMA.

Jenis teks: ${jenis_teks}
Tingkat: ${tingkat} (${tingkatInfo})

${passageText ? `READING PASSAGE (base all questions on this):\n"""\n${passageText}\n"""` : ""}

Generate questions EXACTLY following this outline. Each question MUST match its assigned subkompetensi and format.

${outlineDesc}

Return JSON:
{
  "questions": [
    {
      "question_text": "...",
      "options": ["A", "B", "C", "D", "E"],
      "correct_answer": "...",
      "difficulty": "easy" | "medium" | "hard",
      "cognitive_level": "Pemahaman Tekstual" | "Pemahaman Inferensial" | "Evaluasi dan Apresiasi",
      "kompetensi": "...",
      "subkompetensi": "..."
    }
  ]
}

IMPORTANT: You MUST follow the outline exactly. Do NOT create questions outside the given subkompetensi.`;

  const result = await runWithKeys(keys, questionsPrompt, (d) => Array.isArray(d?.questions));
  if (!result) {
    return new Response(JSON.stringify({ error: "All API keys exhausted for question generation." }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const questions = result.data.questions.map((q: any, i: number) => ({
    question_text: q.question_text || "",
    options: q.options || null,
    correct_answer: typeof q.correct_answer === "object" ? JSON.stringify(q.correct_answer) : (q.correct_answer || ""),
    difficulty: q.difficulty || "medium",
    cognitive_level: q.cognitive_level || q.kompetensi || "Pemahaman Tekstual",
    order_index: i,
  }));

  const responseData: any = { questions, model_used: result.model };
  if (passageText) responseData.reading_passage = passageText;

  return new Response(JSON.stringify(responseData), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleFormativeMode(body: any, keys: any[]) {
  const { topic, question_type, num_questions, difficulty_distribution, cognitive_levels, reading_passage, generate_passage } = body;

  if (!topic) {
    return new Response(JSON.stringify({ error: "topic is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

    const result = await runWithKeys(keys, passagePrompt, (d) => !!d?.reading_passage);
    if (!result) {
      return new Response(JSON.stringify({ error: "All API keys and models exhausted for passage generation." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ reading_passage: result.data.reading_passage, model_used: result.model }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Mode: generate questions
  if (!question_type || !num_questions) {
    return new Response(JSON.stringify({ error: "question_type and num_questions are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const typeLabel: Record<string, string> = {
    multiple_choice: "multiple choice with 4 options (A, B, C, D). Each question has exactly ONE correct answer.",
    mcma: "multiple choice with 4-5 options. Each question may have MULTIPLE correct answers (2-3 correct answers per question). The correct_answer field must be a JSON array of the correct options.",
    true_false: "true or false. Each question is a statement, and the correct_answer is either \"True\" or \"False\".",
    true_false_statement: "true or false statement categorization. Each question is a specific statement derived from the reading passage, and the correct_answer is either \"True\" or \"False\".",
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
    ? 'The correct_answer must be a JSON array string of all correct options. Each question should have 2-3 correct answers.'
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

  const result = await runWithKeys(keys, prompt, (d) => Array.isArray(d?.questions));
  if (!result) {
    return new Response(JSON.stringify({ error: "All API keys and models exhausted. Please try again later or add more API keys." }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const questions = result.data.questions.map((q: any, i: number) => ({
    question_text: q.question_text || "",
    options: q.options || null,
    correct_answer: typeof q.correct_answer === "object" ? JSON.stringify(q.correct_answer) : (q.correct_answer || ""),
    difficulty: q.difficulty || "medium",
    cognitive_level: q.cognitive_level || "C1",
    order_index: i,
  }));

  return new Response(JSON.stringify({ questions, model_used: result.model }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
