// Setup helper: open https://<your-site>/api/models to list the model IDs your key can use.
export default async function handler(req, res) {
  const key = process.env.CODECRAFT_API_KEY;
  if (!key) return res.status(500).json({ error: "Add CODECRAFT_API_KEY in Vercel settings first" });
  const base = (process.env.CODECRAFT_BASE_URL || "https://codecraftapi.com/v1").replace(/\/$/, "");
  try {
    const r = await fetch(base + "/models", { headers: { Authorization: "Bearer " + key, "x-api-key": key, "User-Agent": "dt-sl-paper-generator/1.0" } });
    const raw = await r.text();
    let d;
    try { d = JSON.parse(raw); } catch (e) { d = { status: r.status, body: raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300) }; }
    const ids = Array.isArray(d.data) ? d.data.map(m => m.id) : d;
    return res.status(r.ok ? 200 : 502).json({ current_model: process.env.CODECRAFT_MODEL || null, models: ids });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach CodeCraft" });
  }
}
