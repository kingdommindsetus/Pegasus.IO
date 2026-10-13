# Pegasus → Astra persistent job handoff — isolated acceptance

**Scope:** isolated Windows PostgreSQL acceptance database and local Ollama only. The experimental handoff is not mounted in the production API, scheduled agent worker, or any external-action channel.

## Implementation

- `core/work/jobs/isolatedAstraHandoff.ts` reuses the existing Pegasus tables: `pegasus_core.jobs`, `job_runs`, `evidence`, `memories` and `events`.
- Database is strictly bound to `127.0.0.1:5432/pegasus_world_windows_accept_1011`, restricted role `pegasus_windows_accept_role`, existing isolated objective `cbe5f353-25de-4daa-a69e-09b326299fea`, and a Simon-assigned task.
- Jobs are uniquely marked `astra_kmce_readonly_v1`; inputs must request draft-only, external actions disabled, and local Ollama. Unexpected input keys are rejected. Enqueue uses an idempotency key and low queue priority.
- Unlike generic workers, processing targets **one explicitly provided job ID** inside a database transaction and uses the existing `startOwnedIsolatedRun` and `finishOwnedIsolatedRun` fencing/lease-checked paths. No other queued task is intentionally claimed.
- `answerKmceWithValidation` uses the five-source pilot knowledge pack, local `astra-main`, and deterministic completeness/citation checks. A model response requiring review is saved as `draft_assessed` / `needs_review`, **not** an accepted customer answer.
- Completion writes a run record, evidence per source, a single project handoff memory and one completion event. Result explicitly records `externalActionsExecuted:false`.

## Verified database acceptance on Kingdom

Executed `tests/isolated-astra-queue-acceptance.ts` using the pre-existing local isolated PostgreSQL acceptance connection. Output:

`ASTRA_PERSISTENCE_ACCEPTANCE` with job ID `3b9672f3-1230-487a-bae7-c9066b0706f9`, status `completed`, validation `needs_review`, evidence 2, project memories 1, completion events 1, completed job runs 1, external actions 0.

Repeat enqueue with same idempotency key returned the same job ID. Re-processing the completed job returned no new work. Existing unit suites for the local bridge, source knowledge and validator passed **13/13**. TypeScript no-emit check passed after correcting test typing.

The acceptance job was intentionally retained as traceable evidence in the **isolated database**. No production database, mail, payment, website or third-party services were modified. No modifications made to Astra source, agents' brains or voices.

## Important limitations and next controls

- The test demonstrates persistent Pegasus-to-local-Astra processing, **not** permissioned access to KMCE production data or the full Astra agent gateway.
- `needs_review` jobs are technically completed executions, but their factual answer is withheld. A future human-review workflow must distinguish *execution complete* from *content approved*.
- The current generic isolated worker may also claim generic `generate_content` jobs if running concurrently; the pilot's low-priority job selection and direct job-ID claim reduce—but do not formally eliminate—the possibility of competition. Before enabling concurrent workers, add a claim-level marker exclusion to generic workers with isolated regression tests.
- No real patient/student data. No external action scope. S02 authentication and tenant isolation remain unfinished.

**Launch tracker stays at 9/72 (12.5%), 63 open.**

## Final guard hardening and repeat acceptance

Before final commit, `validatePilotInput` was hardened to require at least one matching approved knowledge source, and to invoke the existing Astra draft guard **before enqueue**, rejecting unsupported and side-effect-seeking questions rather than leaving an invalid job claimed. TypeScript check passed.

Re-ran isolated database/model acceptance after that change: second unique job `535f0fd3-6f87-4290-9d07-9ee2f3138a51` completed with validation `needs_review`, 2 evidence rows, 1 project memory, 1 completion event, 1 completed run, and 0 external actions. The job remains in the isolated database for inspection. Both records are synthetic.

## 2026-10-13 continuation: worker isolation and failure handling

- An Astra-only `astra_knowledge_draft` skill now marks pilot jobs. Generic global, objective-scoped, and isolated draft workers exclude jobs bearing `astra_kmce_readonly_v1`. Only the explicit `isolated-astra-worker` may start a marked pilot job, after revalidating its safe inputs.
- `astraDraftReview` classifies even factually complete drafts as `pending_human_review`; automatic approval deliberately raises a denial. A completed *execution* is not an approved answer.
- The worker now records a local model failure through `failOwnedIsolatedAstraRun`, using the same owned-run lease fencing. It sets the job and run to `failed` and writes a failure event; it does not publish draft content, create evidence or memory, or perform external actions.
- The acceptance script now covers both a deterministic validated-draft path and a simulated local model outage. The positive persistence path was observed passing on the isolated database; the negative test reached its SQL assertions, encountered a test-only text/UUID comparison error, and the query was corrected. A fresh database rerun is **still required** because subsequent database execution attempts were blocked by connection controls.
- TypeScript `tsc --noEmit` passed, 17/17 offline bridge/knowledge/validator/isolation tests passed, and `git diff --check` passed. These do **not** replace the outstanding database failure-path acceptance test.
- No deployment, production data, email, payment, or patient data modification was part of this continuation. The feature branch is not production.

**Next safety gate:** rerun both database assertions when the isolated database test runner is available; then review the worker's lease timeout/expiration recovery and consider a permissioned human-review workflow. Do not enable Astra dispatch, automatic publishing, or production data access before S02 authorization and tenant isolation pass.
