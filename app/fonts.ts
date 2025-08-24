// app/fonts.ts
import { Barlow } from "next/font/google";

export const din = Barlow({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-din",
});
