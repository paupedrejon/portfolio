import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, courseId, notesType, topicName, apiKey, model } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key requerida' },
        { status: 400 }
      );
    }

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'userId y courseId son requeridos' },
        { status: 400 }
      );
    }

    if (notesType === 'topic' && !topicName) {
      return NextResponse.json(
        { error: 'topicName es requerido para tipo "topic"' },
        { status: 400 }
      );
    }

    // Verificar que FastAPI esté disponible
    try {
      const healthCheck = await fetch(`${FASTAPI_URL}/health`, {
        method: 'GET',
      }).catch(() => null);
      
      if (!healthCheck || !healthCheck.ok) {
        return NextResponse.json(
          { 
            error: `El backend FastAPI no está disponible. Por favor, inicia el servidor primero.`,
            hint: `Ejecuta en otra terminal: cd study_agents && python api/main.py`,
            url: FASTAPI_URL
          },
          { status: 503 }
        );
      }
    } catch (healthError: unknown) {
      const details = healthError instanceof Error ? healthError.message : 'Error desconocido';
      return NextResponse.json(
        { 
          error: `No se pudo conectar al backend FastAPI en ${FASTAPI_URL}`,
          hint: 'Asegúrate de que FastAPI esté corriendo: cd study_agents && python api/main.py',
          details: details
        },
        { status: 503 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(`${FASTAPI_URL}/api/generate-course-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        course_id: courseId,
        apiKey: apiKey,
        notes_type: notesType || 'topic',
        topic_name: topicName || null,
        model: model || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
      return NextResponse.json(
        { 
          error: errorData.detail || errorData.error || `Error del servidor: ${response.statusText}`,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en generate-course-notes:', errorMessage);
    return NextResponse.json(
      { 
        error: 'Error al generar apuntes del curso',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

