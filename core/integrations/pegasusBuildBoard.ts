/**
 * Static engineering evidence board. Labels describe what has been verified
 * on the feature branch, NOT what is deployed/online. No DB, network or model calls.
 * Change status ONLY alongside an explicit acceptance receipt.
 */
export const BOARD_UPDATED_AT='2026-10-13' as const;
export const BOARD_VERSION='pegasus-build-board-v1' as const;
export const BOARD_STATES=['verified_lab','existing_unverified','in_progress','blocked','queued','deferred'] as const;
export type BoardState=typeof BOARD_STATES[number];
export type Priority='P0'|'P1'|'P2'|'P3';
export type BuildMilestone={
 id:string;title:string;owner:string;priority:Priority;status:BoardState;
 phase:'foundation'|'make_it_work'|'expansion';
 acceptance:string;nextAction:string;blocker:string|null;
 proof:string|null;customerFacing:boolean;
};
export const PEGASUS_BUILD_MILESTONES:readonly BuildMilestone[]=[
 {id:'foundation',title:'Canonical Pegasus jobs & agent identity',owner:'Simon / Marie',
 priority:'P0',status:'existing_unverified',phase:'foundation',
 acceptance:'Fresh isolated PostgreSQL run proves claim, lease, review, evidence, restart recovery and durable handoff.',
 nextAction:'Finish isolated Astra/PostgreSQL acceptance; keep existing agent brains and voices unchanged.',
 blocker:'Isolated database acceptance was blocked by prior connection controls.',
 proof:'core/work/jobs; tests/astra-worker-isolation.test.ts (offline only)',customerFacing:false},
 {id:'rea',title:'REA evidence ingestion',owner:'IRIS / Alice',
 priority:'P1',status:'verified_lab',phase:'foundation',
 acceptance:'Real REA source analysis detects synthetic registration regression and is validated by Pegasus.',
 nextAction:'Extend from synthetic bundles to approved staging output; require Alice browser verification.',
 blocker:null,proof:'dbdcf1b; tests/rea-real-lab-acceptance.ts',customerFacing:false},
 {id:'capability',title:'Capability policy + video planning',owner:'Simon / Tube',
 priority:'P1',status:'verified_lab',phase:'foundation',
 acceptance:'Synthetic-only REA and Tube signals pass review-gated tests, without executing tools.',
 nextAction:'Connect actual read-only job receipts to a durable, authorized job pipeline.',
 blocker:null,proof:'278d06f; tests/pegasus-capability-real-evidence-acceptance.ts',customerFacing:false},
 {id:'godseye',title:"God's Eye verified activity feed",owner:'Simon / Founder',
 priority:'P0',status:'in_progress',phase:'make_it_work',
 acceptance:'Signed-in founder sees actual scoped PostgreSQL job, run and evidence records with accurate timestamps; cannot mutate.',
 nextAction:'Build and test a permission-scoped read-only API against an isolated database.',
 blocker:'Authentication scope and database acceptance not yet verified for this feature.',
 proof:'src/components/GodsEyeLabDashboard.tsx (static view only)',customerFacing:false},
 {id:'real-job',title:'First genuine end-to-end agent task',owner:'Marie / Simon',
 priority:'P0',status:'blocked',phase:'make_it_work',
 acceptance:'Create → claim → execute allowed task → persist result/evidence → review → Simon close → reload from PostgreSQL → God\'s Eye.',
 nextAction:'Run controlled isolated database test and wire evidence feed; never let a synthetic signal claim real completion.',
 blocker:'Authenticated read path and isolated DB acceptance missing.',
 proof:null,customerFacing:false},
 {id:'kmce',title:'KMCE verified commercial workflow',owner:'Doc / Echo / Booker / Simon',
 priority:'P0',status:'existing_unverified',phase:'make_it_work',
 acceptance:'Synthetic educator or lead journey passes intake, assignment, approved communications, schedule/seat state and reconciled transaction checks.',
 nextAction:'Audit existing KMCE integration and reproduce staging acceptance without charging or sending live messages.',
 blocker:'End-to-end payment, email, calendar and CRM reconciliation not reverified in this build.',
 proof:'kingdommindsetus/kmce-educator-platform (separate app)',customerFacing:true},
 {id:'paperclip',title:'Paperclip agent-management adapter',owner:'Marie / Simon',
 priority:'P2',status:'queued',phase:'expansion',
 acceptance:'Single synthetic Pegasus task mirrors into Paperclip and back with stable correlation ID, auth, no duplicate scheduler or approvals.',
 nextAction:'Audit pinned Paperclip version, Node requirements, license, storage and heartbeat API in an isolated environment.',
 blocker:'No Paperclip installation or running process verified in searched KINGDOM locations.',
 proof:'https://github.com/paperclipai/paperclip',customerFacing:false},
 {id:'playwright',title:'Playwright storefront QA',owner:'Alice / IRIS',
 priority:'P1',status:'queued',phase:'make_it_work',
 acceptance:'Chrome staging script catches broken registration paths, collects screenshots/traces, and stores an auditable review result.',
 nextAction:'Use approved staging domain and synthetic accounts with no charges.',
 blocker:'Browser QA harness and staging authorization not set up.',
 proof:'https://github.com/microsoft/playwright',customerFacing:false},
 {id:'openmontage',title:'Tube video render pipeline',owner:'Tube / Evan',
 priority:'P2',status:'queued',phase:'expansion',
 acceptance:'Synthetic storyboard produces local rendered MP4, reusable checkpoints and review receipt; nothing automatically publishes.',
 nextAction:'Provision isolated rendering toolchain after memory and licensing review.',
 blocker:'No renderer installed and RAM insufficient for more heavy services.',
 proof:'OpenMontage planning receipt from 278d06f',customerFacing:false},
 {id:'redis',title:'Redis optional wake-up channel',owner:'Marie / Engineering',
 priority:'P3',status:'deferred',phase:'expansion',
 acceptance:'Transactional outbox survives restart, deduplicates hints, and always reloads PostgreSQL before execution.',
 nextAction:'Do not add Redis until PostgreSQL-only task loop is proven and additional RAM is available.',
 blocker:'KINGDOM free RAM low; no Redis server found.',
 proof:'makeRedisWakeupHint in pegasusCapabilityFabric.ts (not published)',customerFacing:false},
 {id:'openclaw',title:'OpenClaw isolated execution worker',owner:'Simon / Gatekeeper',
 priority:'P3',status:'deferred',phase:'expansion',
 acceptance:'Health-only sidecar on compatible Node in separate security identity passes permission denial, sandbox and rollback tests.',
 nextAction:'Resolve Node and OS-isolation requirements; never expose a full-authority Gateway to users.',
 blocker:'KINGDOM Node 24.12.0 below uploaded OpenClaw engine requirement; memory and isolation gates unmet.',
 proof:'aca5ca9; tests/openclaw-lab-readiness.test.ts',customerFacing:false},
 {id:'n8n-dify',title:'n8n + Dify optional internal tools',owner:'Marie / Astra',
 priority:'P3',status:'deferred',phase:'expansion',
 acceptance:'One isolated internal workflow with no duplicate authority, safe credentials and licensing reviewed.',
 nextAction:'Revisit after task loop and KMCE revenue workflow verification.',
 blocker:'Potential duplicate orchestration and hosting/licensing costs.',
 proof:'Uploaded source audits; no deployed service verified',customerFacing:false},
];
const unique=(xs:readonly string[])=>new Set(xs).size===xs.length;
export function validateBuildBoard(milestones:readonly BuildMilestone[]=PEGASUS_BUILD_MILESTONES){
 if(!unique(milestones.map(x=>x.id)))throw Error('BUILD_BOARD_INVALID: duplicate task ID');
 for(const x of milestones){
  if(!x.id||!x.title||!x.owner||!x.acceptance||!x.nextAction||
     !BOARD_STATES.includes(x.status)||!['P0','P1','P2','P3'].includes(x.priority)||
     (x.status==='verified_lab'&&!x.proof)||
     (x.status==='blocked'&&!x.blocker))
    throw Error('BUILD_BOARD_INVALID: incomplete or ungrounded milestone');
 }
 return true;
}
export function buildBoardSnapshot(milestones:readonly BuildMilestone[]=PEGASUS_BUILD_MILESTONES){
 validateBuildBoard(milestones);
 const counts=Object.fromEntries(BOARD_STATES.map(state=>[state,milestones.filter(x=>x.status===state).length])) as Record<BoardState,number>;
 return {version:BOARD_VERSION,updatedAt:BOARD_UPDATED_AT,mode:'engineering_tracking_not_live' as const,
  total:milestones.length,counts,priorityLaunchGates:milestones.filter(x=>x.priority==='P0'),
  verifiedLabOnly:counts.verified_lab,productionGoLiveVerified:false as const,
  milestoneCount:milestones.length};
}
