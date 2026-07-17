import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      apiKey,
      difficulty = 'medium',
      topics,
      exerciseType,
      constraints,
      model,
      conversationHistory,
      userId,
      user_id,
      chatId,
      chat_id,
      providerKeys,
      provider_keys,
    } = body;

    const keys = (providerKeys || provider_keys || {}) as Record<string, string>;
    const hasAnyKey = Boolean(
      (apiKey && apiKey !== 'default') ||
        keys.openai ||
        keys.groq ||
        keys.deepseek ||
        keys.openrouter,
    );
    if (!hasAnyKey) {
      return NextResponse.json(
        { error: 'Configura al menos una API key (Groq, DeepSeek, OpenRouter u OpenAI).' },
        { status: 400 },
      );
    }

    const openaiForSystem =
      (typeof apiKey === 'string' && apiKey !== 'default' ? apiKey : null) ||
      keys.openai ||
      'default';

    const response = await fetch(getFastAPIUrl('/api/generate-exercise'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: openaiForSystem,
        difficulty,
        topics: topics || null,
        exercise_type: exerciseType || null,
        constraints: constraints || null,
        model: model || null,
        conversation_history: conversationHistory || null,
        user_id: userId || user_id || null,
        chat_id: chatId || chat_id || null,
        provider_keys: keys,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || 'Error al generar ejercicio' },
        { status: response.status },
      );
    }

    return NextResponse.json({
      success: true,
      exercise: data.exercise,
      exerciseId: data.exercise_id,
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      adaptive: data.adaptive || null,
    });
  } catch (error: unknown) {
    console.error('Error generating exercise:', error);
    const message = error instanceof Error ? error.message : 'Error al generar ejercicio';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
