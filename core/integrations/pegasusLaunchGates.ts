/** Fixed baseline launch gates; only verified proof may change status. */
export const PEGASUS_LAUNCH_GATES=[
 {id:'database',name:'Isolated PostgreSQL identity & schema',passed:true,proof:'tests/p0-postgres-isolated-preflight.ts · passed 2026-10-13'},
 {id:'job',name:'Persistent Astra job, evidence & memory',passed:true,proof:'tests/isolated-astra-queue-acceptance.ts · passed 2026-10-13'},
 {id:'recovery',name:'Model failure & expired lease guards',passed:true,proof:'tests/isolated-astra-queue-acceptance.ts · passed 2026-10-13'},
 {id:'trace',name:'Gods Eye isolated read & denial tests',passed:true,proof:'tests/p0-godseye-isolated-acceptance.ts · passed 2026-10-13'},
 {id:'frontend',name:'Frontend build & UI smoke tests',passed:true,proof:'vite build + tests/p0-ui-browser-smoke.mjs · Chrome passed 2026-10-13'},
 {id:'auth',name:'Production founder login & tenant isolation',passed:false,proof:null},
 {id:'handoff',name:'Real multiagent handoff & Simon Close',passed:false,proof:null},
 {id:'kmce',name:'KMCE staging lead/educator workflow',passed:false,proof:null},
 {id:'commerce',name:'Test payments, seats & notification reconciliation',passed:false,proof:null},
 {id:'release',name:'Approved production launch & rollback verification',passed:false,proof:null},
] as const;
const FIXED_GATE_IDS=['database','job','recovery','trace','frontend','auth','handoff','kmce','commerce','release'] as const;
export function launchProgress(gates:readonly {id:string;passed:boolean;proof:string|null}[]=PEGASUS_LAUNCH_GATES){
 if(gates.length!==FIXED_GATE_IDS.length||gates.some((g,i)=>g.id!==FIXED_GATE_IDS[i]))throw Error('LAUNCH_GATES_INVALID: fixed ten-gate baseline required');
 if(gates.some(g=>g.passed&&!g.proof))throw Error('LAUNCH_GATES_INVALID: missing acceptance proof');
 const completed=gates.filter(g=>g.passed).length;
 return {completed,total:10,percent:completed*10,productionVerified:completed===10,asOf:'2026-10-13',method:'10 fixed equal-weight acceptance gates'};
}
