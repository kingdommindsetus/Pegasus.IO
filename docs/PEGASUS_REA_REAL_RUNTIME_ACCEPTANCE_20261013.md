# Pegasus × REA real-runtime acceptance — 2026-10-13

**Scope:** KINGDOM isolated filesystem lab and synthetic JavaScript fixtures only. No production data, model, customer/clinical data, mail, checkout or outbound tools. The sidecar is **not** registered with Pegasus's agents or MCP configuration.

## Runtime setup

- Existing repository: `C:/Users/info/Documents/Pegasus.IO-production` on branch `feature/voice-core-identity-20261011`.
- Separate local lab: `C:/Users/info/PegasusVoiceEngine/acceptance-isolated/rea-lab-20261013`. The lab is filesystem-separated **but still runs under the current Windows user, not a separately permissioned OS account**. Treat it as a development test, not a security isolation boundary.
- Installed pinned NPM package `rea-agents@6.4.0` under the lab folder with `--ignore-scripts --omit=optional --no-audit --no-fund --save-exact`. Installation reported 143 packages. This does not change global npm packages or the Pegasus application dependency tree.
- Registry distribution integrity reported as `sha512-Vj1zWfSlna5bphGoaoI/TcVBuYvze9u+OyPC3Shz8YkBqaCTqB4COnnRoX7XDwMpwI24ZlFEel2yEj0k8LTWEQ==`.
- **Provenance caveat:** the uploaded REA source archive and the published npm package both identify as `6.4.0`, but their launcher/compiled runtime paths differ. The published package launcher requires `dist/cli.js`; the uploaded archive's launcher checks `dist/cli-runtime/cli.js`. Do not assume byte-for-byte equivalence. Do not overwrite one with the other.
- Used KINGDOM Node `v24.12.0`, bounded V8 old-space memory to 512 MiB for each analysis invocation, and did **not** call `rea setup` or start its MCP server.

## Actual analysis executed

Ran the published `scripts/rea.mjs analyze-javascript-application <synthetic lab directory> --json` separately on the copied baseline and candidate fixture. Both exited `0`.

Output locations (lab only):
- `results/baseline.json` (138,690 bytes, original PowerShell UTF-16LE redirection)
- `results/candidate.json` (138,728 bytes, original PowerShell UTF-16LE redirection)

Both evidence records report provider `rea-javascript-application`, operation `analyze_javascript_application`, a root directory artifact digest, and a structured `normalized_result.semantic_graph`. The source text is analyzed inertly; the application is not launched.

| Case | REA evidence ID | Source SHA-256 | Observation |
|---|---|---|---|
| Baseline | `ev_24039bdb36f7a8b0a8a7d4d502f91013e2786f6be0281358654695676d54fcd9` | `01156865bf5e6b8e04d1217c75676668930b8d5eb16e9242de078437c5872846` | Registration literal at `/events/register`; matching declared route |
| Candidate | `ev_702f931e4b4af8f22bdb2bd5242c3eceb1a9a20d9b2c3671058f1a59fad31e3f` | `f5afea5db31ff3d17b5148809b7565c4b3e4edc898c20544966dd46128f4ea86` | Registration literal `/events/register-missing` at `main.js:2` versus declared `/events/register` at line 3 |

## Pegasus interpretation

- Added `core/integrations/reaEvidenceIngest.ts`: pure, read-only ingestion of the REA JSON structure with provider and evidence ID checks, directory digest matching, synthetic source SHA matching, explicit `main.js` location checks and extraction of static navigation and declared-route literals.
- Added `tests/rea-evidence-ingest.test.ts` for accepted evidence and denial of mismatches or ambiguous source locations.
- Added `tests/rea-real-lab-acceptance.ts`, a manual fixed-path acceptance test reading the real REA outputs and original synthetic source bytes from the lab; it does not invoke REA or any network service. PowerShell 5.1 stdout redirection produced UTF-16LE BOM JSON, so this reader supports both UTF-16LE and UTF-8.
- Manual real-evidence acceptance output: `REA_REAL_EVIDENCE_ACCEPTANCE`, with `baselineBroken:false`, `candidateBroken:true`, `expectedRoute:'/events/register'`, `observedRoute:'/events/register-missing'`, location `main.js:2`, `decision:'human_review_required'`, and `externalActionsExecuted:false`. Command exit code `0`.

## Trust and readiness boundaries

- The module checks the *structure* of generated evidence and source hashes; there is no independently signed REA attestation. It must not be treated as authorizing deployments, edits, contacts or any money movement.
- The route checker is intentionally **specialized to this fixed synthetic fixture format**. A real KMCE compiled storefront, client-side router or dynamic route will require additional validated reasoning and browser acceptance tests.
- No real Pegasus database jobs were enqueued or changed; the prior Astra isolated PostgreSQL acceptance remains pending due to connection controls.
- OpenClaw remains **not installed**; Node/runtime, available memory, sandboxing and separate-identity requirements remain prerequisites. No automatic agents or messages were enabled.
- Future pilot: under independently verified runtime constraints, move REA into a low-privilege OS/container isolation boundary and have IRIS/Alice receive review-only, content-addressed analysis records through Pegasus's authenticated approval and evidence pipeline. Prioritize checkout, educator contract reconciliation and verified lead routing before autonomously repairing live website code.
