# Contributing to Pegasus.io

Thanks for helping improve Pegasus.io.

Pegasus is maintained as a governed executive-agent system. Changes must preserve the canonical provider architecture, durable Postgres state, memory trust boundaries, and release security gates.

## Development Setup

1. Fork or clone the repository.
2. Create a feature branch from current `main`.
3. Run `npm install`.
4. Copy `.env.example` to `.env.local`.
5. Add only local credentials to `.env.local`.
6. Apply database migrations in `core/database/migrations/` in numeric order.
7. Run `npm run dev`.

Never commit credentials, private keys, connection strings, production database exports, or local environment files.

## Canonical Architecture

Contributions must preserve these production paths unless a deliberate architecture change is approved:

- Reasoning: `core/runtime/agents/pegasusReasoner.ts` → Google AI Studio via `@google/genai`
- Voice: `api/pegasusVoiceRegistry.js` → `/api/agent/speak` → ElevenLabs
- Voice fallback: Browser Web Speech
- Durable state: PostgreSQL
- Trusted memory partitions: `company_memory`, `agent_role_memory`, `mission_run_memory`

Do not add parallel provider stacks, client-side secret use, browser-authoritative memory, or ungoverned autonomous actions.

## Pull Request Workflow

1. Branch from current `main`.
2. Make the smallest coherent change.
3. Add or update tests for behavior/contracts affected by the change.
4. Run locally:

```bash
npm run typecheck
npm test
npm run build
```

5. Push your branch.
6. Open a pull request against `main`.
7. Resolve all review conversations.
8. Keep the branch up to date with `main`.
9. Merge only after all required checks pass.

## Required Status Checks

Every PR must pass:

- **Security / Gitleaks**
- **Quality / Typecheck & Tests**

The quality gate includes locked dependency installation, TypeScript checking, sanity tests, and a production build.

The security gate uses a full-history checkout and Gitleaks. A detected secret blocks the PR.

## Secret Handling

Never commit:

- Google AI Studio API keys
- ElevenLabs API keys
- PostgreSQL URLs or passwords
- CRM tokens
- Vercel tokens or bypass values
- session-signing secrets
- `.env` files
- PEM/private-key material

If a secret is accidentally committed:

1. revoke/rotate it immediately;
2. stop the merge;
3. report the affected commit/path without reposting the secret value;
4. purge Git history if the secret entered any reachable commit;
5. rerun the full history scan before release.

## Database Changes

- Add schema changes as a new numbered SQL migration.
- Never rely on runtime DDL for permanent schema changes.
- Migrations must be safe to apply in sequence.
- Do not edit already-released migrations in a way that invalidates existing installations.

## Agent and Memory Safety

Agent changes must preserve:

- server-owned identity and role resolution;
- authorized-skill selection;
- evidence-backed completion;
- no fabricated execution claims;
- strict trusted-memory partitions;
- no arbitrary browser text accepted as trusted memory;
- validated mission identifiers.

## Provider Changes

Any provider change must:

1. preserve the canonical registry/module pattern;
2. update `.env.example`;
3. update README configuration docs;
4. add/update provider contract tests;
5. keep zero-cost fallback behavior where applicable;
6. pass the full CI suite.

## Branch Protection for `main`

Repository maintainers should configure `main` with:

- Require a pull request before merging
- Minimum 1 approval
- Dismiss stale approvals on new commits
- Require conversation resolution
- Require branches to be up to date
- Require **Security / Gitleaks**
- Require **Quality / Typecheck & Tests**
- Block force pushes
- Block branch deletion
- Require linear history (recommended)
- Avoid routine bypasses

## Pull Request Scope

Prefer focused PRs. Explain:

- what changed;
- why it changed;
- how it was tested;
- whether database/environment/provider behavior changed;
- any migration or deployment considerations.

By contributing, you agree that your contributions are licensed under the repository's MIT License.
