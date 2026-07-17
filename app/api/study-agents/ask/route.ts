import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      apiKey,
      question,
      userId = 'default',
      model,
      chatId,
      topic,
      providerKeys,
      provider_keys,
      initial_form_data,
    } = body;

    const keys = (providerKeys || provider_keys || {}) as Record<string, string>;
    const hasAnyKey = Boolean(
      apiKey ||
        keys.openai ||
        keys.groq ||
        keys.deepseek ||
        keys.openrouter,
    );

    if (!hasAnyKey) {
      return NextResponse.json(
        { error: 'Configura al menos una API key (Groq, DeepSeek, OpenRouter u OpenAI).' },
        { status: 400 }
      );
    }

    if (!question) {
      return NextResponse.json(
        { error: 'Pregunta requerida' },
        { status: 400 }
      );
    }

    // apiKey = solo OpenAI para embeddings; el resto va en provider_keys
    const openaiForEmbeddings =
      (typeof apiKey === 'string' && apiKey !== 'default' ? apiKey : null) ||
      keys.openai ||
      null;

    const response = await fetch(getFastAPIUrl('/api/ask-question'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: openaiForEmbeddings,
        question,
        user_id: userId,
        model: model || null,
        chat_id: chatId || null,
        topic: topic || null,
        provider_keys: keys,
        initial_form_data: initial_form_data || null,
      }),
    });

    if (!response.ok) {
      const raw = await response.text();
      let detail: string = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = raw ? JSON.parse(raw) : null;
        if (typeof errorData?.detail === 'string') {
          detail = errorData.detail;
        } else if (Array.isArray(errorData?.detail)) {
          detail = JSON.stringify(errorData.detail);
        } else if (typeof errorData?.error === 'string') {
          detail = errorData.error;
        } else if (raw?.trim()) {
          detail = raw.trim().slice(0, 500);
        }
      } catch {
        if (raw?.trim()) detail = raw.trim().slice(0, 500);
      }
      console.error('Error from FastAPI:', { status: response.status, detail, raw: raw?.slice(0, 500) });
      return NextResponse.json(
        {
          success: false,
          error: detail || 'Error al procesar pregunta',
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      answer: data.answer,
      question: data.question,
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
    });
  } catch (error: unknown) {
    console.error('Error asking question:', error);
    const message = error instanceof Error ? error.message : 'Error al procesar pregunta';
    return NextResponse.json(
      { 
        success: false,
        error: message 
      },
      { status: 500 }
    );
  }
}
