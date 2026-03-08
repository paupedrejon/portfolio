// app/fonts.ts
import { Space_Grotesk, JetBrains_Mono, Outfit, League_Spartan } from "next/font/google";

// Display font - Bold, modern, geometric
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-display",
});

// Body font - Clean, readable
export const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-body",
});

// Mono font - Technical, code-like
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-mono",
});

// League Spartan - Hero name
export const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-league-spartan",
});

// Legacy export for compatibility
export const din = outfit;
