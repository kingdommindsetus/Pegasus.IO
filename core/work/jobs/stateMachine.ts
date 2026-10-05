export type JobStatus = 'queued'|'claimed'|'running'|'waiting_approval'|'retrying'|'completed'|'failed'|'cancelled';

export interface PegasusJob {
  id: string;
  taskId?: string;
  agentId: string;
  skillKey: string;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  input: Record<string, unknown>;
  result?: Record<string, unknown>;
  lastError?: string;
  availableAt?: string;
  leaseExpiresAt?: string;
}

export const TERMINAL: ReadonlySet<JobStatus> = new Set(['completed','failed','cancelled']);

const transitions: Record<JobStatus, JobStatus[]> = {
  queued: ['claimed','cancelled'],
  claimed: ['running','queued','cancelled'],
  running: ['completed','retrying','waiting_approval','failed','cancelled'],
  waiting_approval: ['queued','cancelled','failed'],
  retrying: ['claimed','failed','cancelled'],
  completed: [],
  failed: [],
  cancelled: [],
};

export function assertJobTransition(from: JobStatus, to: JobStatus) {
  if (!transitions[from].includes(to)) throw new Error(`Illegal Pegasus job transition: ${from} -> ${to}`);
}

export function nextRetryDelayMs(attempt: number) {
  const base = 2_000;
  const cap = 5 * 60_000;
  return Math.min(cap, base * 2 ** Math.max(0, attempt - 1));
}
