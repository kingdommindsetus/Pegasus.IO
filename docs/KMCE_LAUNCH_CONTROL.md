# KMCE × PEGASUS — LAUNCH CONTROL BOARD

**Source of truth:** this file on Kingdom (development branch). **Updated:** 2026-10-12. **No calendar weeks.** Work in dependency order and mark complete only with test evidence. Estimates are rough hands-on engineering hours, not elapsed time or promises; parallel work, credentials, complexity and failures change them.

**Status legend:** `[x]` verified; `[ ]` unverified/not complete. `BLOCKED` only when a concrete dependency is recorded. Each completion must append a timestamp, evidence (test command/results or artifact), commit, owner and applicable release gate in the evidence log. Never mark complete from an agent's claim alone.

**Immutable launch gates:** no production change without approval; no unsolicited contact; no publishing/charges/refunds without scoped permissions; no CE/clinical or financial claims without verified authoritative record; human signs contracts; user never speaks card information to voice bot. Preserve 12 original brains/voices and 21 total named identities. Public and portal tenants must be isolated.

**Verified starting point:** Windows PostgreSQL restored from Ubuntu archive with 19 historical jobs (at restore), local Simon→Marie draft-only handoff passed on Windows and committed `38d864f`. Existing ZIP concierge source reviewed in previous discussion, but public deployment/auth/voice/CRM not accepted. All other checks remain unverified until audited.

**Launch definition:** no founder approval to publicly launch until M00–M08 are evidenced, with controlled exceptions documented and risk-approved. MVP = stable runtime + secure educator task assistant + one founder-to-review simulated lead workflow; commercial launch also needs payments, support, compliance and release gates.

## Progress
- Verified items: **8**
- Open items: **64**
- Total items: **72**
- Next critical path: **S01 -> S01-S05 -> D04/D05 -> V04/V05 -> A01-A06 -> L02/L03**
- Estimates: rough engineering effort per milestone; NOT dates or target weeks.

## M00 — Evidence baseline and scope (rough effort 1-2h)

- [ ] **E01** Inventory production portal, website, store, APIs, deploys and repositories; capture revisions. **Done when:** Audit report; no production writes.
- [ ] **E02** Map data owners and authoritative records for doctors, educators, courses, leads, orders and CE. **Done when:** Schema/source-of-truth table.
- [ ] **E03** Baseline 12 original + 9 added agent identities, brain versions and voices. **Done when:** Identity registry diff; no overwritten personas.
- [ ] **E04** Capture security, infrastructure and vendor-cost baseline. **Done when:** Access/cost matrix; secrets excluded.

## M01 — Stable Pegasus runtime (rough effort 3-8h)

- [x] **R01** Verify restored isolated Windows Postgres access and backup restore. **Done when:** DB verification evidence.
- [x] **R02** Verify Simon-to-Marie draft-only Ollama handoff. **Done when:** Both jobs completed and evidenced.
- [x] **R03** Migrate isolated scheduled workers from WSL to Windows DB. **Done when:** Scheduled service reads correct database; old workers safely retired.
- [x] **R04** Prove crash/restart recovery and lease expiry. **Done when:** Kill/restart simulation recovers exactly once.
- [x] **R05** Prove idempotency, retries, dead-letter state and timeouts. **Done when:** Duplicate workload does not duplicate actions.
- [x] **R06** Connect Jarvis to Windows runtime and distinguish stale/down/blocked. **Done when:** Health dashboard and alert tests.
- [x] **R07** Capture structured logs, job trace IDs, error causes and evidence links. **Done when:** Founder can follow each job lifecycle.
- [x] **R08** Enforce no live production, email, publishing or payments in tests. **Done when:** Negative authorization tests.

## M02 — Identity, permissions and isolation (rough effort 4-10h)

- [ ] **S01** Map roles: founder, staff, educator, doctor, student, public visitor, service-agent. **Done when:** Permission matrix approved.
- [ ] **S02** Verify authentication and session refresh on portal. **Done when:** Unauthorized and expired access denied.
- [ ] **S03** Add tenant/educator ownership checks to every portal read and write. **Done when:** Cross-account tests denied.
- [ ] **S04** Secure /api/admin/leads and /api/admin/metrics and any founder routes. **Done when:** Unauthorized requests get 401/403.
- [ ] **S05** Create explicit tool permissions and founder/Gatekeeper approval gates. **Done when:** No side effect before approval.
- [ ] **S06** Encrypt secrets, audit data retention, PII controls and backup restore. **Done when:** Security/restore test log.
- [ ] **S07** Rate limits, abuse detection, prompt-injection boundaries and voice data consent. **Done when:** Attack/abuse suite passed.

## M03 — Canonical KMCE business backbone (rough effort 5-12h)

- [ ] **D01** Reconcile active faculty, Dr Tim records and educator contracts, dates, obligations. **Done when:** Controlling agreement and approved roster.
- [ ] **D02** Reconcile product catalog, CE eligibility, faculty and course statuses. **Done when:** Approved catalog version.
- [ ] **D03** Resolve single pricing schedule for in-office, seminar, digital and educator offers. **Done when:** Approved versioned price book.
- [ ] **D04** Create Doctor/Practice/Contact/Opportunity/Consent/Assignment CRM objects. **Done when:** Migrations and ownership tests.
- [ ] **D05** Create onboarding tasks, documents, draft revisions, milestones and approval events. **Done when:** Read/write and history tests.
- [ ] **D06** Create event capacity, held/paid seats, cancellation and refund state model. **Done when:** Capacity invariants and test enrollments.
- [ ] **D07** Connect Stripe and Shopify data via verified events with reconciliation. **Done when:** Payment ledger matches processor test data.
- [ ] **D08** Model educator earnings and settlements by agreement, excluding gross-sales assumptions. **Done when:** Auditable revenue allocation test.

## M04 — Doctor and educator voice assistant (rough effort 6-15h)

- [ ] **V01** Audit uploaded concierge code and actual local voice services. **Done when:** Reuse/dependency and risk report.
- [ ] **V02** Build separate public and logged-in portal assistant profiles. **Done when:** Role-bounded system prompts and tools.
- [ ] **V03** Connect conversational microphone STT, TTS, interruption and fallback. **Done when:** Browser test with measured latency.
- [ ] **V04** Connect readMyTasks and readMyProgress to authorized account records. **Done when:** No hallucinated status; cross-user denial.
- [ ] **V05** Implement assisted biography interview, draft, preview and save. **Done when:** Bio persisted, reviewed and editable.
- [ ] **V06** Implement document checklist, upload status and missing-item explanation. **Done when:** Stored-document proofs.
- [ ] **V07** Implement contract read/review and human-controlled e-sign redirect. **Done when:** Valid signer audit and returned status.
- [ ] **V08** Implement invoice explanation and hosted payment handoff. **Done when:** No voice collection of card data.
- [ ] **V09** Implement educator leads and follow-up review with account permission. **Done when:** Only assigned leads visible.
- [ ] **V10** Implement event seat count, capacity, cancellations and earnings explanation. **Done when:** Matches DB and payment processor.
- [ ] **V11** Implement course outline/objectives drafting and reviewer submission. **Done when:** Human approval and version history.
- [ ] **V12** Implement consent-based reminders, escalation and accessible text alternative. **Done when:** Opt-out, quiet hours and WCAG checks.

## M05 — Public voice concierge and conversion (rough effort 4-9h)

- [ ] **W01** Approved public knowledge base, current prices and CE claim filters. **Done when:** Grounded answer test cases.
- [ ] **W02** Guide program selection, in-office qualification and educator pathway. **Done when:** Correct routing on scenario tests.
- [ ] **W03** Connect persistent consented lead capture and anti-spam controls. **Done when:** CRM entry created once.
- [ ] **W04** Connect Calendly/availability or verified booking path. **Done when:** No fabricated appointments.
- [ ] **W05** Connect live product pages and checkout links without card collection. **Done when:** Checkout sandbox result.
- [ ] **W06** Test mobile, desktop, Chrome, Edge, mic denial, silence and interruption. **Done when:** QA evidence matrix.
- [ ] **W07** Feature flag, rollback and support handoff for public widget. **Done when:** Controlled preview deployment.

## M06 — Pegasus agent-to-agent work (rough effort 5-14h)

- [ ] **A01** Simon accepts founder doctor instruction and persists one mission. **Done when:** Job ID, consent and scope stored.
- [ ] **A02** Claire/IRIS research verified permitted sources; unknown remains unknown. **Done when:** Citations and confidence.
- [ ] **A03** Atlas qualifies against approved offers and real discovery facts. **Done when:** Auditable reason codes.
- [ ] **A04** Midas produces approved offer recommendation, no invented discount. **Done when:** Price book version cited.
- [ ] **A05** Echo/Maven create reviewable outreach and collateral drafts. **Done when:** Draft trace linked to mission.
- [ ] **A06** Gatekeeper enforces compliance and scoped founder approvals. **Done when:** Unauthorized send impossible.
- [ ] **A07** Booker validates real booking availability; Flow takes onboarding handoff. **Done when:** Test contact lifecycle.
- [ ] **A08** Ledger reports paid enrollments and reconciled net receipts. **Done when:** Source-linked figures.
- [ ] **A09** Implement agent watchdog, escalation and Simon close only when evidence complete. **Done when:** No phantom completions.
- [ ] **A10** Test original 12 identities and additional agents separately with role-specific contracts. **Done when:** Pass/fail grid per agent.

## M07 — Founder command room (rough effort 4-10h)

- [ ] **F01** Show missions, running/blocked/failed/retrying statuses from actual DB. **Done when:** Refresh and replay evidence.
- [ ] **F02** Show click-through agent traces, inputs, outputs, brain/model and provider. **Done when:** Verifiable step drilldown.
- [ ] **F03** Founder can assign additional tasks and reprioritize without losing context. **Done when:** Persisted mission update.
- [ ] **F04** Approval inbox for message, price, contract, external publish/payment changes. **Done when:** Decision audit and no bypass.
- [ ] **F05** Educator and doctor status dashboard: missing files, course stages, leads. **Done when:** Permissions and fresh data.
- [ ] **F06** Revenue dashboard: leads, seats, settled receipts, refunds, obligations. **Done when:** Reconciled ledger, no demo metrics.
- [ ] **F07** Restore voice/avatar behavior as view of real jobs, not fake typing. **Done when:** UI state maps to telemetry.

## M08 — Production readiness and launch gates (rough effort 6-16h)

- [ ] **L01** Run automated tests: schema, permission, API, integration, voice and jobs. **Done when:** CI green on locked revision.
- [ ] **L02** Run workflow demo: doctor logs in -> asks unfinished work -> completes bio draft. **Done when:** Recorded acceptance trace.
- [ ] **L03** Run workflow demo: founder doctor lead -> Simon -> draft -> Gatekeeper approval. **Done when:** No external messages sent in test.
- [ ] **L04** Run payment/e-sign sandbox tests and event seat reconciliation. **Done when:** Verified test receipts and audit.
- [ ] **L05** Load test concurrent sessions, queue lengths and Kingdom downtime fallback. **Done when:** Resource and uptime plan.
- [ ] **L06** Backups, rollback, incident response, support ownership and observability. **Done when:** Recovery rehearsal passed.
- [ ] **L07** Review AGD PACE public claims, privacy, terms, consent and accessibility. **Done when:** Documented review and signoff.
- [ ] **L08** Deploy staged preview, user acceptance, explicit founder go-live signoff. **Done when:** Release checklist signed.
- [ ] **L09** Launch behind flags; observe real usage and error rates; pause on safety threshold. **Done when:** Post-launch evidence dashboard.

## Evidence log

- 2026-10-12 — **R01:** Windows PostgreSQL 16 service running; restored `pegasus_world_windows_accept_1011` authenticated as dedicated role; archive SHA matched; 19 preexisting jobs, 7 audits and 17 evidence records at initial verification. Developer verification only; no production changes.
- 2026-10-12 — **R02:** Test `tests/simon-marie-ai-handoff.ts` completed with `TWO_AGENT_HANDOFF_PASSED` and process exit 0; both local Ollama jobs saved as completed with separate brain sources, evidence. Commit `38d864f` on `feature/voice-core-identity-20261011`.

- 2026-10-12 — **R03:** Both isolated recovery scripts backed up at `C:\Users\info\PegasusVoiceEngine\acceptance-isolated\backups\r03-supervisors` and updated to read `.windows-test-db-url`, validating `127.0.0.1`, `pegasus_world_windows_accept_1011` and `pegasus_windows_accept_role`. Both worker source guard checks updated accordingly. Six old isolated Node processes stopped, scheduled workers restarted. Two `postgres.js` idle connections verified on Windows test database under the dedicated test role; four Node wrapper/worker processes (two worker types) observed; two Task Scheduler `LastTaskResult=0`; PostgreSQL service running; supervisor PowerShell AST parse error count 0; TypeScript `tsc --noEmit` exit 0. **Scope:** isolated development only. Crash recovery and duplicate-job tests remain R04/R05, not claimed here.

\n- 2026-10-12 — **R04 IN PROGRESS / BLOCKED (NOT CHECKED):** Controlled interruption on Windows test workers only. Standard worker PIDs 4692,31252 stopped; Task Scheduler relaunched 10304,40804 (LastTaskResult=0). Ollama worker PIDs 32332,14784 stopped; initial 7-second check showed no processes/LastTaskResult=267009 (still running); later verification showed new PIDs 40504,18856, task Ready/LastTaskResult=0. Windows isolated Postgres has 23 jobs; current status aggregate: completed 15, waiting_approval 4, failed 3, retrying 1; 0 currently expired claimed/running jobs. **Blocker:** core/work/jobs/repository.ts claims only queued/retrying statuses, so expired claimed/running leases cannot be recovered via the normal claim path; no in-flight crash/lease-expiry recovery test passed. Existing database rows were not intentionally altered; no external activity. R04 remains open pending scoped lease reaper, durable recovery evidence, and retest. R05 duplicate prevention not assessed.\n- 2026-10-12 — **R04 PASSED (development-only):** Added `core/work/jobs/isolatedLeaseRecovery.ts` with Windows database/role/objective guards; locks expired `claimed`/`running` jobs using `FOR UPDATE OF j SKIP LOCKED` and limits to Simon draft-only `search_company_memory`/`generate_content` with `externalActionsAllowed=false`. Moves safe interrupted jobs to `retrying` (or `failed` at attempt limit), closes abandoned runs and records `isolated_lease_recovered` audit events. Wired into both isolated worker loops. Stopped/restarted only both isolated worker families; four Node processes and two `postgres.js` test DB connections verified; scheduled tasks reported result 0. `tests/isolated-lease-recovery-acceptance.ts` passed, including event record, attempt preservation and second-pass non-repeat. `tests/isolated-worker-auto-recovery-acceptance.ts` passed automatically within 5.75 seconds end to end (synthetic job was cleaned after assertion), run closed and recovery event confirmed. `tsc --noEmit` exit 0. **R05 remains OPEN:** cross-worker duplicate execution, late-writer fencing and side-effect exactly-once semantics not established. D: drive only inspected read-only; Astra runtime and visual engineering assets not modified.

- 2026-10-12 — **R05 PARTIAL — concurrent claim and isolation fencing tests PASS; milestone OPEN:** `tests/isolated-r05-claim-fencing-acceptance.ts` competed 8 concurrent claimers against one synthetic queued development job; exactly one claim succeeded. New `isolatedClaimFencing.ts` verifies dedicated Windows test DB/role/objective, lease validity, active `job_runs` run ID, and rejects expired-lease result writes; valid and stale paths both tested. `tests/isolated-r05-retry-limits.ts` proved an expired safe draft-only job at max attempts 3/3 becomes `failed`, emits one recovery event and is not reprocessed. `tsc --noEmit` passed. **Still needed before checking R05:** integrate strict lease/run ownership into the real job save, evidence, memory and completion transaction; prove stale-worker late writes cannot win after another worker reclaims; verify idempotent side-effect/outbox behavior. Isolated synthetic jobs cleaned; production untouched. **D: Astra read-only inventory:** 8 GB FAT32 portable drive; `openastra-main/src/memory` contains retrieval, cold-store, dedup, provenance, consolidation, CRDT-merge and cross-agent modules; `src/db`, scheduler, jobs, workspaces and security components present. README states databases, chats, accounts, models and secrets are not backed up on drive. Porting compatibility/security not verified; do not store active Pegasus DB or secrets on USB.

- 2026-10-12 — **R05 PASSED within isolated Windows development objective:** Transactional `startOwnedIsolatedRun` and `finishOwnedIsolatedRun` enforce live run ID + exact database lease + active job status. Job completion, evidence, project memory, job-run finalization, and audit event persist atomically; late/stale workers cannot write. `claimIsolatedDraftJob` scopes both isolated workers to proper agent/skill, draft-only input, disabled external actions, max-attempt policy, and both queued/retrying states using `FOR UPDATE SKIP LOCKED`. Tests passed: eight concurrent claimants/one winner; valid owner update; expired owner rejected; attempt limit 3/3 failed with single recovery event; simulated old worker completion rejected after a replacement took the lease; exactly one evidence, memory, completion and successful run; repeat completion rejected. Restarted BOTH scheduled isolated worker types (four Node processes); actual standard worker completed new queued and retrying synthetic jobs with exactly one set of records; Ollama worker completed a queued model-generated draft with exactly one set of records. TypeScript `tsc --noEmit` and git diff checks exit 0. Synthetic jobs and derived records cleaned in tests. **Caveat:** this certifies safe isolated draft-only execution; it does NOT certify external side-effect exactly-once semantics, commercial production tasks, payment processing, or the unrestricted legacy job repository. Production and `D:\Astra` unchanged.

- 2026-10-12 — **R06 PARTIAL — isolated Jarvis health probe validated, milestone OPEN:** Added read-only PowerShell health probe `tests/jarvis-isolated-health.ps1` for isolated Windows PostgreSQL dedicated role/DB, queued/retrying and expired lease counts, failed-job totals, local Ollama HTTP, both worker process families and Task Scheduler definitions. It emits JSON status `healthy`, `degraded`, `offline`, `blocked` and per-signal evidence; no secrets emitted. `tests/jarvis-isolated-health-acceptance.ps1` passed five states (healthy baseline, simulated database-offline, Ollama-offline, workers-offline, queue-blocked), without stopping services. Actual baseline reports Windows test DB and Ollama available; both worker families healthy and no expired active leases at probe. **Still required before R06 checkmark:** integrate persistent Jarvis dashboard/watch into command room, independently verify stale/last-seen detection and reporting under recurring outages, and test alert/visibility; standalone probe does not establish monitoring in production. Zero production changes; D: Astra untouched.

- 2026-10-12 — **R06 PERSISTENT MONITOR PROVEN / UI INTEGRATION STILL OPEN:** `tests/jarvis-persistent-health.ps1` now captures atomic `latest.json` snapshots plus append-only `history.jsonl` in local isolated development storage; read-only mode validates age and fails stale for missing, aged, future or corrupt snapshots. `docs/JARVIS_ISOLATED_HEALTH_CONTRACT.md` documents JSON schema for a future authenticated Founder Command Room bridge. `tests/jarvis-persistent-health-acceptance.ps1` PASS: healthy, simulated Ollama offline, simulated blocked queue, aged/missing stale, history count=3, read-only operation no writes. Scheduled task `Pegasus-Isolated-Jarvis-Health` registered every 2 minutes with allowed battery execution and IgnoreNew; scheduler result=0 at 22:08:47, 3 actual history snapshots, live read status healthy age=48s/stale=false. Original base health probe previously passed database/worker/Ollama/blocked simulations. **R06 intentionally remains OPEN:** no authenticated bridge or visible health dashboard integration in the Founder Command Room has been demonstrated. Production and D: Astra untouched; no secret content persisted.

- 2026-10-12 — **R06 ACCEPTED (isolated Windows development only):** Local `src/App.tsx` War Room mounts `JarvisHealthPanel` and `JarvisStatusBadge`; authenticated dev-only Express `/api/dev/jarvis-health` bridge in `core/runtime/jarvisDevelopment.ts` consumes persistent snapshots/history read-only with 180-second server freshness and no-store response. Development server binds 127.0.0.1; token file lives outside Git with restricted Windows ACL; unauthorized = 401, cross-site Origin = 403, invalid method = 405, production handler = 404. Actual development HTTP authorization and Chrome UI acceptance passed: panel present, unauthenticated STALE, authenticated real HEALTHY; browser test-only intercepted responses rendered OFFLINE, BLOCKED, STALE without modifying service snapshots. `tests/jarvis-ui-acceptance.tsx`: 4/4 tests passed (all badge states, fail-closed missing/corrupt/expired/future, bearer/origin/HTTP restrictions, production disabled). `tests/jarvis-browser-acceptance.mjs`: pass, exit 0; `tsc --noEmit` exit 0. Scheduled `Pegasus-Isolated-Jarvis-Health` reports Ready/LastTaskResult 0 and continues writing snapshots; timeout adjusted to 3 minutes, battery execution enabled. **Scope limitation:** local development UI acceptance, not verified public production Founder Center, not external notifications. Original 21 agent registry/voice files untouched; D: Astra read-only/unmodified, no production deployment or production database writes.

- 2026-10-12 — **R07 ACCEPTED (isolated development only):** Inspected actual Pegasus Postgres schema for jobs, job_runs, events, evidence, memories, tasks. Added bounded read-only "/api/dev/job-trace" bridge (`core/runtime/jobTraceDevelopment.ts`) with dedicated Windows test role/objective checks, loopback + bearer authorization, foreign Origin rejection, no-store, production route excluded, stale fail-closed on DB error. War Room `JobTracePanel` displays real job/run/event/evidence IDs, worker, attempts, status, last error, expired lease and linked memory IDs with no raw input/evidence/memory content; 15-second refresh, 45-second freshness limit. `tests/r07-job-trace-acceptance.ts` created synthetic completed/failed/interrupted/retrying histories in isolated Windows DB and verified all four statuses, real IDs and linked records via authenticated HTTP; synthetic rows cleaned. Headless Chrome `tests/r07-browser-acceptance.mjs` confirmed panel visible, authenticated LIVE status and actual persistent job IDs. API checks: unauthenticated 401, valid token 200, foreign origin 403. `tsc --noEmit` and `git diff --check` exit 0. Technical contract in `docs/R07_ISOLATED_JOB_TRACE.md`. **Not a production Founder Command Center deployment**; no external actions, original DB, voice, agent brains or D: drive changes.

- 2026-10-12 — **R08 PARTIAL — negative authorization checks passed, milestone OPEN:** Inspected actual R08 requirement (no live production, email, publishing or payments in tests) and existing approval/isolated worker code. Added `core/work/jobs/isolatedSafetyPolicy.ts` deny-by-default intent guard restricted to Windows 127.0.0.1 `pegasus_world_windows_accept_1011`, role `pegasus_windows_accept_role`, approved objective, Simon draft-only `search_company_memory` or local Ollama `generate_content`, and explicit rejection of side-effect flags/actions. Wired guard into `claimIsolatedDraftJob` before claimed job mutation, so rejected candidate transaction rolls back. `tests/r08-negative-authorization.test.ts`: 19/19 passed, including negative cases for production/wrong database and role, wrong objective/agent, email, publish, checkout, deployment, live work, external actions and remote reasoning. `tsc --noEmit` and `git diff --check` passed. Tests were pure/in-memory authorization checks, not real external communications, payments or production writes. **R08 remains OPEN:** must still verify an actual isolated database-claim negative test and audit all execution adapters for possible outbound side effects; no full-system production safety claim. No changes to live production, D: Astra, agents or voices.

- 2026-10-12 — **R08 ACCEPTED — isolated Windows test-execution boundary only:** 19/19 negative/positive authorization tests passed in `tests/r08-negative-authorization.test.ts`, covering production database, wrong role/objective, unauthorized agents/skills, email, publishing, payments, deployments, live work, remote reasoning, and side-effect flags. Follow-up `tests/r08-isolated-database-denial.ts` exercised actual PostgreSQL transactional claim with unsafe `send=true` candidate and proved rejection with job still queued, attempts=0, lease NULL, zero run rows, no side effects; fixture removed. Audited imports of both isolated workers; no live mail/post/payment/deployment adapter and only local Ollama HTTP endpoint. `tsc --noEmit` and `git diff --check` passed. Acceptance and limitations documented `docs/R08_ISOLATED_SAFETY_ACCEPTANCE.md`. Scope does NOT certify production routes, external integrations or future agents; S01 security matrix next. Production, D: Astra, brain/voice registrations untouched.

## Change control

On any completed item, attach: ID, exact command/test, outcome, database/environment, artifact or commit, timestamp, and remaining risks. If a regression appears, revert status to open and record why. No auto-credit for adjacent capabilities.
