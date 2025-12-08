import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, difficulty = 'medium', numQuestions = 5, topics, model, constraints } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key requerida' },
        { status: 400 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(`${FASTAPI_URL}/api/generate-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        difficulty,
        num_questions: numQuestions,
        topics: topics || null,
        constraints: constraints || null,
        model: model || "gpt-4-turbo",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al generar test' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      test: data.test,
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
    });
  } catch (error: unknown) {
    console.error('Error generating test:', error);
    const message = error instanceof Error ? error.message : 'Error al generar test';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

