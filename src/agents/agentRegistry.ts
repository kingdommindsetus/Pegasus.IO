import type { AgentVisualConfig } from "./types";

export const agentRegistry: Record<string, AgentVisualConfig> = {
  simon: { id:"simon", displayName:"Simon", role:"Executive Strategy", modelUrl:"/agents/simon.glb", hologramColor:"#33ddff", idleExpression:"calm", speakingIntensity:1 },
  marie: { id:"marie", displayName:"Marie", role:"Operations", modelUrl:"/agents/marie.glb", hologramColor:"#33ddff", idleExpression:"focused", speakingIntensity:1 },
  iris: { id:"iris", displayName:"IRIS", role:"Intelligence / Observability", modelUrl:"/agents/iris.glb", hologramColor:"#33ddff", idleExpression:"focused", speakingIntensity:1 },
  mark: { id:"mark", displayName:"Mark", role:"Marketing", modelUrl:"/agents/mark.glb", hologramColor:"#33ddff", idleExpression:"focused", speakingIntensity:1 },
  cammy: { id:"cammy", displayName:"Cammy", role:"Campaigns", modelUrl:"/agents/cammy.glb", hologramColor:"#33ddff", idleExpression:"focused", speakingIntensity:1 },
  evan: { id:"evan", displayName:"Evan", role:"Creative / Content", modelUrl:"/agents/evan.glb", hologramColor:"#33ddff", idleExpression:"creative", speakingIntensity:1 },
  tube: { id:"tube", displayName:"Tube", role:"Video", modelUrl:"/agents/tube.glb", hologramColor:"#33ddff", idleExpression:"focused", speakingIntensity:1 },
  lucy: { id:"lucy", displayName:"Lucy", role:"Distribution", modelUrl:"/agents/lucy.glb", hologramColor:"#33ddff", idleExpression:"focused", speakingIntensity:1 },
  snake: { id:"snake", displayName:"Snake", role:"Analytics", modelUrl:"/agents/snake.glb", hologramColor:"#33ddff", idleExpression:"analytical", speakingIntensity:1 },
  alice: { id:"alice", displayName:"Alice", role:"Web Quality / Commerce", modelUrl:"/agents/alice.glb", hologramColor:"#33ddff", idleExpression:"focused", speakingIntensity:1 },
  echo: { id:"echo", displayName:"Echo", role:"Sales Outreach", modelUrl:"/agents/echo.glb", voiceId:"cjVigY5qzO86Huf0OWal", hologramColor:"#33ddff", idleExpression:"focused", speakingIntensity:1 },
  booker: { id:"booker", displayName:"Booker", role:"Scheduling", modelUrl:"/agents/booker.glb", hologramColor:"#33ddff", idleExpression:"calm", speakingIntensity:1 }
};

export const agentExecutionChain=[
  "simon","marie","iris","mark","cammy","evan","tube","lucy","snake","alice","echo","booker"
] as const;

export type CanonicalAgentId=typeof agentExecutionChain[number];

export function getAgentVisual(agentId:string){
  return agentRegistry[agentId.toLowerCase()] ?? null;
}
