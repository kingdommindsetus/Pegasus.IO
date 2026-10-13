/** Fixed baseline launch gates; only verified proof may change status. */
export const PEGASUS_LAUNCH_GATES=[
 {id:'database',name:'Isolated PostgreSQL identity & schema',passed:true,proof:'tests/p0-postgres-isolated-preflight.ts · passed 2026-10-13'},
 {id:'job',name:'Persistent Astra job, evidence & memory',passed:true,proof:'tests/isolated-astra-queue-acceptance.ts · passed 2026-10-13'},
 {id:'recovery',name:'Model failure & expired lease guards',passed:true,proof:'tests/isolated-astra-queue-acceptance.ts · passed 2026-10-13'},
 {id:'trace',name:'Gods Eye isolated read & denial tests',passed:true,proof:'tests/p0-godseye-isolated-acceptance.ts · passed 2026-10-13'},
 {id:'frontend',name:'Frontend build & UI smoke tests',passed:false,proof:null},
 {id:'auth',name:'Production founder login & tenant isolation',passed:false,proof:null},
 {id:'handoff',name:'Real multiagent handoff & Simon Close',passed:false,proof:null},
 {id:'kmce',name:'KMCE staging lead/educator workflow',passed:false,proof:null},
 {id:'commerce',name:'Test payments, seats & notification reconciliation',passed:false,proof:null},
 {id:'release',name:'Approved production launch & rollback verification',passed:false,proof:null},
] as const;
export function launchProgress(gates:readonly {id:string;passed:boolean;proof:string|null}[]=PEGASUS_LAUNCH_GATES){
 if(gates.length!==10||new Set(gates.map(g=>g.id)).size!==10)throw Error('LAUNCH_GATES_INVALID: fixed ten-gate baseline required');
 if(gates.some(g=>g.passed&&!g.proof))throw Error('LAUNCH_GATES_INVALID: missing acceptance proof');
 const completed=gates.filter(g=>g.passed).length;
 return {completed,total:10,percent:completed*10,productionVerified:completed===10,asOf:'2026-10-13',method:'10 fixed equal-weight acceptance gates'};
}
