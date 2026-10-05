-- Least-privilege permissions for real agent reasoning.
INSERT INTO agent_skills(agent_id,skill_key,permission)
SELECT a.id,s.key,CASE WHEN s.key IN ('send_email','schedule_meeting') THEN 'approval_required' ELSE 'allow' END
FROM agents a CROSS JOIN skills s
WHERE (a.id='simon' AND s.key IN ('search_company_memory','create_task','handoff_task'))
   OR (a.id='marie' AND s.key IN ('search_company_memory','create_task','handoff_task','update_crm'))
   OR (a.id='iris' AND s.key IN ('search_company_memory','research_company','research_person'))
   OR (a.id='mark' AND s.key IN ('search_company_memory','create_campaign','generate_content'))
   OR (a.id='echo' AND s.key IN ('research_company','research_person','draft_email','send_email','update_crm'))
   OR (a.id='booker' AND s.key IN ('schedule_meeting','search_company_memory'))
ON CONFLICT(agent_id,skill_key) DO UPDATE SET permission=EXCLUDED.permission;
