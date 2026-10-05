-- Pegasus Core v2 — foundation schema
-- Designed for PostgreSQL/Neon. Add pgvector when retrieval embeddings are enabled.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE memory_scope AS ENUM ('company','agent','project','entity','episodic');
CREATE TYPE job_status AS ENUM ('queued','claimed','running','waiting_approval','retrying','completed','failed','cancelled');
CREATE TYPE approval_status AS ENUM ('pending','approved','rejected','expired');

CREATE TABLE organizations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, slug text UNIQUE NOT NULL,
 metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE people (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid REFERENCES organizations(id),
 display_name text NOT NULL, email text, metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE agents (
 id text PRIMARY KEY, display_name text NOT NULL, department text NOT NULL, mission text NOT NULL,
 system_prompt_version text NOT NULL DEFAULT 'v1', enabled boolean NOT NULL DEFAULT true,
 permissions jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE projects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid REFERENCES organizations(id),
 name text NOT NULL, objective text NOT NULL, status text NOT NULL DEFAULT 'active',
 metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE objectives (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 title text NOT NULL, success_criteria jsonb NOT NULL DEFAULT '[]', status text NOT NULL DEFAULT 'open',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 objective_id uuid REFERENCES objectives(id), assigned_agent_id text REFERENCES agents(id), parent_task_id uuid REFERENCES tasks(id),
 title text NOT NULL, instructions text NOT NULL, status text NOT NULL DEFAULT 'queued', priority integer NOT NULL DEFAULT 50,
 depends_on jsonb NOT NULL DEFAULT '[]', input jsonb NOT NULL DEFAULT '{}', output jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
 agent_id text REFERENCES agents(id), skill_key text, status job_status NOT NULL DEFAULT 'queued',
 priority integer NOT NULL DEFAULT 50,
 idempotency_key text UNIQUE, attempts integer NOT NULL DEFAULT 0, max_attempts integer NOT NULL DEFAULT 3,
 available_at timestamptz NOT NULL DEFAULT now(), lease_expires_at timestamptz,
 input jsonb NOT NULL DEFAULT '{}', result jsonb, last_error text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE job_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
 attempt integer NOT NULL, worker_id text, started_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz,
 status job_status NOT NULL, checkpoint jsonb NOT NULL DEFAULT '{}', error text, metrics jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE memories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), scope memory_scope NOT NULL, scope_id text,
 agent_id text REFERENCES agents(id), project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
 subject text NOT NULL, content text NOT NULL, source_uri text, source_type text,
 confidence numeric(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
 authority text NOT NULL DEFAULT 'unverified', version integer NOT NULL DEFAULT 1,
 valid_from timestamptz NOT NULL DEFAULT now(), valid_to timestamptz,
 metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE knowledge_nodes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid REFERENCES organizations(id),
 node_type text NOT NULL, canonical_name text NOT NULL, properties jsonb NOT NULL DEFAULT '{}',
 source_memory_id uuid REFERENCES memories(id), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(organization_id,node_type,canonical_name)
);
CREATE TABLE knowledge_edges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), from_node_id uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
 relation text NOT NULL, to_node_id uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
 properties jsonb NOT NULL DEFAULT '{}', source_memory_id uuid REFERENCES memories(id),
 confidence numeric(4,3), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid REFERENCES organizations(id),
 project_id uuid REFERENCES projects(id), title text NOT NULL, mime_type text, source_uri text,
 checksum text, version integer NOT NULL DEFAULT 1, trust_level text NOT NULL DEFAULT 'unverified',
 metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE document_chunks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
 chunk_index integer NOT NULL, content text NOT NULL, token_count integer, metadata jsonb NOT NULL DEFAULT '{}',
 UNIQUE(document_id,chunk_index)
);
CREATE TABLE skills (
 key text PRIMARY KEY, name text NOT NULL, description text NOT NULL, risk_level text NOT NULL DEFAULT 'low',
 input_schema jsonb NOT NULL DEFAULT '{}', output_schema jsonb NOT NULL DEFAULT '{}', enabled boolean NOT NULL DEFAULT true
);
CREATE TABLE agent_skills (
 agent_id text NOT NULL REFERENCES agents(id) ON DELETE CASCADE, skill_key text NOT NULL REFERENCES skills(key) ON DELETE CASCADE,
 permission text NOT NULL CHECK(permission IN ('allow','approval_required','deny')), PRIMARY KEY(agent_id,skill_key)
);
CREATE TABLE approvals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
 requested_by_agent_id text REFERENCES agents(id), action_type text NOT NULL, payload jsonb NOT NULL,
 status approval_status NOT NULL DEFAULT 'pending', decided_by text, decision_reason text,
 created_at timestamptz NOT NULL DEFAULT now(), decided_at timestamptz
);
CREATE TABLE events (
 id bigserial PRIMARY KEY, project_id uuid REFERENCES projects(id), agent_id text REFERENCES agents(id),
 event_type text NOT NULL, entity_type text, entity_id text, payload jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE audit_log (
 id bigserial PRIMARY KEY, actor_type text NOT NULL, actor_id text NOT NULL, action text NOT NULL,
 entity_type text NOT NULL, entity_id text, before_state jsonb, after_state jsonb,
 correlation_id uuid, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_claim ON jobs(status, available_at, priority) WHERE status IN ('queued','retrying');
CREATE INDEX idx_tasks_project_status ON tasks(project_id,status);
CREATE INDEX idx_memories_scope ON memories(scope,scope_id);
CREATE INDEX idx_memories_project ON memories(project_id);
CREATE INDEX idx_edges_from ON knowledge_edges(from_node_id,relation);
CREATE INDEX idx_edges_to ON knowledge_edges(to_node_id,relation);
CREATE INDEX idx_events_project_time ON events(project_id,created_at DESC);
