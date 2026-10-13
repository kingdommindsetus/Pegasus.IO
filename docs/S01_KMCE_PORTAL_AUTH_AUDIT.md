# S01 KMCE Portal — Approved RBAC baseline & read-only source audit

**Decision:** Founder approved the seven-role least-privilege policy proposed in `S01_ROLE_PERMISSION_MATRIX_DRAFT.md` on 2026-10-13. This is a DESIGN BASELINE approval only: no authorization migration, new privileges, or production changes are approved.

## Source provenance and limitations

Inspected the existing `C:\Users\info\kmce-educator-platform` Git repository read-only on Kingdom, using `origin/main` at commit `31438cc1` (merge #158), because the checked-out `archive/legacy-kmce-2026-10-08` working tree is intentionally minimal. The inspected source **may not exactly match the deployed Vercel commit**; production deployment hash was not verified. Inspected the unauthenticated public behavior at `https://portal.kingdommindsetce.com/` without logging in or mutating production.

## Current code versus approved matrix

| Approved role | Existing source identity | Result |
|---|---|---|
| Founder | `FOUNDER_ADMIN` | Exists; `requireFounder()` checks role; role bootstrapped from `KMCE_FOUNDER_EMAIL` |
| Staff | No `STAFF` in `KMCEUser` | Missing; no approved scope enforcement yet |
| Educator | `EDUCATOR` | Exists; `requireEducatorAccess(id)` checks claimed educator ID against server session-derived `educator_id` |
| Doctor | No independent `DOCTOR` role | Missing; current named doctor can be bootstrapped as an educator |
| Student | `STUDENT` | Exists as a default for new email identities; a verified private enrollment-scoped API was not found in the examined route inventory |
| Public visitor | Middleware exclusions for public certificate/evaluation and checkout paths | Public token-based routes exist; require separate token entropy, revocation and disclosure assessment |
| Service-agent | Agent routes exist but human RBAC model does not have this principal type | Needs distinct machine identity, scoped grants, approval enforcement and audit trail |

## Verified implementation details

- `frontend/lib/auth/server.ts` uses `createNeonAuth` with signed cookies and a 300-second session-data TTL. It has a build-time fallback string for secret/baseUrl; **verify live configuration separately**, do not infer production is using fallbacks.
- `frontend/middleware.ts` wraps routes in `auth.middleware({loginUrl:'/auth/sign-in'})` and explicitly excludes certain webhook, public certificate/evaluation, checkout and static routes.
- `frontend/lib/auth.ts` reads `auth.getSession()`, then performs `ensureSchema()` and an `app_users` UPSERT (last_login_at on reads). Existing `FOUNDER_ADMIN`, `EDUCATOR`, `STUDENT` role resolution uses configured founder/doctor email bootstraps. `requireEducatorAccess` checks educator ID except for founder role.
- `frontend/app/api/educator/performance/route.ts` requires EDUCATOR and an educator_id, and filters leads, courses, commerce transactions, and tasks by that educator ID.
- `frontend/app/api/educator/events/route.ts` checks EDUCATOR and educator_id; event-registration aggregation uses educator-owned event IDs.
- `frontend/app/api/admin/educators/[id]/finance/route.ts` checks `requireFounder()` before writes; `frontend/app/api/admin/educators/[id]/courses/route.ts` uses educator ownership and founder checks. `frontend/app/api/faculty/documents/route.ts` checks ownership on upload.
- `frontend/app/api/public/certificate/[token]/route.ts` and `frontend/app/api/public/evaluation/[token]/route.ts` use bearer-like verification tokens in URLs without a general user session; audit token entropy, TTL/revocation, private fields and content before external release.
- Live **unauthenticated GET** observations: `/api/auth/me` -> **401**; `/api/educator/performance` -> **307 sign-in redirect**; `/api/educator/events` -> **307 sign-in redirect**. These checks do not prove authorized or cross-tenant data isolation.
- The previously inspected **Pegasus isolated test database** had no active table-level RLS; **this says nothing conclusive about Neon RLS policies in the separate KMCE production database**, which was not accessed.

## Open security acceptance gates (S02–S05 and follow-up)

1. Verify deployed commit, session issuer/cookie flags, TTL, refresh and logout/revocation in a separate staging environment.
2. Implement a vetted identity-to-role/membership model for STAFF/DOCTOR/SERVICE_AGENT in staging. Avoid auto-granting founder or educator privileges solely through an unverified email; retain authenticated identity and explicitly provisioned membership.
3. Test two separate real staging educator accounts: educator A cannot read educator B's courses, CRM, students, compensation or document vault; an unauthenticated user is denied; role revocations take effect.
4. Test two learner identities: each can access only own enrollments, completion records and certificates via authenticated routes; public certificate verification reveals minimum appropriate data.
5. Audit all mutation endpoints and token-public actions for authorization, CSRF/anti-replay, explicit approval and audit logging. Avoid auth checks that silently write production records on every read.
6. Verify database enforcement with staging RLS or equivalent server queries. Do not assume permission from UI visibility.
7. Use a reviewed release/rollback plan and explicit founder authorization before touching production.

**No production modifications were made during S01.** No identities, database rows, payments, emails or live entitlements were created or changed; no agent voices, brains or D:\Astra files were modified.
