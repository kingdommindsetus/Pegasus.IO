import { generatePegasusText } from "../core/runtime/agents/pegasusReasoner.js";
import {
  classifyKnowledgeRoute,
  buildRouteGuard
} from "./agentKnowledge.js";
import { resolveVerifiedSource } from "./sourceRouter.js";
import { loadAgentBrain } from "./loadAgentBrain.js";
import { isKnownAgent } from "./serverAgentRegistry.js";
import { hasFounderCoreSession } from "./serverSessionAuth.js";
import { loadPersistentAgentContext } from "./agentContextStore.js";

function normalizeMission(body = {}) {
  const mission = body?.mission;
  if (!mission || typeof mission !== "object" || Array.isArray(mission)) return null;

  return {
    missionId: String(mission.missionId || mission.id || "").slice(0, 120),
    assignedBy: String(mission.assignedBy || "").slice(0, 80),
    assignedTo: String(mission.assignedTo || "").slice(0, 80),
    objective: String(mission.objective || "").slice(0, 2000),
    offer: String(mission.offer || "").slice(0, 500),
    audience: String(mission.audience || "").slice(0, 500),
    knownFacts: Array.isArray(mission.knownFacts) ? mission.knownFacts.slice(0, 20) : [],
    unknowns: Array.isArray(mission.unknowns) ? mission.unknowns.slice(0, 20) : [],
    constraints: Array.isArray(mission.constraints) ? mission.constraints.slice(0, 20) : [],
    requiredOutputs: Array.isArray(mission.requiredOutputs) ? mission.requiredOutputs.slice(0, 20) : [],
    approvalRequired: Boolean(mission.approvalRequired)
  };
}

function normalizeMemory(body = {}) {
  if (!Array.isArray(body?.memory)) return [];
  return body.memory
    .slice(0, 12)
    .map((item) => String(item || "").trim().slice(0, 1000))
    .filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  } catch {
    return res.status(400).json({ error: "Invalid JSON body." });
  }

  const message = String(body.message || "").trim();
  const requestedAgentId = String(body.agentId || "echo").trim().toLowerCase().slice(0, 80);

  if (!message) return res.status(400).json({ error: "Message is required." });
  if (message.length > 4000) return res.status(400).json({ error: "Message is too long." });

  if (!isKnownAgent(requestedAgentId)) {
    return res.status(400).json({
      error: "Unknown Pegasus agent.",
      agentId: requestedAgentId
    });
  }

  const routeInfo = classifyKnowledgeRoute(message);
  const sourceResult = await resolveVerifiedSource(routeInfo, message);

  const verifiedContext = sourceResult?.ok && !sourceResult?.bypass
    ? String(sourceResult.context || "").slice(0, 12000)
    : "";

  const requestedMission = normalizeMission(body);
  const requestedMemory = normalizeMemory(body);
  const founderSession = hasFounderCoreSession(req);

  const persistentContext = founderSession
    ? await loadPersistentAgentContext({
        agentId: requestedAgentId,
        missionId: requestedMission?.missionId || "",
        message
      })
    : {
        ok: false,
        reason: "Founder Core session required for persistent context.",
        mission: null,
        memory: [],
        knowledge: [],
        missionLoaded: false,
        memoryItems: 0,
        knowledgeItems: 0
      };

  const mission = persistentContext?.mission || requestedMission;
  const memory = Array.from(new Set([
    ...(persistentContext?.memory || []),
    ...(persistentContext?.knowledge || []),
    ...requestedMemory
  ])).slice(0, 12);

  const brain = loadAgentBrain({
    agentId: requestedAgentId,
    mission,
    memory,
    verifiedContext
  });

  const persistentMemoryVerified = Boolean(
    routeInfo.route === "MEMORY" &&
    founderSession &&
    persistentContext?.ok &&
    ((persistentContext?.memoryItems || 0) > 0 || persistentContext?.missionLoaded)
  );

  const routeGuard = persistentMemoryVerified
    ? "MEMORY SOURCE STATUS: VERIFIED via authenticated Pegasus Core / Neon retrieval. Use only the loaded persistent mission and memory context; do not invent missing facts."
    : buildRouteGuard(routeInfo, verifiedContext);

  const sourceFailureGuard = (
    !sourceResult?.ok &&
    !persistentMemoryVerified &&
    routeInfo.route !== "CORE_FACT" &&
    routeInfo.route !== "ROLE_KNOWLEDGE"
  )
    ? [
        "SOURCE STATUS: UNAVAILABLE.",
        `Source: ${sourceResult?.source || routeInfo.requiredSource || "UNKNOWN"}.`,
        `Reason: ${sourceResult?.reason || "No verified source data was available."}`,
        "Do not provide a guessed current-state answer and do not claim any action occurred."
      ].join(" ")
    : "";

  const system = [
    brain.systemPrompt,
    routeGuard,
    sourceFailureGuard
  ].filter(Boolean).join(" ");

  try {
    const result = await generatePegasusText({
      system,
      prompt: message,
      maxOutputTokens: 700
    });

    const text = String(result.text || "").trim();
    if (!text) return res.status(502).json({ error: "Pegasus returned no response text." });

    return res.status(200).json({
      text,
      provider: result.runtime.reasoningProvider,
      model: result.runtime.model,
      agentId: brain.agent.id,
      agentName: brain.agent.name,
      role: brain.agent.role,
      authority: brain.agent.authority || [],
      knowledgeRoute: routeInfo.route,
      requiredSource: routeInfo.requiredSource,
      sourceVerified: Boolean(verifiedContext || persistentMemoryVerified),
      sourceStatus: (sourceResult?.ok || persistentMemoryVerified) ? "VERIFIED" : "UNAVAILABLE",
      sourceReason: persistentMemoryVerified ? null : (sourceResult?.reason || null),
      routeReason: routeInfo.reason,
      missionId: mission?.missionId || null,
      memoryItemsLoaded: brain.memory.length,
      persistentContextAuthenticated: founderSession,
      persistentContextLoaded: Boolean(founderSession && persistentContext?.ok),
      persistentMissionLoaded: Boolean(persistentContext?.missionLoaded),
      persistentMemoryItemsLoaded: Number(persistentContext?.memoryItems || 0),
      persistentKnowledgeItemsLoaded: Number(persistentContext?.knowledgeItems || 0),
      brainVersion: "agent-brain-v1"
    });
  } catch (error) {
    const errorMessage = String(error?.message || "Unknown reasoning error");
    console.error("Pegasus reasoning error", errorMessage);
    return res.status(502).json({
      error: "Pegasus LLM request failed.",
      code: String(error?.name || "REASONING_ERROR").slice(0, 80),
      detail: errorMessage.slice(0, 240),
      knowledgeRoute: routeInfo.route,
      requiredSource: routeInfo.requiredSource,
      agentId: brain.agent.id,
      brainVersion: "agent-brain-v1"
    });
  }
}
