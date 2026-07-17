/**
 * Calcula el costo estimado de una respuesta basado en tokens y modelo usado
 */

import { buildModelPricingMap } from "@/lib/study-agents/models";

// Precios por 1000 tokens (USD) — incluye modelos chinos / gratis / OpenAI
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  ...buildModelPricingMap(),
  "gpt-5-pro": { input: 0.03, output: 0.12 },
  "gpt-4": { input: 0.03, output: 0.06 },
  "gpt-4-turbo": { input: 0.01, output: 0.03 },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
  "gpt-3.5-turbo-16k": { input: 0.003, output: 0.004 },
  "llama3.2": { input: 0.0, output: 0.0 },
};

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  model: string;
}

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string,
): CostEstimate {
  const normalizedModel = model.toLowerCase();
  let pricing = MODEL_PRICING[normalizedModel] || MODEL_PRICING[model];

  if (!pricing) {
    if (normalizedModel.includes("deepseek")) {
      pricing = MODEL_PRICING["deepseek-chat"] || { input: 0.00014, output: 0.00028 };
    } else if (normalizedModel.includes("qwen") || normalizedModel.includes("glm")) {
      pricing = { input: 0, output: 0 };
    } else if (
      normalizedModel.includes("groq") ||
      normalizedModel.includes("llama") ||
      normalizedModel.includes("gemma")
    ) {
      pricing = { input: 0, output: 0 };
    } else if (normalizedModel.includes("gpt-5-pro")) {
      pricing = MODEL_PRICING["gpt-5-pro"];
    } else if (normalizedModel.includes("gpt-5")) {
      pricing = MODEL_PRICING["gpt-5"];
    } else if (normalizedModel.includes("gpt-4o-mini")) {
      pricing = MODEL_PRICING["gpt-4o-mini"];
    } else if (normalizedModel.includes("gpt-4o")) {
      pricing = MODEL_PRICING["gpt-4o"];
    } else if (normalizedModel.includes("gpt-4")) {
      pricing = MODEL_PRICING["gpt-4"];
    } else if (normalizedModel.includes("gpt-3.5")) {
      pricing = MODEL_PRICING["gpt-3.5-turbo"];
    } else {
      pricing = { input: 0, output: 0 };
    }
  }

  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;

  return {
    inputTokens,
    outputTokens,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    model: normalizedModel,
  };
}

export function formatCost(cost: number): string {
  if (cost < 0.001) {
    return `$${(cost * 1000).toFixed(3)}¢`;
  } else if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  } else if (cost < 1) {
    return `$${cost.toFixed(3)}`;
  } else {
    return `$${cost.toFixed(2)}`;
  }
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
