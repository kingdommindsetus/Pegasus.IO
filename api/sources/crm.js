const MAX_CONTEXT_CHARS = 10000;

function compact(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return String(text || "").slice(0, MAX_CONTEXT_CHARS);
}

export async function fetchCrmContext(query) {
  const baseUrl = String(process.env.PEGASUS_CRM_URL || "").trim();
  const token = String(process.env.PEGASUS_CRM_TOKEN || "").trim();

  if (!baseUrl) {
    return {
      ok: false,
      source: "CRM",
      reason: "CRM adapter is not configured. Set PEGASUS_CRM_URL."
    };
  }

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        query: String(query || "").slice(0, 4000),
        requester: "Pegasus"
      })
    });

    if (!response.ok) {
      return {
        ok: false,
        source: "CRM",
        reason: `CRM returned HTTP ${response.status}.`
      };
    }

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    return {
      ok: true,
      source: "CRM",
      context: compact(payload)
    };
  } catch (error) {
    return {
      ok: false,
      source: "CRM",
      reason: String(error?.message || "CRM request failed").slice(0, 240)
    };
  }
}
