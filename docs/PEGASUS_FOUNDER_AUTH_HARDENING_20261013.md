# Pegasus founder authentication hardening — staging checkpoint

Date: 2026-10-13
Branch: `feature/pegasus-capability-bus-20261013`
Status: Security patch coded and tested in isolation. **Gate 6 NOT PASSED**.

## Finding

Before this patch, `api/core/session.ts` issued a signed founder cookie from any non-rate-limited POST login request whenever `PEGASUS_CORE_API_SECRET` was set, and returned `passwordRequired:false`. This relied on deployment-level protection for all login access, which is insufficient if protection is absent or misconfigured. The browser component already offers a founder password field and submits it; the server was ignoring it.

## Change

- `api/core/session.ts` now requires both a configured signing secret and founder password; otherwise it returns 503 and no cookie.
- POST `login` must pass server-side `validAdminPassword`, which uses constant-time comparison. Missing or invalid password returns 401 with no cookie.
- Unknown session actions return 400, and successful login reports `passwordRequired:true`.
- The existing `HttpOnly; Secure; SameSite=Strict` session cookie remains unchanged.
- GET only checks existing signed founder cookie; logout clears it. No session claims, agent brain files or voice settings changed.
- Test `tests/p0-founder-session-auth.test.ts` uses dummy in-memory environment secrets and checks all fail-closed cases, forged and expired cookies, and logout. It accesses no customer or production system.

## Operator requirements **before** deploying this patch

Configure `PEGASUS_CORE_API_SECRET` and `PEGASUS_ADMIN_PASSWORD` as distinct strong secrets using the target deployment's secret manager. Never save the values in Git, test output, front-end environment variables or issue trackers. Verify behind deployment protection, then test correct/incorrect login, logout, expired session, CSRF protections, tenant scope and rate limiting.

**Pending to pass Gate 6:** company-scoped founder authorization, actual staging environment secret configuration, negative tenant tests, and verified login across the deployed environment. Do NOT count this code-only hardening as production authentication acceptance. No push, migration, production deployment, emails or payments performed.

## Isolated organization-scoped reader — additional acceptance

Implemented `api/core/founder-activity.ts` and registered the route in `server.ts`. Added `src/components/GodsEyeFounderActivityPanel.tsx` to the God's Eye development page. The endpoint:

- Accepts **GET only**, with an unexpired signed founder session cookie; it does not accept the service API-secret header as a substitute for founder login.
- Reads `PEGASUS_FOUNDER_ORGANIZATION_ID` **from the server environment only**. Missing/invalid organization scope returns 503, fail closed. Browser-supplied organization selectors have no effect.
- Filters job records through `jobs -> tasks -> projects.organization_id` at the SQL layer. Returns only job metadata, timestamps and linked run/evidence/event/memory **counts**; never raw user input, model output or private payload.
- Denies cross-site fetch contexts, uses no-store/private cache policy and enforces a bounded limit.
- Does not grant publication, task execution, payment, staff actions, or a blanket global view of all organizations.
- Displays read-only provenance in the founder UI; unauthenticated or unconfigured reads display an unavailable state instead of invented activities.

The negative acceptance test `tests/p0-founder-org-scope-isolated.ts` used two freshly created **synthetic** organizations on the existing Windows local test database. It verified that the configured founder only sees that organization's jobs, request-supplied organization IDs cannot override scope, another organization's synthetic job stays hidden, private payloads are withheld, unsigned/service-only requests and writes are denied, and missing scope fails closed. Fixtures were deleted after the test.

**Important limitations:** The selector is one organization ID configured **per deployment**. Multi-organization membership and secure company switching are future work. Existing War Room missions may have different organization IDs because the older mission creation code creates a new organization per mission. The new founder reader deliberately will not display these unless their projects belong to the configured organization. Do not weaken the query to make records appear.

**Still required before marking Gate 6:** a verified deployment-level founder credential setup, a company ownership/membership plan, mission creation and execution scoped to that company, negative staging browser tests and review of session/cookie propagation. **Gate remains 5/10 = 50%.**

## Follow-on checkpoint — same-day company authorization closure

The new code-only scope protection now extends to `api/core/mission.ts`, `api/core/step.ts`, `api/core/world-jobs.ts`, and `api/core/world-events.ts`.

- New War Room missions reuse `PEGASUS_FOUNDER_ORGANIZATION_ID` rather than creating an unrelated organization. Missing organization configuration fails closed, and a missing pre-provisioned company cannot silently create a tenant.
- Hydrate restricts the latest/explicit mission to the configured organization. Status and Simon Executive Close return 404 for a foreign mission, before any model call.
- HTTP execution passes the configured organization to the atomic PostgreSQL claim query. Its organization predicate is evaluated inside the claim transaction; internal test-only callers keep the previous optional signature for compatibility.
- Legacy world-job and event feeds now read only records belonging to the configured company, including job events linked through their task/project ownership.
- Negative acceptance on the named, loopback-only Windows PostgreSQL database passed with two synthetic organizations: activity, hydrate/status/close and both read-only feeds did not leak other tenants. Tests created completed (non-runnable) fixtures and cleaned them up; no agent runs or external actions were invoked.
- Founder login, environment-contract, provider-contract and TypeScript checks pass. The production build is verified separately.

**Gate 6 remains NOT PASSED / launch board remains 50%.** Still required before deployment: authoritative company provisioning/ownership and role membership policy, plan for legacy missions created in other organizations, actual staging secrets and session-cookie/CSRF/browser verification, deployment protection and tenant-isolation tests against staging. Do not promote this security branch directly to production without those checks. No push, DB migration, live purchase, outreach or live deployment performed in this checkpoint.

## Company workspace bootstrap — isolated acceptance

- Canonical workspace: `Kingdom Mindset CE` (`kingdom-mindset-ce`). Pegasus.IO is the orchestration platform; the company is the tenant that owns its projects and job activity.
- Added `core/database/provisionFounderOrganization.ts` with **dry-run default**, exact hostname/database/role checks, non-production-only (`isolated` or dedicated `staging`) enforcement, explicit confirmation before insertion, slug uniqueness and idempotent reuse. It neither migrates schemas nor reparents historic missions.
- Tested using the named Windows **isolated local** PostgreSQL acceptance database and the dedicated Node test runner `tests/p0-provision-founder-organization-isolated.mjs`. The first read-only run reported `would_create`, the explicit apply reported `created`, and re-apply returned the **same UUID** with `exists`. No external agent jobs, emails or payments ran.
- The UUID from this exercise is **local-only**. Never copy it to production or Vercel preview unless that deployment is proven to use the same database (which it should not). Each database must resolve its own unique organization UUID from its own organizations table.
- A separate production or preview database has **not** been provisioned by this operation. `PEGASUS_FOUNDER_ORGANIZATION_ID` has not been configured on Vercel.
- Before staging: verify the actual deployment-to-database mapping without revealing credentials; create/identify a dedicated staging database with the Pegasus Core schema; validate company ownership and founder membership policy; run the bootstrap with the exact dedicated staging host/database/role; set staging-scoped founder UUID only after verification; test protected browser login, wrong-company scope, legacy mission visibility and signed-session propagation.
- Security limitation: per-deployment single-tenant UUID selection does not replace an explicit company membership/role model. Gate 6 remains **NOT PASSED** and the launch dashboard remains **50%** until deployment acceptance passes.

## Preview-only database identity diagnostic — pending deployment acceptance

Added `api/core/staging-diagnostics.ts` and registered it in local `server.ts` at `GET /api/core/staging-diagnostics`.

- Disabled outside `VERCEL_ENV=preview` (404); accepts GET only and a valid signed founder session cookie, not merely a service API key.
- Denies cross-origin requests and rate-limits; returns `Cache-Control: private, no-store` and `Vary: Cookie`.
- Reads only PostgreSQL `current_database()`, `current_user`, existence of the `pegasus_core.organizations` schema, the canonical `Kingdom Mindset CE` organization ID/name/slug, and whether the configured founder organization ID matches. It does not return database URLs, hostnames, passwords, task inputs/results, model outputs, emails or payment details. It writes nothing.
- Positive acceptance in the isolated local database passed with the already-provisioned company and synthetic signed founder cookie. Negative tests passed for production disabled, missing environment, unsigned/service-only requests, forged session, cross-site request and POST.
- Confirmed Vercel project `pegasus-io` has `war-room-v2-preview` scoped `DATABASE_URL`, `PEGASUS_CORE_API_SECRET`, and `PEGASUS_ADMIN_PASSWORD` variable entries. No `PEGASUS_FOUNDER_ORGANIZATION_ID` entry appeared in the non-decrypted env listing at the time of inspection. Database contents and the underlying preview connection target are **not confirmed** by env metadata alone.
- IMPORTANT release-path warning: recent `pegasus-io` production deployment metadata identifies the private `Pegasus.IO-internal` repository; preview `war-room-v2-preview` deployment metadata identifies public `Pegasus.IO`, matching this checkout's remote. Do not assume the current local security patch is in either deployed build. Do not push this feature branch, change production settings or replace the preview DB URL without reviewing branch target and the destination schema.

Next acceptance: review the exact preview target and protected source commit; deploy the reviewed preview-only diagnostic via a separate staging release path; authenticate through protected preview; record only database-name/role and schema/company identity; then provision the **preview database's own** company UUID if missing, configure it only for that preview environment, and re-test login, tenant isolation and missions. Do not treat the isolated local UUID as a staging UUID. **Launch remains 50% / Gate 6 open.**

## 2026-10-13 real preview database audit — verification blocked safely

Audit target: Vercel project `pegasus-io` (`prj_INz5WFbYcLtNjfkKFhWrp8qjsPcF`), historical `war-room-v2-preview` deployment `dpl_4TgLprvfXGH265wp38y8CmMnXEjr`.

- The old deployment is `READY` and its `GET /api/health` endpoint answered `status: ok` using an authenticated `vercel curl` call. That verifies HTTP service health **only**; it does not prove database identity or Pegasus Core readiness.
- `GET /api/core/verify` and `GET /api/core/staging-diagnostics` are **not deployed** on that old preview (Vercel NOT_FOUND). The newer local authenticated preview diagnostic has passed isolated tests, but has not been shipped.
- Deployment metadata links the old preview to a public `Pegasus.IO` commit on `war-room-v2-preview`; that ref and commit are no longer retrievable from the connected GitHub repository. Current production deployment metadata points to the distinct private `Pegasus.IO-internal` repository. Do not assume source parity.
- Non-decrypted Vercel environment metadata confirms a `DATABASE_URL` entry specific to preview branch `war-room-v2-preview`, plus a generic production/preview `DATABASE_URL` entry. The actual connection target was **not** read or inferred from those entries; avoid secret retrieval.
- No Vercel `PEGASUS_FOUNDER_ORGANIZATION_ID` environment entry was present. The isolated local UUID must **not** be inserted into Vercel.
- Read-only Neon checks of the accessible `kmce-staging` project and `kingdom mindset ce` project returned `to_regclass('pegasus_core.organizations') IS NOT NULL = false` for their respective default databases. They cannot be assumed to host Pegasus Core or correspond to Vercel's preview `DATABASE_URL`.
- Local Vercel CLI version `50.1.3` does not support `vercel env run`, despite newer documentation. No local credential export, database modification, Vercel project-setting edit, Git push, preview deployment or production deployment was done.

**Safely blocked requirement:** conclusively identify the Vercel branch-specific preview database under authenticated, read-only execution. Then select its canonical company UUID or provision with the environment-scoped guarded bootstrap, configure the preview-only organization setting, and run browser tenant/auth acceptance. Preserve feature-branch changes and do not reintroduce unauthenticated founder-login logic from public `main`.

**Operator progress:** 50% / Gate 6 open. Do not count the HTTP health check as DB acceptance.

## Branch-specific preview environment injection verdict

Tested non-mutating `vercel env run -e preview --git-branch war-room-v2-preview` with temporary Vercel CLI 64.0.1, leaving globally installed CLI 50.1.3 unchanged. CLI successfully found the preview environment, but warned that three protected Secret values cannot be pulled. A benign child process verified `DATABASE_URL` was **not** present; no credentials were read, displayed or exported. Thus a local read-only PostgreSQL probe cannot conclusively examine this protected branch-specific database with the current permitted environment access. A guarded read-only script exists at `tests/p0-vercel-branch-db-readonly.ts`, but it was **not** run against remote infrastructure.

Next operator milestone: restore a **reviewed protected preview release** containing the existing founder-authenticated, preview-only diagnostic and test it from its own serverless runtime, where the managed secret is available. Do not deploy the old public-main founder login, do not disable SSO/deployment protection, and do not apply the local UUID to Vercel. Actual database mapping remains unverified. Gate 6 / 50% unchanged.

## Gate 6 — Protected preview release acceptance (2026-10-13)

- Prepared a **local-only** branch `war-room-v2-preview` from security-hardened feature work. Recorded commit `143ccb832c10fe0f11c981f550260af607c51fb4` containing reviewed security and diagnostics changes. No push to any GitHub branch or production release was performed.
- Built a Vercel **preview-only** deployment `dpl_ACkJxk2n19fAtcM8MHQbQJEHvkvB` at `https://pegasus-e94k16jwg-kingdommindsetus.vercel.app` via linked project `pegasus-io` (`prj_INz5WFbYcLtNjfkKFhWrp8qjsPcF`) using `vercel deploy --target preview`. Vercel metadata explicitly identifies the reviewed commit, `war-room-v2-preview` branch and CLI source; the deployment is READY with `target=null` (preview).
- Confirmed project SSO/Vercel Authentication policy is enabled for all `.vercel.app` deployments (`all_except_custom_domains`). Authenticated CLI can access the preview without weakening the deployment protection. Separate unauthenticated raw HTTP verification was inconclusive; do not represent it as passed.
- Authenticated Vercel CLI GET `/api/core/staging-diagnostics` returned HTTP **401**, body `Founder session required`, `Cache-Control: private, no-store`, `Vary: Cookie`. GET `/api/core/session` returned HTTP **401**, body `ok:false`. No cookie/secret used.
- POST `/api/core/session` without a valid password returned HTTP **401 Unauthorized**, with no session cookie issued. POST `/api/core/staging-diagnostics` returned HTTP **405 Method Not Allowed**. No mutating API, agent run, payment or email was triggered.
- Re-checked Vercel production deployments: latest production remains `dpl_2TDgoG1WSPeqLfCmPmuAwLLnnszF` at commit `d85384d54` from private `Pegasus.IO-internal`. Production domains and deployment were not promoted or changed.
- Source gates before preview: seven automated tests passed (session, fail-closed tenant scope, diagnostic access, bootstrap protections, environment contract, provider contract), TypeScript passed, and isolated Chrome UI smoke passed at launch score 50%.
- **NOT YET VERIFIED:** actual preview `DATABASE_URL` target, whether `pegasus_core.organizations` exists there, canonical `Kingdom Mindset CE` UUID and preview-specific `PEGASUS_FOUNDER_ORGANIZATION_ID` match. Valid founder session is required to query the server-side diagnostic. Managed founder and DB secrets were never retrieved or printed. No matching credentials were available in the ignored local `.env.local` file.
- The browser operator can authenticate on the protected preview using the founder password stored in the authorized secret manager, then open `/api/core/staging-diagnostics` in the **same browser session**. Record the sanitized response (`databaseName`, `connectionRole`, `coreOrganizationSchemaReady`, `company` ID/slug, `configuration`) without sharing passwords or tokens. If 503, inspect server logs rather than exposing credentials. If company missing, provision on the **verified preview database**; never reuse the local acceptance UUID.
- **Gate 6 remains OPEN. Dashboard remains 50%.** Do not infer database acceptance from HTTP 401 or healthy static page; do not promote to production until session and tenant scope tests pass against preview DB.

## Gate 6 operator diagnostic panel and session truthfulness hardening

- Added `src/components/PreviewDatabaseAudit.tsx`, displayed only when the War Room URL contains `?staging-audit=1`. It is read-only; it displays a fixed 50%/10-of-20 launch bar, and the VERIFY DATABASE button stays disabled unless a founder session is validated.
- The panel requests the preview-only GET `/api/core/staging-diagnostics` with same-origin credentials and no-store cache, then displays sanitized database name, role, organizations schema readiness, canonical company UUID and scope match; it never exposes a connection URL, credentials, or customer payloads.
- Fixed an existing `CoreWarRoomV2` client authorization-UX bug: previously any HTTP 200 from GET `/api/core/session` set `unlocked=true` even if it was a misrouted HTML page. The UI now checks for a JSON response with explicit `ok:true`; otherwise it remains locked. The API already performs its own authentication; this fixes the visual discrepancy and prevents misleading operator indications.
- The isolated Chrome smoke test now navigates `/?staging-audit=1` and verifies the panel, the 50% bar, sign-in requirement, and disabled Verify Database button. TypeScript, Vite build and Chrome smoke all passed before redeployment.
- Staging verification still requires the operator's genuine founder password via the protected browser. No password, session cookie, or Vercel database secret was inspected, saved or disclosed. Gate 6 remains open.
