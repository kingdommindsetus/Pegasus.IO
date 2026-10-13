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
