// ============================================================
// SciLab — science-generate-exercises (Edge Function)
// Generates adaptive Science exercises for a 7th-grader using Groq.
//
// Deploy:  supabase functions deploy science-generate-exercises --no-verify-jwt
// Secret:  supabase secrets set GROQ_API_KEY=your_key
// ============================================================

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors() });
  }
  try {
    const { skill, level, mastery, count = 5, seenQuestions = [] } = await req.json();

    if (!GROQ_API_KEY) {
      return json({ error: "GROQ_API_KEY not configured" }, 500, cors());
    }

    const focus = skill || "any";
    const weakSkills = Object.keys(mastery || {})
      .filter((s) => (mastery[s]?.seen || 0) >= 3 && (mastery[s]?.correct || 0) / mastery[s].seen < 0.6)
      .join(", ") || "none";

    const system = `You are an exercise generator for a 7th-grade Science class (Boston Flex).
Topics: Photosynthesis, Plant Respiration, Human Respiratory System.
Generate exactly ${count} multiple-choice questions about "${focus}".
Target difficulty for student level ${level || 1} (1 = easy ... 8 = hardest).
Weak skills to reinforce: ${weakSkills}.

Rules:
- Each question is a JSON object with keys: sk (topic id), q (question), o (array of 4 options), a (index 0-3 of the correct one), fb (short feedback explaining why, 1 sentence).
- Keep questions in simple English for 12-year-olds. Science-accurate.
- Vary question types: vocabulary, process order, function, "what happens if", true/false style.
- Do NOT repeat: ${seenQuestions.slice(0, 30).join(" | ")}
- Respond with ONLY a valid JSON array, no markdown, no extra text.`;

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.9,
        max_tokens: 1600,
        messages: [{ role: "system", content: system }, { role: "user", content: "Generate the exercises now." }],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return json({ error: "Groq error: " + t.slice(0, 200) }, 502, cors());
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    // Extract a JSON array from the model output (tolerant parsing)
    const m = content.match(/\[[\s\S]*\]/);
    let exercises = [];
    try {
      exercises = m ? JSON.parse(m[0]) : [];
    } catch {
      exercises = [];
    }
    exercises = exercises
      .filter((e) => e && e.q && Array.isArray(e.o) && e.o.length >= 2 && typeof e.a === "number" && e.o[e.a] != null)
      .map((e) => ({ ...e, sk: focus !== "any" ? focus : e.sk || "photosynthesis" }));

    return json({ exercises }, 200, cors());
  } catch (e) {
    return json({ error: String(e && e.message || e) }, 500, cors());
  }
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}
function json(obj: unknown, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}