export const SERVER_AGENT_REGISTRY = Object.freeze({
  simon: { id: "simon", name: "Simon", role: "Executive Orchestrator", knowledgePath: "knowledge/agents/simon/brain.md", authority: ["prioritize","delegate","request_approval","hold_mission"] },
  marie: { id: "marie", name: "Marie", role: "Operations", knowledgePath: "knowledge/agents/marie/brain.md", authority: ["plan","assign","track","escalate"] },
  iris: { id: "iris", name: "IRIS", role: "Research & Intelligence", knowledgePath: "knowledge/agents/iris/brain.md", authority: ["research","verify","classify_evidence"] },
  mark: { id: "mark", name: "Mark", role: "Marketing Strategy", knowledgePath: "knowledge/agents/mark/brain.md", authority: ["position","segment","direct_campaign"] },
  cammy: { id: "cammy", name: "Cammy", role: "Campaigns", knowledgePath: "knowledge/agents/cammy/brain.md", authority: ["plan_campaign","sequence_channels"] },
  evan: { id: "evan", name: "Evan", role: "Content", knowledgePath: "knowledge/agents/evan/brain.md", authority: ["draft_content","adapt_copy"] },
  tube: { id: "tube", name: "Tube", role: "Video", knowledgePath: "knowledge/agents/tube/brain.md", authority: ["plan_video","package_media"] },
  lucy: { id: "lucy", name: "Lucy", role: "Distribution", knowledgePath: "knowledge/agents/lucy/brain.md", authority: ["plan_distribution","repurpose"] },
  snake: { id: "snake", name: "Snake", role: "Analytics", knowledgePath: "knowledge/agents/snake/brain.md", authority: ["measure","analyze","forecast"] },
  alice: { id: "alice", name: "Alice", role: "Digital Experience / Storefront", knowledgePath: "knowledge/agents/alice/brain.md", authority: ["audit_site","recommend_conversion_fix"] },
  echo: { id: "echo", name: "Echo", role: "Sales Outreach", knowledgePath: "knowledge/agents/echo/brain.md", authority: ["qualify","draft_outreach","follow_up","route_lead"], prohibited: ["change_pricing","invent_discount","promise_clinical_result","sign_contract","commit_faculty"] },
  booker: { id: "booker", name: "Booker", role: "Scheduling", knowledgePath: "knowledge/agents/booker/brain.md", authority: ["check_availability","schedule","reschedule"], prohibited: ["invent_availability"] }
});

export function resolveServerAgent(agentId = "") {
  const key = String(agentId || "").trim().toLowerCase();
  return SERVER_AGENT_REGISTRY[key] || SERVER_AGENT_REGISTRY.echo;
}

export function isKnownAgent(agentId = "") {
  return Boolean(SERVER_AGENT_REGISTRY[String(agentId || "").trim().toLowerCase()]);
}
