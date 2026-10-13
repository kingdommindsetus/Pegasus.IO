# Pegasus Working System — Engineering taskboard

**Last verified:** 2026-10-13
**Source branch:** `feature/pegasus-capability-bus-20261013`
**Tracker code:** `core/integrations/pegasusBuildBoard.ts`
**Local UI (not deployed):** `/?build-board=1`, linked from the War Room header and `/?gods-eye-lab=1`.

## Non-negotiable product boundary

- Pegasus is the **canonical operating system**, task authority, identity store and evidence source. Its 12 agent brains, voice registrations and Huddle handoffs must be preserved.
- KMCE is the **business application/tenant** and owns its own CRM, payments, checkout, educator contracts and transactional records. Pegasus never directly inherits KMCE payment secrets.
- God's Eye is an **authenticated read model** over verifiable Pegasus/KMCE events and trace IDs; it must not claim a task completed without database evidence.
- Paperclip is an **optional workflow management adapter**, not a second authoritative job scheduler. Previously considered as underlying orchestration infrastructure, but **not integrated** as of this checkpoint. Its upstream source: https://github.com/paperclipai/paperclip (MIT).
- PostgreSQL (Neon in production) is the durable source of truth. Redis, if used later, sends disposable signaling hints and caches, never authoritative approvals or money state.
- Astra, REA, OpenMontage, OpenClaw, n8n, Dify and Playwright remain independently permissioned capabilities, not substitutes for the central governance layer.
- No fake telemetry, phantom sales, marketing claims of zero errors, unauthorized outreach or invented reservations.

## Actual status

Only **two** milestones have `verified_lab` status: REA's genuine synthetic artifact evidence and the review-only capability/data contracts. This is **not** a percent-complete production launch claim.

The previously written Pegasus workflow modules and KMCE ecommerce components **exist**, but their latest end-to-end integration is not verified in this branch. The Astra isolated PostgreSQL acceptance still has an unresolved connection/control restriction; do not bypass it.

The current God's Eye page is a **static capability registry**. The new taskboard is an **engineering tracking view**; it is not a real-time issue tracker and does not update itself without code changes plus evidence.

## Launch-critical P0 work in execution order

1. **P0 — Isolated durable job acceptance.** Run a synthetic controlled Pegasus job in an authorized non-production PostgreSQL database: create, claim with a lease, fail/retry, persist evidence and memory, resume and restart. Verify one ownership sequence and actual database records. Preserve original 12 agent identities and voices. **Current: existing, re-verification required / prior DB access blocked.**
2. **P0 — God's Eye authenticated read-only feed.** Implement company-scoped, founder-only PostgreSQL reads for jobs, job runs, events and evidence with strict fields, pagination and tests proving customer separation and denied writes. Do not fetch real customer data in tests. **Current: static UI only; reader in progress.**
3. **P0 — Real agent acceptance.** Synthetic source-backed job moves from Marie → assigned specialist → verified evidence → human review → Simon close → reload; God's Eye reflects confirmed state transitions and no duplicate actions. **Current: blocked by #1 and #2.**
4. **P0 — KMCE commercial staging acceptance.** Synthetic educator/lead journey, explicit approvals for outbound contact, safe appointment scheduling, and payment/seat reconciliation using non-charge test artifacts. No real emails/Stripe charges until verified permission gates. **Current: existing implementation, integration re-verification required.**

## Immediate supporting P1 work

- **IRIS/REA/Alice QA:** actual REA synthetic regression evidence already passed. Add Playwright against an approved **staging** site, trace URLs, screenshot the failure, produce durable evidence and human review. Prove no mutations to production.
- **Astra:** complete isolated PostgreSQL worker results and review using safe approved connection. Retain knowledge-source validation.
- **God's Eye trace identifiers:** use a common `objectiveId / taskId / jobId / runId / evidenceId` envelope in persisted events (an additive OpenTelemetry trace ID later).

## Paperclip (P2) review gate

Historical planned use: dedicated agent-management UI, goals, budgets, heartbeat scheduling, team hierarchy and audit trail. Official repo: https://github.com/paperclipai/paperclip .

**Today:** not found as an installed service in KINGDOM's searched Documents, PEGASUS_OS, PegasusVoiceEngine or Desktop locations; no Paperclip process found. Earlier exploratory plans **do not** establish completed integration.

Gate before adding:
- Confirm release, Node/pnpm dependencies, memory consumption, authentication and Postgres requirements in an isolated installation.
- Decide the **single authority** for every job and approval. Strong default: Pegasus remains canonical; Paperclip mirrors subordinate status or handles a separate clearly owned class of development tasks. Do not start two competing heartbeat/retry engines over the same job.
- Pilot with **one synthetic job**, stable correlation ID, reviewed heartbeat adapter and idempotency, no autonomous messaging or payments. Verify expected state on both sides before promoting any adapter.

## P2/P3 deferred until profitable baseline works

- **Tube/OpenMontage:** isolated local synthetic screen-demo render, then checkpoint ingestion. Planning contract only so far; no renderer installed, AGPL-3.0 licensing review needed.
- **Redis:** no server located, current RAM constrained. Prioritize PostgreSQL outbox and exactly-once *business effects* (idempotency) first; optional Redis hints after.
- **OpenClaw:** does not currently meet uploaded release Node engine and isolation requirements; no gateway.
- **n8n/Dify:** evaluate internal-only use and licenses after core business processes pass.

## System acceptance definition

The system is **operational** only when all P0 gates pass against actual authorized isolated/staging resources, browser acceptance verifies front-to-back records, ownership is explicit, the payment and message channels use correct approvals, restart/retry does not duplicate side effects, the founder can trace every claim in God's Eye, and an approved production promotion has a rollback plan.

**Do not conflate** a unit test, a static dashboard, real REA *synthetic* analysis, or a proposed provider interface with a production-ready autonomous business system.

## Run tests (from Pegasus repo root)

```powershell
node .\node_modules\typescript\bin\tsc --noEmit
node .\node_modules\tsx\dist\cli.mjs --test tests\pegasus-build-board.test.ts tests\pegasus-capability-fabric.test.ts tests\rea-evidence-ingest.test.ts tests\rea-synthetic-preflight.test.ts tests\openclaw-lab-readiness.test.ts tests\external-research-policy.test.ts tests\astra-draft-bridge.test.ts tests\astra-worker-isolation.test.ts tests\kmce-astra-knowledge.test.ts tests\kmce-astra-validator.test.ts
```

No third-party system installation or live production deployment is performed by this milestone board.
