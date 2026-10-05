-- Dynamic client agent templates / objective staffing
CREATE TABLE IF NOT EXISTS agent_templates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
 template_name text NOT NULL,
 base_agent_id text REFERENCES agents(id),
 role_name text NOT NULL,
 job_description text NOT NULL,
 department text,
 color_hex varchar(9) NOT NULL CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$'),
 voice_profile jsonb NOT NULL DEFAULT '{}',
 personality jsonb NOT NULL DEFAULT '{}',
 default_skills jsonb NOT NULL DEFAULT '[]',
 approval_policy jsonb NOT NULL DEFAULT '{}',
 system_prompt_template text,
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS objective_agents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 objective_id uuid NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
 template_id uuid REFERENCES agent_templates(id),
 runtime_agent_key text NOT NULL,
 display_name text NOT NULL,
 role_name text NOT NULL,
 job_description text NOT NULL,
 color_hex varchar(9) NOT NULL,
 config_snapshot jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(objective_id,runtime_agent_key)
);
CREATE INDEX IF NOT EXISTS idx_agent_templates_org ON agent_templates(organization_id,active);
CREATE INDEX IF NOT EXISTS idx_objective_agents_objective ON objective_agents(objective_id);
