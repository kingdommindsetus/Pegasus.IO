import React from 'react';
import { Activity, ArrowLeft, BrainCircuit, Database, Eye, Film, LockKeyhole, ShieldCheck, Workflow } from 'lucide-react';
import {CAPABILITY_REGISTRY} from '../../core/integrations/capabilityRegistry';
import {GodsEyeLocalEvidencePanel} from './GodsEyeLocalEvidencePanel';
import {GodsEyeFounderActivityPanel} from './GodsEyeFounderActivityPanel';

const definitions:Record<string,{name:string,detail:string,owner:string}> = {
 pegasus:{name:'PEGASUS CORE',detail:'Canonical identities, jobs, durable evidence and approval rules',owner:'Simon'},
 gods_eye:{name:"GOD'S EYE",detail:'Organization-scoped founder activity tested in an isolated database; not deployed',owner:'Founder'},
 paperclip:{name:'PAPERCLIP',detail:'Optional agent-management adapter; not installed or connected',owner:'Marie / Simon'},
 astra:{name:'ASTRA',detail:'Isolated source-grounded knowledge drafts',owner:'Simon'},
 rea:{name:'REA',detail:'Actual synthetic JavaScript analysis verified; production adapter not enabled',owner:'IRIS'},
 openmontage:{name:'OPENMONTAGE',detail:'Video storyboard contract only; no renders yet',owner:'Tube'},
 openclaw:{name:'OPENCLAW',detail:'Execution runtime blocked pending isolation review',owner:'Pegasus'},
 redis:{name:'REDIS',detail:'Optional signaling contract only; no server connected',owner:'Pegasus'},
 playwright:{name:'PLAYWRIGHT',detail:'Browser QA pilot not enabled',owner:'Alice'},
 n8n:{name:'n8n',detail:'Optional internal integration layer; not enabled',owner:'Marie'},
 dify:{name:'DIFY',detail:'Optional knowledge workflow layer; not enabled',owner:'Astra'},
};
const statuses:Record<string,{label:string,classes:string}>={
 existing_core:{label:'Existing core',classes:'border-emerald-500/40 text-emerald-300 bg-emerald-900/20'},
 synthetic_verified:{label:'Lab verified',classes:'border-emerald-500/40 text-emerald-300 bg-emerald-900/20'},
 isolated_prototype:{label:'Isolated prototype',classes:'border-sky-500/40 text-sky-300 bg-sky-900/20'},
 planning_only:{label:'Planning only',classes:'border-amber-500/40 text-amber-300 bg-amber-900/20'},
 read_model_planned:{label:'Read model planned',classes:'border-amber-500/40 text-amber-300 bg-amber-900/20'},
 not_enabled:{label:'Not enabled',classes:'border-slate-700 text-slate-300 bg-slate-800/20'},
};
export function GodsEyeLabDashboard(){
 return <div className="min-h-screen bg-[#080b12] text-white p-5 sm:p-9 font-sans">
  <div className="mx-auto max-w-6xl space-y-7">
   <header className="flex flex-wrap items-start justify-between gap-4">
    <div>
     <div className="flex items-center gap-2 text-xs font-bold tracking-[.24em] text-amber-300"><Eye size={17}/> PEGASUS / LAB</div>
     <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">GOD'S EYE <span className="text-amber-300">COMMAND FLOOR</span></h1>
     <p className="mt-2 max-w-3xl text-sm text-slate-400">Architecture preview. Capabilities below are pulled from the code registry, not a live operational feed.</p>
    </div>
    <div className="flex flex-wrap gap-2"><a href="/?build-board=1" className="flex items-center gap-2 rounded-xl border border-amber-700/40 px-4 py-2 text-sm font-bold text-amber-200 hover:bg-amber-900/20">Build Taskboard</a><a href="/" className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900"><ArrowLeft size={15}/> Return to Pegasus</a></div>
   </header>
   <div className="grid gap-3 sm:grid-cols-3">
    <div className="rounded-2xl border border-slate-800 bg-[#101623] p-5">
     <ShieldCheck className="mb-3 text-amber-300" size={21}/>
     <div className="text-xs uppercase tracking-wider text-slate-400">Execution authority</div>
     <div className="mt-1 font-semibold">Pegasus only</div>
    </div>
    <div className="rounded-2xl border border-slate-800 bg-[#101623] p-5">
     <Database className="mb-3 text-amber-300" size={21}/>
     <div className="text-xs uppercase tracking-wider text-slate-400">Durable system of record</div>
     <div className="mt-1 font-semibold">PostgreSQL / Neon</div>
    </div>
    <div className="rounded-2xl border border-amber-600/30 bg-[#17140d] p-5">
     <LockKeyhole className="mb-3 text-amber-300" size={21}/>
     <div className="text-xs uppercase tracking-wider text-slate-400">Live founder activity feed</div>
     <div className="mt-1 font-semibold text-amber-200">Production not connected</div>
    </div>
   </div>
   <GodsEyeFounderActivityPanel />
   <GodsEyeLocalEvidencePanel />
   <div className="flex items-center gap-3">
    <Workflow className="text-amber-300" size={20}/>
    <h2 className="text-xl font-bold">Capability family</h2>
    <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-400">{Object.keys(CAPABILITY_REGISTRY).length} modules</span>
   </div>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {(Object.entries(CAPABILITY_REGISTRY) as [keyof typeof CAPABILITY_REGISTRY,(typeof CAPABILITY_REGISTRY)[keyof typeof CAPABILITY_REGISTRY]][]).map(([id,capability])=>{
     const x=definitions[id],status=statuses[capability.mode];
     return <article key={id} className="rounded-2xl border border-slate-800 bg-[#101623] p-5 hover:border-slate-700">
      <div className="flex items-start justify-between gap-2">
       {id==='openmontage'?<Film size={21} className="text-amber-300"/>:id==='astra'?<BrainCircuit size={21} className="text-amber-300"/>:<Activity size={21} className="text-amber-300"/>}
       <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${status.classes}`}>{status.label}</span>
      </div>
      <h3 className="mt-4 text-base font-bold">{x.name}</h3>
      <p className="mt-1 min-h-12 text-xs leading-relaxed text-slate-400">{x.detail}</p>
      <div className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-500">Owner: <span className="text-slate-300">{x.owner}</span></div>
     </article>;
    })}
   </div>
   <section className="rounded-2xl border border-amber-700/30 bg-[#13151b] p-5">
    <div className="flex gap-3"><LockKeyhole className="shrink-0 text-amber-300" size={19}/><div>
     <h2 className="font-bold text-amber-200">Verified lab ≠ live operations</h2>
     <p className="mt-1 text-sm text-slate-400">REA has real synthetic analysis evidence. Tube has a zero-cost OpenMontage planning contract. Redis messages, video renders, live agent handoffs, and external actions remain disabled. No customer metrics are displayed without an authenticated database reader.</p>
    </div></div>
   </section>
  </div>
 </div>;
}
