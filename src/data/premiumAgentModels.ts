export const PREMIUM_AGENT_MODELS = [
  { id: 'simon', name: 'Simon', role: 'Executive Strategy', modelUrl: '/agents/simon.glb' },
  { id: 'marie', name: 'Marie', role: 'Operations', modelUrl: '/agents/marie.glb' },
  { id: 'iris', name: 'IRIS', role: 'Intelligence / Observability', modelUrl: '/agents/iris.glb' },
  { id: 'mark', name: 'Mark', role: 'Marketing', modelUrl: '/agents/mark.glb' },
  { id: 'cammy', name: 'Cammy', role: 'Campaigns', modelUrl: '/agents/cammy.glb' },
  { id: 'evan', name: 'Evan', role: 'Creative / Content', modelUrl: '/agents/evan.glb' },
  { id: 'tube', name: 'Tube', role: 'Video', modelUrl: '/agents/tube.glb' },
  { id: 'lucy', name: 'Lucy', role: 'Distribution', modelUrl: '/agents/lucy.glb' },
  { id: 'snake', name: 'Snake', role: 'Analytics', modelUrl: '/agents/snake.glb' },
  { id: 'alice', name: 'Alice', role: 'Web Quality / Commerce', modelUrl: '/agents/alice.glb' },
  { id: 'echo', name: 'Echo', role: 'Sales Outreach', modelUrl: '/agents/echo.glb' },
  { id: 'booker', name: 'Booker', role: 'Scheduling / Appointments', modelUrl: '/agents/booker.glb' },
] as const;

export type PremiumAgentModel = (typeof PREMIUM_AGENT_MODELS)[number];
