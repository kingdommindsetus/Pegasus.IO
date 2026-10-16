# Pegasus clip kit — listening & talking clips

Each robot needs **two short clips**, both made from its first-frame image in this folder.

| Clip | When it plays | File name to save |
|---|---|---|
| Listening | While you type or speak to the agent | `<name>-listen.mp4` |
| Talking | While the agent answers | `<name>-talk.mp4` |

Example: `simon-listen.mp4`, `simon-talk.mp4`. Drop them in Downloads and say which ones are ready.

Order: **Simon and Marie first**, then the rest (Mark is `12-mark-first-frame.jpg`).

## Settings in your video tool

- **First frame:** the robot's `NN-<name>-first-frame.jpg` from this folder.
- **Last frame (if your tool has it):** the same image again. This makes the loop seamless.
- **Length:** 4 seconds. Shorter is better — AI video morphs more the longer it runs.
- **Resolution:** 1080p, 16:9.
- **Camera:** locked / static. No zoom, pan, or push-in.

## Prompts

**Listening**

> Locked-off camera, completely static background, screens, and desk. The robot stays seated and slowly nods its head twice as if attentively listening, then returns to its exact starting pose. Only the robot's head and shoulders move. 4 seconds.

**Talking**

> Locked-off camera, completely static background, screens, and desk. The robot stays seated, tilts its head slightly and makes one calm hand gesture as if explaining something, then returns to its exact starting pose. Only the robot moves. 4 seconds.

## What a good clip looks like

- Background, screens, and text do not change at all.
- The robot's shape and colors stay the same from start to end (no morphing).
- The last frame looks the same as the first.

If a clip drifts or morphs, regenerate it — the site blends only the robot area over the still office, but it can't fix a robot that changes shape.
