import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Viseme } from "../types";
import { VISEME_WEIGHTS } from "./visemes";
import { buildStaticFaceRig, driveStaticFace, type StaticFaceRig } from "./staticFaceRig";

type MorphMesh = THREE.Mesh & {
  morphTargetDictionary?: Record<string, number>;
  morphTargetInfluences?: number[];
};

const aliases: Record<string, string[]> = {
  jawOpen: ["jawOpen", "JawOpen", "mouthOpen"],
  mouthClose: ["mouthClose", "MouthClose"],
  mouthFunnel: ["mouthFunnel", "MouthFunnel"],
  mouthPucker: ["mouthPucker", "MouthPucker"],
  mouthSmileLeft: ["mouthSmileLeft", "MouthSmile_L"],
  mouthSmileRight: ["mouthSmileRight", "MouthSmile_R"],
  mouthStretchLeft: ["mouthStretchLeft", "MouthStretch_L"],
  mouthStretchRight: ["mouthStretchRight", "MouthStretch_R"],
  mouthPressLeft: ["mouthPressLeft", "MouthPress_L"],
  mouthPressRight: ["mouthPressRight", "MouthPress_R"],
  mouthLowerDownLeft: ["mouthLowerDownLeft", "MouthLowerDown_L"],
  mouthLowerDownRight: ["mouthLowerDownRight", "MouthLowerDown_R"],
  mouthRollLower: ["mouthRollLower", "MouthRollLower"],
  mouthUpperUpLeft: ["mouthUpperUpLeft", "MouthUpperUp_L"],
  mouthUpperUpRight: ["mouthUpperUpRight", "MouthUpperUp_R"],
  eyeBlinkLeft: ["eyeBlinkLeft", "EyeBlink_L"],
  eyeBlinkRight: ["eyeBlinkRight", "EyeBlink_R"]
};

function resolveName(dictionary: Record<string, number>, logical: string) {
  const candidates = aliases[logical] ?? [logical];
  return candidates.find((name) => dictionary[name] !== undefined);
}

const PEGASUS_VISEME_TARGETS: Record<Viseme, Record<string, number>> = {
  REST: {},
  AA: { jawOpen: 0.72, viseme_aa: 1 },
  AE: { jawOpen: 0.56, viseme_aa: 0.78, viseme_ee: 0.18 },
  AH: { jawOpen: 0.66, viseme_aa: 0.88 },
  EE: { jawOpen: 0.22, viseme_ee: 1 },
  IH: { jawOpen: 0.24, viseme_ee: 0.72 },
  OH: { jawOpen: 0.48, viseme_oh: 1 },
  OU: { jawOpen: 0.30, viseme_oh: 0.88 },
  MBP: { viseme_mbp: 1 },
  FV: { jawOpen: 0.10, viseme_ee: 0.30 },
  L: { jawOpen: 0.28, viseme_aa: 0.34 },
  SZ: { jawOpen: 0.14, viseme_ee: 0.42 },
  TH: { jawOpen: 0.24, viseme_aa: 0.28 },
  CH: { jawOpen: 0.20, viseme_oh: 0.28 },
  R: { jawOpen: 0.20, viseme_oh: 0.22 },
  WQ: { jawOpen: 0.18, viseme_oh: 0.62 }
};

const PEGASUS_TARGET_NAMES = [
  "jawOpen",
  "viseme_aa",
  "viseme_oh",
  "viseme_ee",
  "viseme_mbp",
  "mouthSmile"
] as const;

export function GLBFacialAvatar({
  modelUrl,
  viseme,
  blink,
  hologramColor = "#33ddff"
}: {
  modelUrl: string;
  viseme: Viseme;
  blink: number;
  hologramColor?: string;
}) {
  const { scene: sourceScene } = useGLTF(modelUrl);
  const scene = useMemo(() => {
    const cloned = sourceScene.clone(true);
    cloned.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry = mesh.geometry.clone();
      if (Array.isArray(mesh.material)) mesh.material = mesh.material.map((m) => m.clone());
      else if (mesh.material) mesh.material = mesh.material.clone();
    });
    return cloned;
  }, [sourceScene]);

  const root = useRef<THREE.Group>(null);

  const { morphMeshes, staticRigs } = useMemo(() => {
    const morphs: MorphMesh[] = [];
    const statics: StaticFaceRig[] = [];
    scene.traverse((object) => {
      const mesh = object as MorphMesh;
      if (!mesh.isMesh) return;
      if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) morphs.push(mesh);
      else {
        const rig = buildStaticFaceRig(mesh);
        if (rig) statics.push(rig);
      }
    });
    return { morphMeshes: morphs, staticRigs: statics };
  }, [scene]);

  useEffect(() => {
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = mesh.material;
      const apply = (m: THREE.Material) => {
        if ("color" in m) (m as THREE.MeshStandardMaterial).color = new THREE.Color(hologramColor);
        if ("emissive" in m) {
          const std = m as THREE.MeshStandardMaterial;
          std.emissive = new THREE.Color(hologramColor);
          std.emissiveIntensity = 0.44;
          std.transparent = true;
          std.opacity = 0.82;
          std.depthWrite = false;
        }
      };
      Array.isArray(material) ? material.forEach(apply) : material && apply(material);
    });
  }, [scene, hologramColor]);

  useFrame((state, delta) => {
    const targets = VISEME_WEIGHTS[viseme];
    const smoothing = 1 - Math.exp(-delta * 18);

    for (const mesh of morphMeshes) {
      const dict = mesh.morphTargetDictionary!;
      const weights = mesh.morphTargetInfluences!;
      const pegasusTargets = PEGASUS_VISEME_TARGETS[viseme];

      // Reset Pegasus-native mouth targets every frame. This neutralizes
      // non-zero default weights exported in some source GLBs.
      for (const targetName of PEGASUS_TARGET_NAMES) {
        const index = dict[targetName];
        if (index === undefined) continue;
        const expressiveSmile = targetName === "mouthSmile" && viseme !== "REST" ? 0.04 : 0;
        const desired = pegasusTargets[targetName] ?? expressiveSmile;
        weights[index] = THREE.MathUtils.lerp(weights[index] ?? 0, desired, smoothing);
      }

      // Keep ARKit-compatible models working too.
      for (const [logicalName, targetValue] of Object.entries(targets)) {
        const actual = resolveName(dict, logicalName);
        if (!actual || PEGASUS_TARGET_NAMES.includes(actual as (typeof PEGASUS_TARGET_NAMES)[number])) continue;
        const index = dict[actual];
        weights[index] = THREE.MathUtils.lerp(weights[index] ?? 0, targetValue, smoothing);
      }

      for (const logicalName of ["eyeBlinkLeft", "eyeBlinkRight"]) {
        const actual = resolveName(dict, logicalName);
        if (!actual) continue;
        const index = dict[actual];
        weights[index] = THREE.MathUtils.lerp(weights[index] ?? 0, blink, 1 - Math.exp(-delta * 28));
      }
    }

    if (!morphMeshes.length) {
      for (const rig of staticRigs) driveStaticFace(rig, viseme, smoothing);
    }

    if (root.current) {
      root.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.33) * 0.008;
      root.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.27) * 0.004;
      root.current.position.y = Math.sin(state.clock.elapsedTime * 0.42) * 0.006;
    }
  });

  return <primitive ref={root} object={scene} />;
}

useGLTF.preload("/agents/echo.glb");
