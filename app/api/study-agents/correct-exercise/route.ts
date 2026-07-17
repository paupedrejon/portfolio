import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      apiKey,
      exercise,
      studentAnswer,
      studentAnswerImage,
      userId,
      user_id,
      chatId,
      model,
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

    if (!exercise) {
      return NextResponse.json({ error: 'Ejercicio requerido' }, { status: 400 });
    }

    if (!studentAnswer && !studentAnswerImage) {
      return NextResponse.json({ error: 'Respuesta del estudiante requerida' }, { status: 400 });
    }

    const openaiForSystem =
      (typeof apiKey === 'string' && apiKey !== 'default' ? apiKey : null) ||
      keys.openai ||
      'default';

    const response = await fetch(getFastAPIUrl('/api/correct-exercise'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: openaiForSystem,
        exercise,
        student_answer: studentAnswer || '',
        student_answer_image: studentAnswerImage || null,
        user_id: userId || user_id || null,
        chat_id: chatId || null,
        model: model || null,
        provider_keys: keys,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || 'Error al corregir ejercicio' },
        { status: response.status },
      );
    }

    return NextResponse.json({
      success: true,
      correction: data.correction,
      progress_update: data.progress_update || null,
      exerciseId: data.exercise_id,
      points: data.points,
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      mastery_updates: data.mastery_updates || [],
      srs_cards_created: data.srs_cards_created || 0,
      srs_due_hint: data.srs_due_hint || false,
      weak_prerequisite: data.weak_prerequisite || null,
    });
  } catch (error: unknown) {
    console.error('Error correcting exercise:', error);
    const message = error instanceof Error ? error.message : 'Error al corregir ejercicio';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
