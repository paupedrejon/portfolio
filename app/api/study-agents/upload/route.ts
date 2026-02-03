import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const apiKey = formData.get('apiKey') as string;

    console.log('[Upload] API Key recibida:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NO HAY');
    console.log('[Upload] Archivos recibidos:', files.length);

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron archivos' },
        { status: 400 }
      );
    }

    // Si no hay API key del frontend, el backend usará la de .env.local
    // Solo mostrar warning, no error
    if (!apiKey) {
      console.log('[Upload] INFO: No se recibió API key del frontend, el backend usará la de .env.local');
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

    // Crear nuevo FormData para enviar a FastAPI
    const fastApiFormData = new FormData();
    
    // Procesar cada archivo
    for (const file of files) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage = file.type.startsWith('image/') || 
        ['.jpg', '.jpeg', '.png', '.gif', '.webp'].some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!isPdf && !isImage) {
        return NextResponse.json(
          { error: `El archivo ${file.name} debe ser un PDF o una imagen` },
          { status: 400 }
        );
      }
      
      // Convertir File a Blob/ArrayBuffer para reenvío
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.type || (isPdf ? 'application/pdf' : 'image/jpeg') });
      
      // Añadir al FormData con el nombre del archivo
      fastApiFormData.append('files', blob, file.name);
    }
    
    // Añadir API key solo si existe (el backend puede usar la de .env.local)
    if (apiKey && apiKey.trim() !== '') {
      fastApiFormData.append('apiKey', apiKey.trim());
      console.log('[Upload] Enviando a FastAPI con API key del frontend:', apiKey.substring(0, 10) + '...');
    } else {
      console.log('[Upload] No se envió API key del frontend, el backend usará la de .env.local');
    }

    // Llamar al backend FastAPI
    const response = await fetch(`${FASTAPI_URL}/api/upload-documents`, {
      method: 'POST',
      body: fastApiFormData,
    });

    if (!response.ok) {
      let errorMessage = 'Error al subir archivos';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
        console.error('[Upload] Error de FastAPI:', errorMessage);
      } catch (e) {
        errorMessage = `Error ${response.status}: ${response.statusText}`;
        console.error('[Upload] Error parseando respuesta:', e);
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Upload] Éxito:', data.message);
    console.log('[Upload] Data recibida:', JSON.stringify(data, null, 2));

    // Convertir rutas relativas a URLs completas
    const saved_paths = (data.data?.saved_paths || []).map((path: string) => {
      if (path.startsWith('http')) {
        return path;
      }
      // Si es una ruta relativa como /api/files/filename, construir URL completa
      if (path.startsWith('/')) {
        return `${FASTAPI_URL}${path}`;
      }
      // Si es una ruta relativa sin /, añadir el prefijo
      return `${FASTAPI_URL}/api/files/${path}`;
    });

    return NextResponse.json({
      success: true,
      message: data.message || `${files.length} archivo(s) procesado(s) correctamente`,
      files: data.data?.processed_files || files.map(f => f.name),
      data: {
        ...data.data,
        saved_paths,
      },
    });
  } catch (error: any) {
    console.error('[Upload] Error general:', error);
    
    // Mensajes de error más descriptivos
    let errorMessage = 'Error al subir archivos';
    
    if (error.message) {
      if (error.message.includes('fetch failed') || 
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('network')) {
        errorMessage = `No se pudo conectar al backend FastAPI. Asegúrate de que esté corriendo en ${FASTAPI_URL}`;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        hint: 'Ejecuta en otra terminal: cd study_agents && python api/main.py',
        url: FASTAPI_URL
      },
      { status: 500 }
    );
  }
}



