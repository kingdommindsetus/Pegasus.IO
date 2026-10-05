import React from 'react';
import { AgentDefinition } from '../data/agents';

interface AvatarFaceProps {
  agent: AgentDefinition; isSpeaking: boolean; frequencyData?: Uint8Array;
  size?: 'sm'|'md'|'lg'|'xl'; showHud?: boolean; customColor?: string;
}
const SIZE={sm:'w-16 h-16',md:'w-24 h-24',lg:'w-40 h-40',xl:'w-64 h-64'};
const ORBS:Record<string,[string,string,string]>={
 simon:['#22d3ee','#2563eb','#a5f3fc'],marie:['#a855f7','#ec4899','#f5d0fe'],
 iris:['#14b8a6','#06b6d4','#ccfbf1'],mark:['#f59e0b','#f97316','#fef3c7'],
 cammy:['#ec4899','#8b5cf6','#fce7f3'],evan:['#f97316','#ef4444','#ffedd5'],
 tube:['#8b5cf6','#3b82f6','#ede9fe'],lucy:['#facc15','#fb7185','#fef9c3'],
 snake:['#94a3b8','#22d3ee','#f1f5f9'],alice:['#2dd4bf','#10b981','#d1fae5'],
 echo:['#38bdf8','#6366f1','#e0f2fe'],booker:['#3b82f6','#0ea5e9','#dbeafe']
};

export const AvatarFace:React.FC<AvatarFaceProps>=({agent,isSpeaking,frequencyData,size='md',showHud=true,customColor})=>{
 const fallback=ORBS[agent.id]||ORBS.simon;
 const [a,b,c]=customColor?[customColor,customColor,'#ffffff']:fallback;
 const energy=isSpeaking&&frequencyData?.length?frequencyData.reduce((x,y)=>x+y,0)/(frequencyData.length*255):0;
 const scale=isSpeaking?1.06+energy*.16:1;
 const duration=isSpeaking?'.9s':'5.5s';
 return <div className={'pegasus-orb-stage relative grid place-items-center overflow-hidden rounded-2xl '+SIZE[size]}>
  <div className="absolute inset-[5%] rounded-full blur-2xl" style={{background:a,opacity:isSpeaking?.22:.09,transform:`scale(${isSpeaking?1.2:1})`}}/>
  <div className="pegasus-orb relative aspect-square w-[72%] rounded-full" style={{transform:`scale(${scale})`,boxShadow:`0 0 ${isSpeaking?52:24}px ${a}88,0 0 ${isSpeaking?96:50}px ${b}44`,transition:'transform 100ms linear, box-shadow 180ms ease'}}>
   <div className="absolute inset-0 rounded-full" style={{background:`radial-gradient(circle at 31% 24%,white 0%,${c} 5%,${a} 24%,${b} 58%,#020617 88%)`}}/>
   <div className="absolute inset-[5%] rounded-full opacity-80 mix-blend-screen" style={{background:`conic-gradient(from 40deg,${a},transparent 18%,${c},transparent 42%,${b},transparent 68%,${a})`,filter:'blur(9px)',animation:`pegasus-spin ${duration} linear infinite`}}/>
   <div className="absolute inset-[13%] rounded-full opacity-75 mix-blend-screen" style={{background:`conic-gradient(from 220deg,transparent,${c},transparent 35%,${a},transparent 70%)`,filter:'blur(13px)',animation:`pegasus-spin-reverse ${isSpeaking?'1.3s':'7s'} linear infinite`}}/>
   <div className="absolute inset-[24%] rounded-full bg-white/25 blur-xl" style={{boxShadow:`0 0 34px ${c}`}}/>
   <div className="absolute left-[23%] top-[16%] h-[18%] w-[24%] rotate-[-22deg] rounded-full bg-white/60 blur-lg"/>
   <div className="absolute inset-[2%] rounded-full border border-white/25"/>
   <div className="absolute inset-[8%] rounded-full border border-white/10"/>
   <div className="absolute inset-[18%] rounded-full border border-white/5"/>
   {isSpeaking&&<><div className="absolute -inset-[10%] rounded-full border animate-ping" style={{borderColor:a,opacity:.28}}/><div className="absolute -inset-[19%] rounded-full border animate-pulse" style={{borderColor:b,opacity:.18}}/></>}
  </div>
  {showHud&&<div className="pointer-events-none absolute bottom-1 left-1 rounded-full border border-white/10 bg-slate-950/75 px-2 py-.5 text-[7px] font-mono tracking-[.18em]" style={{color:c}}>{isSpeaking?'VOICE ACTIVE':agent.name.toUpperCase()}</div>}
  <style>{`@keyframes pegasus-spin{to{transform:rotate(360deg)}}@keyframes pegasus-spin-reverse{to{transform:rotate(-360deg)}}.pegasus-orb-stage{background:radial-gradient(circle at 50% 45%,rgba(34,211,238,.07),rgba(2,6,23,.96) 66%)}`}</style>
 </div>;
};
