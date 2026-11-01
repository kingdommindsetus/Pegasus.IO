// POST /api/hq-chat — one agent's in-character reply, written by Claude.
// The API key lives only in the Vercel environment (ANTHROPIC_API_KEY); the page never sees it.
// When the key is missing or Claude is unavailable the page falls back to its scripted replies.
import Anthropic from "@anthropic-ai/sdk";

// Server-side roster: the page may send extra office context, but names and roles come from here.
const ROSTER = {
  simon: "Executive Director", marie: "Operations", iris: "Market Intelligence", mark: "Marketing Direction",
  cammy: "Campaign Generation", evan: "Content Creation", tube: "Video Production", lucy: "Distribution",
  snake: "Analytics & Insights", alice: "Storefront & Conversion", echo: "Sales & Outreach",
  booker: "Scheduling & Appointments", scout: "Lead Discovery", maven: "Campaigns & Content",
  sofia: "Growth & Digital Presence", gatekeeper: "Approval & Compliance", atlas: "Lead Qualification",
  claire: "Research & Enrichment", flow: "Workflow Automation", ledger: "Finance & Operations",
  midas: "Product & Revenue Architect",
};
const NAMES = { iris: "IRIS" };

const MAX_MESSAGE = 600, MAX_TURNS = 8, MAX_FIELD = 140;
const hits = new Map(); // best-effort per-instance rate limit: 20 requests / minute / IP

const clip = (v, n = MAX_FIELD) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const list = (v, n) => (Array.isArray(v) ? v : []).slice(0, n).map((x) => clip(x)).filter(Boolean);

function systemPrompt(id, office) {
  const name = NAMES[id] || id[0].toUpperCase() + id.slice(1);
  const duties = list(office.duties, 6), missions = list(office.missions, 4);
  return [
    `You are ${name}, the ${ROSTER[id]} agent inside Pegasus, an AI workforce headquarters for KMCE (Kingdom Mindset Continuing Education).`,
    `Your colleagues: Simon (Executive Director) sets priorities, Marie (Operations) dispatches work, Gatekeeper (Approval & Compliance) reviews anything before it goes out, and the founder makes final decisions.`,
    duties.length ? `Your responsibilities: ${duties.join("; ")}.` : "",
    missions.length ? `Your current missions: ${missions.join("; ")}.` : "",
    office.quote ? `Your motto: "${clip(office.quote, 80)}".` : "",
    "You are speaking out loud to the founder in your office, so answer like a sharp colleague in conversation: two or three short sentences, no lists, no markdown, no emoji.",
    "You are not yet connected to live KMCE data. Never invent numbers, dates, names of clients, or results, and never claim you sent, booked, approved, or changed anything. If asked for figures or actions, say what you would do and that live data arrives once your office is connected.",
    "Stay in character as this agent; if asked something outside your role, briefly say which colleague owns it.",
  ].filter(Boolean).join("\n");
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body) return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  let raw = "";
  for await (const chunk of req) { raw += chunk; if (raw.length > 20000) throw new Error("too large"); }
  return JSON.parse(raw || "{}");
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return json(res, 405, { error: "Method not allowed" }); }
  if (!process.env.ANTHROPIC_API_KEY) return json(res, 503, { error: "not_configured" });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
  const now = Date.now(), recent = (hits.get(ip) || []).filter((t) => now - t < 60000);
  if (recent.length >= 20) return json(res, 429, { error: "rate_limited" });
  hits.set(ip, [...recent, now]);

  let body;
  try { body = await readBody(req); } catch { return json(res, 400, { error: "bad_json" }); }
  const id = clip(body.agentId, 20).toLowerCase();
  if (!ROSTER[id]) return json(res, 400, { error: "unknown_agent" });
  const message = clip(body.message, MAX_MESSAGE);
  if (!message) return json(res, 400, { error: "empty_message" });

  // Prior turns from this office visit, alternating user/assistant, ending before the new question.
  const history = (Array.isArray(body.history) ? body.history : [])
    .slice(-MAX_TURNS)
    .filter((t) => (t?.role === "user" || t?.role === "assistant") && clip(t.text, MAX_MESSAGE))
    .map((t) => ({ role: t.role, content: clip(t.text, MAX_MESSAGE) }));
  while (history.length && history[0].role !== "user") history.shift();
  const messages = [...history, { role: "user", content: message }];

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 1024,
      output_config: { effort: "low" }, // short spoken replies; keeps latency down
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: systemPrompt(id, body.office || {}),
      messages,
    });
    if (response.stop_reason === "refusal") return json(res, 200, { text: "", refused: true });
    const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join(" ").trim();
    return json(res, 200, { text, model: response.model });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json(res, 429, { error: "claude_rate_limited" });
    if (error instanceof Anthropic.AuthenticationError) return json(res, 503, { error: "bad_key" });
    if (error instanceof Anthropic.APIError) return json(res, 502, { error: "claude_error", status: error.status });
    return json(res, 502, { error: "network_error" });
  }
}
