# Pegasus → Astra local intelligence bridge — isolated pilot

**Status:** working isolated local-model pilot, NOT production integration, NOT a new accepted launch milestone.

## Architecture and boundaries

- Pegasus owns authority, task identity and evidence. A new independent module `core/runtime/execution/astraDraftBridge.ts` calls **localhost Ollama only** (`127.0.0.1:11434/api/generate`), requesting the installed `astra-main` model with non-streaming, low-temperature generation.
- It does not use Astra's HTTP agent gateway, tools, database, memory, plugins, autonomous scheduler, or any live KMCE integration. Do not claim full Astra-agent orchestration is wired.
- Call is restricted to `agentId=simon`, `draftOnly=true`, `externalActionsAllowed=false`, fixed loopback endpoint and model, explicit evidence IDs, bounded input and output, 12-second timeout, and simple deny-list screening. The bridge is **not mounted into existing Peggy/Pegasus execution paths**; it requires a separate gate-reviewed integration phase.
- Important security limitation: prompt sanitization and a deny-list do NOT guarantee model obedience. The response is untrusted draft text; external actions remain impossible at this bridge's transport level because no tools or action adapters are available, but downstream consumers must independently authorize any action and verify citations. Model output cannot be treated as evidence itself.

## Acceptance observed on Kingdom

- `tests/astra-draft-bridge.test.ts`: **3 passed / 0 failed**. Tested loopback-only URL, no tool declarations, provenance IDs, refusal of unauthorized agent/draft/side-effect inputs, duplicate evidence IDs, malformed task IDs, failed HTTP and empty model output. Test fixtures use synthetic business statements, not genuine CE records.
- `tests/astra-draft-live-isolated.ts` successfully queried installed Ollama `astra-main` through the new module. The draft correctly stated an *example* airway course has 12 CE hours, is **not** a real KMCE listing and has **no scheduled date**. Measured `elapsedMs=6479` at request level. No mail, publishing, payments, production API or database operations.
- TypeScript no-emit validation and Git diff-check passed (verify again before final commit). Astra repository itself remains unchanged.

## Next implementation steps (requires explicit authorization before live operations)

1. Treat the module as an optional Pegasus draft reasoner only in an isolated, authenticated worker; keep all existing Pegasus agent voices and brains intact. Attach immutable task IDs, source references, and worker telemetry.
2. Build a read-only **KMCE knowledge adapter** from approved course/faculty/CE records, not arbitrary live private information. Include document version, scope and citation IDs; return 'not established' if evidence is absent.
3. Keep Astra agent gateway disabled until its tool permissions, workspace isolation, shell, mail, billing and publishing capabilities pass independent negative tests.
4. Add retry/resource limits, prompt-injection adversarial tests, cross-workspace negative tests, concurrency and local model health checks.
5. Resume the existing **S02** authentication session revocation and cross-tenant acceptance before connecting accounts or student records.

**Verified Pegasus launch task count remains 9/72; this experiment does not mark S02 or another tracker item as complete.**
