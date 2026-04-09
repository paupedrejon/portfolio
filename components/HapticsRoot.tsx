"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { installPortfolioHaptics } from "@/lib/haptics/installGlobalListeners";

/**
 * Mounts global haptic listeners in useLayoutEffect.
 * ?haptic=debug — first touch runs a long vibrate once; shows a test button (API vs hit-test).
 */
export default function HapticsRoot() {
  const uninstallRef = useRef<(() => void) | null>(null);
  const [debugUi, setDebugUi] = useState(false);

  useLayoutEffect(() => {
    const debug =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("haptic") === "debug";
    setDebugUi(debug);

    uninstallRef.current = installPortfolioHaptics({ debug });

    return () => {
      uninstallRef.current?.();
      uninstallRef.current = null;
    };
  }, []);

  if (!debugUi) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 2147483647,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: "min(280px, 92vw)",
        fontFamily: "system-ui, sans-serif",
        fontSize: 12,
        pointerEvents: "auto",
      }}
    >
      <button
        type="button"
        onClick={() => {
          const r =
            typeof navigator !== "undefined" && typeof navigator.vibrate === "function"
              ? navigator.vibrate(400)
              : undefined;
          console.log("[haptics] direct onClick vibrate() returned:", r);
        }}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid rgba(139,92,246,0.65)",
          background: "rgba(15,15,22,0.96)",
          color: "#e2e8f0",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Probar vibración (clic directo)
      </button>
      <p style={{ margin: 0, color: "rgba(148,163,184,0.95)", lineHeight: 1.45 }}>
        Si esto vibra pero los enlaces no, el problema era capas encima (canvas). Ahora se usa
        elementsFromPoint. Si esto tampoco vibra, revisa ajustes del móvil (modo silencio / vibración).
      </p>
    </div>
  );
}
