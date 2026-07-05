"use client";

import { SessionProvider } from "next-auth/react";
import PortfolioTracker from "@/components/analytics/PortfolioTracker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={60 * 5}
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      <PortfolioTracker />
      {children}
    </SessionProvider>
  );
}
