-- Pegasus 12-agent roster
INSERT INTO agents(id,display_name,department,mission) VALUES
('simon','Simon','Executive Strategy','Decide what matters and establish mission priority'),
('marie','Marie','Operations','Decompose strategy into coordinated execution'),
('iris','IRIS','Intelligence','Gather, verify and synthesize intelligence'),
('mark','Mark','Marketing','Develop positioning and marketing direction'),
('cammy','Cammy','Campaigns','Turn strategy into executable campaigns'),
('evan','Evan','Content','Create campaign and educational content'),
('tube','Tube','Video','Create video strategy and production briefs'),
('lucy','Lucy','Distribution','Distribute content through appropriate channels'),
('snake','Snake','Analytics','Measure performance and surface decisions'),
('alice','Alice','Web Quality & CRO','Protect website quality and conversion'),
('echo','Echo','Sales Outreach','Research and pursue qualified opportunities'),
('booker','Booker','Scheduling','Convert qualified conversations into appointments')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name,department=EXCLUDED.department,mission=EXCLUDED.mission;

INSERT INTO skills(key,name,description,risk_level) VALUES
('search_company_memory','Search Company Memory','Retrieve governed company context','low'),
('research_company','Research Company','Research a target organization','low'),
('research_person','Research Person','Research a target professional','low'),
('draft_email','Draft Email','Prepare outreach without sending','low'),
('send_email','Send Email','Transmit an external email','high'),
('update_crm','Update CRM','Create or update CRM state with audit','medium'),
('create_campaign','Create Campaign','Create a campaign plan','low'),
('generate_content','Generate Content','Create draft content','low'),
('analyze_metrics','Analyze Metrics','Analyze performance data','low'),
('inspect_website','Inspect Website','Review site quality and conversion','low'),
('schedule_meeting','Schedule Meeting','Create an external calendar booking','high'),
('create_task','Create Task','Create internal Pegasus work','low'),
('handoff_task','Handoff Task','Assign work to another agent','low')
ON CONFLICT (key) DO NOTHING;
