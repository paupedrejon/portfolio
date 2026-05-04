"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, useGLTF, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo } from "react";
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

const HERO_BG_LAYERS = `
  radial-gradient(ellipse 90% 55% at 18% 22%, rgba(16, 185, 129, 0.18) 0%, transparent 52%),
  radial-gradient(ellipse 70% 50% at 88% 78%, rgba(5, 150, 105, 0.14) 0%, transparent 48%),
  radial-gradient(ellipse 50% 40% at 50% 100%, rgba(34, 197, 94, 0.08) 0%, transparent 55%),
  linear-gradient(165deg, #040a08 0%, #020403 42%, #010302 100%)
`;

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
}: {
  screenTexture: Texture;
  position: [number, number, number];
  rotation: [number, number, number];
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

  return <primitive object={clonedScene} scale={MODEL_SCALE} position={position} rotation={rotation} />;
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

/** Dentro del Canvas: una sola carga de texturas + clones para distinto flipY. */
function EgoScene() {
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
      // Misma convención que `MobileScene` (pantalla del GLTF).
      t.flipY = true;
      t.needsUpdate = true;
    }
    // El plano usa UV distintas: invertimos respecto al GLTF para que no quede al revés.
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

export default function EgoShowcasePage() {
  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundColor: "#030806",
        backgroundImage: HERO_BG_LAYERS,
        // Un solo degradado respecto al viewport: evita el “corte” entre texto y Canvas.
        backgroundAttachment: "fixed",
        color: "#fff",
        display: "grid",
        gridTemplateColumns: "minmax(340px, 1fr) minmax(420px, 1.2fr)",
        alignItems: "center",
        gap: "2rem",
        padding: "clamp(1.5rem, 4vw, 4rem)",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 120% 80% at 50% -10%, rgba(16, 185, 129, 0.06) 0%, transparent 45%)",
        }}
      />
      <section style={{ maxWidth: 520, paddingLeft: "clamp(1rem, 2.5vw, 2.25rem)", position: "relative", zIndex: 2 }}>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.7)",
            marginBottom: "1rem",
          }}
        >
          Universitat Politecnica de Barcelona
        </p>
        <h1
          style={{
            fontFamily: "\"Lulo Clean\", \"Bebas Neue\", var(--font-league-spartan), sans-serif",
            fontSize: "clamp(2rem, 6vw, 4.4rem)",
            lineHeight: 1.02,
            letterSpacing: "0.04em",
            marginBottom: "1.2rem",
          }}
        >
          E-Go
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "clamp(1rem, 1.7vw, 1.35rem)",
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.85)",
            maxWidth: 480,
          }}
        >
          App de movilidad sostenible para usuarios de vehiculo electrico: estaciones de carga, autonomia,
          favoritos y gestion de la experiencia en una sola plataforma.
        </p>
      </section>

      <section
        style={{
          width: "100%",
          height: "min(96vh, 980px)",
          position: "relative",
          zIndex: 1,
          background: "transparent",
        }}
      >
        <Canvas
          camera={{ position: [0, 0.68, 10.8], fov: 30 }}
          dpr={[1.25, 2.5]}
          gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
          style={{ width: "100%", height: "100%", display: "block", background: "transparent" }}
        >
          <Suspense fallback={null}>
            <EgoScene />
          </Suspense>
        </Canvas>
      </section>
    </main>
  );
}

useGLTF.preload(MODEL);
