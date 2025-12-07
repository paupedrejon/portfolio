import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, question, userId = 'default', model } = body;

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
    const response = await fetch(`${FASTAPI_URL}/api/ask-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        question,
        user_id: userId,
        model: model || "gpt-4-turbo",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al procesar pregunta' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      answer: data.answer,
      question: data.question,
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
    });
  } catch (error: any) {
    console.error('Error asking question:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar pregunta' },
      { status: 500 }
    );
  }
}

