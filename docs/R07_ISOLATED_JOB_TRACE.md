# R07 — Isolated job lifecycle trace

Scope: **Windows isolated development** only. Not a production command-center deployment.

## Data provenance

Source: real `pegasus_core.jobs`, `job_runs`, `events`, `evidence`, and `memories` rows in `pegasus_world_windows_accept_1011`. Fixed objective ID `cbe5f353-25de-4daa-a69e-09b326299fea`. Read-only API returns at most 12 recent jobs, with bounded linked records: 30 runs, 60 events, 60 evidence IDs and 60 memory IDs per job. Joins use persistent job IDs; no invented evidence links.

Lifecycle states: completed, failed, retrying, interrupted (expired claimed/running lease), in_progress, or original database status. Interrupted means lease expired **as of query time**, not a claim that recovery succeeded. `lastError` and run errors are truncated to 180 characters; raw input, output, evidence content, memory content, and secrets are not returned.

Development-only endpoint: `GET /api/dev/job-trace`. Requires loopback caller, same local bearer token as Jarvis, and local origin checks; `Cache-Control: no-store, private`. Checks dedicated Windows test role/database. On database failure returns a stale status with no records; production handler returns 404 and route is unregistered in production. The War Room `JobTracePanel` inherits the in-memory Jarvis token, displays scoped run/event/evidence IDs and reasons, polls every 15 seconds, and falls back to STALE after 45 seconds of obsolete API data.

## Acceptance

- `tests/r07-job-trace-acceptance.ts`: seeded four development-only synthetic cases — completed, failed, interrupted, retrying. Confirmed real job, run, event and evidence IDs and matching states from authenticated HTTP endpoint; removed synthetic jobs and evidence/events afterward. Tested stale time limits.
- `tests/r07-browser-acceptance.mjs`: headless Chrome confirmed War Room trace panel, authenticated LIVE state, and visible persistent job IDs; exit 0.
- Live HTTP checks: missing token 401, authorized 200 and scoped records, foreign origin 403.
- `tsc --noEmit` and `git diff --check` passed.

Restrictions: No production database or deployment changes. `D:\Astra`, agent brains and voice registry unchanged. No email or external business actions. Long-term secure audit retention, production telemetry, and full-text search are separate future milestones.
