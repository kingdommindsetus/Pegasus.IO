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
