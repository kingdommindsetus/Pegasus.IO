import React,{useMemo,useState} from 'react';
import {ArrowLeft,CheckCircle2,Clock3,ClipboardList,ExternalLink,LockKeyhole,ShieldAlert,ShieldCheck} from 'lucide-react';
import {BOARD_UPDATED_AT,PEGASUS_BUILD_MILESTONES,buildBoardSnapshot} from '../../core/integrations/pegasusBuildBoard';
import {PEGASUS_LAUNCH_GATES,launchProgress} from '../../core/integrations/pegasusLaunchGates';
import type {BoardState,Priority} from '../../core/integrations/pegasusBuildBoard';
const colors:Record<BoardState,string>={
 verified_lab:'border-emerald-700/50 bg-emerald-950/30 text-emerald-300',
 existing_unverified:'border-sky-700/50 bg-sky-950/30 text-sky-300',
 in_progress:'border-amber-700/50 bg-amber-950/30 text-amber-200',
 blocked:'border-rose-700/50 bg-rose-950/30 text-rose-200',
 queued:'border-slate-600 bg-slate-900 text-slate-300',
 deferred:'border-slate-800 bg-slate-950 text-slate-500',
};
const labels:Record<BoardState,string>={
 verified_lab:'Verified in lab',existing_unverified:'Exists · recheck needed',
 in_progress:'Building',blocked:'Blocked',queued:'Next queue',deferred:'Later'
};
const phaseLabels={foundation:'Verified foundations',make_it_work:'Make it actually work',expansion:'Optional enhancements'};
const phases=['foundation','make_it_work','expansion'] as const;
export function PegasusBuildBoard(){
 const [statusFilter,setStatusFilter]=useState<'all'|BoardState>('all');
 const [onlyP0,setOnlyP0]=useState(false);
 const [expanded,setExpanded]=useState<string|null>('real-job');
 const summary=useMemo(()=>buildBoardSnapshot(),[]);
 const entries=PEGASUS_BUILD_MILESTONES.filter(x=>
  (statusFilter==='all'||x.status===statusFilter)&&(!onlyP0||x.priority==='P0'));
 const launch=useMemo(()=>launchProgress(),[]);
 const progress=launch.percent;
 return <div className="min-h-screen bg-[#080c14] text-white p-5 sm:p-9 font-sans">
  <div className="mx-auto max-w-6xl space-y-7">
   <header className="flex flex-wrap items-start justify-between gap-4">
    <div>
     <div className="flex items-center gap-2 text-xs font-extrabold tracking-[.22em] text-amber-300"><ClipboardList size={18}/> PEGASUS / ENGINEERING</div>
     <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">BUILD <span className="text-amber-300">TASKBOARD</span></h1>
     <p className="mt-2 max-w-3xl text-sm text-slate-400">Finish → Prove → Systemize → Scale. These statuses are curated from repository checks—not a live project-management sync.</p>
    </div>
    <div className="flex gap-2">
     <a href="/?gods-eye-lab=1" className="rounded-xl border border-amber-700/40 px-3 py-2 text-sm text-amber-200 hover:bg-amber-950/30">God's Eye <ExternalLink size={13} className="inline"/></a>
     <a href="/" className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"><ArrowLeft size={14} className="inline"/> Pegasus</a>
    </div>
   </header>
   <div className="grid gap-3 sm:grid-cols-4">
    <div className="rounded-2xl border border-slate-800 bg-[#101725] p-5">
     <CheckCircle2 size={21} className="mb-3 text-emerald-300"/>
     <div className="text-3xl font-bold">{summary.counts.verified_lab}<span className="text-base text-slate-500"> / {summary.total}</span></div>
     <div className="mt-1 text-xs text-slate-400">Milestones verified in lab</div>
    </div>
    <div className="rounded-2xl border border-slate-800 bg-[#101725] p-5">
     <Clock3 size={21} className="mb-3 text-amber-300"/>
     <div className="text-3xl font-bold">{summary.counts.in_progress}</div>
     <div className="mt-1 text-xs text-slate-400">Currently building</div>
    </div>
    <div className="rounded-2xl border border-slate-800 bg-[#101725] p-5">
     <ShieldAlert size={21} className="mb-3 text-rose-300"/>
     <div className="text-3xl font-bold">{summary.counts.blocked}</div>
     <div className="mt-1 text-xs text-slate-400">Blocked milestones</div>
    </div>
    <div className="rounded-2xl border border-amber-700/35 bg-[#1b1711] p-5">
     <LockKeyhole size={21} className="mb-3 text-amber-300"/>
     <div className="text-lg font-bold text-amber-200">NOT LAUNCH VERIFIED</div>
     <div className="mt-1 text-xs text-slate-400">Production acceptance remains required</div>
    </div>
   </div>
   <section className="rounded-2xl border border-slate-800 bg-[#101725] p-5">
    <div className="flex justify-between text-xs text-slate-400"><span>Fixed launch acceptance gates · {launch.completed}/{launch.total} verified</span><span data-testid="pegasus-launch-percent">{progress}%</span></div>
    <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
     <div className="h-full rounded-full bg-emerald-400" style={{width:`${progress}%`}}/>
    </div>
    <div className="mt-3 text-xs text-slate-500">Fixed ten-gate baseline reviewed {BOARD_UPDATED_AT}. This is acceptance checklist coverage, not business or production readiness. Production is NOT launched.</div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">{PEGASUS_LAUNCH_GATES.map(g=><div key={g.id} className="flex items-start gap-2 rounded-lg border border-slate-800 p-2 text-xs"><span className={g.passed?'text-emerald-300':'text-amber-300'}>{g.passed?'✓':'○'}</span><div><div className="font-semibold">{g.name}</div><div className="mt-1 text-slate-500">{g.proof||'Not yet verified'}</div></div></div>)}</div>
   </section>
   <div className="flex flex-wrap items-center gap-2">
    <label className="text-sm text-slate-400" htmlFor="pegasus-board-filter">Filter</label>
    <select id="pegasus-board-filter" value={statusFilter} onChange={e=>setStatusFilter(e.target.value as 'all'|BoardState)}
      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
     <option value="all">Every status</option>
     {Object.entries(labels).map(([id,label])=><option key={id} value={id}>{label}</option>)}
    </select>
    <label className="ml-2 flex items-center gap-2 text-sm text-slate-300">
     <input type="checkbox" checked={onlyP0} onChange={e=>setOnlyP0(e.target.checked)}/> Show launch-critical P0 only
    </label>
   </div>
   {phases.map(phase=>{
    const tasks=entries.filter(x=>x.phase===phase);
    return tasks.length===0?null:<section key={phase} className="space-y-3">
     <h2 className="text-xl font-bold">{phaseLabels[phase]}</h2>
     <div className="space-y-2">{tasks.map(task=>
      <article key={task.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-[#101725]">
       <button type="button" onClick={()=>setExpanded(expanded===task.id?null:task.id)}
        className="flex w-full flex-wrap items-center gap-3 p-4 text-left hover:bg-slate-900/60">
        <span className="rounded-md border border-slate-600 px-2 py-1 text-[10px] font-extrabold">{task.priority}</span>
        <span className="min-w-0 flex-1 text-sm font-bold sm:text-base">{task.title}</span>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${colors[task.status]}`}>{labels[task.status]}</span>
        <span className="text-xs text-slate-500">{expanded===task.id?'−':'+'}</span>
       </button>
       {expanded===task.id&&<div className="grid gap-3 border-t border-slate-800 p-4 text-sm sm:grid-cols-2">
        <div><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Owner</h3><p className="mt-1">{task.owner}</p></div>
        <div><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Next engineering move</h3><p className="mt-1">{task.nextAction}</p></div>
        <div><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Definition of done</h3><p className="mt-1">{task.acceptance}</p></div>
        <div><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Blocker / proof</h3><p className="mt-1 text-slate-300">{task.blocker||'No blocking dependency currently identified'}</p>{task.proof&&<p className="mt-2 break-words text-xs text-amber-200">Evidence: {task.proof}</p>}</div>
       </div>}
      </article>
     )}</div>
    </section>;
   })}
   <footer className="rounded-xl border border-amber-800/30 bg-[#19150f] p-4 text-sm text-amber-100/90">
    <div className="flex items-start gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0"/>
     <p>Paperclip is a P2 integration candidate—not a replacement for Pegasus. The next P0 engineering deliverable is a complete isolated job/evidence/approval loop and authenticated God's Eye feed. No deploy, revenue, message sends or customer access is implied by this board.</p>
    </div>
   </footer>
  </div>
 </div>;
}
