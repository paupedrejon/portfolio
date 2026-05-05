"use client";

import { ContactShadows, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type MutableRefObject } from "react";
import { Group, MathUtils, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, type Material } from "three";

const MODEL = "/3d_printer/scene.gltf";
/** GLTF muy grande en unidades internas — alejar encuadre con escala baja + cámara. */
const MODEL_SCALE = 0.035;
const MOBILE_MODEL_FACTOR = 0.6;

interface HardwareSceneProps {
  reducedMotion: boolean;
  scrollProgressRef: MutableRefObject<number>;
  isMobile: boolean;
}

function easeInOutQuad(p: number) {
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
}

function HardwareModel({
  reducedMotion,
  scrollProgressRef,
  isMobile,
}: {
  reducedMotion: boolean;
  scrollProgressRef: MutableRefObject<number>;
  isMobile: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(MODEL);

  useEffect(() => {
    scene.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((mat: Material | undefined) => {
        if (!mat) return;
        if (
          (mat instanceof MeshStandardMaterial || mat instanceof MeshPhysicalMaterial) &&
          mat.roughness > 0.7
        ) {
          mat.roughness = 0.5;
          mat.needsUpdate = true;
        }
      });
    });
  }, [scene]);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;

    const p = reducedMotion ? 1 : scrollProgressRef.current;
    const ease = easeInOutQuad(MathUtils.clamp(p, 0, 1));

    const targetRotY = 0.6 - ease * 0.4;
    g.rotation.y = MathUtils.lerp(g.rotation.y, targetRotY, 0.08);

    const targetRotX = -0.1 + ease * 0.05;
    g.rotation.x = MathUtils.lerp(g.rotation.x, targetRotX, 0.08);

    g.position.y = -0.5 + Math.sin(state.clock.elapsedTime * 0.6) * 0.08;
  });

  return (
    <group ref={groupRef} name="hardware-group" position={[0, -0.5, 0]}>
      <primitive
        object={scene}
        scale={MODEL_SCALE * (isMobile ? MOBILE_MODEL_FACTOR : 1)}
        rotation={[0, 0.5, 0]}
      />
    </group>
  );
}

export default function HardwareScene(props: HardwareSceneProps) {
  return (
    <>
      <color attach="background" args={["#0f0800"]} />

      <ambientLight intensity={0.4} />

      <directionalLight position={[4, 6, 3]} intensity={1.2} color="#ffffff" />

      <pointLight position={[0, 0, -4]} intensity={3} color="#fb923c" distance={12} decay={2} />
      <pointLight position={[-3, 2, 2]} intensity={2} color="#ea580c" distance={8} decay={2} />

      <HardwareModel
        reducedMotion={props.reducedMotion}
        scrollProgressRef={props.scrollProgressRef}
        isMobile={props.isMobile}
      />

      <ContactShadows
        position={[0, -2.2, 0]}
        opacity={0.38}
        blur={2.4}
        far={4.5}
        color="#0c0600"
        resolution={512}
      />
    </>
  );
}

useGLTF.preload(MODEL);
