/**
 * Calcula el costo estimado de una respuesta basado en tokens y modelo usado
 */

// Precios por 1000 tokens (en USD) - actualizados a precios de OpenAI 2024
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "auto": { input: 0.0, output: 0.0 }, // Modo automático: gratis (Ollama) o muy barato (GPT-3.5)
  "gpt-5": { input: 0.015, output: 0.06 }, // GPT-5 premium
  "gpt-5-pro": { input: 0.03, output: 0.12 }, // GPT-5 Pro (máxima calidad)
  "gpt-4": { input: 0.03, output: 0.06 },
  "gpt-4-turbo": { input: 0.01, output: 0.03 },
  "gpt-4o": { input: 0.005, output: 0.015 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
  "gpt-3.5-turbo-16k": { input: 0.003, output: 0.004 },
  "llama3.1": { input: 0.0, output: 0.0 }, // Llama 3.1 (gratis, local)
  "llama3.2": { input: 0.0, output: 0.0 }, // Llama 3.2 (gratis, local)
};

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  model: string;
}

/**
 * Calcula el costo estimado basado en tokens y modelo
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): CostEstimate {
  // Normalizar el nombre del modelo
  const normalizedModel = model.toLowerCase();
  
  // Buscar el precio del modelo (con fallback)
  let pricing = MODEL_PRICING[normalizedModel];
  
  // Si no se encuentra exacto, buscar por prefijo
  if (!pricing) {
    if (normalizedModel.includes("gpt-5-pro")) {
      pricing = MODEL_PRICING["gpt-5-pro"];
    } else if (normalizedModel.includes("gpt-5")) {
      pricing = MODEL_PRICING["gpt-5"];
    } else if (normalizedModel.includes("llama3.1") || normalizedModel.includes("llama3")) {
      pricing = MODEL_PRICING["llama3.1"];
    } else if (normalizedModel.includes("gpt-4o")) {
      pricing = MODEL_PRICING["gpt-4o"];
    } else if (normalizedModel.includes("gpt-4-turbo")) {
      pricing = MODEL_PRICING["gpt-4-turbo"];
    } else if (normalizedModel.includes("gpt-4")) {
      pricing = MODEL_PRICING["gpt-4"];
    } else if (normalizedModel.includes("gpt-3.5")) {
      pricing = MODEL_PRICING["gpt-3.5-turbo"];
    } else {
      // Fallback a gpt-4-turbo si no se reconoce
      pricing = MODEL_PRICING["gpt-4-turbo"];
    }
  }
  
  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  const totalCost = inputCost + outputCost;
  
  return {
    inputTokens,
    outputTokens,
    inputCost,
    outputCost,
    totalCost,
    model: normalizedModel,
  };
}

/**
 * Formatea el costo para mostrar en la UI
 */
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

/**
 * Estima tokens basado en el texto (aproximación)
 */
export function estimateTokens(text: string): number {
  // Aproximación: ~4 caracteres por token en promedio
  // Esto es una estimación, no es exacto
  return Math.ceil(text.length / 4);
}







