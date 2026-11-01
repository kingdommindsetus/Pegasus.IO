# PEGASUS HQ — Immersive CRM visual prototype

**Status:** design/staging handoff only. No production integration, authentication, task execution, model inference, or real-time status in these files.

## Scope
The visual system comprises headquarters atrium, Founder HQ, War Room, Employee Floor, individual offices, CRM, and Client Portal. This branch introduces the lightweight interactive atrium with a video centerpiece, intro/loading state, keyboard-ready hotspots, static fallback, motion controls, a reusable transition overlay, a Sofia office interaction shell, and a mock command-deck preview that presents people, work, decisions, and memory as one CRM experience.

## Run
Open `index.html` in this folder with the verified media files below, or serve this folder with any local static HTTP server. The included `build.mjs` creates the Vercel-ready `dist` folder for this standalone visual preview. Deployment and integration are owned by engineering.

## Verified authorized media
- `assets/pegasus-centerpiece.mp4` — user-supplied rotating neon Pegasus loading video (1920x1080, approximately 10s)
- `assets/pegasus-atrium.png` — approved atrium backdrop (do not replace official logo or hologram branding)
- `assets/marie-working.mp4` — user-supplied purple Marie operations/dispatcher clip; `assets/marie-poster.jpg` is a frame from that clip
- `assets/gatekeeper-working.mp4` — user-supplied gold Gatekeeper approval/compliance clip; `assets/gatekeeper-poster.jpg` is a frame from that clip

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

The current design slice exposes a safe presentation contract: destination clicks open an accessible mock transition dialog; the `Founder HQ` dialog offers a keyboard-accessible Sofia mock entry; the `OFFICE · STEP INSIDE` tab opens a mapped 21-agent hallway with reusable office bubbles; and staged shells exist for Sofia, Simon, Marie, and Gatekeeper. The hallway labels the remaining rooms as next slices instead of implying live agents. Office event controls preview states without invoking runtime behavior. This is intentionally not a live route, auth flow, agent integration, microphone flow, report query, or voice integration.

Marie and Gatekeeper use separate single-video room visuals with clip-derived still posters for loading. Their supplied MP4 streams are remuxed with the playback index at the front; the video and audio streams are not re-encoded. Any dashboard counts, approval labels, or status indicators embedded in the supplied artwork are fictional and do not represent CRM records or authorization.

Sofia’s KMCE identity is intentionally gesture-first: the active room composition uses the supplied working and circuit motion clips, crops away facial detail, and labels the channel as `NO FACE SIGNAL`. The supplied posters remain preserved as source references but are not used as the active identity layer. This does not prove that Sofia is connected to the KMCE CRM, a microphone, a report source, Simon, Gatekeeper, or partner agents.

The intended model is a stateful operator shell rather than a talking avatar: input becomes an intent, the room expresses state through gesture/light/labels, and delegation appears as a visible handoff path. Any future Anthropic or other model integration must provide verified events to this shell; decorative motion must never be treated as proof of listening, reasoning, dispatch, or completion.

## Responsive
- Desktop target scene: 1920x1080/16:9 with content-safe overlay.
- Mobile target: 1080x1920/9:16 crop and responsive hotspots.
- Prefer AVIF/WebP static poster with a 150-300KB target. Encode video for < 3MB where practical, without sacrificing acceptable quality. These are targets, not measured output sizes.

## Engineering requirements
Do not wire synthetic counts to a real live indicator. Retain existing agent identities, voices, legal access controls, CRM API, and Gatekeeper review; this layer is presentation only. The application cannot claim model-provider integrations by showing model names or badges.
