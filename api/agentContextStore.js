import postgres from "postgres";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanText(value, max = 1000) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function keywords(message) {
  return Array.from(new Set(
    cleanText(message, 1200)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 5)
  )).slice(0, 8);
}

export async function loadPersistentAgentContext({ agentId, missionId, message } = {}) {
  const url = String(process.env.DATABASE_URL || "").trim();
  if (!url) {
    return { ok: false, reason: "DATABASE_URL is not configured", mission: null, memory: [], knowledge: [] };
  }

  const sql = postgres(url, { max: 1, idle_timeout: 5, connect_timeout: 10 });

  try {
    let mission = null;
    let projectId = null;

    if (UUID_RE.test(String(missionId || ""))) {
      const rows = await sql`
        SELECT
          o.id,
          o.project_id,
          o.title,
          o.description,
          o.success_criteria,
          o.constraints,
          o.metrics,
          o.status_v2,
          o.owner_agent_id,
          p.name AS project_name,
          p.objective AS project_objective
        FROM pegasus_core.objectives o
        JOIN pegasus_core.projects p ON p.id = o.project_id
        WHERE o.id = ${missionId}
        LIMIT 1
      `;

      const row = rows[0];
      if (row) {
        projectId = row.project_id;
        mission = {
          missionId: row.id,
          assignedBy: "Pegasus Core",
          assignedTo: agentId,
          objective: cleanText(row.description || row.project_objective || row.title, 2000),
          knownFacts: [
            cleanText(row.project_name, 300),
            cleanText(row.title, 500),
            `status=${cleanText(row.status_v2, 80)}`
          ].filter(Boolean),
          constraints: Array.isArray(row.constraints) ? row.constraints.slice(0, 20) : [],
          requiredOutputs: Array.isArray(row.success_criteria) ? row.success_criteria.slice(0, 20) : [],
          approvalRequired: false
        };
      }
    }

    const memoryRows = projectId
      ? await sql`
          SELECT agent_id, subject, left(content, 1200) AS content, authority, source_type, created_at
          FROM pegasus_core.memories
          WHERE valid_to IS NULL
            AND superseded_by IS NULL
            AND (
              project_id = ${projectId}
              OR scope = 'company'
              OR (scope = 'agent' AND agent_id = ${agentId})
            )
          ORDER BY
            CASE WHEN project_id = ${projectId} THEN 0 WHEN agent_id = ${agentId} THEN 1 ELSE 2 END,
            created_at DESC
          LIMIT 12
        `
      : await sql`
          SELECT agent_id, subject, left(content, 1200) AS content, authority, source_type, created_at
          FROM pegasus_core.memories
          WHERE valid_to IS NULL
            AND superseded_by IS NULL
            AND (scope = 'company' OR (scope = 'agent' AND agent_id = ${agentId}))
          ORDER BY created_at DESC
          LIMIT 12
        `;

    const memory = memoryRows.map((row) =>
      cleanText(
        `[${row.authority || "unverified"}] ${row.subject}: ${row.content}`,
        1400
      )
    );

    const terms = keywords(message);
    let knowledge = [];

    if (terms.length) {
      const patterns = terms.map((term) => `%${term}%`);
      const docs = await sql`
        SELECT d.title, d.trust_level, left(dc.content, 1400) AS content
        FROM pegasus_core.document_chunks dc
        JOIN pegasus_core.documents d ON d.id = dc.document_id
        WHERE d.trust_level IN ('verified','founder_approved','approved')
          AND dc.content ILIKE ANY(${patterns})
        ORDER BY d.created_at DESC, dc.chunk_index
        LIMIT 6
      `;
      knowledge = docs.map((row) =>
        cleanText(`[${row.trust_level}] ${row.title}: ${row.content}`, 1500)
      );
    }

    return {
      ok: true,
      mission,
      memory,
      knowledge,
      missionLoaded: Boolean(mission),
      memoryItems: memory.length,
      knowledgeItems: knowledge.length
    };
  } catch (error) {
    return {
      ok: false,
      reason: cleanText(error?.message || "Persistent context lookup failed", 240),
      mission: null,
      memory: [],
      knowledge: []
    };
  } finally {
    await sql.end({ timeout: 1 });
  }
}
