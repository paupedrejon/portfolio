"use client";

import { useLayoutEffect, useRef } from "react";
import { installPortfolioHaptics } from "@/lib/haptics/installGlobalListeners";

/**
 * Mounts global haptic listeners as early as possible (useLayoutEffect).
 * Add ?haptic=debug to the URL: first touch triggers a long vibrate once (Android Chrome)
 * to verify the Vibration API and listeners; iOS has no navigator.vibrate.
 */
export default function HapticsRoot() {
  const uninstallRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    const debug =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("haptic") === "debug";

    uninstallRef.current = installPortfolioHaptics({ debug });

    return () => {
      uninstallRef.current?.();
      uninstallRef.current = null;
    };
  }, []);

  return null;
}
