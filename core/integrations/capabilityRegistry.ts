/** Public metadata only. Never stores credentials, tenant data or live health claims. */
export const CAPABILITY_REGISTRY = {
 pegasus:{role:'control_plane',mode:'existing_core',license:'owned',authority:'system_of_record'},
 gods_eye:{role:'founder_observability',mode:'read_model_planned',license:'owned',authority:'read_only'},
 paperclip:{role:'optional_agent_management_adapter',mode:'not_enabled',license:'MIT',authority:'no_execution'},
 astra:{role:'knowledge_draft',mode:'isolated_prototype',license:'internal',authority:'review_only'},
 rea:{role:'software_evidence',mode:'synthetic_verified',license:'MIT',authority:'review_only'},
 openmontage:{role:'video_production',mode:'planning_only',license:'AGPL-3.0',authority:'no_execution'},
 openclaw:{role:'approved_tool_sidecar',mode:'not_enabled',license:'MIT',authority:'no_execution'},
 redis:{role:'optional_signaling',mode:'not_enabled',license:'redis_8_tri_license',authority:'not_system_of_record'},
 playwright:{role:'staging_browser_qa',mode:'not_enabled',license:'Apache-2.0',authority:'no_execution'},
 n8n:{role:'internal_workflow_design',mode:'not_enabled',license:'fair_code_conditions',authority:'no_execution'},
 dify:{role:'knowledge_workflow_design',mode:'not_enabled',license:'modified_apache_conditions',authority:'no_execution'},
} as const;
export type CapabilityId=keyof typeof CAPABILITY_REGISTRY;
