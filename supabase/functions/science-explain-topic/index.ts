// ============================================================
// SciLab — science-explain-topic (Edge Function)
// Explains a confusing Science topic to a 7th-grader using Groq.
//
// Deploy:  supabase functions deploy science-explain-topic --no-verify-jwt
// Secret:  supabase secrets set GROQ_API_KEY=your_key
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const TOPICS = {
  photosynthesis: {
    name: "Photosynthesis",
    def: "Photosynthesis is how plants make their own food using sunlight, water and carbon dioxide.",
  },
  photo-inputs: {
    name: "What Plants Eat (Photosynthesis Inputs)",
    def: "Plants take in sunlight, water (from the soil) and carbon dioxide (from the air) to make food.",
  },
  photo-outputs: {
    name: "Photosynthesis Products",
    def: "Photosynthesis produces glucose (the plant's food/sugar) and releases oxygen into the air.",
  },
  chlorophyll: {
    name: "Chlorophyll and Leaves",
    def: "Chlorophyll is the green pigment inside chloroplasts that captures sunlight for photosynthesis.",
  },
  stomata: {
    name: "Stomata and Gas Exchange",
    def: "Stomata are tiny pores on leaves that let carbon dioxide in and oxygen out.",
  },
  "plant-resp": {
    name: "Plant Respiration",
    def: "Respiration is how plants break down glucose to release energy, using oxygen and releasing carbon dioxide.",
  },
  "root-resp": {
    name: "Root Respiration",
    def: "Roots also breathe: they absorb oxygen from air spaces in the soil to release energy.",
  },
  "human-resp-organs": {
    name: "Human Respiratory Organs",
    def: "The respiratory system includes the nose, trachea, bronchi and lungs that carry air in and out.",
  },
  breathing: {
    name: "Breathing Mechanism",
    def: "Breathing in (inhalation) and out (exhalation) is controlled by the diaphragm and rib muscles.",
  },
  "gas-exchange": {
    name: "Gas Exchange in the Lungs",
    def: "In the alveoli (tiny air sacs), oxygen passes into the blood and carbon dioxide passes out.",
  },
  "resp-care": {
    name: "Caring for the Respiratory System",
    def: "Keep your lungs healthy: avoid smoking, exercise, breathe clean air and wash your hands.",
  },
  "resp-vocab": {
    name: "Respiratory Vocabulary",
    def: "Key words: alveoli, bronchi, trachea, diaphragm, inhale, exhale, oxygen, carbon dioxide.",
  },
};

export default async function handler(req: Request): Promise<Response> {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors() });
  }
  try {
    const { skill, confusion, level } = await req.json();
    const topic = TOPICS[skill] || { name: skill, def: "" };
    if (!GROQ_API_KEY) {
      return json({ error: "GROQ_API_KEY not configured" }, 500, cors());
    }

    const userQ = confusion || "Explain this topic simply.";

    const system = `You are a friendly Science tutor for 7th-grade students at Boston Flex.
Topic: ${topic.name}. Core idea: ${topic.def}
The student is at level ${level || 1} of a learning game.
Respond in a warm, encouraging tone for a 12-year-old. Use simple English.
Include: (1) a short simple explanation, (2) one real-life or everyday example,
(3) a mini review question with the answer, (4) one Bible connection.
Keep it under 180 words. Use short paragraphs with emojis sparingly.`;

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.6,
        max_tokens: 420,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userQ },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return json({ error: "Groq error: " + t.slice(0, 200) }, 502, cors());
    }
    const data = await res.json();
    const explanation = data.choices?.[0]?.message?.content?.trim();

    return json(
      {
        explanation,
        skillName: topic.name,
        model: "groq-" + (data.model || "llama"),
      },
      200,
      cors()
    );
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