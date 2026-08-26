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

/**
 * Resuelve acceso LLM según plan:
 * - Free → GROQ_API_KEY del servidor (no se expone al cliente) + cuota diaria
 * - Premium → BYOK del cliente (como hasta ahora)
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
    if (!clientHasAnyKey(clientApiKey, clientKeys)) {
      return {
        ok: false,
        status: 400,
        error: "Configura al menos una API key (Groq, DeepSeek, OpenRouter u OpenAI).",
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
        freeServerReady: Boolean(process.env.GROQ_API_KEY?.trim()),
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
  // Releer env en cada request (tras redeploy con GROQ_API_KEY)
  const serverGroq = process.env.GROQ_API_KEY?.trim() || "";
  if (!serverGroq) {
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
      ok: false,
      status: 503,
      error:
        "Plan Free no disponible: falta GROQ_API_KEY en el servidor (Vercel). Añádela y vuelve a desplegar, o configura una API key propia.",
      code: "FREE_NOT_READY",
      entitlements: { ...entitlements, freeServerReady: false },
    };
  }

  if (entitlements.remainingToday <= 0) {
    return {
      ok: false,
      status: 429,
      error: `Has agotado las ${entitlements.dailyLimit} peticiones diarias del plan Free. Vuelve mañana o pasa a Premium (BYOK / suscripción).`,
      code: "FREE_LIMIT",
      entitlements,
    };
  }

  return {
    ok: true,
    entitlements: { ...entitlements, freeServerReady: true },
    apiKey: null,
    providerKeys: { groq: serverGroq },
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
