# Pegasus → Astra KMCE answer validator — pilot

This is a source-specific, **draft-only** gate on the experimental local Astra bridge, not a general fact checker or part of live Pegasus task execution.

## Implemented

- `core/runtime/execution/kmceAstraValidator.ts` checks model evidence IDs, source revision/paths, and the knowledge version against the approved pilot knowledge pack.
- Topic-dependent required strings enforce both code-backed identifiers `441585` (national) and `217702` (local) when asked for both; includes faculty credentials, current source's human account role names, and founder approval requirement checks for respective topics.
- Flags unsupported five-digit numbers and certain unverifiable accreditation or sales claims; unknown-date questions return `not_established` before inference.
- If a check fails, `answer` is withheld and `status='needs_review'`; an internal `modelAnswer` may be retained for inspection. That raw response must **never be rendered or acted upon as an accepted answer**.
- This remains a limited lexical validator: matching a required string is not sufficient proof a sentence is true, and the listed terms cannot prevent all hallucinations or prompt-injection attacks. Source claims are verified against inspected **code revision** `31438cc1`, not independent accreditation, current enrollment or production configuration. The bridge is not wired into production, Astra's gateway, or Pegasus workers.

## Acceptance on Kingdom

- `tests/kmce-astra-validator.test.ts`: **6/6 passed** for complete source-backed answers, missing local ID, unsupported numbers and claims, tampered source/version/evidence identifiers, unknown topic refusal and incomplete mock reply.
- `tests/kmce-astra-validator-live-isolated.ts`: real local Ollama `astra-main` replied `Both AGD PACE provider identifiers are 441585.` when asked for both; validator returned `needs_review`, reason `missing_required_fact:217702`, withheld public answer. Elapsed **1337 ms**. This is a successful *negative* acceptance test, not a correct model answer.
- No access to live CRM, enrolled learners, production payments, Astra's tool gateway or email. Astra source remains untouched. Do not increase the 72-item launch tracker: 9/72 verified, S02 still open.

## Follow-up

Introduce structured fact extraction and sentence-level entailment checks, deterministic citations, source freshness and explicit reviewer acceptance. Build adversarial prompt-injection tests before connecting more sensitive data. Leave human approvals and action execution under Pegasus.
