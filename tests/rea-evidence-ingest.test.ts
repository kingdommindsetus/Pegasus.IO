import assert from 'node:assert/strict';
import {test} from 'node:test';
import {summarizeReaRegistrationEvidence,compareReaRouteEvidence} from '../core/integrations/reaEvidenceIngest.js';
const fileHash='a'.repeat(64),rootHash='b'.repeat(64);
function sample(registration:string){
 const node=(value:string,role:string,line:number)=>({
  kind:'literal',identity:{artifact_sha256:fileHash,module_path:'main.js',role_key:role},
  properties:{value},evidence:{location:{available:true,value:{source:'main.js',start:{line}}}}
 });
 return {evidence_id:'ev_'+'c'.repeat(64),operation:'analyze_javascript_application',
  provider:{id:'rea-javascript-application'},subject:{digest:{sha256:rootHash}},
  normalized_result:{root_artifact_sha256:rootHash,semantic_graph:{nodes:[
   node(registration,'binding:navigation:property:/registration:',2),
   node('/events/register','binding:declaredPages:property:/2:',3),
   node('/events','binding:declaredPages:property:/1:',3)
  ]}}};
}
test('REA derived route evidence creates review-only regression receipt',()=>{
 const baseline=summarizeReaRegistrationEvidence(sample('/events/register'),fileHash);
 const candidate=summarizeReaRegistrationEvidence(sample('/events/register-missing'),fileHash);
 assert.equal(baseline.brokenRoute,false);
 assert.equal(candidate.brokenRoute,true);
 assert.equal(candidate.registration.line,2);
 assert.equal(candidate.reviewState,'pending_human_review');
 assert.throws(()=>compareReaRouteEvidence(baseline,candidate),/no verified synthetic route regression/);
 // A genuine before/after comparison must have different source fingerprints.
 const c=sample('/events/register-missing');
 c.normalized_result.semantic_graph.nodes.forEach((n:any)=>n.identity.artifact_sha256='d'.repeat(64));
 const changed=summarizeReaRegistrationEvidence(c,'d'.repeat(64));
 const diff=compareReaRouteEvidence(baseline,changed);
 assert.equal(diff.expectedRoute,'/events/register');assert.equal(diff.observedRoute,'/events/register-missing');
 assert.equal(diff.decision,'human_review_required');assert.equal(diff.externalActionsExecuted,false);
});
test('REA provenance must include matched application, source and precise lines',()=>{
 const denied=[
  (()=>{const x=sample('/events/register');x.provider.id='unknown';return x})(),
  (()=>{const x=sample('/events/register');x.normalized_result.root_artifact_sha256='d'.repeat(64);return x})(),
  (()=>{const x=sample('/events/register');x.normalized_result.semantic_graph.nodes[0].identity.artifact_sha256='d'.repeat(64);return x})(),
  (()=>{const x=sample('/events/register');x.normalized_result.semantic_graph.nodes[0].evidence.location.value.start.line=0;return x})(),
  (()=>{const x=sample('/events/register');x.normalized_result.semantic_graph.nodes=[] as any;return x})()
 ];
 for(const item of denied)assert.throws(()=>summarizeReaRegistrationEvidence(item,fileHash),/REA_EVIDENCE_DENIED/);
 assert.throws(()=>summarizeReaRegistrationEvidence(null,fileHash),/REA_EVIDENCE_DENIED/);
});
