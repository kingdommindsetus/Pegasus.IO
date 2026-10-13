# R08 — Isolated execution safety acceptance

## Scope

This acceptance is limited to the dedicated **Windows isolated test workers**, not all possible future agent adapters or production deployment. The approved objective is `cbe5f353-25de-4daa-a69e-09b326299fea`; database `pegasus_world_windows_accept_1011`; role `pegasus_windows_accept_role`; only loopback 127.0.0.1.

## Defense-in-depth

- The workers only claim Simon `search_company_memory` and local Ollama `generate_content` jobs with `draftOnly=true`, `externalActionsAllowed=false`, correct objective/role/database and attempt limits.
- `isolatedSafetyPolicy.ts` rejects production and wrong database/role, unrelated agents/objectives/skills, live operations, remote reasoning for model generation, external actions and send/publish/charge/deploy indicators.
- The guard runs **inside** the transactional isolated job claim before any mutation. Rejected candidate claims roll back. Lease, run ownership and completion fencing were previously proven in R05.
- Source audit of both isolated worker executors confirms that only the local Ollama endpoint `http://127.0.0.1:11434/api/generate` is called; the other worker executes an internal draft checkpoint. Neither isolated worker imports mail, publish, payments or deployment adapters.
- The general `core/runtime/execution/coreSkills.ts` currently returns draft/planning objects for supported skills; it is **not** an external-action executor. Other app/API entrypoints and commercial integrations remain subject to separate permissions/security launch gates.

## Test evidence

- `tests/r08-negative-authorization.test.ts`: **19 passed, zero failed**, covering approved draft positive cases and 17 denied scenarios (production/wrong DB, wrong role/objective/agent, outbound skills, live actions, external-action flags, remote reasoning).
- `tests/r08-isolated-database-denial.ts`: seeded synthetic unsafe queued job with `send=true` in the isolated database, invoked the actual transactional claim, asserted rejection, job still queued, attempts unchanged, lease NULL, zero run rows, then removed the fixture. No outbound service was called.
- TypeScript `tsc --noEmit` and `git diff --check` passed.
- No production deployments, email sends, posts, payments, or `D:\Astra` changes.

## Explicit non-claims

This is not a complete audit of production-facing adapters, payment idempotency, consent/approval matrices, or all future custom plugins. Those remain future security/commercial acceptance requirements. It proves the existing **isolated Windows test execution path** fails closed for unauthorized actions.
