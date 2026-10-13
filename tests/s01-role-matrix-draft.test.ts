import {test} from 'node:test';
import assert from 'node:assert/strict';
import {proposedAccess,type UserRole,type AccessAction} from '../core/approvals/roleMatrixDraft.js';
const roles:UserRole[]=['founder','staff','educator','doctor','student','public','service_agent'];
const actions:AccessAction[]=['view_own_enrollment','view_own_course','edit_own_course_draft','view_own_clinical_roster','view_scoped_crm','view_company_revenue','edit_company_settings','approve_external_action','draft_internal_job','send_email','publish','charge_payment','deploy'];
test('all roles permit public catalog',()=>{for(const role of roles)assert.equal(proposedAccess({role,action:'view_public_catalog',identityVerified:false}),'allow')});
test('unverified identity denied all privileged actions',()=>{for(const role of roles)for(const action of actions)assert.equal(proposedAccess({role,action,identityVerified:false}),'deny')});
test('student only own enrollment',()=>{assert.equal(proposedAccess({role:'student',action:'view_own_enrollment',identityVerified:true,ownershipVerified:true}),'allow');assert.equal(proposedAccess({role:'student',action:'view_own_enrollment',identityVerified:true,ownershipVerified:false}),'deny')});
test('educator ownership and doctor/staff assignment required',()=>{
 for(const [role,action,scope] of [['educator','view_own_course','ownershipVerified'],['doctor','view_own_clinical_roster','assignmentVerified'],['staff','view_scoped_crm','assignmentVerified']] as const){
  assert.equal(proposedAccess({role,action,identityVerified:true,[scope]:false}),'deny');
  assert.equal(proposedAccess({role,action,identityVerified:true,[scope]:true}),'allow');
 }
});
test('service agents cannot perform outbound actions',()=>{
 for(const action of ['send_email','publish','charge_payment','deploy','approve_external_action'] as const)
 assert.equal(proposedAccess({role:'service_agent',action,identityVerified:true,serviceScopeVerified:true}),'deny');
 assert.equal(proposedAccess({role:'service_agent',action:'draft_internal_job',identityVerified:true,serviceScopeVerified:true}),'allow');
});
test('founder outbound changes require human approval',()=>{
 for(const action of ['send_email','publish','charge_payment','deploy'] as const){
  assert.equal(proposedAccess({role:'founder',action,identityVerified:true}),'approval_required');
  assert.equal(proposedAccess({role:'founder',action,identityVerified:true,humanApproval:true}),'allow');
 }
});
test('educator and student denied company revenue and settings',()=>{
 for(const role of ['educator','student','doctor','staff','service_agent'] as const)
 for(const action of ['view_company_revenue','edit_company_settings'] as const)
 assert.equal(proposedAccess({role,action,identityVerified:true,ownershipVerified:true,assignmentVerified:true,serviceScopeVerified:true}),'deny');
});
