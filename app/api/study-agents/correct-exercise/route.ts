import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, exercise, studentAnswer, studentAnswerImage, userId, user_id, chatId, model } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key requerida' },
        { status: 400 }
      );
    }

    if (!exercise) {
      return NextResponse.json(
        { error: 'Ejercicio requerido' },
        { status: 400 }
      );
    }

    if (!studentAnswer) {
      return NextResponse.json(
        { error: 'Respuesta del estudiante requerida' },
        { status: 400 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(`${FASTAPI_URL}/api/correct-exercise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          apiKey,
          exercise,
          student_answer: studentAnswer,
          student_answer_image: studentAnswerImage || null,
          user_id: userId || user_id || null,
          chat_id: chatId || null,  // Pasar chat_id si está disponible
          model: model || null,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al corregir ejercicio' },
        { status: response.status }
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
    });
  } catch (error: unknown) {
    console.error('Error correcting exercise:', error);
    const message = error instanceof Error ? error.message : 'Error al corregir ejercicio';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

