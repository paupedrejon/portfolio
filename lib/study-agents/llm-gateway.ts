import {
  getStudyAgentsEntitlements,
  incrementStudyAgentsUsage,
} from "./entitlements";
import { FREE_DEFAULT_MODEL, type StudyAgentsEntitlements } from "./plans";
import { studyAgentsFlags } from "./flags";

export type LlmGatewayInput = {
  userId?: string | null;
  apiKey?: string | null;
  providerKeys?: Record<string, string> | null;
};

export type LlmGatewayResult =
  | {
      ok: true;
      entitlements: StudyAgentsEntitlements;
      /** OpenAI key solo para embeddings (o null → locales). */
      apiKey: string | null;
      providerKeys: Record<string, string>;
      /** Modelo sugerido en Free. */
      preferredModel: string | null;
    }
  | {
      ok: false;
      status: number;
      error: string;
      entitlements?: StudyAgentsEntitlements;
      code?: "FREE_LIMIT" | "FREE_NOT_READY" | "PREMIUM_NEEDS_KEYS" | "NO_KEYS";
    };

function cleanKeys(keys?: Record<string, string> | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!keys) return out;
  for (const [k, v] of Object.entries(keys)) {
    if (typeof v === "string" && v.trim() && v.trim() !== "default") {
      out[k] = v.trim();
    }
  }
  return out;
}

function clientHasAnyKey(
  apiKey: string | null | undefined,
  keys: Record<string, string>,
): boolean {
  return Boolean(
    (apiKey && apiKey !== "default") ||
      keys.openai ||
      keys.groq ||
      keys.deepseek ||
      keys.openrouter,
  );
}

function serverGroqKey(): string {
  return (process.env.GROQ_API_KEY || "").trim();
}

/**
 * Resuelve acceso LLM según plan:
 * - Free → GROQ_API_KEY del servidor (Vercel BFF y/o Railway FastAPI) + cuota diaria
 * - Premium → BYOK del cliente
 */
export async function resolveLlmAccess(
  input: LlmGatewayInput,
): Promise<LlmGatewayResult> {
  const userId = input.userId?.trim() || "";
  const clientKeys = cleanKeys(input.providerKeys);
  const clientApiKey =
    typeof input.apiKey === "string" && input.apiKey !== "default"
      ? input.apiKey.trim()
      : null;

  if (!studyAgentsFlags.planGating) {
    // Legacy: si hay Groq de servidor, Free implícito
    const groq = serverGroqKey();
    if (!clientHasAnyKey(clientApiKey, clientKeys) && groq) {
      return {
        ok: true,
        entitlements: {
          plan: "free",
          status: "active",
          requestsToday: 0,
          dailyLimit: Number.POSITIVE_INFINITY,
          remainingToday: Number.POSITIVE_INFINITY,
          freeServerReady: true,
          stripeReady: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
          source: "fallback",
        },
        apiKey: null,
        providerKeys: { groq },
        preferredModel: FREE_DEFAULT_MODEL,
      };
    }
    if (!clientHasAnyKey(clientApiKey, clientKeys)) {
      return {
        ok: false,
        status: 400,
        error:
          "Configura al menos una API key (Groq, DeepSeek, OpenRouter u OpenAI), o define GROQ_API_KEY en Vercel/Railway.",
        code: "NO_KEYS",
      };
    }
    return {
      ok: true,
      entitlements: {
        plan: "premium",
        status: "active",
        requestsToday: 0,
        dailyLimit: Number.POSITIVE_INFINITY,
        remainingToday: Number.POSITIVE_INFINITY,
        freeServerReady: Boolean(groq),
        stripeReady: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
        source: "fallback",
      },
      apiKey: clientApiKey || clientKeys.openai || null,
      providerKeys: clientKeys,
      preferredModel: null,
    };
  }

  const entitlements = await getStudyAgentsEntitlements(userId || "anonymous");

  if (entitlements.plan === "premium") {
    if (!clientHasAnyKey(clientApiKey, clientKeys)) {
      return {
        ok: false,
        status: 400,
        error:
          "Plan Premium: configura tu API key (Groq, DeepSeek, OpenRouter u OpenAI) en Configurar API.",
        code: "PREMIUM_NEEDS_KEYS",
        entitlements,
      };
    }
    return {
      ok: true,
      entitlements,
      apiKey: clientApiKey || clientKeys.openai || null,
      providerKeys: clientKeys,
      preferredModel: null,
    };
  }

  // Free
  if (entitlements.remainingToday <= 0) {
    return {
      ok: false,
      status: 429,
      error: `Has agotado las ${entitlements.dailyLimit} peticiones diarias del plan Free. Vuelve mañana o pasa a Premium (BYOK / suscripción).`,
      code: "FREE_LIMIT",
      entitlements,
    };
  }

  const groq = serverGroqKey();
  if (groq) {
    return {
      ok: true,
      entitlements: { ...entitlements, freeServerReady: true },
      apiKey: null,
      providerKeys: { groq },
      preferredModel: FREE_DEFAULT_MODEL,
    };
  }

  // Sin Groq en Vercel: si el usuario trae BYOK, ok; si no, reenviamos vacío
  // para que FastAPI (Railway) use su propia GROQ_API_KEY.
  if (clientHasAnyKey(clientApiKey, clientKeys)) {
    return {
      ok: true,
      entitlements,
      apiKey: clientApiKey || clientKeys.openai || null,
      providerKeys: clientKeys,
      preferredModel: null,
    };
  }

  return {
    ok: true,
    entitlements: { ...entitlements, freeServerReady: false },
    apiKey: null,
    providerKeys: {},
    preferredModel: FREE_DEFAULT_MODEL,
  };
}

export async function recordLlmUsage(input: {
  userId?: string | null;
  entitlements: StudyAgentsEntitlements;
  tokensIn?: number;
  tokensOut?: number;
}): Promise<void> {
  if (!input.userId || input.entitlements.plan !== "free") return;
  await incrementStudyAgentsUsage({
    userId: input.userId,
    requests: 1,
    tokensIn: input.tokensIn,
    tokensOut: input.tokensOut,
  });
}
