export type AgentFactoryInput = {
 name:string; role:string; job:string; colorHex:string; department?:string;
 baseAgentId?:string; skills?:string[]; voiceProfile?:Record<string,unknown>;
 client?:string; objective?:string; memoryScopes?:string[]; permissions?:string[];
};

export type RuntimeAgent = AgentFactoryInput & {
 runtimeKey:string; createdAt:string; source:'custom';
};

export function normalizeHex(value:string) {
 const v=value.trim().toUpperCase();
 if (!/^#[0-9A-F]{6}([0-9A-F]{2})?$/.test(v)) throw new Error('Color must be a #RRGGBB or #RRGGBBAA hex code');
 return v;
}

export function createRuntimeAgent(input:AgentFactoryInput):RuntimeAgent {
 if (!input.name.trim() || !input.role.trim() || !input.job.trim()) throw new Error('Name, role and job are required');
 const slug=input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 return {...input,colorHex:normalizeHex(input.colorHex),runtimeKey:'custom-'+slug,createdAt:new Date().toISOString(),source:'custom'};
}

export function cloneAgentRender<T extends {colorHex:string}>(base:T,colorHex:string):T {
 return {...base,colorHex:normalizeHex(colorHex)};
}
