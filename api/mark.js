// Server-side marking proxy. The API key stays here, never in the web page.
// Environment variables (set in Vercel → Project → Settings → Environment Variables):
//   CODECRAFT_API_KEY   your key from codecraftapi.com/dashboard   (required)
//   CODECRAFT_MODEL     a vision-capable model ID from your CodeCraft model list (required)
//   CODECRAFT_MODEL_CAREFUL  optional stronger model used when "Careful marking" is ticked
//   CODECRAFT_BASE_URL  optional, defaults to https://codecraftapi.com/v1

const MAX_IMAGES = 12;
const MAX_PROMPT_CHARS = 120000;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  const key = process.env.CODECRAFT_API_KEY;
  const model = process.env.CODECRAFT_MODEL;
  if (!key || !model) return res.status(500).json({ error: "Server not set up: add CODECRAFT_API_KEY and CODECRAFT_MODEL in Vercel settings" });

  const { prompt, images = [], careful = false } = req.body || {};
  if (typeof prompt !== "string" || !prompt.trim()) return res.status(400).json({ error: "Missing prompt" });
  if (prompt.length > MAX_PROMPT_CHARS) return res.status(413).json({ error: "Prompt too long" });
  if (!Array.isArray(images) || images.length > MAX_IMAGES) return res.status(413).json({ error: `Upload at most ${MAX_IMAGES} pages` });
  if (!images.every(u => typeof u === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(u))) return res.status(400).json({ error: "Images must be JPEG, PNG or WebP" });

  const content = [{ type: "text", text: prompt }, ...images.map(url => ({ type: "image_url", image_url: { url } }))];
  const base = (process.env.CODECRAFT_BASE_URL || "https://codecraftapi.com/v1").replace(/\/$/, "");
  const useModel = careful && process.env.CODECRAFT_MODEL_CAREFUL ? process.env.CODECRAFT_MODEL_CAREFUL : model;

  try {
    const r = await fetch(base + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key, "x-api-key": key, "User-Agent": "ess-paper-generator/1.0" },
      body: JSON.stringify({
        model: useModel,
        max_tokens: 8000,
        temperature: 0.2,
        messages: [
          { role: "system", content: "You are a careful IB Environmental Systems and Societies examiner. Reply with only the JSON object requested." },
          { role: "user", content }
        ]
      })
    });
    const raw = await r.text();
    let data = {};
    try { data = JSON.parse(raw); } catch (e) {}
    if (!r.ok) {
      const msg = (data.error && (data.error.message || data.error)) || `API error ${r.status}: ${raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)}`;
      return res.status(r.status === 429 || r.status === 402 ? 429 : 502).json({ error: String(msg).slice(0, 300) });
    }
    const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    const out = Array.isArray(text) ? text.map(p => p.text || "").join("") : text;
    if (!out) return res.status(502).json({ error: "Empty reply from the model" });
    return res.status(200).json({ text: out });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach the marking service" });
  }
}
