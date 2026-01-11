import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, topics, model, userId, conversationHistory, topic } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key requerida' },
        { status: 400 }
      );
    }

    // Verificar que FastAPI esté disponible primero
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
    } catch (healthError: any) {
      return NextResponse.json(
        { 
          error: `No se pudo conectar al backend FastAPI en ${FASTAPI_URL}`,
          hint: 'Asegúrate de que FastAPI esté corriendo: cd study_agents && python api/main.py',
          details: healthError.message
        },
        { status: 503 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(`${FASTAPI_URL}/api/generate-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        topics: topic ? [topic] : (topics || null), // Usar topic si está disponible, sino topics
        model: model || null, // null = modo automático
        user_id: userId || null,
        conversation_history: conversationHistory || null,
        topic: topic || null,
      }),
    });

    // Manejar errores 404 específicamente
    if (response.status === 404) {
      return NextResponse.json(
        { 
          error: `El endpoint /api/generate-notes no se encontró en FastAPI.`,
          hint: 'Asegúrate de que el servidor FastAPI esté actualizado y corriendo.',
          url: `${FASTAPI_URL}/api/generate-notes`
        },
        { status: 404 }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al generar apuntes' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      notes: data.notes,
    });
  } catch (error: any) {
    console.error('Error generating notes:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar apuntes' },
      { status: 500 }
    );
  }
}







