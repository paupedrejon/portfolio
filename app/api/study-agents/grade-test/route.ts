import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, testId, answers } = body;

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

    // Llamar al backend FastAPI
    const response = await fetch(`${FASTAPI_URL}/api/grade-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        test_id: testId,
        answers,
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
    });
  } catch (error: any) {
    console.error('Error grading test:', error);
    return NextResponse.json(
      { error: error.message || 'Error al corregir test' },
      { status: 500 }
    );
  }
}

