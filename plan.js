// Saves and loads each person's plan, by their personal code.
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const id = String((req.query && req.query.id) || "");
  if (!/^[a-z0-9]{8,32}$/.test(id)) return res.status(400).json({ error: "bad id" });
  if (!url || !token) return res.status(500).json({ error: "database not connected" });
  const key = "plan:" + id;
  const auth = { Authorization: "Bearer " + token };
  try {
    if (req.method === "GET") {
      const r = await fetch(url + "/get/" + key, { headers: auth });
      const j = await r.json();
      return res.status(200).json({ data: j.result ? JSON.parse(j.result) : null });
    }
    if (req.method === "POST") {
      let data = req.body;
      if (typeof data === "string") data = JSON.parse(data);
      if (!data || typeof data !== "object" || Array.isArray(data)) return res.status(400).json({ error: "bad data" });
      const body = JSON.stringify(data);
      if (body.length > 50000) return res.status(413).json({ error: "too big" });
      const r = await fetch(url + "/set/" + key, { method: "POST", headers: auth, body });
      if (!r.ok) return res.status(502).json({ error: "save failed" });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: "server error" });
  }
};
