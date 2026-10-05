import { generatePegasusText } from "../core/runtime/agents/pegasusReasoner.js";
import {
  buildAgentSystemPrompt,
  classifyKnowledgeRoute,
  buildRouteGuard
} from "./agentKnowledge.js";
import { resolveVerifiedSource } from "./sourceRouter.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const message = String(body.message || "").trim();
  const agentName = String(body.agentName || "Echo").slice(0, 80);
  const role = String(body.role || "Sales Outreach").slice(0, 160);
  const agentId = String(body.agentId || agentName || "echo").toLowerCase().slice(0, 80);

  if (!message) return res.status(400).json({ error: "Message is required." });
  if (message.length > 4000) return res.status(400).json({ error: "Message is too long." });

  const routeInfo = classifyKnowledgeRoute(message);
  const sourceResult = await resolveVerifiedSource(routeInfo, message);

  // IMPORTANT: client-supplied "verifiedContext" is intentionally ignored.
  // Only server-side source adapters may create trusted live context.
  const verifiedContext = sourceResult?.ok && !sourceResult?.bypass
    ? String(sourceResult.context || "").slice(0, 12000)
    : "";

  const baseSystem = buildAgentSystemPrompt(agentName, role, agentId);
  const routeGuard = buildRouteGuard(routeInfo, verifiedContext);

  const sourceFailureGuard = (!sourceResult?.ok && routeInfo.route !== "CORE_FACT" && routeInfo.route !== "ROLE_KNOWLEDGE")
    ? [
        `SOURCE STATUS: UNAVAILABLE.`,
        `Source: ${sourceResult?.source || routeInfo.requiredSource || "UNKNOWN"}.`,
        `Reason: ${sourceResult?.reason || "No verified source data was available."}`,
        "Do not provide a guessed current-state answer and do not claim any action occurred."
      ].join(" ")
    : "";

  const system = [
    baseSystem,
    routeGuard,
    sourceFailureGuard,
    verifiedContext ? `VERIFIED SOURCE CONTEXT: ${verifiedContext}` : ""
  ].filter(Boolean).join(" ");

  try {
    const result = await generatePegasusText({
      system,
      prompt: message,
      maxOutputTokens: 500
    });

    const text = String(result.text || "").trim();
    if (!text) return res.status(502).json({ error: "Pegasus returned no response text." });

    return res.status(200).json({
      text,
      provider: result.runtime.reasoningProvider,
      model: result.runtime.model,
      agentId,
      knowledgeRoute: routeInfo.route,
      requiredSource: routeInfo.requiredSource,
      sourceVerified: Boolean(verifiedContext),
      sourceStatus: sourceResult?.ok ? "VERIFIED" : "UNAVAILABLE",
      sourceReason: sourceResult?.reason || null,
      routeReason: routeInfo.reason
    });
  } catch (error) {
    const errorMessage = String(error?.message || "Unknown reasoning error");
    console.error("Pegasus reasoning error", errorMessage);
    return res.status(502).json({
      error: "Pegasus LLM request failed.",
      code: String(error?.name || "REASONING_ERROR").slice(0, 80),
      detail: errorMessage.slice(0, 240),
      knowledgeRoute: routeInfo.route,
      requiredSource: routeInfo.requiredSource
    });
  }
}
