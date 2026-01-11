import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, difficulty = 'medium', topics, exerciseType, constraints, model, conversationHistory, userId, user_id } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key requerida' },
        { status: 400 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(`${FASTAPI_URL}/api/generate-exercise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        difficulty,
        topics: topics || null,
        exercise_type: exerciseType || null,
        constraints: constraints || null,
        model: model || null,
        conversation_history: conversationHistory || null,
        user_id: userId || user_id || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al generar ejercicio' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      exercise: data.exercise,
      exerciseId: data.exercise_id,
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
    });
  } catch (error: unknown) {
    console.error('Error generating exercise:', error);
    const message = error instanceof Error ? error.message : 'Error al generar ejercicio';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

