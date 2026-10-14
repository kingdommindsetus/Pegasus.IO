# Founder Skill for Pegasus — review-stage integration

Source: https://github.com/Jakeschincariol/founder-skill
Upstream license: MIT. The upstream publishes **11 Claude-oriented skills**, some with local Python stdlib calculators.

## What this branch actually does
- Adds a standalone vendor importer (`node tools/install-founder-skill.mjs`) that obtains all 11 upstream skill folders and copies them into `third_party/founder-skill` **for review**, preserving their MIT license and a SHA-256 file manifest. It **never executes** the cloned scripts or prompts.
- Adds `core/runtime/founderSkillCatalog.mjs`, assigning the skills to Pegasus's existing twelve agents, with disabled-by-default, draft-only governance. It is a static capability registry, **not** agent skill activation.
- Adds `tests/founder-skill-catalog.test.mjs` for role and safety contracts.
- Introduces **no cloud-model provider, token charges, new Python package, or external account requirement**. Actual model inference still consumes local resources if activated later.

## Suggested ownership
Simon: founder-board, founder-plan. Marie: founder-ops, founder-launch. IRIS: founder-competitors. Mark: founder-marketing, founder-brand. Cammy: founder-launch, founder-marketing. Evan: founder-marketing, founder-brand. Tube: founder-marketing. Lucy: founder-marketing, founder-launch. Snake: founder-cfo, founder-pricing, founder-plan. Alice: founder-offer, founder-brand. Echo: founder-consumer, founder-competitors, founder-offer. Booker: founder-launch.

## Installation when Kingdom remote becomes responsive
1. Bring this review branch into the local working tree **without overwriting** the active `war-room-v2-preview` local commits. Prefer cherry-pick of the integration commits, or a targeted PR merge after checking differences.
2. Check the upstream repository and the review branch. In the Pegasus repository, run `node tools/install-founder-skill.mjs`. It downloads the files but does not activate them.
3. Review `third_party/founder-skill/PEGASUS_VENDOR_MANIFEST.json` and the copied skill instructions. Pin `FOUNDER_SKILL_COMMIT` to that reviewed SHA for repeatable subsequent installs.
4. Run `node --test tests/founder-skill-catalog.test.mjs` and upstream `python -m unittest discover -s third_party/founder-skill/tests -v` **only after reviewing the upstream code**. The importer deliberately does not copy or run upstream tests.
5. Add explicit Pegasus approved-skill adapters for individual skills: CFO calculations from verified costs, pricing comparisons from verified data, and marketing drafts with citations. Do not enable unrestricted shell/Python, financial writes, CRM sends, payments, or client data access.
6. Require clear founder approval before any execution. Run one local synthetic test then stage proof. Do not promote to production by default.

## Critical limitations
- **The upstream has not yet been installed into the Windows checkout** and none of its 11 skills is currently activated. The feature branch offers an importer and allowlisted catalog; no claim of live operations.
- The upstream consumer panel simulates buyers. Its purchase rate is not real customer demand or a revenue forecast. Pegasus should record it as `synthetic_market_research`, not validated sales evidence.
- CFO estimates depend on real input costs and volume. Never synthesize unknown fees, revenue, margins, customers, bookings or permits.
- Founder-skill prompts are untrusted third-party content. Review prompt injection, external links, tool demands, licenses, and data safety before enabling them.
- Maintain the existing Windows Ollama RAM guard. Twelve concurrent LLM simulations, much less 100, are not appropriate for the current machine.
- This branch does **not** change the secure staging bridge work, production, Neon, payments, deployed War Room, or agent voices.

## Verification state
The source repository's contents and license were inspected; these integration files have not yet been executed against the connected Kingdom checkout because remote Desktop Commander timed out. Treat execution tests as pending, not passed.
