# OpenClaw as a subordinate Pegasus tool execution layer — decision candidate

Date: 2026-10-13. Status: evaluated for architecture only, **NOT INSTALLED OR ENABLED**.

## Placement

Pegasus remains authoritative for agent identities, run queue, evidence, memory, approvals and Simon's executive close. Astra provides constrained, source-grounded local drafting. A separately isolated OpenClaw Gateway could eventually perform explicitly permitted tool tasks, returning receipts to Pegasus. OpenClaw does not replace Simon, established Pegasus agents, their voices, or Pegasus PostgreSQL state.

## Evidence and risks

OpenClaw documentation describes a trusted-operator Gateway, with configurable tools, explicit sandboxing, and exec approvals. It is **not** a security boundary for mutually untrusted tenant users on one Gateway. The documented default sandbox setting is off; host command approvals are guardrails rather than per-user authorization. Native plugins may run with Gateway privileges. OpenClaw's Ollama provider supports a local model lane, but performance and resource suitability have not been measured on KINGDOM.

Official references:
- https://docs.openclaw.ai/start/why-openclaw
- https://docs.openclaw.ai/gateway/security/tool-permissions
- https://docs.openclaw.ai/gateway/sandboxing
- https://docs.openclaw.ai/tools/exec-approvals
- https://docs.openclaw.ai/providers/ollama/setup

## Minimum pilot architecture

1. Complete current Astra isolated database acceptance and S02 founder authentication/tenant-isolation gates before production integration.
2. Lab OpenClaw on a separate low-privilege account or container, not a production Pegasus worker. Do not expose the Gateway to the public internet or connect live CRM/student/patient/Stripe data.
3. Set sandbox mode explicitly; prohibit host/elevated exec and deny exec/write/edit/patch by default. Apply least-privilege per-agent allowlists and manually review third-party skills. Never mount deployment secrets or voice/brain masters.
4. Start with a synthetic internal-only task and an allowlisted read-only adapter. Pegasus generates a signed, narrow-scope request, validates source receipts, and alone stores run evidence. No direct approval or external action from model content.
5. Make kill switch, audit/event log, model failure handling, rate/resource ceilings, and approval gates visible in Simon's command center before enabling anything real.

## Not authorized

No OpenClaw installation, credential connection, provider billing, gateway exposure, agent replacement, production changes, live emails, checkout, appointment-booking, or tenant data access was requested or performed in this evaluation.

## Commercial priority

Do not let an additional runtime displace checkout reconciliation, faculty agreements, verified course offer, and lead conversion. OpenClaw is valuable only if it reduces time-to-revenue or improves an approved operator workflow while preserving safety.
