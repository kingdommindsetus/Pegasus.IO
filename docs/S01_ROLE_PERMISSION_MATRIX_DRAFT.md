# S01 — Proposed human/agent permission matrix (FOUNDER APPROVAL REQUIRED)

**Status: draft, NOT approved or connected to production authorization.** Based on inspection of Pegasus.IO-production on Kingdom and isolated Windows test database. This is not a verified audit of the separate deployed KMCE educator/student portal.

Legend: **P** public view; **O** only an authenticated, server-verified owned resource; **A** only a server-verified assignment; **V** verified founder; **H** explicit per-action human approval; **I** isolated approved draft-only service scope; **—** deny by default. User-supplied role, owner, assignment, or approval flags are **not** trustworthy authorization evidence.

| Action/resource | Founder | Staff | Educator | Doctor | Student | Public visitor | Service agent |
|---|---|---|---|---|---|---|---|
| Public catalog | P | P | P | P | P | P | P |
| Own enrollment / CE progress | V* | — | — | — | O | — | — |
| Own course & draft | V* | — | O | — | — | — | — |
| Assigned clinical roster | V* | — | — | A | — | — | — |
| Assigned/owned CRM | V* | A | O | — | — | — | — |
| Company-wide revenue & configuration | V | — | — | — | — | — | — |
| Internal test drafting | V | — | — | — | — | — | I |
| Send email, publish, charge, deploy | H | — | — | — | — | — | — |
| Grant permissions / approve external action | V plus independent approval verification | — | — | — | — | — | — |

*Founder access to individual private student/clinical records should be explicitly justified and logged under minimum-necessary rules before implementation, not treated as automatic through this draft.

## Existing code findings

1. `api/core/_security.ts` uses HMAC-signed founder-role cookies, eight-hour expiry, and a server secret; `api/core/session.ts` issues a founder cookie when the secret is configured **without an application-level identity/password check**. The code states it relies on deployment-level protection. That external protection was not independently verified. This is a high-priority access-design risk and should be addressed before broad role expansion.
2. `core/runtime/execution/postgresPermissions.ts` consults per-agent `pegasus_core.agent_skills` with deny fallback; migration `006_full_agent_permissions.sql` marks Echo send/update and Booker scheduling as approval-required. It is an **agent skill** permission model, not a human RBAC, educator tenancy or student enrollment access model.
3. The isolated PostgreSQL role `pegasus_windows_accept_role` is login-enabled but not superuser and does not bypass RLS. **No inspected tables in `pegasus_core` had RLS enabled**, and no user/membership/enrollment tables were found in the isolated schema's inspected name search. Therefore educator/student row isolation cannot be asserted from that database.
4. The production KMCE portal is a separate application; the directory currently audited was `Pegasus.IO-production`. Live portal authorization, OTP, educator ownership and student course gating remain unverified here.
5. Existing isolated-worker R08 limits are separate and must stay in place; no agent brains, model voices, passwords or production integrations were changed.

## Security design before production

- Establish an authenticated identity provider/session with role membership evaluated **server-side**, including expiration, revocation and fresh verification for founder-sensitive actions.
- Model organizations, educator-course ownership, enrollment/student scope, doctor assignments, staff CRM assignment and service-agent grants as durable memberships rather than client-controlled values.
- Enforce tenant and resource ownership at the database access layer (e.g., carefully tested RLS or equivalent scoped queries), and test cross-tenant accesses, mismatched identities, forged approvals, suspended users and revoked tokens.
- Require action-specific approval records for externally visible changes, payments, publishes, mail and deployment. Approval must be independently checked by the executor; never trust `humanApproval: true` from an API request.
- Log access decisions without leaking student, patient, payment or private clinical details.
- Apply changes to an isolated development clone before any production authentication migration; plan a founder recovery mechanism to prevent administrative lockout.

## Draft implementation and acceptance

`core/approvals/roleMatrixDraft.ts` is a **pure proposal helper, not authoritative middleware**. `tests/s01-role-matrix-draft.test.ts` verifies public views, unknown/unverified identity denial, owner/assignment scoping, no external actions for service agents, and required founder approval. This code intentionally is not wired to HTTP routes or live records.

**S01 cannot be checked off until the founder explicitly approves this matrix and the separate KMCE portal's identities and tenant boundaries are inventoried.** The next security phase should turn an approved matrix into authenticated, database-enforced policies with negative HTTP and cross-tenant tests.
