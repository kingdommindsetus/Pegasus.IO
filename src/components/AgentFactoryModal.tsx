import React,{useMemo,useState} from 'react';
import { X,Play,Square,Sparkles } from 'lucide-react';
import { AvatarFace } from './AvatarFace';
import { AGENTS,AgentDefinition } from '../data/agents';
import { speakAgent,stopAllAudio } from '../utils/audio';

const VOICES=[
 ['cedar','Executive / grounded'],['marin','Warm / polished'],['shimmer','Bright / social'],
 ['verse','Confident / modern'],['coral','Energetic / warm'],['ash','Calm / clear'],
 ['echo','Direct / crisp'],['onyx','Deep / analytical'],['nova','Professional / friendly'],
 ['alloy','Balanced / versatile'],['fable','Expressive / conversational']
] as const;

export type CustomAgent={id:string;name:string;role:string;job:string;color:string;voice:string;department:string;client:string;objective:string};

export function AgentFactoryModal({open,onClose,onCreate}:{open:boolean;onClose:()=>void;onCreate:(a:CustomAgent)=>void}){
 const [name,setName]=useState(''); const [role,setRole]=useState('');
 const [job,setJob]=useState(''); const [department,setDepartment]=useState('');
 const [client,setClient]=useState(''); const [objective,setObjective]=useState('');
 const [color,setColor]=useState('#7C3AED'); const [voice,setVoice]=useState('marin');
 const [speaking,setSpeaking]=useState(false);
 const preview=useMemo(()=>({...AGENTS[0],id:'custom-preview',name:name||'NEW AGENT',department:department||role||'Specialist'}) as AgentDefinition,[name,department,role]);
 if(!open)return null;
 const sample=`Hello. I'm ${name||'your new Pegasus specialist'}. My role is ${role||'to support this objective'}.`;
 const audition=()=>{stopAllAudio();setSpeaking(true);fetch('/api/agent/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({agentId:'simon',text:sample,voiceOverride:voice})}).then(r=>r.json()).then(x=>{if(!x.audioUrl)throw Error('No audio');const a=new Audio(x.audioUrl);a.onended=()=>setSpeaking(false);a.onerror=()=>setSpeaking(false);a.play();}).catch(()=>{speakAgent(sample,'simon',AGENTS[0].voiceConfig,true,()=>setSpeaking(true),()=>setSpeaking(false));});};
 const create=()=>{if(!name.trim()||!role.trim()||!job.trim())return;onCreate({id:'custom-'+Date.now(),name:name.trim(),role:role.trim(),job:job.trim(),department:department.trim(),client:client.trim(),objective:objective.trim(),color,voice});onClose();};
 return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/85 p-4 backdrop-blur-md">
  <div className="w-full max-w-4xl rounded-3xl border border-cyan-500/20 bg-slate-950 shadow-2xl shadow-cyan-950/60">
   <div className="flex items-center justify-between border-b border-slate-800 p-5"><div><div className="text-[10px] font-mono tracking-[.3em] text-cyan-400">PEGASUS AGENT FACTORY</div><h2 className="text-2xl font-black">Build a Specialist</h2></div><button onClick={onClose}><X/></button></div>
   <div className="grid gap-6 p-6 md:grid-cols-[1fr_1.35fr]">
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-center">
     <AvatarFace agent={preview} isSpeaking={speaking} size="xl" customColor={color}/>
     <div className="mt-3 text-xl font-bold">{name||'New Specialist'}</div><div className="text-sm text-cyan-300">{role||'Choose a role'}</div>
     <button onClick={speaking?()=>{stopAllAudio();setSpeaking(false)}:audition} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">{speaking?<Square size={15}/>:<Play size={15}/>} {speaking?'Stop':'Play Voice Sample'}</button>
    </div>
    <div className="space-y-4">
     <div className="grid grid-cols-2 gap-3"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Agent name" className="rounded-xl border border-slate-700 bg-slate-900 p-3"/><input value={role} onChange={e=>setRole(e.target.value)} placeholder="Role" className="rounded-xl border border-slate-700 bg-slate-900 p-3"/></div>
     <input value={department} onChange={e=>setDepartment(e.target.value)} placeholder="Department / client team (optional)" className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3"/>
     <div className="grid grid-cols-2 gap-3"><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Client / workspace" className="rounded-xl border border-slate-700 bg-slate-900 p-3"/><input value={objective} onChange={e=>setObjective(e.target.value)} placeholder="Assign objective" className="rounded-xl border border-slate-700 bg-slate-900 p-3"/></div>
     <textarea value={job} onChange={e=>setJob(e.target.value)} placeholder="What exactly is this agent responsible for?" rows={4} className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3"/>
     <div><label className="text-xs font-bold text-slate-300">ORB COLOR</label><div className="mt-2 flex gap-3"><input type="color" value={color} onChange={e=>setColor(e.target.value.toUpperCase())} className="h-11 w-16 rounded bg-transparent"/><input value={color} onChange={e=>/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)&&setColor(e.target.value.toUpperCase())} className="flex-1 rounded-xl border border-slate-700 bg-slate-900 p-3 font-mono"/></div></div>
     <div><label className="text-xs font-bold text-slate-300">VOICE</label><div className="mt-2 grid grid-cols-2 gap-2">{VOICES.map(([v,label])=><button key={v} onClick={()=>setVoice(v)} className={'rounded-xl border p-2 text-left text-xs '+(voice===v?'border-cyan-400 bg-cyan-500/15 text-white':'border-slate-800 bg-slate-900 text-slate-400')}><b className="block capitalize">{v}</b>{label}</button>)}</div></div>
     <button disabled={!name.trim()||!role.trim()||!job.trim()} onClick={create} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 disabled:opacity-30"><Sparkles size={17}/> CREATE AGENT</button>
    </div>
   </div>
  </div>
 </div>;
}
