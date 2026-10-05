# Public Release Pre-Flight Checklist

Use this checklist immediately before changing the GitHub repository visibility from Private to Public.

## Security

- [ ] Full reachable Git history has been scanned for secrets.
- [ ] Gitleaks CI is green on current `main`.
- [ ] `.env.example` contains empty placeholders only.
- [ ] `.gitignore` blocks environment files and private-key material.
- [ ] No database URLs, API keys, tokens, bypass values, or passwords appear in committed docs.
- [ ] No private PEM/key/certificate files are tracked.
- [ ] Any credential ever exposed outside the repository has been independently reviewed and rotated when necessary.

## Documentation

- [ ] README describes Google AI Studio as the canonical reasoning provider.
- [ ] README describes ElevenLabs as the primary voice provider.
- [ ] README documents Browser Web Speech fallback.
- [ ] README documents PostgreSQL migrations and required configuration.
- [ ] README contains no private/staging webhook URLs.
- [ ] CONTRIBUTING documents required CI checks and secret-handling rules.
- [ ] LICENSE is present.

## Repository Controls

- [ ] `main` requires pull requests.
- [ ] `Security / Gitleaks` is a required check.
- [ ] `Quality / Typecheck & Tests` is a required check.
- [ ] Force pushes to `main` are blocked.
- [ ] Branch deletion for `main` is blocked.
- [ ] At least one approval is required before merge.
- [ ] Review conversations must be resolved.

## Product Verification

- [ ] Production health endpoint reports canonical providers.
- [ ] One full 12-agent Huddle completes.
- [ ] Zero governed fallbacks in the release acceptance mission.
- [ ] Simon Executive Close completes and persists.
- [ ] Hard refresh/new session rehydrates persisted mission state.
- [ ] Cross-mission memory carry-over is verified.
- [ ] Provider telemetry displays expected reasoning and voice providers.

## Public Toggle

Only after every item above is checked:

1. make the repository public;
2. verify README badges render;
3. clone the public repository into a clean directory;
4. run the Quickstart from scratch;
5. verify no credentials are required beyond user-supplied environment variables.
