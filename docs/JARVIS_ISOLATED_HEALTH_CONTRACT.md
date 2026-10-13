# Jarvis isolated health — read-only command-room contract

**Development-only:** Windows test database and local Ollama, not production. This document describes the current snapshot contract, not a public endpoint or a deployed UI integration.

## Persistence and scheduling

Windows Task Scheduler task: `Pegasus-Isolated-Jarvis-Health`, 2-minute repetition, interactive `info` account, battery execution allowed, single instance, read-only probes. Calls `tests/jarvis-persistent-health.ps1 -Mode capture`.

Local snapshot path: `C:\Users\info\PegasusVoiceEngine\acceptance-isolated\jarvis-health\latest.json`.
Append-only capture history: same folder, `history.jsonl`. Only dev health metadata is emitted, never credentials or database connection strings. This is **not** a backup system: protect and rotate history as part of future operations.

For a read-only consumer, call:
```powershell
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File tests\jarvis-persistent-health.ps1 -Mode read -MaxAgeSeconds 180
```

## JSON contract

`schemaVersion: 1`, `source: "jarvis-isolated"`, `scope: "windows-isolated-development"`, `status: "healthy" | "degraded" | "offline" | "blocked" | "stale"`, `stale: boolean`, `ageSeconds: integer | null`, `lastSeen: ISO string | null`, `signals: object`, `alerts: array`.

Never render a prior green snapshot as live if `stale=true`. Missing, invalid or aged snapshots fail closed as `stale`. A blocked queue overrides offline signals for the aggregate, but all raw signal states remain visible.

## Acceptance

- Base health probe: healthy plus simulated database offline, Ollama offline, worker outage and blocked queue.
- Persistent acceptance: fresh snapshot healthy, simulated offline/blocked capture, history growth, aged/missing snapshot stale, read operation makes no write.
- Real Windows scheduled task must report success and update `history.jsonl`; verify Task Scheduler again when making any launch decision.
- Command Room UI/API integration is **not** implemented in this milestone's current source. Frontend must consume this contract through an authenticated local bridge, never directly publish disk paths or credential files.

## Founder Command Room development integration (R06)

The Pegasus development War Room at `src/App.tsx` now mounts `src/components/JarvisHealthPanel.tsx`. It displays four isolated health signals, alert history, last snapshot time, and an explicit `STALE` state on missing/aged/unavailable readings. No agent brain or voice file is modified.

The local API route is `GET /api/dev/jarvis-health?history=1` on the **development-only, loopback-bound** Express server. Production does not register the route. A bearer token is required; the token is stored exclusively in the local untracked file `C:\Users\info\PegasusVoiceEngine\acceptance-isolated\.jarvis-local-ui-token` with restricted filesystem access. The token is never placed in Git or user-visible logs. To use the panel, retrieve the token locally on Kingdom and paste it into the password-type input; it remains in component memory, not browser localStorage. HTTPS external origins and non-loopback network clients are rejected. Responses are `Cache-Control: no-store, private`.

**Development validation:** the standalone test server was started on `127.0.0.1:4318` using only the dedicated Windows isolated test database. The bridge does not write to Postgres or the health snapshot/history files. Freshness is enforced server-side at 180 seconds and again in the React display, so even an old green snapshot is shown as `STALE`.

**Tests:** `tests/jarvis-ui-acceptance.tsx` verified healthy/stale/offline/blocked status badge rendering and stale fail-closed logic; real HTTP tests passed bearer required (401), valid token (200), foreign website origin forbidden (403), and invalid HTTP method (405). `tests/jarvis-browser-acceptance.mjs` launched isolated headless Chrome and verified the real War Room panel appeared, started STALE until authentication, then showed the true isolated HEALTHY reading; CDP interception of *test-only* responses verified OFFLINE/BLOCKED/STALE visual states without altering snapshots or actual services. TypeScript check passed. The scheduled capture task later reported Ready/result 0 and continued to record health snapshots.

**Limitations:** This is a local development UI acceptance, not a verified production Founder Command Center deployment, external alert delivery, or independent always-on watchdog. R06's acceptance is limited to the isolated Windows environment. Future release gates must authenticate and audit real production telemetry separately.
