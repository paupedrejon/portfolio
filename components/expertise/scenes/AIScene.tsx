"use client";

import { Center, Environment, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type MutableRefObject } from "react";
import {
  Color,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
} from "three";

const MODEL = "/neural_networks_of_the_brain/scene.gltf";
const MOBILE_MODEL_FACTOR = 0.6;

interface AISceneProps {
  reducedMotion: boolean;
  scrollProgressRef: MutableRefObject<number>;
  isMobile: boolean;
}

function BrainModel({ reducedMotion, isMobile }: { reducedMotion: boolean; isMobile: boolean }) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(MODEL);

  useEffect(() => {
    scene.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;

      obj.material = new MeshPhysicalMaterial({
        color: new Color("#0a0020"),
        emissive: new Color("#a855f7"),
        emissiveIntensity: 0.6,
        metalness: 0.28,
        roughness: 0.62,
        specularIntensity: 0,
        envMapIntensity: 0.22,
        transmission: 0.18,
        thickness: 1.2,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        side: DoubleSide,
      });
      obj.material.needsUpdate = true;
    });
  }, [scene]);

  useEffect(() => {
    const wireframes: Mesh[] = [];
    scene.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const wfMat = new MeshBasicMaterial({
        color: "#d8b4fe",
        wireframe: true,
        transparent: true,
        opacity: 0.12,
      });
      const wf = new Mesh(obj.geometry, wfMat);
      wf.position.copy(obj.position);
      wf.rotation.copy(obj.rotation);
      wf.scale.copy(obj.scale);
      obj.parent?.add(wf);
      wireframes.push(wf);
    });
    return () => {
      wireframes.forEach((wf) => {
        wf.removeFromParent();
        if (wf.material instanceof MeshBasicMaterial) wf.material.dispose();
      });
    };
  }, [scene]);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    if (!reducedMotion) {
      g.rotation.y += 0.003;
      g.rotation.x = MathUtils.lerp(g.rotation.x, state.mouse.y * 0.08, 0.04);
    } else {
      g.rotation.x = MathUtils.lerp(g.rotation.x, 0, 0.06);
    }
  });

  return (
    <Center>
      <group ref={groupRef} name="ai-group" position={[0, 0.42, 0]}>
        <primitive object={scene} scale={0.5 * (isMobile ? MOBILE_MODEL_FACTOR : 1)} />
      </group>
    </Center>
  );
}

export default function AIScene(props: AISceneProps) {
  void props.scrollProgressRef;
  return (
    <>
      <color attach="background" args={["#0a0812"]} />

      <ambientLight intensity={0.08} />
      <directionalLight position={[3, 5, 3]} intensity={0.28} color="#d4c8f0" />
      <pointLight position={[-3, 2, 2]} intensity={0.75} color="#a855f7" distance={10} decay={2} />
      <pointLight position={[3, -1, 1]} intensity={0.55} color="#06b6d4" distance={8} decay={2} />

      <BrainModel reducedMotion={props.reducedMotion} isMobile={props.isMobile} />
      <Environment preset="studio" />
    </>
  );
}

useGLTF.preload(MODEL);
