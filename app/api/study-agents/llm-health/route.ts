import { NextResponse } from "next/server";
import { studyAgentsFlags } from "@/lib/study-agents/flags";

/**
 * Diagnóstico seguro (no expone secrets): ¿el plan Free puede usar Groq en Vercel?
 * GET /api/study-agents/llm-health
 */
export async function GET() {
  const groq = (process.env.GROQ_API_KEY || "").trim();
  return NextResponse.json({
    ok: true,
    planGating: studyAgentsFlags.planGating,
    serverGroqFree: studyAgentsFlags.serverGroqFree,
    vercelHasGroqKey: groq.length > 0,
    groqKeyPrefix: groq ? `${groq.slice(0, 4)}…` : null,
    fastapiUrlConfigured: Boolean(process.env.FASTAPI_URL?.trim()),
    hint: groq
      ? "Vercel tiene GROQ_API_KEY: el BFF puede inyectarla en plan Free."
      : "Falta GROQ_API_KEY en Vercel (Production) o hay que redesplegar tras añadirla. También puedes ponerla en Railway (FastAPI).",
  });
}
