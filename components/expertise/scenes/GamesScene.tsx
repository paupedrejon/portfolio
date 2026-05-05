"use client";

import { ContactShadows, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type MutableRefObject } from "react";
import { Box3, Group, MathUtils, Vector3 } from "three";

const MODEL = "/nes_controller_free/scene.gltf";
/** El GLTF del NES viene muy grande en unidades internas. */
const MODEL_SCALE = 0.34;
/** En viewport móvil el modelo se muestra ~40% más pequeño. */
const MOBILE_MODEL_FACTOR = 0.6;

function GamesCameraRig() {
  const camera = useThree((s) => s.camera);
  useFrame(() => {
    camera.position.set(0, 3, 6);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

interface GamesSceneProps {
  reducedMotion: boolean;
  scrollProgressRef: MutableRefObject<number>;
  isMobile: boolean;
}

function GamesModel({
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
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    console.log("Tamaño modelo (NES):", {
      x: size.x,
      y: size.y,
      z: size.z,
    });
  }, [scene]);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;

    const p = MathUtils.clamp(
      reducedMotion ? 1 : scrollProgressRef.current,
      0,
      1,
    );
    const ease =
      p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const t = state.clock.elapsedTime;

    g.rotation.x = MathUtils.lerp(g.rotation.x, 1.0 - ease * 0.25, 0.06);

    g.rotation.y = MathUtils.lerp(g.rotation.y, ease * 0.15 - 0.08, 0.06);

    g.position.y = -0.3 + Math.sin(t * 0.7) * 0.08;

    g.position.z = MathUtils.lerp(g.position.z, ease * 0.3, 0.05);
  });

  return (
    <group ref={groupRef} name="games-group">
      <primitive
        object={scene}
        scale={MODEL_SCALE * (isMobile ? MOBILE_MODEL_FACTOR : 1)}
        rotation={[0, 0, 0]}
      />
    </group>
  );
}

export default function GamesScene(props: GamesSceneProps) {
  return (
    <>
      <GamesCameraRig />
      <color attach="background" args={["#120505"]} />

      <ambientLight intensity={0.75} color="#ffe8e8" />

      <directionalLight position={[0, 0, 12]} intensity={1.35} color="#ffffff" />

      <directionalLight position={[0, 4, 8]} intensity={0.55} color="#ffcccc" />
      <directionalLight position={[-5, 2, 4]} intensity={0.35} color="#ff6b6b" />

      <pointLight position={[4, 1, 2]} intensity={2.2} color="#ef4444" distance={14} decay={2} />
      <pointLight position={[-4, 0, 3]} intensity={1.6} color="#f87171" distance={12} decay={2} />
      <pointLight position={[0, -2, 5]} intensity={1.2} color="#7f1d1d" distance={10} decay={2} />

      <GamesModel
        reducedMotion={props.reducedMotion}
        scrollProgressRef={props.scrollProgressRef}
        isMobile={props.isMobile}
      />

      <ContactShadows
        position={[0, -1.8, 0]}
        opacity={0.4}
        blur={2.2}
        far={4}
        color="#1a0505"
        resolution={512}
      />
    </>
  );
}

useGLTF.preload(MODEL);
