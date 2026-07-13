// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import "./section-pages.css";
import VercelAnalyticsGate from "@/components/analytics/VercelAnalyticsGate";
import { Providers } from "./providers";
import { spaceGrotesk, outfit, jetbrainsMono, leagueSpartan, quicksand, bebasNeue, playfairDisplay } from "./fonts";
import ConditionalFooter from "@/components/ConditionalFooter";
import { getLocale } from "next-intl/server";
import HapticsRoot from "@/components/HapticsRoot";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo/config";

const gscVerification = process.env.NEXT_PUBLIC_GSC_VERIFICATION?.trim();
const bingVerification = process.env.NEXT_PUBLIC_BING_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Software Engineer & Developer`,
    template: "%s",
  },
  description:
    "Full-Stack Software Engineer portfolio — React, Node.js, AI. Real production projects, professional experience, and open to opportunities in Barcelona and remote.",
  manifest: "/manifest.json",
  verification: {
    ...(gscVerification ? { google: gscVerification } : {}),
    other: {
      ...(bingVerification ? { "msvalidate.01": bingVerification } : {}),
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: '/Favicon.png', sizes: 'any', type: 'image/png' },
      { url: '/Favicon32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/Favicon16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/Favicon.png',
    apple: '/Favicon.png',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${spaceGrotesk.variable} ${outfit.variable} ${jetbrainsMono.variable} ${leagueSpartan.variable} ${quicksand.variable} ${bebasNeue.variable} ${playfairDisplay.variable}`}
      suppressHydrationWarning
    >
      <body className="overflow-x-hidden w-full" suppressHydrationWarning>
        <HapticsRoot />
        <Providers>
          {children}

          <ConditionalFooter />

          <VercelAnalyticsGate />
        </Providers>
      </body>
    </html>
  );
}
