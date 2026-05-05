"use client";

import { Center, ContactShadows, Environment, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import { Color, Group, MathUtils, MeshStandardMaterial, type Material, type Mesh } from "three";

const MOBILE_MODEL_FACTOR = 0.6;

interface WebSceneProps {
  reducedMotion: boolean;
  scrollProgressRef: MutableRefObject<number>;
  isMobile: boolean;
}

/** Solo mallas que comparten material "Screen" pero no deben animarse (p. ej. suelo). Añade nombre exacto tras ver `SCREEN MESH:` en consola. */
const EXCLUDE_SCREEN_MATERIAL_MESH_NAMES = new Set<string>();

function shouldSkipScreenMaterialReplace(mesh: Mesh): boolean {
  return EXCLUDE_SCREEN_MATERIAL_MESH_NAMES.has(mesh.name);
}

function WebModel({
  reducedMotion,
  scrollProgressRef,
  isMobile,
  screenMatRef,
}: WebSceneProps & {
  screenMatRef: RefObject<MeshStandardMaterial | null>;
}) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF("/old_computers/scene.gltf");

  useEffect(() => {
    if (!scene) return;
    const shared = screenMatRef.current;
    if (!shared) return;

    if (process.env.NODE_ENV === "development") {
      scene.traverse((obj: unknown) => {
        const mesh = obj as Mesh;
        if (!mesh.isMesh) return;
        const matName = Array.isArray(mesh.material)
          ? mesh.material.map((m: Material) => m?.name).join(",")
          : mesh.material?.name;
        if (matName === "Screen") {
          console.log(`SCREEN MESH: "${mesh.name}"`);
        }
      });
    }

    scene.traverse((obj: unknown) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh || shouldSkipScreenMaterialReplace(mesh)) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((slot: Material | undefined, idx: number) => {
        if (slot?.name === "Screen") {
          if (Array.isArray(mesh.material)) {
            mesh.material[idx] = shared;
          } else {
            mesh.material = shared;
          }
          shared.needsUpdate = true;
        }
      });
    });
  }, [scene, screenMatRef]);

  useFrame((state, delta) => {
    const mat = screenMatRef.current;
    if (!mat) return;
    if (!reducedMotion) {
      const ud = mat.userData as { t?: number };
      ud.t = (ud.t ?? 0) + delta * 0.8;
      const t = ud.t;
      const colors: [number, number, number][] = [
        [0.0, 1.0, 0.4],
        [0.0, 0.3, 1.0],
        [0.8, 0.0, 1.0],
        [0.0, 0.9, 0.9],
      ];
      const pos = (t * 0.25) % colors.length;
      const fi = Math.floor(pos) % colors.length;
      const ti = (fi + 1) % colors.length;
      const frac = pos - Math.floor(pos);
      const ease = frac < 0.5 ? 2 * frac * frac : 1 - Math.pow(-2 * frac + 2, 2) / 2;
      const cf = colors[fi]!;
      const ct = colors[ti]!;
      mat.emissive.setRGB(
        cf[0]! + (ct[0]! - cf[0]!) * ease,
        cf[1]! + (ct[1]! - cf[1]!) * ease,
        cf[2]! + (ct[2]! - cf[2]!) * ease
      );
      mat.emissiveIntensity = 2.2 + Math.sin(t * 2.0) * 0.6;
    }

    const g = groupRef.current;
    if (!g) return;

    const { camera, mouse } = state;
    if (!reducedMotion) {
      const targetCamX = mouse.x * 0.05;
      const targetCamY = mouse.y * 0.05;
      camera.position.x = MathUtils.lerp(camera.position.x, targetCamX, 0.04);
      camera.position.y = MathUtils.lerp(camera.position.y, 1 + targetCamY, 0.04);
      camera.position.z = MathUtils.lerp(camera.position.z, 14, 0.04);
      camera.lookAt(0, 0, 0);
    }
    const targetRotY = (scrollProgressRef.current - 0.5) * 0.16;
    g.rotation.y = MathUtils.lerp(g.rotation.y, reducedMotion ? 0 : targetRotY, 0.05);
    g.rotation.x = 0;
    g.rotation.z = 0;
  });

  return (
    <group
      ref={groupRef}
      scale={1.2 * (isMobile ? MOBILE_MODEL_FACTOR : 1)}
      position={[0, -0.5, 0]}
      rotation={[0, 0, 0]}
    >
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

export default function WebScene(props: WebSceneProps) {
  const screenMatRef = useRef<MeshStandardMaterial | null>(null);
  if (!screenMatRef.current) {
    screenMatRef.current = new MeshStandardMaterial({
      color: new Color(0, 0.1, 0.05),
      emissive: new Color(0, 1, 0.6),
      emissiveIntensity: 2.5,
      roughness: 0.15,
      metalness: 0,
      toneMapped: false,
    });
    (screenMatRef.current.userData as { t?: number }).t = 0;
  }

  return (
    <>
      <color attach="background" args={["#000000"]} />

      <ambientLight intensity={0.05} color="#ffffff" />
      <directionalLight position={[4, 5, 3]} intensity={0.55} color="#ffd7b5" />
      {!props.isMobile ? (
        <directionalLight position={[-4, 2, 2]} intensity={0.45} color="#9cc8ff" />
      ) : null}
      <pointLight position={[0, 1.5, -2]} intensity={props.isMobile ? 0.85 : 1} color="#00ffaa" />
      <pointLight position={[0, 3.0, 2.5]} intensity={2.0} color="#00ff99" distance={12} decay={2} />

      <WebModel
        reducedMotion={props.reducedMotion}
        scrollProgressRef={props.scrollProgressRef}
        isMobile={props.isMobile}
        screenMatRef={screenMatRef}
      />
      <ContactShadows position={[0, -1.6, 0]} opacity={0.32} blur={2.4} far={3} resolution={512} />
      <Environment preset="studio" />
    </>
  );
}

useGLTF.preload("/old_computers/scene.gltf");
