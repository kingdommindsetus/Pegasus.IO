import * as THREE from "three";
import type { Viseme } from "../types";
import { VISEME_WEIGHTS } from "./visemes";

export type StaticFaceRig = {
  mesh: THREE.Mesh;
  position: THREE.BufferAttribute;
  original: Float32Array;
  indices: number[];
  bounds: THREE.Box3;
};

export function buildStaticFaceRig(mesh: THREE.Mesh): StaticFaceRig | null {
  const geometry = mesh.geometry as THREE.BufferGeometry;
  const position = geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
  if (!position) return null;
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox?.clone();
  if (!bounds) return null;

  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  bounds.getSize(size);
  bounds.getCenter(center);

  const mouthMinY = bounds.min.y + size.y * 0.49;
  const mouthMaxY = bounds.min.y + size.y * 0.66;
  const halfMouthWidth = size.x * 0.18;
  const frontThreshold = bounds.min.z + size.z * 0.56;
  const indices: number[] = [];

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    if (Math.abs(x - center.x) <= halfMouthWidth && y >= mouthMinY && y <= mouthMaxY && z >= frontThreshold) {
      indices.push(i);
    }
  }

  return {
    mesh,
    position,
    original: new Float32Array(position.array as ArrayLike<number>),
    indices,
    bounds
  };
}

export function driveStaticFace(rig: StaticFaceRig, viseme: Viseme, smoothing: number) {
  const targets = VISEME_WEIGHTS[viseme];
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  rig.bounds.getSize(size);
  rig.bounds.getCenter(center);

  const jawOpen = targets.jawOpen ?? 0;
  const pucker = Math.max(targets.mouthPucker ?? 0, targets.mouthFunnel ?? 0);
  const smile = Math.max(targets.mouthSmileLeft ?? 0, targets.mouthSmileRight ?? 0);
  const close = targets.mouthClose ?? 0;
  const mouthCenterY = rig.bounds.min.y + size.y * 0.575;

  for (const i of rig.indices) {
    const j = i * 3;
    const ox = rig.original[j];
    const oy = rig.original[j + 1];
    const oz = rig.original[j + 2];
    const vertical = THREE.MathUtils.clamp((mouthCenterY - oy) / (size.y * 0.09), -1, 1);
    const horizontal = THREE.MathUtils.clamp((ox - center.x) / (size.x * 0.18), -1, 1);
    const lower = THREE.MathUtils.smoothstep(vertical, -0.1, 1);
    const middle = 1 - Math.min(1, Math.abs(horizontal));

    const tx = ox - pucker * size.x * 0.012 * horizontal * middle;
    const ty = oy - jawOpen * size.y * 0.020 * lower * middle + smile * size.y * 0.005 * Math.abs(horizontal);
    const tz = oz + pucker * size.z * 0.018 * middle - close * size.z * 0.004 * middle;

    rig.position.setXYZ(
      i,
      THREE.MathUtils.lerp(rig.position.getX(i), tx, smoothing),
      THREE.MathUtils.lerp(rig.position.getY(i), ty, smoothing),
      THREE.MathUtils.lerp(rig.position.getZ(i), tz, smoothing)
    );
  }
  rig.position.needsUpdate = true;
}
