"use client";

import EgoDownloadButton from "@/components/ego/EgoDownloadButton";
import MobileScene from "@/components/expertise/scenes/MobileScene";
import { Canvas } from "@react-three/fiber";
import { Vignette, EffectComposer } from "@react-three/postprocessing";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Suspense, useEffect, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

/** Mismos tokens que la sección MOBILE en expertise (`data.ts`). */
const MOBILE_SECTION_BG =
  "radial-gradient(circle at 50% 45%, rgba(0, 0, 0, 0.35) 0%, rgba(5, 13, 18, 0.96) 55%, #050d12 100%)";
const MOBILE_VIGNETTE =
  "radial-gradient(ellipse 55% 65% at center, transparent 8%, rgba(0,0,0,0.62) 55%, rgba(0,0,0,0.98) 100%)";
const MOBILE_CAMERA = { position: [0, 0, 7] as [number, number, number], fov: 30 };

type Props = {
  kicker: string;
  title: string;
  subtitle: string;
  downloadCta: string;
};

function useDeviceHints() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [weakDevice, setWeakDevice] = useState(false);

  useEffect(() => {
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(motionMq.matches);
      setWeakDevice((navigator.hardwareConcurrency || 8) < 4);
    };
    update();
    motionMq.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      motionMq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return { reducedMotion, weakDevice };
}

/**
 * Hero móvil de /ego: réplica del stack visual de la sección MOBILE en home
 * (canvas fullscreen, parallax por scroll, vignette, misma cámara y escena).
 */
export default function EgoMobileHero({ kicker, title, subtitle, downloadCta }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollProgressRef = useRef(0);
  const [shouldRenderCanvas, setShouldRenderCanvas] = useState(false);
  const { reducedMotion, weakDevice } = useDeviceHints();

  useEffect(() => {
    setShouldRenderCanvas(true);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top center",
      end: "bottom center",
      onUpdate: (self) => {
        scrollProgressRef.current = self.progress;
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <header
      ref={sectionRef}
      className="ego-mobile-hero"
      style={{
        position: "relative",
        minHeight: "100dvh",
        overflow: "hidden",
        background: MOBILE_SECTION_BG,
        color: "#fff",
        colorScheme: "dark",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 0,
        }}
      >
        {shouldRenderCanvas && !weakDevice ? (
          <Canvas
            style={{ width: "100%", height: "100%", display: "block" }}
            dpr={[1, 1]}
            camera={MOBILE_CAMERA}
            gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
            onCreated={({ gl }) => {
              gl.setSize(window.innerWidth, window.innerHeight);
            }}
          >
            <Suspense fallback={null}>
              <MobileScene
                reducedMotion={reducedMotion}
                scrollProgressRef={scrollProgressRef}
                isMobile
                mattePhone
              />
              {!reducedMotion ? (
                <EffectComposer multisampling={0}>
                  <Vignette eskil={false} offset={0.2} darkness={0.5} />
                </EffectComposer>
              ) : null}
            </Suspense>
          </Canvas>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "#050d12",
            }}
          />
        )}
      </div>

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
          background: MOBILE_VIGNETTE,
        }}
      />

      <div className="ego-mobile-hero__scrim" aria-hidden />

      <div className="ego-mobile-hero__content">
        <p className="ego-mobile-hero__kicker">{kicker}</p>
        <h1 className="ego-mobile-hero__title">{title}</h1>
        <p className="ego-mobile-hero__subtitle">{subtitle}</p>
        <EgoDownloadButton label={downloadCta} />
      </div>
    </header>
  );
}
