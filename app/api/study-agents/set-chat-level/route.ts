import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    // Verificar que el body no esté vacío
    const text = await request.text();
    if (!text || text.trim() === '') {
      console.error('📊 [Next.js API] Error: Body vacío en set-chat-level');
      return NextResponse.json(
        { error: 'El body de la petición está vacío' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('📊 [Next.js API] Error al parsear JSON:', parseError);
      console.error('📊 [Next.js API] Text recibido:', text);
      return NextResponse.json(
        { error: 'JSON inválido en el body de la petición' },
        { status: 400 }
      );
    }

    const { userId, chatId, level, topic } = body;

    if (!userId || !chatId || level === undefined) {
      return NextResponse.json(
        { error: 'userId, chatId y level son requeridos' },
        { status: 400 }
      );
    }

    // Validar que el nivel esté entre 0 y 10
    const levelNum = parseInt(level, 10);
    if (isNaN(levelNum) || levelNum < 0 || levelNum > 10) {
      return NextResponse.json(
        { error: 'El nivel debe ser un número entre 0 y 10' },
        { status: 400 }
      );
    }

    console.log('📊 [Next.js API] Estableciendo nivel:', {
      userId,
      chatId,
      level: levelNum,
      topic
    });

    // Llamar al backend FastAPI
    const response = await fetch(`${FASTAPI_URL}/api/set-chat-level`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        chat_id: chatId,
        level: levelNum,
        topic: topic || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al establecer el nivel' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      result: data.result,
    });
  } catch (error: any) {
    console.error('📊 [Next.js API] Error setting chat level:', error);
    console.error('📊 [Next.js API] Error stack:', error.stack);
    
    // Si es un error de JSON, dar un mensaje más específico
    if (error instanceof SyntaxError || error.message?.includes('JSON')) {
      return NextResponse.json(
        { error: 'Error al parsear el JSON de la petición. Verifica que el body esté correctamente formateado.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error al establecer el nivel' },
      { status: 500 }
    );
  }
}


