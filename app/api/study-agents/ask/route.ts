import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, question, userId = 'default', model, chatId, topic } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key requerida' },
        { status: 400 }
      );
    }

    if (!question) {
      return NextResponse.json(
        { error: 'Pregunta requerida' },
        { status: 400 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(getFastAPIUrl('/api/ask-question'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        question,
        user_id: userId,
        model: model || null, // null = modo automático
        chat_id: chatId || null,
        topic: topic || null,
      }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: `Error ${response.status}: ${response.statusText}` };
      }
      console.error('Error from FastAPI:', errorData);
      return NextResponse.json(
        { 
          success: false,
          error: errorData.detail || 'Error al procesar pregunta' 
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

