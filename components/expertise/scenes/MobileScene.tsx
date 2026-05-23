"use client";

import { ContactShadows, useGLTF, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type MutableRefObject } from "react";
import {
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  type Material,
} from "three";

const MODEL = "/glass_smartphone_design/scene.gltf";
const EGO_TEXTURE = "/ego.jpg";
const MODEL_SCALE = 28;
const MOBILE_MODEL_FACTOR = 0.6;

function dampenBodyMaterial(mat: Material, matte = false) {
  if (mat instanceof MeshStandardMaterial || mat instanceof MeshPhysicalMaterial) {
    mat.color = new Color("#5e6d7e");
    mat.metalness = matte ? 0.12 : 0.45;
    mat.roughness = matte ? 0.72 : 0.38;
    mat.envMapIntensity = 0;
    if (mat instanceof MeshPhysicalMaterial) {
      mat.transmission = 0;
      mat.thickness = 0;
      mat.transparent = false;
      mat.opacity = 1;
      mat.clearcoat = matte ? 0 : 0.35;
      mat.clearcoatRoughness = matte ? 1 : 0.4;
    }
    mat.needsUpdate = true;
  }
}

interface MobileSceneProps {
  reducedMotion: boolean;
  scrollProgressRef: MutableRefObject<number>;
  isMobile: boolean;
  /** Sin emissive/clearcoat en pantalla y marco (p. ej. hero /ego móvil). */
  mattePhone?: boolean;
}

function easeInOutQuad(p: number) {
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
}

function MobileModel({
  reducedMotion,
  scrollProgressRef,
  isMobile,
  mattePhone,
}: {
  reducedMotion: boolean;
  scrollProgressRef: MutableRefObject<number>;
  isMobile: boolean;
  mattePhone: boolean;
}) {
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
        obj.material = mattePhone
          ? new MeshBasicMaterial({
              map: egoTexture,
              toneMapped: false,
            })
          : new MeshStandardMaterial({
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
        if (mat) dampenBodyMaterial(mat, mattePhone);
      });
    });
  }, [scene, egoTexture, mattePhone]);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;

    const p = reducedMotion ? 1 : scrollProgressRef.current;
    const eased = easeInOutQuad(MathUtils.clamp(p, 0, 1));

    const targetRotX = -0.55 + eased * 0.55;
    g.rotation.x = MathUtils.lerp(g.rotation.x, targetRotX, 0.08);

    const targetScale = 1.3 - eased * 0.3;
    const s = MathUtils.lerp(g.scale.x, targetScale, 0.08);
    g.scale.setScalar(s);

    const targetY = -0.5 + eased * 0.3;
    g.position.y = MathUtils.lerp(g.position.y, targetY, 0.08);
    g.position.x = MathUtils.lerp(g.position.x, 0, 0.06);

    g.rotation.y = MathUtils.lerp(g.rotation.y, 0, 0.05);
    g.rotation.z = MathUtils.lerp(g.rotation.z, 0, 0.05);
  });

  return (
    <group ref={groupRef} name="mobile-group">
      <primitive
        object={scene}
        scale={MODEL_SCALE * (isMobile ? MOBILE_MODEL_FACTOR : 1)}
        rotation={[0, 0, 0]}
      />
    </group>
  );
}

export default function MobileScene(props: MobileSceneProps) {
  const matte = props.mattePhone ?? false;

  return (
    <>
      <color attach="background" args={["#050d12"]} />

      <pointLight
        position={[-4, 0, 1]}
        intensity={matte ? 2 : 3}
        color="#06b6d4"
        distance={10}
        decay={2}
      />
      <pointLight
        position={[4, 0, 1]}
        intensity={matte ? 2 : 3}
        color="#06b6d4"
        distance={10}
        decay={2}
      />
      <pointLight position={[0, 4, 0]} intensity={matte ? 1.4 : 2} color="#ffffff" distance={8} decay={2} />
      <pointLight position={[0, -3, 2]} intensity={matte ? 1 : 1.5} color="#0891b2" distance={8} decay={2} />

      <ambientLight intensity={matte ? 0.55 : 0.4} />

      <directionalLight position={[0, 0, 5]} intensity={matte ? 0.15 : 0.3} color="#ffffff" />

      <MobileModel
        reducedMotion={props.reducedMotion}
        scrollProgressRef={props.scrollProgressRef}
        isMobile={props.isMobile}
        mattePhone={matte}
      />

      {!matte ? (
        <ContactShadows
          position={[0, -3, 0]}
          opacity={0.35}
          blur={2.5}
          far={4}
          color="#000000"
          resolution={512}
        />
      ) : null}
    </>
  );
}

useGLTF.preload(MODEL);
