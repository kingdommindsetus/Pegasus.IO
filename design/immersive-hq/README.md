# PEGASUS HQ — Immersive CRM visual prototype

**Status:** design/staging handoff only. No production integration, authentication, task execution, model inference, or real-time status in these files.

## Scope
The visual system comprises headquarters atrium, Founder HQ, War Room, Employee Floor, individual offices, CRM, and Client Portal. This branch introduces the lightweight interactive atrium with a video centerpiece, intro/loading state, keyboard-ready hotspots, static fallback, motion controls, a reusable transition overlay, a Sofia office interaction shell, and a mock command-deck preview that presents people, work, decisions, and memory as one CRM experience.

## Run
Open `index.html` in this folder with the verified media files below, or serve this folder with any local static HTTP server. The included `build.mjs` creates the Vercel-ready `dist` folder for this standalone visual preview. Deployment and integration are owned by engineering.

## Verified authorized media
- `assets/pegasus-centerpiece.mp4` — user-supplied rotating neon Pegasus loading video (1920x1080, approximately 10s)
- `assets/pegasus-atrium.png` — approved atrium backdrop (do not replace official logo or hologram branding)

Do **not** use unapproved generated logos. The HTML gracefully falls back to typographic PEGASUS branding when an asset is unavailable.

## Hotspots and intended routes
| ID | Proposed route |
|---|---|
| hq-founder | /hq/founder |
| hq-war-room | /hq/war-room |
| hq-employees | /hq/employees |
| hq-clients | /portal |
| quick-approvals | /crm/approvals |
| quick-leads | /crm/leads |
| quick-accounts | /crm/accounts |
| quick-tasks | /crm/tasks |

These are design contracts; engineering must map to authenticated routes and enforce tenant-level authorization.

## Motion contract
- Intro: 2.8 second skippable reveal; never blocks CRM quick actions after loaded.
- Centerpiece: muted 10-second video loop with playsinline, lazy-compatible poster fallback.
- Centerpiece loop: two synchronized video players crossfade the approved clip before its endpoint, preserving forward motion and hiding the source clip's non-seamless pose reset.
- Reduced-motion users: no animated intro or looping centerpiece.
- Pause/resume control is always accessible.
- Office states must be driven by verified backend events (idle, listening, speaking, working, approval_wait, completed, failed), never inferred from a decorative animation.
- The Sofia office event buttons are mock-only previews and explicitly report that no agent, task, voice, or backend event was invoked.

## Office interaction shell

The current design slice exposes a safe presentation contract: destination clicks open an accessible mock transition dialog; the `Founder HQ` dialog offers a keyboard-accessible Sofia mock entry; the office shows the intended Founder → Sofia → Simon → Gatekeeper → Partners delegation path; and the event controls preview `listening`, `working`, `approval_wait`, and `completed` labels without invoking runtime behavior. The spoken-request control is a staged presentation only. This is intentionally not a live route, auth flow, agent integration, microphone flow, report query, or voice integration.

Sofia’s KMCE identity is represented with the supplied faceless-robot poster and the dedicated Agent World motion asset. The visual identity is integrated into the room; the asset presence does not prove that Sofia is connected to the KMCE CRM, a microphone, a report source, Simon, Gatekeeper, or partner agents.

## Responsive
- Desktop target scene: 1920x1080/16:9 with content-safe overlay.
- Mobile target: 1080x1920/9:16 crop and responsive hotspots.
- Prefer AVIF/WebP static poster with a 150-300KB target. Encode video for < 3MB where practical, without sacrificing acceptable quality. These are targets, not measured output sizes.

## Engineering requirements
Do not wire synthetic counts to a real live indicator. Retain existing agent identities, voices, legal access controls, CRM API, and Gatekeeper review; this layer is presentation only. The application cannot claim model-provider integrations by showing model names or badges.
