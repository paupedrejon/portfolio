import StudyAgentsShell from "@/components/study-agents/StudyAgentsShell";

export default function StudyAgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudyAgentsShell>{children}</StudyAgentsShell>;
}
