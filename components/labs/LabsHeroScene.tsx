"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type LabsHeroSceneProps = {
  className?: string;
};

export default function LabsHeroScene({ className = "" }: LabsHeroSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x05050b, 8, 42);
    const camera = new THREE.PerspectiveCamera(58, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(0, 0.5, 9.3);

    const ambient = new THREE.AmbientLight(0xa5b4fc, 0.55);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0x8b5cf6, 1.1);
    key.position.set(6, 8, 7);
    scene.add(key);
    const fill = new THREE.PointLight(0x60a5fa, 0.9, 22);
    fill.position.set(-7, 2, 5);
    scene.add(fill);

    // Rotating "lab crystal" with stacked voxel-like elements.
    const root = new THREE.Group();
    scene.add(root);

    const baseGeo = new THREE.BoxGeometry(0.95, 0.95, 0.95);
    const voxelMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      roughness: 0.35,
      metalness: 0.2,
      emissive: 0x2b1555,
      emissiveIntensity: 0.75,
    });
    for (let y = -2; y <= 2; y++) {
      for (let x = -2; x <= 2; x++) {
        for (let z = -2; z <= 2; z++) {
          const dist = Math.abs(x) + Math.abs(y) + Math.abs(z);
          if (dist > 4) continue;
          if (Math.random() < 0.22) continue;
          const box = new THREE.Mesh(baseGeo, voxelMat);
          box.position.set(x * 1.02, y * 1.02, z * 1.02);
          root.add(box);
        }
      }
    }

    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(3.6, 0)),
      new THREE.LineBasicMaterial({ color: 0x6d28d9, transparent: true, opacity: 0.55 })
    );
    scene.add(wire);

    // Orbiting particles.
    const particles = new THREE.Group();
    scene.add(particles);
    const pGeo = new THREE.SphereGeometry(0.06, 10, 10);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xc4b5fd });
    for (let i = 0; i < 28; i++) {
      const p = new THREE.Mesh(pGeo, pMat);
      const a = (i / 28) * Math.PI * 2;
      const r = 4.3 + Math.sin(i) * 0.8;
      p.position.set(Math.cos(a) * r, Math.sin(a * 1.2) * 1.3, Math.sin(a) * r);
      particles.add(p);
    }

    let raf = 0;
    let targetScrollRotation = 0;
    let targetScrollX = 0;

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };

    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      const t = max > 0 ? window.scrollY / max : 0;
      targetScrollRotation = t * Math.PI * 2.2;
      targetScrollX = (t - 0.5) * 0.65;
    };

    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      const lerp = 0.04;
      root.rotation.y += (targetScrollRotation - root.rotation.y) * lerp;
      root.rotation.x = Math.sin(t * 0.35) * 0.12;
      root.rotation.z = Math.cos(t * 0.27) * 0.08;
      root.position.y = Math.sin(t * 0.7) * 0.18;
      root.position.x += (targetScrollX - root.position.x) * 0.03;

      wire.rotation.y = root.rotation.y * 0.65 + t * 0.03;
      wire.rotation.x = Math.cos(t * 0.4) * 0.1;
      wire.material.opacity = 0.42 + Math.sin(t) * 0.16;

      particles.rotation.y = -t * 0.22;
      particles.rotation.x = Math.sin(t * 0.5) * 0.2;

      camera.position.x += (targetScrollX * 0.75 - camera.position.x) * 0.03;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    onResize();
    onScroll();
    animate();

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      container.removeChild(renderer.domElement);
      baseGeo.dispose();
      voxelMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      wire.geometry.dispose();
      (wire.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.78,
      }}
      aria-hidden
    />
  );
}
