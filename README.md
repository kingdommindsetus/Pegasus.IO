# Pegasus.io

[![Security & Quality](https://github.com/kingdommindsetus/Pegasus.IO/actions/workflows/security-audit.yml/badge.svg)](https://github.com/kingdommindsetus/Pegasus.IO/actions/workflows/security-audit.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Pegasus.io is an Autonomous Executive Operating System.**

Pegasus coordinates a 12-agent executive team through a governed, persistent mission pipeline. Reasoning runs directly through **Google AI Studio** using the official `@google/genai` SDK. Natural voice runs through **ElevenLabs**, with **Browser Web Speech** as the zero-cost fallback. Mission state, evidence, execution history, telemetry, and durable memory are stored in PostgreSQL.

## Architecture

```text
Founder Objective
      │
      ▼
Pegasus Core
      │
      ├── Google AI Studio
      │     └── canonical reasoning: core/runtime/agents/pegasusReasoner.ts
      │
      ├── Governed Skills + Agent Permissions
      │
      ├── PostgreSQL
      │     ├── tasks
      │     ├── jobs / job_runs
      │     ├── memories
      │     ├── evidence
      │     └── events / telemetry
      │
      ├── ElevenLabs
      │     └── canonical voice registry: api/pegasusVoiceRegistry.js
      │
      └── Browser Web Speech fallback
            │
            ▼
Simon → Marie → IRIS → Mark → Cammy → Evan
→ Tube → Lucy → Snake → Alice → Echo → Booker
            │
            ▼
Simon Executive Close
```

Pegasus uses strict memory partitions:

- `company_memory`
- `agent_role_memory`
- `mission_run_memory`

Trusted agent memory is read server-side from PostgreSQL. Browser-supplied text is not accepted as trusted memory.

## The 12-Agent Executive Cast

| # | Agent | Operational role | Canonical ElevenLabs persona |
|---:|---|---|---|
| 1 | **Simon** | Executive Strategy & Mission Prioritization | Daniel — Steady Broadcaster |
| 2 | **Marie** | Operations & Execution Architecture | Sarah — Mature, Reassuring, Confident |
| 3 | **IRIS** | Research & Competitive Intelligence | Matilda — Knowledgeable, Professional |
| 4 | **Mark** | Marketing Direction & Strategic Positioning | Roger — Laid-Back, Casual, Resonant |
| 5 | **Cammy** | Campaign Strategy & Launch Mechanics | Laura — Enthusiast, Quirky Attitude |
| 6 | **Evan** | Content Strategy & Production | Chris — Charming, Down-to-Earth |
| 7 | **Tube** | Video Strategy & Production | Charlie — Deep, Confident, Energetic |
| 8 | **Lucy** | Social Distribution | Jessica — Playful, Bright, Warm |
| 9 | **Snake** | Analytics & Performance Intelligence | Brian — Deep, Resonant and Comforting |
| 10 | **Alice** | Storefront / Website Quality & CRO | Alice — Clear, Engaging Educator |
| 11 | **Echo** | Sales Outreach | Eric — Smooth, Trustworthy |
| 12 | **Booker** | Scheduling & Appointment Conversion | Bill — Wise, Mature, Balanced |

After Booker completes, accumulated persisted decisions and evidence route back to Simon for the **Executive Close**: Final Decision, Core Priorities, Immediate Next Steps, Risks / Blockers, and Action Owners.

## Quickstart

### Prerequisites

- Git
- Node.js **22+**
- npm
- PostgreSQL-compatible database
- Google AI Studio API key
- ElevenLabs API key for the canonical voice experience

### 1. Clone the repository

```bash
git clone https://github.com/kingdommindsetus/Pegasus.IO.git
cd Pegasus.IO
```

### 2. Install dependencies

```bash
npm install
```

For CI/reproducible installs, use `npm ci`.

> **Windows PowerShell:** if your execution policy blocks `npm.ps1`, use `npm.cmd install` (and `npm.cmd run ...` for later commands) or run the commands from Command Prompt.

### 3. Create your local environment file

macOS/Linux:

```bash
cp .env.example .env.local
```

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Populate only your local `.env.local`. Never commit real credentials.

### 4. Initialize PostgreSQL

Use a **fresh PostgreSQL database** for first-time setup, set `DATABASE_URL` in `.env.local`, then run:

```bash
npm run db:migrate
```

The migration runner loads `.env.local`, applies every SQL migration in numeric order with the required `pegasus_core` schema context, and records applied migrations. It intentionally refuses to run against an existing untracked Pegasus schema so a local onboarding command cannot accidentally mutate an established production database.

On Windows PowerShell with restricted script execution:

```powershell
npm.cmd run db:migrate
```

### 5. Start Pegasus

```bash
npm run dev
```

The local Express server uses the same canonical API handlers as production, preventing provider drift between local development and Vercel.

## Configuration

The committed `.env.example` contains **empty placeholders only**.

| Variable | Required | Purpose |
|---|---:|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | Direct Google AI Studio reasoning |
| `ELEVENLABS_API_KEY` | Yes* | Primary natural voice provider |
| `DATABASE_URL` | Yes | PostgreSQL connection for Pegasus Core |
| `PEGASUS_CORE_API_SECRET` | Yes | Signs/authenticates Pegasus Core sessions |
| `PEGASUS_REASONING_MODELS` | No | Override Gemini reasoning model rotation |
| `GOOGLE_REASONING_RPM` | No | Shared reasoning quota-governor request limit |
| `GOOGLE_REASONING_WINDOW_MS` | No | Quota-governor time window |
| `GOOGLE_REASONING_SAFETY_MS` | No | Safety buffer added before next reasoning slot |
| `ELEVENLABS_TTS_MODEL` | No | Override the ElevenLabs speech model |
| `PEGASUS_CRM_URL` | No | Optional external CRM endpoint |
| `PEGASUS_CRM_TOKEN` | No | Optional CRM authentication token |
| `PEGASUS_ADMIN_PASSWORD` | No | Legacy compatibility setting |
| `PORT` | No | Local Express port |
| `NODE_ENV` | No | Runtime environment |
| `DISABLE_HMR` | No | Local development control |

*If ElevenLabs is unavailable, Pegasus can fall back to Browser Web Speech. ElevenLabs is required for the canonical 12-voice experience.

## Development Commands

```bash
npm run dev
npm run typecheck
npm test
npm run build
```

The sanity suite verifies the environment contract and canonical provider architecture.

## CI & Security

Every pull request and every push to `main` runs:

### Security / Gitleaks

- full-history checkout
- official Gitleaks action
- fails on detected secrets, API keys, tokens, or connection strings

### Quality / Typecheck & Tests

- `npm ci`
- `npm run typecheck`
- `npm test`
- `npm run build`

Recommended `main` branch protection requires both checks:

- **Security / Gitleaks**
- **Quality / Typecheck & Tests**

Also require pull requests, at least one approval, resolved conversations, up-to-date branches, blocked force pushes, and blocked branch deletion.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contributor workflow.

## Security Model

Key release safeguards include:

- server-side reasoning and secret use
- signed Pegasus Core sessions
- governed skills and permission checks
- Postgres-backed memory and mission state
- strict trusted-memory partitions
- UUID validation on mission hydration
- no trusted memory accepted from arbitrary browser payloads
- server-side shared provider quota governance
- Gitleaks enforcement in CI
- empty committed environment templates only

Do not open an issue containing a credential or private connection string. Revoke exposed credentials first, then report the problem without including the secret value.

## Deployment

Pegasus is designed to run on Vercel or on the included Express development/runtime server.

For production:

1. configure the required environment variables in your hosting platform;
2. provision PostgreSQL;
3. apply all database migrations in order;
4. deploy the repository;
5. verify `/api/health`;
6. run one complete 12-agent acceptance mission.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

Pegasus.io is released under the [MIT License](LICENSE).
