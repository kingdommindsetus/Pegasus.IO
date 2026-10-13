/**
 * Explicit, isolated REA result acceptance. Run manually; not part of default unit suite.
 * Reads ONLY the verified synthetic analysis outputs and corresponding synthetic samples.
 * Does not launch REA, modify Pegasus DB or dispatch any action.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {summarizeReaRegistrationEvidence,compareReaRouteEvidence} from '../core/integrations/reaEvidenceIngest.js';
const LAB='C:/Users/info/PegasusVoiceEngine/acceptance-isolated/rea-lab-20261013';
function load(variant:'baseline'|'candidate'){
 const bytes=readFileSync(join(LAB,'results',variant+'.json'));
 // Windows PowerShell 5.1 redirects stdout as UTF-16LE with a BOM.
 const contents=bytes[0]===0xff&&bytes[1]===0xfe?
   bytes.toString('utf16le').replace(/^\uFEFF/,''):bytes.toString('utf8').replace(/^\uFEFF/,'');
 const json=JSON.parse(contents);
 const js=readFileSync(join(LAB,'samples',variant,'main.js'));
 const sourceHash=createHash('sha256').update(js).digest('hex');
 return summarizeReaRegistrationEvidence(json,sourceHash);
}
const baseline=load('baseline'),candidate=load('candidate');
const diff=compareReaRouteEvidence(baseline,candidate);
assert.equal(diff.candidateLocation.path,'main.js');
assert.equal(diff.candidateLocation.line,2);
assert.equal(diff.externalActionsAllowed,false);
assert.equal(diff.externalActionsExecuted,false);
assert.equal(candidate.declaredPages.some(x=>x.value===diff.expectedRoute),true);
console.log('REA_REAL_EVIDENCE_ACCEPTANCE',JSON.stringify({
 baselineEvidenceId:baseline.evidenceId,candidateEvidenceId:candidate.evidenceId,
 baselineSha256:baseline.sourceArtifactSha256,candidateSha256:candidate.sourceArtifactSha256,
 baselineBroken:baseline.brokenRoute,candidateBroken:candidate.brokenRoute,
 regression:diff,reaRuntimeUsedForSourceRecords:true,
 externalActionsExecuted:false,
}));
