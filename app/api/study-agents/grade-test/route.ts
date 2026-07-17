import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, testId, answers, userId, chatId } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key requerida' },
        { status: 400 }
      );
    }

    if (!testId || !answers) {
      return NextResponse.json(
        { error: 'Test ID y respuestas requeridas' },
        { status: 400 }
      );
    }

    const response = await fetch(getFastAPIUrl('/api/grade-test'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        test_id: testId,
        answers,
        user_id: userId || null,
        chat_id: chatId || null,
        provider_keys: body.providerKeys || body.provider_keys || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al corregir test' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      feedback: data.feedback,
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      mastery_updates: data.mastery_updates || [],
      srs_cards_created: data.srs_cards_created || 0,
    });
  } catch (error: unknown) {
    console.error('Error grading test:', error);
    const message = error instanceof Error ? error.message : 'Error al corregir test';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
