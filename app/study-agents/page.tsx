import type { Metadata } from "next";
import StudyAgentsPageClient from "@/components/study-agents/StudyAgentsPageClient";
import { buildStaticMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildStaticMetadata({
  pathname: "/study-agents",
  title: "Study Agents — Asistente de aprendizaje con IA | Pau Pedrejon",
  description:
    "Plataforma educativa con IA multi-agente: sube PDFs, genera apuntes, tests y ejercicios con feedback en tiempo real. Proyecto capstone del Instituto de Inteligencia Artificial.",
  ogTitle: "Study Agents",
  ogSubtitle: "AI Learning Assistant — RAG, tests & spaced repetition",
});

export default function StudyAgentsPage() {
  return (
    <>
      {/* Contenido indexable en HTML inicial (SSR) */}
      <div className="sr-only">
        <h1>Study Agents — Asistente de aprendizaje con IA</h1>
        <p>
          Study Agents es una plataforma educativa con inteligencia artificial
          desarrollada por Pau Pedrejon. Sube documentos PDF, genera apuntes
          automáticos, realiza tests personalizados y recibe feedback educativo
          en tiempo real. Utiliza RAG (Retrieval-Augmented Generation) con
          ChromaDB y ocho agentes especializados orquestados con LangChain y
          FastAPI.
        </p>
        <p>
          Disponible en{" "}
          <a href="https://www.paupedrejon.com/study-agents">
            paupedrejon.com/study-agents
          </a>
          . Proyecto destacado del portfolio de Pau Pedrejon, ingeniero
          full-stack en Barcelona.
        </p>
      </div>
      <StudyAgentsPageClient />
    </>
  );
}
