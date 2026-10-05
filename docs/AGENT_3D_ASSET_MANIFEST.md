# Pegasus 3D Agent Asset Manifest

Validated October 1, 2026 from the uploaded GLB texture labels.

| Uploaded asset | Pegasus agent | Production path | Status |
|---|---|---|---|
| 3d-image-asset (11)(1).glb | Lucy | public/agents/lucy.glb | Ready |
| 3d-image-asset (10).glb | Marie | public/agents/marie.glb | Ready |
| 3d-image-asset (9)(1).glb | Tube | public/agents/tube.glb | Ready |
| 3d-image-asset (8)(1).glb | Evan | public/agents/evan.glb | Ready |
| 3d-image-asset (7)(1).glb | Booker | public/agents/booker.glb | Ready |
| 3d-image-asset (6)(1).glb | Cammy | public/agents/cammy.glb | Ready |
| 3d-image-asset (5)(1).glb | Snake | public/agents/snake.glb | Ready |
| 3d-image-asset (4)(1).glb | Alice | public/agents/alice.glb | Ready |
| 3d-image-asset (3)(1).glb | Simon | public/agents/simon.glb | Ready |
| 3d-image-asset (2)(1).glb | IRIS | public/agents/iris.glb | Ready |
| 3d-image-asset (1)(1).glb | Echo | public/agents/echo.glb | Ready |
| 3d-image-asset(2).glb | Marie (duplicate) | hold / duplicate review | Duplicate |

## Missing unique asset

Mark does not currently have a unique uploaded GLB. Pegasus should retain its existing 2.5D fallback for Mark until `public/agents/mark.glb` is supplied.

## Geometry audit

The uploaded models are compact textured static meshes (roughly 2.35–2.59 MB each), each containing one mesh and one texture. They do not currently contain a skeleton, animation clips, or facial morph targets.

Pegasus therefore uses the procedural static-face rig as the interim runtime. If a future model contains ARKit-style morph targets, the existing native blendshape path takes precedence automatically.
