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
