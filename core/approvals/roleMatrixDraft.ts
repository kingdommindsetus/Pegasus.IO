// S01 development-only candidate policy. NOT an authenticated identity provider.
// Do not connect to production until founder approves role boundaries and identity mapping.
export type UserRole='founder'|'staff'|'educator'|'doctor'|'student'|'public'|'service_agent';
export type AccessAction='view_public_catalog'|'view_own_enrollment'|'view_own_course'|'edit_own_course_draft'|'view_own_clinical_roster'|'view_scoped_crm'|'view_company_revenue'|'edit_company_settings'|'approve_external_action'|'draft_internal_job'|'send_email'|'publish'|'charge_payment'|'deploy';
export type AccessRequest={role:UserRole;action:AccessAction;identityVerified:boolean;ownershipVerified?:boolean;assignmentVerified?:boolean;humanApproval?:boolean;serviceScopeVerified?:boolean};
export type Verdict='allow'|'deny'|'approval_required';
export function proposedAccess(request:AccessRequest):Verdict{
 const {role,action,identityVerified,ownershipVerified,assignmentVerified,humanApproval,serviceScopeVerified}=request;
 if(action==='view_public_catalog')return 'allow';
 if(!identityVerified)return 'deny';
 if(role==='public')return 'deny';
 if(role==='student')return action==='view_own_enrollment'&&ownershipVerified===true?'allow':'deny';
 if(role==='educator')return ['view_own_course','edit_own_course_draft','view_scoped_crm'].includes(action)&&ownershipVerified===true?'allow':'deny';
 if(role==='doctor')return action==='view_own_clinical_roster'&&assignmentVerified===true?'allow':'deny';
 if(role==='staff')return action==='view_scoped_crm'&&assignmentVerified===true?'allow':'deny';
 if(role==='service_agent'){
  if(!serviceScopeVerified)return 'deny';
  return action==='draft_internal_job'?'allow':'deny';
 }
 if(role==='founder'){
  if(['send_email','publish','charge_payment','deploy'].includes(action))return humanApproval?'allow':'approval_required';
  return 'allow';
 }
 return 'deny';
}
