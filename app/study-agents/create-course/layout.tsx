import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear curso — Study Agents",
  robots: { index: false, follow: false },
};

export default function CreateCourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
