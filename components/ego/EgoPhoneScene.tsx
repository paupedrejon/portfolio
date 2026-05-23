"use client";

import { Canvas } from "@react-three/fiber";
import { EgoMobileStyleSceneContent } from "@/components/ego/EgoMobileStyleScene";
import { ContactShadows, useGLTF, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  Color,
  DoubleSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  MeshBasicMaterial,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  type Material,
  type Object3D,
  type Texture,
} from "three";

const MODEL = "/glass_smartphone_design/scene.gltf";
const MODEL_SCALE = 27;
const EGO_URL = "/ego.jpg";
const EGO2_URL = "/ego2.jpg";

function styleBodyMaterial(mat: Material) {
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

function PhoneModel({
  screenTexture,
  position,
  rotation,
  scale = MODEL_SCALE,
}: {
  screenTexture: Texture;
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
}) {
  const { scene } = useGLTF(MODEL);
  const clonedScene = useMemo(() => scene.clone(true) as Object3D, [scene]);

  useEffect(() => {
    const screenMeshes = new WeakSet<Mesh>();

    clonedScene.traverse((obj) => {
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
        obj.material = new MeshBasicMaterial({
          map: screenTexture,
          toneMapped: false,
        });
        obj.material.needsUpdate = true;
        screenMeshes.add(obj);
      }
    });

    clonedScene.traverse((obj) => {
      if (!(obj instanceof Mesh) || screenMeshes.has(obj)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((mat) => {
        if (mat) styleBodyMaterial(mat);
      });
    });
  }, [clonedScene, screenTexture]);

  return <primitive object={clonedScene} scale={scale} position={position} rotation={rotation} />;
}

function PhoneScreen({
  texture,
  position,
  rotation,
}: {
  texture: Texture;
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[1.62, 3.24]} />
      <meshBasicMaterial map={texture} color="#cfd6de" toneMapped={false} side={DoubleSide} depthWrite={false} />
    </mesh>
  );
}

export function EgoSceneContent() {
  const [egoTex, ego2Tex] = useTexture([EGO_URL, EGO2_URL]);
  const egoPlaneTex = useMemo(() => egoTex.clone(), [egoTex]);
  const ego2PlaneTex = useMemo(() => ego2Tex.clone(), [ego2Tex]);

  useEffect(() => {
    for (const t of [egoTex, ego2Tex]) {
      t.colorSpace = SRGBColorSpace;
      t.minFilter = LinearMipmapLinearFilter;
      t.magFilter = LinearFilter;
      t.generateMipmaps = true;
      t.anisotropy = 16;
      t.flipY = true;
      t.needsUpdate = true;
    }
    for (const t of [egoPlaneTex, ego2PlaneTex]) {
      t.colorSpace = SRGBColorSpace;
      t.minFilter = LinearMipmapLinearFilter;
      t.magFilter = LinearFilter;
      t.generateMipmaps = true;
      t.anisotropy = 16;
      t.flipY = false;
      t.needsUpdate = true;
    }
  }, [egoTex, ego2Tex, egoPlaneTex, ego2PlaneTex]);

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[-4, 1, 3]} intensity={2.2} color="#ffffff" />
      <pointLight position={[4, 1, 2]} intensity={1.7} color="#7dd3fc" />
      <pointLight position={[0, 5, 0]} intensity={1.5} color="#ffffff" />

      <PhoneModel screenTexture={egoTex} position={[-1.15, -0.12, 0.6]} rotation={[0.05, 0.3, -0.08]} />
      <PhoneModel screenTexture={ego2Tex} position={[1.22, -0.18, -0.2]} rotation={[0.03, -0.34, 0.1]} />
      <PhoneScreen texture={egoPlaneTex} position={[-1.15, 0.2, 1.08]} rotation={[0.05, 0.3, -0.08]} />
      <PhoneScreen texture={ego2PlaneTex} position={[1.22, 0.14, 0.28]} rotation={[0.03, -0.34, 0.1]} />

      <ContactShadows position={[0, -3.55, 0]} opacity={0.34} blur={2.8} far={7.5} color="#000000" />
    </>
  );
}

type CanvasVariant = "hero" | "banner";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function useIsNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    setNarrow(mq.matches);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return narrow;
}

/** Canvas con los dos móviles 3D de e-Go. */
export default function EgoPhoneCanvas({
  variant = "hero",
  className = "",
}: {
  variant?: CanvasVariant;
  className?: string;
}) {
  const narrow = useIsNarrow();
  const reducedMotion = usePrefersReducedMotion();

  const singlePhone = variant === "hero" && narrow;

  const camera = singlePhone
    ? { position: [0, 0, 7] as [number, number, number], fov: 30 }
    : variant === "banner"
      ? {
          position: [0, 0.52, narrow ? 10.4 : 9.2] as [number, number, number],
          fov: narrow ? 36 : 34,
        }
      : { position: [0, 0.68, narrow ? 12.2 : 10.8] as [number, number, number], fov: narrow ? 34 : 30 };

  const dpr: [number, number] = narrow ? [1, 1.5] : [1.25, 2];

  const canvasClass = [
    "ego-phone-canvas",
    `ego-phone-canvas--${variant}`,
    singlePhone ? "ego-phone-canvas--single" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={canvasClass}>
      <Canvas
        camera={camera}
        dpr={dpr}
        frameloop={reducedMotion ? "demand" : "always"}
        gl={{ alpha: true, antialias: !narrow, premultipliedAlpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        style={{ width: "100%", height: "100%", display: "block", background: "transparent" }}
      >
        <Suspense fallback={null}>
          {singlePhone ? <EgoMobileStyleSceneContent /> : <EgoSceneContent />}
        </Suspense>
      </Canvas>
      <style jsx>{`
        .ego-phone-canvas {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 0;
        }
        .ego-phone-canvas--hero {
          min-height: clamp(280px, 52vh, 720px);
        }
        .ego-phone-canvas--hero.ego-phone-canvas--single {
          min-height: 100%;
        }
        .ego-phone-canvas--banner {
          min-height: clamp(300px, 62vw, 460px);
        }
      `}</style>
    </div>
  );
}

useGLTF.preload(MODEL);
