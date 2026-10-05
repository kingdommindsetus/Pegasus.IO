-- Expand least-privilege autonomous permissions across the full Pegasus 12-agent roster.
-- Only skills with implemented Core adapters are allowed for autonomous execution.
-- External side effects remain approval-gated or denied until connector adapters are implemented.

INSERT INTO pegasus_core.agent_skills(agent_id,skill_key,permission) VALUES
('simon','search_company_memory','allow'),
('simon','create_task','allow'),
('simon','handoff_task','allow'),

('marie','search_company_memory','allow'),
('marie','create_task','allow'),
('marie','handoff_task','allow'),

('iris','search_company_memory','allow'),
('iris','research_company','allow'),
('iris','research_person','allow'),
('iris','handoff_task','allow'),

('mark','search_company_memory','allow'),
('mark','create_campaign','allow'),
('mark','generate_content','allow'),
('mark','handoff_task','allow'),

('cammy','search_company_memory','allow'),
('cammy','create_campaign','allow'),
('cammy','generate_content','allow'),
('cammy','handoff_task','allow'),

('evan','search_company_memory','allow'),
('evan','generate_content','allow'),
('evan','handoff_task','allow'),

('tube','search_company_memory','allow'),
('tube','generate_content','allow'),
('tube','handoff_task','allow'),

('lucy','search_company_memory','allow'),
('lucy','generate_content','allow'),
('lucy','analyze_metrics','allow'),
('lucy','handoff_task','allow'),

('snake','search_company_memory','allow'),
('snake','analyze_metrics','allow'),
('snake','handoff_task','allow'),

('alice','search_company_memory','allow'),
('alice','inspect_website','allow'),
('alice','analyze_metrics','allow'),
('alice','handoff_task','allow'),

('echo','search_company_memory','allow'),
('echo','research_company','allow'),
('echo','research_person','allow'),
('echo','draft_email','allow'),
('echo','handoff_task','allow'),
('echo','send_email','approval_required'),
('echo','update_crm','approval_required'),

('booker','search_company_memory','allow'),
('booker','handoff_task','allow'),
('booker','schedule_meeting','approval_required')
ON CONFLICT(agent_id,skill_key) DO UPDATE SET permission=EXCLUDED.permission;
