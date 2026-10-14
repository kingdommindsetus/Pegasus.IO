# Pegasus Open-Source Integration Registry

**Status: CODED FOR REVIEW, NOT INSTALLED OR ACTIVATED.**

This lightweight registry helps Simon and Marie decide whether an open-source tool is worth integrating into Pegasus without increasing local RAM pressure or duplicating capabilities already in Pegasus.

## Source directory
Discovery inspiration: https://github.com/awesome-selfhosted/awesome-selfhosted

## Registry source
- `core/runtime/openSourceIntegrationRegistry.mjs` — immutable allowlisted catalog, filters, and conservative review gate.
- `tests/open-source-integration-registry.test.mjs` — verifies every candidate is initially research-only, no installation or remote activity can occur automatically, and even a reviewed candidate only becomes eligible for a **sandbox test**, never production deployment.

## Initial candidates
| Candidate | Priority | Notes |
| --- | --- | --- |
| Cua Driver | 1 | Windows desktop computer-use via MCP/SDK. Cua Driver MIT; Cua Spaces and optional perception components have other terms. Desktop access is high-risk and must be sandboxed. |
| Uptime Kuma | 2 | Health/uptime monitoring; MIT; assess host resource consumption before installation. |
| Activepieces Community | 3 | Workflow automation; MIT core, commercial enterprise features separate. Must justify adding another orchestrator when Pegasus already has a job engine. |
| Open WebUI | 4 | Optional AI chat interface; review current version-specific license; potential duplication. |
| Forgejo | 5 | Self-hosted Git, GPL-3.0-or-later in current versions, not MIT. We already have GitHub. |

**Priorities are planning heuristics only, not benchmark results.** Resource classes are unmeasured and must not be presented as measured RAM costs.

## Hard integration gates
1. Confirm exact component licensing and obligations, including optional extensions and build artifacts.
2. Measure memory/CPU/disk impact on the actual Windows machine.
3. Review supply chain, updates, authentication, network exposure, sandboxing, tool scopes and prompt injection.
4. Verify the Pegasus tenant boundary and staging database identity, never substitute production Neon.
5. Obtain founder approval to run a single isolated proof.
6. Where Pegasus already supplies a capability, prove an explicit advantage over existing infrastructure.

The catalog always reports `activationAllowed:false` and `productionAllowed:false`. The tool registry is not an installer, broker, command runner, background agent, or production integration.

## Recommended development order
- **CUA**: one isolated synthetic window and authorized screenshot/test action; block contact, payment, CRM, calendar and browser credentials.
- **Monitoring**: evaluate the smallest nonintrusive health monitoring integration; avoid launching an extra database stack without need.
- **Workflow automation**: prefer existing Pegasus/PostgreSQL queue and add only missing adapters.

## Current workflow and limits
This feature was committed to the **integrations/founder-skill** GitHub branch because the Kingdom Remote Desktop was offline at implementation time. It is intentionally not merged into the local `war-room-v2-preview` worktree, not run on Windows, and not deployed to Vercel. Local Node tests, UI wiring and live service readiness still need verification when the computer reconnects. No local machine, payments, API keys, database, model, or agent voices were changed.

## Evidence and licenses
- Cua: https://github.com/trycua/cua
- Activepieces licensing: https://www.activepieces.com/docs/about/license
- Uptime Kuma MIT: https://github.com/louislam/uptime-kuma/blob/master/LICENSE
- Forgejo change to GPL: https://forgejo.org/2024-08-gpl/
