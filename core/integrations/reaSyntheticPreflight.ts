/**
 * Fixture-only static preflight for the REA integration design.
 * REA is NOT invoked. This recognizes two controlled synthetic fixture shapes,
 * not arbitrary JS: a real REA analysis engine will replace it after sandboxing.
 */
import {createHash} from 'node:crypto';
import {lstatSync,readFileSync,realpathSync} from 'node:fs';
import {join,resolve,sep} from 'node:path';

export type SyntheticVariant='baseline'|'candidate';
export type SyntheticPreflight={variant:SyntheticVariant;artifactSha256:string;
 declaredPages:string[];registrationTarget:string|null;issues:string[];
 parseOnly:true;externalActionsExecuted:false;reaRuntimeUsed:false};
const FIXTURES=resolve(process.cwd(),'tests','fixtures','rea-synthetic-kmce-app');
function readSyntheticSource(variant:SyntheticVariant):string{
 if(variant!=='baseline'&&variant!=='candidate')throw Error('REA_PREFLIGHT_DENIED: unapproved fixture');
 const root=join(FIXTURES,variant),file=join(root,'main.js');
 for(const name of [FIXTURES,root,file])if(lstatSync(name).isSymbolicLink())
   throw Error('REA_PREFLIGHT_DENIED: symlink');
 const canonicalRoot=realpathSync(FIXTURES),canonicalFile=realpathSync(file);
 if(!canonicalFile.startsWith(canonicalRoot+sep))throw Error('REA_PREFLIGHT_DENIED: path outside fixture');
 if(!lstatSync(file).isFile()||lstatSync(file).size>4096)throw Error('REA_PREFLIGHT_DENIED: invalid fixture size');
 return readFileSync(file,'utf8');
}
function parseControlledFixture(input:string):{registrationTarget:string|null;declaredPages:string[]}{
 const nav=input.match(/export\s+const\s+navigation\s*=\s*\{([^{}]*)\}\s*;/);
 const route=nav?.[1]?.match(/(?:^|,)\s*registration\s*:\s*(['"])(\/[^'"]+)\1\s*(?:,|$)/);
 const pages=input.match(/export\s+const\s+declaredPages\s*=\s*\[([^\]]*)\]\s*;/);
 const declaredPages=pages?[...pages[1].matchAll(/(['"])(\/[^'"]+)\1/g)].map(m=>m[2]):[];
 return {registrationTarget:route?.[2]||null,declaredPages};
}
export function inspectSyntheticRegistration(variant:SyntheticVariant):SyntheticPreflight{
 const input=readSyntheticSource(variant);
 const {registrationTarget,declaredPages}=parseControlledFixture(input);
 const issues:string[]=[];
 if(!registrationTarget)issues.push('registration_cta_missing');
 if(declaredPages.length===0)issues.push('declared_pages_missing');
 if(registrationTarget&&!declaredPages.includes(registrationTarget))
   issues.push('registration_cta_points_to_missing_route');
 return {variant,artifactSha256:createHash('sha256').update(input).digest('hex'),
   declaredPages,registrationTarget,issues,parseOnly:true,
   externalActionsExecuted:false,reaRuntimeUsed:false};
}
export function compareSyntheticRegistration():{baseline:SyntheticPreflight;candidate:SyntheticPreflight;
 regressionDetected:boolean;reviewRequired:true}{
 const baseline=inspectSyntheticRegistration('baseline');
 const candidate=inspectSyntheticRegistration('candidate');
 if(baseline.issues.length)throw Error('REA_PREFLIGHT_DENIED: known-good baseline invalid');
 if(baseline.artifactSha256===candidate.artifactSha256)throw Error('REA_PREFLIGHT_DENIED: same artifact');
 return {baseline,candidate,regressionDetected:candidate.issues.includes('registration_cta_points_to_missing_route'),reviewRequired:true};
}
