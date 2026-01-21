import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, chatId, color, icon, topic } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id requerido' },
        { status: 400 }
      );
    }

    if (!chatId) {
      return NextResponse.json(
        { error: 'chat_id requerido' },
        { status: 400 }
      );
    }

    if (!color && !icon) {
      return NextResponse.json(
        { error: 'color o icon requerido' },
        { status: 400 }
      );
    }

    // Construir el body solo con los campos que tienen valores
    interface UpdateChatColorRequestBody {
      user_id: string;
      chat_id: string;
      color?: string;
      icon?: string;
      topic?: string | null;
    }
    const requestBody: UpdateChatColorRequestBody = {
      user_id: userId,
      chat_id: chatId,
    };
    
    if (color && color.trim()) {
      requestBody.color = color.trim();
    }
    
    if (icon && icon.trim()) {
      requestBody.icon = icon.trim();
    }
    
    // Manejar el tema: si es null o undefined, enviar null para eliminar el tema
    if (topic !== undefined) {
      requestBody.topic = topic;
    }

    console.log('[Next.js] Enviando a FastAPI:', JSON.stringify(requestBody));
    console.log('[Next.js] Request body keys:', Object.keys(requestBody));
    console.log('[Next.js] color presente:', !!requestBody.color, 'valor:', requestBody.color);
    console.log('[Next.js] icon presente:', !!requestBody.icon, 'valor:', requestBody.icon);

    // Llamar al backend FastAPI
    const response = await fetch(`${FASTAPI_URL}/api/update-chat-color`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al actualizar color' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error updating chat color:', error);
    const message = error instanceof Error ? error.message : 'Error al actualizar color';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

