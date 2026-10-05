import { fetchCrmContext } from "./sources/crm.js";

export async function resolveVerifiedSource(routeInfo, message) {
  const route = routeInfo?.route || "ROLE_KNOWLEDGE";
  const requiredSource = routeInfo?.requiredSource || null;

  if (route === "CORE_FACT" || route === "ROLE_KNOWLEDGE") {
    return {
      ok: true,
      source: requiredSource,
      context: "",
      bypass: true
    };
  }

  if (route === "MEMORY") {
    return {
      ok: false,
      source: "MEMORY_STORE",
      reason: "Memory adapter is not connected yet."
    };
  }

  if (route === "ACTION") {
    return {
      ok: false,
      source: requiredSource || "AUTHORIZED_TOOL",
      reason: "Action gateway is not connected yet. No external action was performed."
    };
  }

  if (route === "LIVE_DATA") {
    switch (requiredSource) {
      case "CRM":
        return fetchCrmContext(message);
      case "CALENDAR":
        return { ok: false, source: "CALENDAR", reason: "Calendar adapter is not connected yet." };
      case "EMAIL":
        return { ok: false, source: "EMAIL", reason: "Email adapter is not connected yet." };
      case "FINANCE":
        return { ok: false, source: "FINANCE", reason: "Finance adapter is not connected yet." };
      case "WEB":
        return { ok: false, source: "WEB", reason: "Web adapter is not connected yet." };
      case "REPO":
        return { ok: false, source: "REPO", reason: "Repository adapter is not connected yet." };
      default:
        return { ok: false, source: requiredSource || "UNKNOWN", reason: "Required live source is unavailable." };
    }
  }

  return {
    ok: false,
    source: requiredSource || "UNKNOWN",
    reason: "No verified source route was available."
  };
}
