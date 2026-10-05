-- Objective engine: measurable goals -> milestones -> task DAG -> evidence
CREATE TYPE objective_status AS ENUM ('draft','ready','active','blocked','completed','cancelled');
CREATE TYPE milestone_status AS ENUM ('pending','active','completed','blocked');

ALTER TABLE objectives ADD COLUMN IF NOT EXISTS owner_agent_id text REFERENCES agents(id);
ALTER TABLE objectives ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE objectives ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 50;
ALTER TABLE objectives ADD COLUMN IF NOT EXISTS target_date timestamptz;
ALTER TABLE objectives ADD COLUMN IF NOT EXISTS status_v2 objective_status NOT NULL DEFAULT 'draft';
ALTER TABLE objectives ADD COLUMN IF NOT EXISTS progress numeric(5,2) NOT NULL DEFAULT 0 CHECK(progress >= 0 AND progress <= 100);
ALTER TABLE objectives ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'founder';
ALTER TABLE objectives ADD COLUMN IF NOT EXISTS constraints jsonb NOT NULL DEFAULT '[]';
ALTER TABLE objectives ADD COLUMN IF NOT EXISTS metrics jsonb NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS milestones (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 objective_id uuid NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
 title text NOT NULL, description text, sequence integer NOT NULL DEFAULT 0,
 owner_agent_id text REFERENCES agents(id), status milestone_status NOT NULL DEFAULT 'pending',
 acceptance_criteria jsonb NOT NULL DEFAULT '[]', due_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_dependencies (
 task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
 depends_on_task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
 PRIMARY KEY(task_id,depends_on_task_id), CHECK(task_id <> depends_on_task_id)
);

CREATE TABLE IF NOT EXISTS evidence (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
 objective_id uuid REFERENCES objectives(id) ON DELETE CASCADE, task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
 job_id uuid REFERENCES jobs(id) ON DELETE CASCADE, evidence_type text NOT NULL,
 uri text, content jsonb NOT NULL DEFAULT '{}', verified boolean NOT NULL DEFAULT false,
 verifier text, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_objectives_owner_status ON objectives(owner_agent_id,status_v2);
CREATE INDEX IF NOT EXISTS idx_milestones_objective_sequence ON milestones(objective_id,sequence);
CREATE INDEX IF NOT EXISTS idx_evidence_objective ON evidence(objective_id,created_at DESC);
