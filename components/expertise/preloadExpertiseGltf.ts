"use client";

import { useGLTF } from "@react-three/drei";

/** URLs de todos los GLTF del carrusel expertise (precarga al montar la sección). */
export const EXPERTISE_GLTF_URLS = [
  "/neural_networks_of_the_brain/scene.gltf",
  "/old_computers/scene.gltf",
  "/glass_smartphone_design/scene.gltf",
  "/nes_controller_free/scene.gltf",
  "/3d_printer/scene.gltf",
] as const;

export function preloadExpertiseGltf(): void {
  for (const url of EXPERTISE_GLTF_URLS) {
    useGLTF.preload(url);
  }
}
