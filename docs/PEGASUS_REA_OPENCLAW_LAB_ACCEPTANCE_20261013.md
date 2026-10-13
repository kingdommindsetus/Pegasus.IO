# Pegasus × REA × OpenClaw — development lab checkpoint

Date: 2026-10-13. Branch: `feature/voice-core-identity-20261011`. All work is isolated and off production.

## What was exercised

1. Added two **synthetic-only** KMCE JS fixtures: `tests/fixtures/rea-synthetic-kmce-app/{baseline,candidate}/main.js`. The baseline CTA targets `/events/register`; the candidate CTA incorrectly targets `/events/register-missing`. Declared route inventory is unchanged.
2. `core/integrations/reaSyntheticPreflight.ts` uses a deliberately narrow fixture scanner, SHA-256 source fingerprinting and strict realpath/symlink guards. It correctly recognizes the broken candidate route, refuses non-fixture paths and returns an explicit `reaRuntimeUsed:false` flag.
3. Added `core/integrations/openclawLabReadiness.ts`, a pure assessment-only function for Node engine compatibility and defensive runtime configuration. It does not launch, install, configure, or contact OpenClaw.
4. Tests: `tests/rea-synthetic-preflight.test.ts` and `tests/openclaw-lab-readiness.test.ts`. Both are isolated, do not read customer data and do not perform external actions.

## Verified result

- Known-good route passes fixture preflight; broken candidate produces `registration_cta_points_to_missing_route`; the baseline and candidate have distinct SHA-256 hashes.
- Non-allowlisted input paths are denied. OpenClaw admission rejects incompatible Node versions and unsafe configurations.
- KINGDOM runtime observed: Node v24.12.0 and approximately 1.6 GiB free memory; uploaded OpenClaw v2026.10.2 expects `>=24.16 <25 || >=26.1`. We set a conservative internal planning threshold of **2 GiB free RAM** for any additional sidecar—this is a Pegasus operational gate, **not** the upstream vendor's minimum specification.
- TypeScript check and the new synthetic unit tests passed. A wider combined test suite will be run before committing.

## Explicit limitations

**No REA runtime executed yet.** The synthetic fixture scanner is NOT REA static analysis and is not a general JavaScript parser, reverse-engineering engine or substitute for source-map/binary analysis. The project currently ships TypeScript 7 whose root import exposes the version rather than the older compiler parser API; the initial AST-based harness was replaced with a shape-specific scanner rather than changing shared project dependencies. It is suitable only for these fixed fixtures.

**No OpenClaw Gateway executed or installed.** The admission gate does not enforce policies over a future runtime until properly connected to an isolated worker.

**Astra database acceptance remains pending.** Prior access/connection controls prevented finishing the latest model-failure, lease-expiration and Simon-readback database tests. Never claim a database pass based only on source inspection or offline tests; do not circumvent connection controls.

## Next implementation gate

- Complete REA runtime setup *inside a low-privilege isolated analysis environment*, using the pinned `rea-main.zip` snapshot, approved deployment method, dependencies reviewed before install and no automatic setup modifications to shared agent configs. Run its actual static JS analysis on synthetic fixtures and compare REA-generated evidence against expected route regression. Do not run arbitrary binaries or allow REA to access real user/clinical data.
- Allocate an appropriately patched compatible Node sidecar and memory budget for OpenClaw, with sandboxing explicitly enabled, loopback Gateway, empty external channels, no host exec or production credentials, and a revocable kill switch. Verify health-only then escalate tools only with a separate authorization decision.
- Complete Astra isolated database acceptance through an approved connection route before activating agent handoffs. Keep checkout, faculty agreements, and lead-routing milestones ahead of extra autonomous features.

**Launch boundary:** no production changes, no Stripe/Gmail or real CRM use, no agent brain/voice changes, no real booking or autonomous messaging.
