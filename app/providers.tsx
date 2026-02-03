"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={60 * 5} // Refrescar cada 5 minutos
      refetchOnWindowFocus={true} // Refrescar cuando se enfoca la ventana
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}
