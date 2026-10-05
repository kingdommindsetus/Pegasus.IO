import React,{useEffect,useState} from 'react';
import { PREMIUM_AGENT_MODELS } from '../data/premiumAgentModels';
import { AGENTS } from '../data/agents';
import { speakAgent,stopAllAudio } from '../utils/audio';
import { AvatarFace } from './AvatarFace';

export function PremiumAgentGallery(){
 const [selectedId,setSelectedId]=useState(()=>{const q=window.location.hash.slice(1).toLowerCase();return PREMIUM_AGENT_MODELS.some(a=>a.id===q)?q:'simon';});
 const [speaking,setSpeaking]=useState(false); const [freq,setFreq]=useState<Uint8Array>();
 const selected=PREMIUM_AGENT_MODELS.find(a=>a.id===selectedId)??PREMIUM_AGENT_MODELS[0];
 const definition=AGENTS.find(a=>a.id===selected.id)!;
 useEffect(()=>()=>stopAllAudio(),[]);
 const testVoice=()=>{stopAllAudio();setFreq(undefined);speakAgent(definition.voiceConfig.samplePhrase,definition.id,definition.voiceConfig,true,()=>setSpeaking(true),()=>{setSpeaking(false);setFreq(undefined)},d=>setFreq(d));};
 const select=(id:string)=>{stopAllAudio();setSpeaking(false);setFreq(undefined);setSelectedId(id);window.location.hash=id;};
 return <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 md:px-8"><div className="mx-auto max-w-7xl">
  <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><div className="text-xs font-semibold tracking-[0.28em] text-cyan-400">PEGASUS VOICE ORB SYSTEM</div><h1 className="mt-2 text-4xl font-black tracking-tight text-white">{selected.name}</h1><p className="mt-1 text-slate-400">{selected.role}</p></div>
   <button onClick={speaking?()=>{stopAllAudio();setSpeaking(false);setFreq(undefined)}:testVoice} className="rounded-xl border border-cyan-400/50 bg-cyan-950/50 px-5 py-3 text-sm font-bold text-cyan-200 hover:bg-cyan-900/60">{speaking?'STOP VOICE':'TEST AGENT VOICE'}</button></div>
  <div className="relative grid h-[62vh] min-h-[480px] place-items-center overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-950 shadow-2xl shadow-cyan-950/40">
   <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,0.08),transparent_58%)]"/>
   <AvatarFace agent={definition} isSpeaking={speaking} frequencyData={freq} size="xl" showHud={false}/>
   <div className="absolute bottom-8 text-center"><div className="text-2xl font-black text-white">{definition.name}</div><div className="mt-1 text-xs font-mono tracking-[.24em] text-cyan-300">{speaking?'VOICE LINK ACTIVE':'AGENT ONLINE'}</div></div>
  </div>
  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{PREMIUM_AGENT_MODELS.map((a,i)=><button key={a.id} onClick={()=>select(a.id)} className={'rounded-xl border px-3 py-3 text-left transition '+(selected.id===a.id?'border-cyan-400 bg-cyan-950/50':'border-slate-800 bg-slate-900 hover:border-slate-600')}><div className="text-[10px] font-mono text-slate-500">{String(i+1).padStart(2,'0')}</div><div className="font-bold text-white">{a.name}</div><div className="truncate text-[11px] text-slate-400">{a.role}</div></button>)}</div>
 </div></main>;
}
export default PremiumAgentGallery;
