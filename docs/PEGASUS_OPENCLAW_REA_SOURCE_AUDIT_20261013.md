# Pegasus × OpenClaw × REA — source audit and controlled build plan

**Date:** 2026-10-13. **Environment:** KINGDOM, Windows, Pegasus feature branch. **Status:** architecture and policy-only prototype; no third-party runtime installed or enabled.

## Source snapshots reviewed (uploaded ZIPs, static inspection only)

| Project | ZIP source version | Source units | License | Role |
|---|---:|---:|---|---|
| OpenClaw | `2026.10.2` | 57,335 archive entries (~661 MB expanded) | MIT | Gateway, chat/session control, tools, messaging, model providers |
| REA (`rea-agents`) | `6.4.0` | 3,595 archive entries (~36.5 MB expanded) | MIT | Software/binary inspection, source maps, JavaScript/Electron reconstruction, MCP evidence |

Archive SHA-256 pins:
- `openclaw-main.zip`: `e2e9b920eb1320035930c94fda9e7cd1a43b1fff54849408b4b8091fa5bf1fc4`
- `rea-main.zip`: `f2311ad01dee5dbe0ae22be59eaa7f3d0c278c657fecccf636bb0c2961d72549`

No ZIP path traversal was detected by static entry-name inspection. OpenClaw includes six symlink entries; use a safe extractor when moving to a test machine. This is NOT a supply-chain, dependency or malicious-code audit. Never automatically execute untrusted archive scripts or package lifecycle hooks.

## Actual capability boundaries from source

**OpenClaw:** `openclaw.mjs`, `src/gateway`, `packages/gateway-protocol`, `src/agents`, `src/plugins` and `docs/gateway/tools-invoke-http-api.md`. Gateway uses WebSocket RPC and hosts an HTTP `/tools/invoke` endpoint. Sandbox setting is **off by default** and applies to tools, NOT the Gateway process. The HTTP endpoint authenticates with a Gateway-level operator token; exec approvals are not a separate per-call permission boundary. Never expose it to end-user/educator browsers or treat a shared gateway as isolation for multiple tenants. Use a separate process and operating-system identity (or host) for each trust domain.

**REA:** package `rea-agents`, `server.json` registers an MCP stdio server, `src/server`, `src/javascript`, `docs/javascript-artifact-reconstruction.md`, and `docs/mcp-contracts.md`. Static JavaScript/Electron inspection works without Hopper/Ghidra. Native analysis optionally needs an operator-installed provider, e.g. Ghidra with Java. REA returns evidence with provenance and explicit limitations. Reverse engineering yields an understanding of behavior, not guaranteed original source code. Native target analysis isn't a sandbox; treat foreign binaries as hostile and use a disposable VM.

## KINGDOM compatibility

- Observed Node `v24.12.0`. OpenClaw snapshot `package.json` **rejects it** (`>=24.16 <25` or `>=26.1`). Do not globally switch project Node to install OpenClaw. Use a separate pinned Node 26.1+ runtime/OS account for any later isolated sidecar.
- REA snapshot allows Node `^24.11.0` and thus passes the declared engine check. However, source-map analysis on certain older Node builds can fail unsafely on malformed UNC paths; for untrusted artifacts prefer a newer patched Node in a disposable analysis environment. Verify REA runtime on a synthetic fixture first.
- Free KINGDOM physical RAM observed around 1.6 GB during review, far below its installed 16.4 GB. Run one small local model at a time, bound timeouts/output and RAM, and avoid extracting/building the entire OpenClaw repo on the production workstation. No capacity benchmark was performed.

## Ownership and wiring

`Founder approval -> Simon/Pegasus task queue -> Gatekeeper/S02 policy -> adapter-specific isolated worker -> signed evidence receipt -> Pegasus job_runs/evidence/events/memory -> Simon executive close`.

- **Pegasus:** remains system of record; owns task identities, job leases, approval audit, evidence, voice/persona mapping, governance and state transitions.
- **Astra/Ollama:** local fact-scoped draft reasoning; no external tool permission, never self-approves output.
- **OpenClaw sidecar (future):** narrowly allowlisted execution of operator-approved *nonclinical, nonfinancial* tasks. Initially health check only. Don't grant shell, filesystem write, browser profiles, communications, calendar, or production secrets during pilot.
- **REA analysis sidecar (future):** inspect *owned* synthetic JS/Electron bundles and produce evidence on module topology and differences. No patient/educator/student data; no live browser sessions or native target launch until a separate sandbox and explicit security review.

## Practical outcomes worth building

1. **IRIS + REA — Website/portal regression intelligence.** Compare approved builds of KMCE's own JavaScript bundle to detect missing registration routes, orphaned CTA handlers, and unexpected code changes. Use source diff/tests as canonical where source is available; REA adds most value for opaque built artifacts.
2. **Simon + Astra — Factual CE answers.** Existing read-only KMCE evidence pack with human review; REA is not needed for clinical reasoning.
3. **Alice + OpenClaw (later) — Controlled storefront QA.** Stage-only navigation and screenshots, no login to payment data and no checkout mutation; evaluate sandbox browser policy before enabling any browser tool.
4. **Echo/Booker + OpenClaw (much later) — Outreach or scheduling.** Require real founder authorization, tenant-level permissions, verified recipients, opt-out/compliance controls, idempotent sends, audit trail. Never give these capabilities to an untrusted message-triggered agent.
5. **Doc + REA (development only) — Understand third-party educator onboarding software integrations.** Prefer supported APIs for production operations and respect license and access boundaries. Do not inspect private assets without permission.

## Approval gates (must pass sequentially)

**Gate A — PLAN ONLY: IMPLEMENTED.** `core/integrations/externalResearchPolicy.ts` admits only synthetic lab requests for `openclaw.gateway_health` or `rea.inspect_owned_bundle`. It rejects unknown fields, private data, arbitrary paths, credentials, real-world actions and non-Simon requests. `executeExternalResearch()` always throws; this is NOT runtime protection until mounted in a real adapter.

**Gate B — ISOLATED TEST:** Complete the existing Astra PostgreSQL failure, expiry, and Simon read-back acceptance tests; do not silently bypass their connection-control restrictions. Separately provision a tiny approved synthetic JS fixture and verify REA static analysis under a constrained process.

**Gate C — OPENCLAW HEALTH:** Only after a compatible Node runtime and sandbox/OS separation have been verified; no channels and no external tool permissions. Measure memory, startup, model selection and failure recovery.

**Gate D — HUMAN APPROVAL + AUTHN:** S02 identity and tenant isolation must pass before a tool worker receives actionable customer records. Use least privilege, server-side permission checks, immutable audit, replay protection and user-visible cancel/kill switch.

**Gate E — REVENUE PILOT:** Prioritize working sales checkout and lead pipeline ahead of agent visual layers: confirm agreements and core offer, verify Stripe payment settlement/webhooks, prove lead routing and legitimate outbound approval, then expand.

## Official references (verify against the exact pinned source version before implementing)

- OpenClaw source: https://github.com/openclaw/openclaw
- OpenClaw Gateway: https://docs.openclaw.ai/concepts/architecture
- OpenClaw HTTP tool security: https://docs.openclaw.ai/gateway/tools-invoke-http-api
- OpenClaw sandboxing: https://docs.openclaw.ai/gateway/sandboxing
- OpenClaw Ollama provider: https://docs.openclaw.ai/providers/ollama
- REA source: https://github.com/morluto/rea
- REA static JavaScript analysis: https://github.com/morluto/rea/blob/main/docs/javascript-artifact-reconstruction.md
- REA installation: https://github.com/morluto/rea/blob/main/docs/installation.md

No external package was executed or installed, no model calls were charged, and no production systems, agent brains/voices, email, payment, or personal records were modified during this audit.
