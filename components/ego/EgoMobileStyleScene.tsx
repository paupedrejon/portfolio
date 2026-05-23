"use client";

import { ContactShadows, useGLTF, useTexture } from "@react-three/drei";
import { useEffect, useRef } from "react";
import {
  Color,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  type Material,
} from "three";

const MODEL = "/glass_smartphone_design/scene.gltf";
const EGO_TEXTURE = "/ego.jpg";
/** Mismos valores que `MobileScene` en expertise. */
const MODEL_SCALE = 28;
const MOBILE_MODEL_FACTOR = 0.6;

function dampenBodyMaterial(mat: Material) {
  if (mat instanceof MeshStandardMaterial || mat instanceof MeshPhysicalMaterial) {
    mat.color = new Color("#5e6d7e");
    mat.metalness = 0.45;
    mat.roughness = 0.38;
    mat.envMapIntensity = 0;
    if (mat instanceof MeshPhysicalMaterial) {
      mat.transmission = 0;
      mat.thickness = 0;
      mat.transparent = false;
      mat.opacity = 1;
      mat.clearcoat = 0.35;
      mat.clearcoatRoughness = 0.4;
    }
    mat.needsUpdate = true;
  }
}

/** Móvil estático con el mismo look que la sección MOBILE de expertise. */
function StaticMobileModel() {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(MODEL);
  const egoTexture = useTexture(EGO_TEXTURE);

  useEffect(() => {
    egoTexture.flipY = true;
    egoTexture.colorSpace = SRGBColorSpace;
    egoTexture.needsUpdate = true;

    const screenMeshes = new WeakSet<Mesh>();

    scene.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const matName = Array.isArray(obj.material)
        ? obj.material.map((m: Material) => m?.name ?? "").join(",")
        : (obj.material?.name ?? "");

      const lowerMat = matName.toLowerCase();
      const lowerName = obj.name.toLowerCase();
      const isScreen =
        lowerMat.includes("tela") ||
        lowerMat.includes("screen") ||
        lowerMat.includes("display") ||
        lowerName.includes("screen") ||
        lowerName.includes("display");

      if (isScreen) {
        obj.material = new MeshStandardMaterial({
          map: egoTexture,
          emissive: new Color("#ffffff"),
          emissiveMap: egoTexture,
          emissiveIntensity: 0.5,
          roughness: 0.05,
          metalness: 0,
          toneMapped: false,
        });
        obj.material.needsUpdate = true;
        screenMeshes.add(obj);
      }
    });

    scene.traverse((obj) => {
      if (!(obj instanceof Mesh) || screenMeshes.has(obj)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((mat) => {
        if (mat) dampenBodyMaterial(mat);
      });
    });
  }, [scene, egoTexture]);

  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    // Pose final del scroll en MobileScene (vista frontal centrada).
    g.rotation.x = 0;
    g.rotation.y = 0;
    g.rotation.z = 0;
    g.scale.setScalar(1);
    g.position.set(0, -0.2, 0);
  }, []);

  return (
    <group ref={groupRef} name="ego-mobile-hero-group">
      <primitive object={scene} scale={MODEL_SCALE * MOBILE_MODEL_FACTOR} rotation={[0, 0, 0]} />
    </group>
  );
}

/** Luces y sombras idénticas a `MobileScene`. */
export function EgoMobileStyleSceneContent() {
  return (
    <>
      <pointLight position={[-4, 0, 1]} intensity={3} color="#06b6d4" distance={10} decay={2} />
      <pointLight position={[4, 0, 1]} intensity={3} color="#06b6d4" distance={10} decay={2} />
      <pointLight position={[0, 4, 0]} intensity={2} color="#ffffff" distance={8} decay={2} />
      <pointLight position={[0, -3, 2]} intensity={1.5} color="#0891b2" distance={8} decay={2} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[0, 0, 5]} intensity={0.3} color="#ffffff" />

      <StaticMobileModel />

      <ContactShadows
        position={[0, -3, 0]}
        opacity={0.35}
        blur={2.5}
        far={4}
        color="#000000"
        resolution={512}
      />
    </>
  );
}

useGLTF.preload(MODEL);
