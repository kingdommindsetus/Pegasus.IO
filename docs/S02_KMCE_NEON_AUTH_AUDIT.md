# S02 — KMCE Neon Auth session audit (PARTIAL, NOT ACCEPTED)

Scope: read-only inspection of KMCE educator-platform Git `origin/main` (previously recorded as commit `31438cc1`) and isolated local acceptance copy on Kingdom. No live credentials, real student accounts, production database, checkout or email action used. S01's seven-role design baseline is approved; this does **not** mean all roles exist in the live portal.

## Grounded observations

- `frontend/lib/auth/server.ts` constructs `createNeonAuth` and uses `NEON_AUTH_BASE_URL`; it supplies `NEON_AUTH_COOKIE_SECRET || AUTH_SECRET` with a **build-time fallback placeholder**. Whether production uses an actual secure secret and service URL remains unverified.
- The installed Neon Auth library documents a **minimum 32-character cookie secret** and `sessionDataTtl:300` as a *cached session-data TTL*. It is **not evidence that the authenticated session expires in five minutes**. Library middleware documentation states it can refresh sessions if required; successful refresh/revocation was not witnessed.
- `frontend/middleware.ts` uses `auth.middleware({loginUrl:'/auth/sign-in'})`. Its route matcher intentionally exempts checkout, webhooks and public-token routes, requiring separate route-specific validation.
- `frontend/lib/auth.ts` resolves `FOUNDER_ADMIN`, `EDUCATOR`, `STUDENT` based on authenticated session plus `app_users`, and `requireEducatorAccess` verifies educator ownership. However, `currentUser()` performs `ensureSchema()` and `app_users` INSERT/UPDATE on reads; login/retrieval are not pure reads. Founder and named-doctor privileges are bootstrapped based on configured email addresses; examine provisioning, identity verification, and revocation before enabling new roles.
- Multiple educator handlers filter their data by session educator ID and founder finance handler requires founder role. Other surfaces, including student-specific access and cross-educator isolation, still need two-identity staging tests.
- Previously observed without cookies on the live public portal (read-only GETs): `/api/auth/me` responded 401; educator performance and event endpoints responded 307 to sign-in. Do not interpret these as session expiry, refresh or tenant isolation evidence.

## Isolated tests

- `tests/s02-portal-auth-contract.test.mjs` executes **five passing source-contract assertions** against the current local `origin/main` files for Neon Auth session configuration, middleware defaults, ownership/role clauses, unauthenticated route branch, and fallback/side-effect risks. These are *source-presence* assertions, not runtime authentication proof.
- Attempted a direct Neon Auth + Next middleware smoke test in the isolated local acceptance copy, using a fake loopback auth URL and no real tokens or accounts. It **could not run** because the local dependency tree resolved `next/headers` to a different checkout and threw `ERR_MODULE_NOT_FOUND`. No authentication result was obtained. The temporary test file was not committed.
- **No successful isolated tests for expired sessions, refresh, logout, cookie attributes, forged-session handling or cross-tenant identities.** Therefore S02 acceptance criterion, **unauthorized and expired access denied**, is **not satisfied**.

## Safe next steps

1. Create a clean, immutable staging checkout at a specific deployed-source revision with an internally consistent Next/Neon Auth dependency tree and *dedicated* staging identity provider/database, no production secrets.
2. Issue synthetic staging founder/educator/student sessions and test expiry, refreshing, logout/revocation, tampered cookie, wrong role, two educators' tenant boundaries and two students' enrollment boundaries.
3. Confirm cookie flags (Secure, HttpOnly, SameSite, scope), token/session issuer and true expiry against the staging provider, not by inferring from `sessionDataTtl`.
4. Test authenticated data routes and public-token exceptions, then document patch and rollback plan before any production rollout.

**S02 remains OPEN.** No production or D:\Astra modifications; no voices, brains or live identities altered.

## 2026-10-13 — Isolated runtime acceptance progress (NOT FINAL)

### Standalone staging environment

- Created `C:\Users\info\PegasusVoiceEngine\acceptance-isolated\s02-auth-staging`, using a **separate real node_modules directory** (not the former kmce-current junction). Ran `npm.cmd install --offline --ignore-scripts` successfully; @neondatabase/auth `0.5.0-beta`, Next `16.3.6`, no live credentials or account connections.
- Copied `frontend/lib/auth/server.ts`, `frontend/middleware.ts`, and `frontend/app/api/auth/[...path]/route.ts` from inspected KMCE source to the staging app, then added an isolated `/secure` test route and a local HTTP auth-provider fixture on loopback only.
- The Next 16 initial boot attempted TypeScript/dev dependency installation in **the staging directory only** and reported peer-dependency warnings and one high-severity dependency advisory; those need dedicated dependency review before any real release. No production installation.
- Staging cookie secret is synthetic. Identity fixtures use `.invalid` email domains and fixed fake account IDs, not actual KMCE account records.

### Observed pass cases

1. `tests/s02-isolated-neon-auth-core.mjs`: real Neon Auth framework-independent middleware with local provider fixture: no cookie denied; forged denied; five synthetic sessions allowed; expired and revoked bare session tokens denied; a locally issued replacement token allowed; independent synthetic scope mapping kept founder, educator A/B and student A/B within their assigned resources. **Synthetic scope map is not the live `currentUser()` database implementation.**
2. `tests/s02-neon-cache-revocation.test.mjs`: real signed session-data JWT with `HttpOnly`, `Secure`, `SameSite=Lax`; invalid signature rejected; deliberately expired signed cache refreshed using an **active** local provider session.
3. `tests/s02-next-http-test.mjs`: actual minimal Next.js staging middleware: no cookie -> 307 sign-in, forged -> 307, expired -> 307, active synthetic identity -> 200 protected route.
4. `tests/s02-next-logout-mitigated.test.mjs`: actual Next API auth proxy produced a signed `__Secure-neon-auth.local.session_data` cookie with expected security flags; `POST /api/auth/sign-out` revoked the provider session in the local fixture and bare old token was rejected.

### Security gap reproduced — S02 BLOCKER

Before staging hardening, the signed session-data cookie plus a **revoked session token** continued to authorize `/secure` (HTTP 200) after successful mock-provider logout. The framework-independent core yielded `action=allow` in the same revoked-cache case. This is a cached-session revocation window; it is not proof of a live production exploit, and its maximum lifetime is bounded by the signed cache JWT expiration and configured cache TTL (source sets 300 seconds).

A **staging-only mitigation prototype** (saved as `docs/S02_STAGING_MIDDLEWARE_PROTOTYPE.txt`) forces provider revalidation for the protected `/secure` route using a server-built request with `disableCookieCache=true`. After this change, the exact previous old-token-plus-signed-cache attempt was denied with HTTP 307. This mitigation must be independently reviewed for correctness, performance and sensitive-route coverage before proposed production use. A client-supplied query parameter is not a sufficient authorization policy. Do **not** blindly copy the prototype to the live app.

### Remaining mandatory verification

- Real Neon Auth hosted/session-service **token renewal** and refresh semantics have not been tested. The SDK's signed-cache refresh was tested; these are different claims.
- Authenticated `currentUser()` and founder/educator/student **database** separation must be tested with dedicated *staging* identities and a staging database, including cross-tenant negative access and revocation.
- Verify actual production deployment revision, effective cookie/session configuration, and signout behavior via an approved controlled process. Do not assume source/localhost parity.
- Stage a reviewed mitigation for protected routes; prove no authorization via revoked cached credentials before any production rollout.
- Fix or risk-review the isolated staging dependency advisory, and establish reliable staging lifecycle/teardown scripts.

**S02 is intentionally OPEN.** Session-core/staging proofs are logged here, but all required secure-session and portal tenant tests have not passed. No production deployment, emails, payments, real sessions or D:\Astra changes were made.

## 2026-10-13 — Reconnected Kingdom; S02 path-hardening policy checks

After Desktop Commander restored terminal access, reviewed commit `458e1d2` and the existing isolated middleware revalidation prototype. Added `tests/s02-session-guard-path-policy.mjs` and ran `node --test`: **3/3 passing**. The proposed server-side URL policy forces `disableCookieCache=true` for named protected founder, educator, student, administration, and API routes; uses explicit public-route exclusions; and replaces a malicious query value of `false` or `0` with `true`. This is a **pure policy unit test**, not proof that the rule is integrated across all Next.js routes. It does not change portal middleware, staging identities or production.

**S02 still OPEN:** require integrated Next.js regression for every protected route, expiry/revocation with real staging Neon Auth, and database-backed cross-account isolation. Do not generalize the synthetic role assertions or policy unit test into an accepted security guarantee.
