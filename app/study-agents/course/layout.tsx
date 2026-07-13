import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Curso — Study Agents",
  robots: { index: false, follow: false },
};

export default function StudyAgentsCourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
