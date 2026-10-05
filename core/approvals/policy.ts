export type Permission = 'allow'|'approval_required'|'deny';

export function authorize(permission: Permission) {
  if (permission === 'deny') return { execute:false, approval:false, reason:'Skill denied for this agent' };
  if (permission === 'approval_required') return { execute:false, approval:true, reason:'Human approval required' };
  return { execute:true, approval:false, reason:'Authorized' };
}
