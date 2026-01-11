import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    let response;
    try {
      response = await fetch(`${FASTAPI_URL}/api/execute-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        // Añadir timeout
        signal: AbortSignal.timeout(15000), // 15 segundos
      });
    } catch (fetchError: any) {
      // Si hay error de conexión (backend no disponible)
      if (fetchError.name === "AbortError" || fetchError.message?.includes("fetch")) {
        return NextResponse.json(
          { 
            success: false, 
            error: "No se pudo conectar con el servidor de ejecución. Asegúrate de que el backend FastAPI esté corriendo en http://localhost:8000" 
          },
          { status: 503 }
        );
      }
      throw fetchError;
    }

    // Si la respuesta no es OK, intentar leer el JSON del error
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        // Si no se puede parsear JSON, usar el texto de la respuesta
        const text = await response.text();
        return NextResponse.json(
          { 
            success: false, 
            error: text || `Error del servidor (${response.status}): ${response.statusText}` 
          },
          { status: response.status }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.detail || errorData.error || `Error al ejecutar código (${response.status})` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in execute-code route:", error);
    
    // Manejar errores específicos
    if (error.name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "La ejecución del código tardó demasiado (timeout)" },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Error interno del servidor. Verifica que el backend FastAPI esté corriendo." 
      },
      { status: 500 }
    );
  }
}

