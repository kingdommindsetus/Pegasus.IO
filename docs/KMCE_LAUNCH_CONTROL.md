# KMCE × PEGASUS — LAUNCH CONTROL BOARD

**Source of truth:** this file on Kingdom (development branch). **Updated:** 2026-10-12. **No calendar weeks.** Work in dependency order and mark complete only with test evidence. Estimates are rough hands-on engineering hours, not elapsed time or promises; parallel work, credentials, complexity and failures change them.

**Status legend:** `[x]` verified; `[ ]` unverified/not complete. `BLOCKED` only when a concrete dependency is recorded. Each completion must append a timestamp, evidence (test command/results or artifact), commit, owner and applicable release gate in the evidence log. Never mark complete from an agent's claim alone.

**Immutable launch gates:** no production change without approval; no unsolicited contact; no publishing/charges/refunds without scoped permissions; no CE/clinical or financial claims without verified authoritative record; human signs contracts; user never speaks card information to voice bot. Preserve 12 original brains/voices and 21 total named identities. Public and portal tenants must be isolated.

**Verified starting point:** Windows PostgreSQL restored from Ubuntu archive with 19 historical jobs (at restore), local Simon→Marie draft-only handoff passed on Windows and committed `38d864f`. Existing ZIP concierge source reviewed in previous discussion, but public deployment/auth/voice/CRM not accepted. All other checks remain unverified until audited.

**Launch definition:** no founder approval to publicly launch until M00–M08 are evidenced, with controlled exceptions documented and risk-approved. MVP = stable runtime + secure educator task assistant + one founder-to-review simulated lead workflow; commercial launch also needs payments, support, compliance and release gates.

## Progress
- Verified items: **2**
- Open items: **70**
- Total items: **72**
- Next critical path: **R03 → R04/R05 → S01–S05 → D04/D05 → V04/V05 → A01–A06 → L02/L03**
- Estimates: rough engineering effort per milestone; NOT dates or target weeks.

## M00 — Evidence baseline and scope (rough effort 1-2h)

- [ ] **E01** Inventory production portal, website, store, APIs, deploys and repositories; capture revisions. **Done when:** Audit report; no production writes.
- [ ] **E02** Map data owners and authoritative records for doctors, educators, courses, leads, orders and CE. **Done when:** Schema/source-of-truth table.
- [ ] **E03** Baseline 12 original + 9 added agent identities, brain versions and voices. **Done when:** Identity registry diff; no overwritten personas.
- [ ] **E04** Capture security, infrastructure and vendor-cost baseline. **Done when:** Access/cost matrix; secrets excluded.

## M01 — Stable Pegasus runtime (rough effort 3-8h)

- [x] **R01** Verify restored isolated Windows Postgres access and backup restore. **Done when:** DB verification evidence.
- [x] **R02** Verify Simon-to-Marie draft-only Ollama handoff. **Done when:** Both jobs completed and evidenced.
- [ ] **R03** Migrate isolated scheduled workers from WSL to Windows DB. **Done when:** Scheduled service reads correct database; old workers safely retired.
- [ ] **R04** Prove crash/restart recovery and lease expiry. **Done when:** Kill/restart simulation recovers exactly once.
- [ ] **R05** Prove idempotency, retries, dead-letter state and timeouts. **Done when:** Duplicate workload does not duplicate actions.
- [ ] **R06** Connect Jarvis to Windows runtime and distinguish stale/down/blocked. **Done when:** Health dashboard and alert tests.
- [ ] **R07** Capture structured logs, job trace IDs, error causes and evidence links. **Done when:** Founder can follow each job lifecycle.
- [ ] **R08** Enforce no live production, email, publishing or payments in tests. **Done when:** Negative authorization tests.

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

## Change control

On any completed item, attach: ID, exact command/test, outcome, database/environment, artifact or commit, timestamp, and remaining risks. If a regression appears, revert status to open and record why. No auto-credit for adjacent capabilities.
