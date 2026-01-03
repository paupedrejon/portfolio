"""
API FastAPI para Study Agents
Interfaz web para interactuar con los agentes
Soporta API keys por usuario
"""

# APLICAR PARCHE DE PROXIES ANTES DE CUALQUIER OTRA IMPORTACIÓN
import os
import sys
# Añadir el directorio padre al path para importar el parche
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Importar y aplicar el parche ANTES de cualquier otra cosa
try:
    import openai_proxy_patch  # noqa: F401
    # Forzar aplicación del parche de LangChain también
    openai_proxy_patch.patch_langchain_openai()
    print("✅ Parche de proxies aplicado en api/main.py")
except Exception as e:
    print(f"⚠️ Warning: Error al aplicar parche de proxies: {e}")
    import traceback
    traceback.print_exc()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.requests import Request as StarletteRequest
from pydantic import BaseModel, ValidationError
from typing import List, Optional, Dict
from threading import Lock
import sys
import os
import importlib.util

# Importar chat_storage desde el directorio padre
chat_storage_path = os.path.join(parent_dir, "chat_storage.py")
spec_chat = importlib.util.spec_from_file_location("chat_storage", chat_storage_path)
chat_storage = importlib.util.module_from_spec(spec_chat)
spec_chat.loader.exec_module(chat_storage)
print("✅ Módulo chat_storage cargado correctamente")

# El path ya fue añadido arriba para el parche

# Importar desde el directorio raíz usando importlib para evitar conflictos de nombres
# IMPORTANTE: El parche ya debe estar aplicado antes de importar main.py
# (importlib.util ya está importado arriba)
main_module_path = os.path.join(parent_dir, "main.py")
spec = importlib.util.spec_from_file_location("study_agents_main", main_module_path)
study_agents_main = importlib.util.module_from_spec(spec)

# Aplicar el parche nuevamente antes de ejecutar el módulo
# Esto es crítico porque el módulo puede importar cosas que usan OpenAI
print("🔧 Aplicando parche de proxies antes de cargar main.py...")
try:
    import openai_proxy_patch  # noqa: F401
    openai_proxy_patch.patch_openai_client()
    openai_proxy_patch.patch_langchain_openai()
    print("✅ Parche aplicado correctamente antes de cargar main.py")
except Exception as e:
    print(f"⚠️ Error al aplicar parche antes de cargar main.py: {e}")
    import traceback
    traceback.print_exc()

# Ahora ejecutar el módulo (esto importará los agentes y memory_manager)
spec.loader.exec_module(study_agents_main)
StudyAgentsSystem = study_agents_main.StudyAgentsSystem
print("✅ Módulo main.py cargado correctamente")

# Inicializar FastAPI
app = FastAPI(
    title="Study Agents API",
    description="API para el sistema multi-agente de autoaprendizaje",
    version="1.0.0"
)

# Manejar errores de validación de Pydantic para debug
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: StarletteRequest, exc: RequestValidationError):
    import json
    import traceback
    
    # Intentar leer el body de diferentes maneras
    body_str = 'No se pudo leer el body'
    try:
        if hasattr(request, '_body') and request._body:
            body_str = request._body.decode('utf-8')
        elif hasattr(request, 'body'):
            try:
                body_bytes = await request.body()
                body_str = body_bytes.decode('utf-8') if body_bytes else 'None'
            except:
                pass
    except Exception as e:
        body_str = f'Error al leer body: {str(e)}'
        traceback.print_exc()
    
    print(f"\n{'='*60}")
    print(f"[FastAPI] ❌❌❌ Error de validación 422 ❌❌❌")
    print(f"{'='*60}")
    print(f"[FastAPI] URL: {request.url}")
    print(f"[FastAPI] Method: {request.method}")
    print(f"[FastAPI] Path: {request.url.path}")
    print(f"[FastAPI] Body recibido: {body_str}")
    print(f"[FastAPI] Errores de validación:")
    for i, error in enumerate(exc.errors(), 1):
        print(f"  Error {i}: {json.dumps(error, indent=4, ensure_ascii=False)}")
    print(f"{'='*60}\n")
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "body": body_str,
            "message": "Error de validación de Pydantic - revisa los logs del servidor"
        }
    )

# Configurar CORS para permitir requests desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica los orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache de sistemas por API key (para evitar recrear sistemas)
systems_cache: Dict[str, StudyAgentsSystem] = {}
cache_lock = Lock()

# Crear directorio para documentos subidos
UPLOAD_DIR = "documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_or_create_system(api_key: Optional[str] = None, mode: str = "auto") -> StudyAgentsSystem:
    """
    Obtiene o crea un sistema de agentes para una API key
    
    Args:
        api_key: API key de OpenAI del usuario
        mode: Modo de selección de modelo ("auto" = optimizar costes, "manual" = usar modelo especificado)
        
    Returns:
        Sistema de agentes configurado
    """
    if not api_key:
        api_key = "default"
    
    # Usar caché con clave que incluya el modo
    cache_key = f"{api_key}:{mode}"
    if cache_key in systems_cache:
        return systems_cache[cache_key]
    
    # Crear nuevo sistema
    with cache_lock:
        # Verificar de nuevo por si otro thread lo creó
        if cache_key not in systems_cache:
            try:
                system = StudyAgentsSystem(
                    api_key=api_key if api_key != "default" else None,
                    mode=mode
                )
                systems_cache[cache_key] = system
                return system
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error al inicializar el sistema: {str(e)}")
    
    return systems_cache[cache_key]


# ============================================================================
# MODELOS DE DATOS (Pydantic)
# ============================================================================

class QuestionRequest(BaseModel):
    """Modelo para hacer una pregunta"""
    question: str
    user_id: Optional[str] = "default"
    apiKey: Optional[str] = None
    model: Optional[str] = "gpt-4-turbo"


class TestRequest(BaseModel):
    """Modelo para generar un test"""
    apiKey: str
    difficulty: str = "medium"
    num_questions: int = 10
    topics: Optional[List[str]] = None
    constraints: Optional[str] = None
    model: Optional[str] = "gpt-4-turbo"
    conversation_history: Optional[List[Dict[str, str]]] = None


class GradeTestRequest(BaseModel):
    """Modelo para corregir un test"""
    test_id: str
    answers: Dict[str, str]
    apiKey: Optional[str] = None


class GenerateNotesRequest(BaseModel):
    """Modelo para generar apuntes"""
    topics: Optional[List[str]] = None
    apiKey: Optional[str] = None
    model: Optional[str] = "gpt-4-turbo"


class UploadDocumentsRequest(BaseModel):
    """Modelo para subir documentos"""
    apiKey: Optional[str] = None


class SaveChatRequest(BaseModel):
    """Modelo para guardar una conversación"""
    user_id: str
    chat_id: Optional[str] = None
    title: Optional[str] = None
    messages: List[Dict]
    metadata: Optional[Dict] = None


class LoadChatRequest(BaseModel):
    """Modelo para cargar una conversación"""
    user_id: str
    chat_id: str


class DeleteChatRequest(BaseModel):
    """Modelo para eliminar una conversación"""
    user_id: str
    chat_id: str


class UpdateChatTitleRequest(BaseModel):
    """Modelo para actualizar el título de una conversación"""
    user_id: str
    chat_id: str
    title: str


class UpdateChatColorRequest(BaseModel):
    """Modelo para actualizar el color e icono de una conversación"""
    user_id: str
    chat_id: str
    color: Optional[str] = None
    icon: Optional[str] = None


class ListChatsRequest(BaseModel):
    """Modelo para listar conversaciones"""
    user_id: str


# ============================================================================
# ENDPOINTS DE LA API
# ============================================================================

@app.get("/")
async def read_root():
    """Endpoint raíz de la API"""
    return {
        "message": "Study Agents API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Verifica que la API está funcionando"""
    return {"status": "ok", "message": "Study Agents API is running"}


@app.post("/api/upload-documents")
async def upload_documents(
    files: List[UploadFile] = File(...),
    apiKey: Optional[str] = Form(None)
):
    """
    Sube y procesa documentos PDF
    
    Args:
        files: Lista de archivos PDF a subir
        apiKey: API key de OpenAI del usuario (en FormData)
        
    Returns:
        Información sobre el procesamiento
    """
    try:
        if not apiKey:
            print("[FastAPI] ERROR: API key no recibida en FormData")
            raise HTTPException(status_code=400, detail="API key requerida. Envíala como 'apiKey' en FormData.")
        
        print(f"[FastAPI] API key recibida: {apiKey[:10]}...")
        
        saved_paths = []
        
        # Guardar archivos
        for file in files:
            if not file.filename or not file.filename.endswith('.pdf'):
                raise HTTPException(status_code=400, detail=f"El archivo {file.filename} no es un PDF")
            
            file_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            saved_paths.append(file_path)
        
        # Obtener sistema para esta API key (modo automático por defecto)
        system = get_or_create_system(apiKey, mode="auto")
        
        # Procesar documentos
        result = system.upload_documents(saved_paths)
        
        return {
            "success": True,
            "message": f"{len(saved_paths)} documentos procesados correctamente",
            "data": result
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error en upload_documents: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-notes")
async def generate_notes(request: GenerateNotesRequest):
    """
    Genera apuntes completos del contenido procesado
    
    Args:
        request: Solicitud con API key y temas opcionales
        
    Returns:
        Apuntes en formato Markdown
    """
    try:
        print("[FastAPI] Iniciando generación de apuntes...")
        if not request.apiKey:
            raise HTTPException(status_code=400, detail="API key requerida")
        
        print("[FastAPI] Obteniendo sistema...")
        system = get_or_create_system(request.apiKey, mode="auto")
        
        print("[FastAPI] Generando apuntes (esto puede tardar)...")
        # Generar apuntes (model=None usa modo automático)
        notes = system.generate_notes(topics=request.topics, model=request.model if request.model else None)
        
        print(f"[FastAPI] Apuntes generados exitosamente ({len(notes)} caracteres)")
        
        return {
            "success": True,
            "notes": notes
        }
    except HTTPException:
        raise
    except KeyError as e:
        error_msg = f"Error de clave: {str(e)}"
        print(f"[FastAPI] KeyError en generate_notes: {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al procesar la respuesta: {error_msg}")
    except Exception as e:
        error_msg = str(e)
        print(f"[FastAPI] Error en generate_notes: {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)


@app.post("/api/ask-question")
async def ask_question(request: QuestionRequest):
    """
    Responde una pregunta del estudiante
    
    Args:
        request: Solicitud con pregunta, user_id y API key
        
    Returns:
        Respuesta contextualizada
    """
    try:
        if not request.apiKey:
            raise HTTPException(status_code=400, detail="API key requerida")
        
        if not request.question:
            raise HTTPException(status_code=400, detail="Pregunta requerida")
        
        system = get_or_create_system(request.apiKey, mode="auto")
        
        # Responder pregunta (model=None usa modo automático)
        answer, usage_info = system.ask_question(request.question, request.user_id, model=request.model if request.model else None)
        
        return {
            "success": True,
            "answer": answer,
            "question": request.question,
            "inputTokens": usage_info.get("inputTokens", 0),
            "outputTokens": usage_info.get("outputTokens", 0)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error en ask_question: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-test")
async def generate_test(request: TestRequest):
    """
    Genera un test personalizado
    
    Args:
        request: Solicitud con dificultad, número de preguntas, temas y API key
        
    Returns:
        Test generado
    """
    try:
        if not request.apiKey:
            raise HTTPException(status_code=400, detail="API key requerida")
        
        system = get_or_create_system(request.apiKey, mode="auto")
        
        # Generar test (model=None usa modo automático)
        test, usage_info = system.generate_test(
            difficulty=request.difficulty,
            num_questions=request.num_questions,
            topics=request.topics,
            constraints=request.constraints,
            model=request.model if request.model else None,
            conversation_history=request.conversation_history
        )
        
        return {
            "success": True,
            "test": test,
            "inputTokens": usage_info.get("inputTokens", 0),
            "outputTokens": usage_info.get("outputTokens", 0)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error en generate_test: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/grade-test")
async def grade_test(request: GradeTestRequest):
    """
    Corrige un test y proporciona feedback
    
    Args:
        request: Solicitud con test_id, respuestas y API key
        
    Returns:
        Feedback detallado
    """
    try:
        if not request.apiKey:
            raise HTTPException(status_code=400, detail="API key requerida")
        
        system = get_or_create_system(request.apiKey, mode="auto")
        
        # Corregir test
        feedback, usage_info = system.grade_test(request.test_id, request.answers)
        
        return {
            "success": True,
            "feedback": feedback,
            "inputTokens": usage_info.get("inputTokens", 0),
            "outputTokens": usage_info.get("outputTokens", 0)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error en grade_test: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/save-chat")
async def save_chat_endpoint(request: SaveChatRequest):
    """
    Guarda una conversación
    
    Args:
        request: Solicitud con datos del chat
        
    Returns:
        Información del chat guardado
    """
    print(f"[FastAPI] save-chat endpoint llamado: user_id={request.user_id}, messages={len(request.messages)}")
    try:
        # Generar chat_id si no se proporciona
        chat_id = request.chat_id or chat_storage.generate_chat_id()
        
        # Generar título si no se proporciona
        title = request.title
        if not title and request.messages:
            # Generar título inteligente basado en todos los mensajes
            title = chat_storage.generate_chat_title(request.messages)
        
        # Guardar chat
        chat_data = chat_storage.save_chat(
            user_id=request.user_id,
            chat_id=chat_id,
            title=title or "Nueva conversación",
            messages=request.messages,
            metadata=request.metadata
        )
        
        return {
            "success": True,
            "chat": chat_data
        }
    except Exception as e:
        print(f"[FastAPI] Error en save-chat: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/load-chat")
async def load_chat_endpoint(request: LoadChatRequest):
    """
    Carga una conversación
    
    Args:
        request: Solicitud con user_id y chat_id
        
    Returns:
        Datos del chat
    """
    try:
        chat_data = chat_storage.load_chat(
            user_id=request.user_id,
            chat_id=request.chat_id
        )
        
        if not chat_data:
            raise HTTPException(status_code=404, detail="Chat no encontrado")
        
        return {
            "success": True,
            "chat": chat_data
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error en load-chat: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/list-chats")
async def list_chats_endpoint(request: ListChatsRequest):
    """
    Lista todas las conversaciones de un usuario
    
    Args:
        request: Solicitud con user_id
        
    Returns:
        Lista de chats
    """
    try:
        chats = chat_storage.list_chats(user_id=request.user_id)
        
        return {
            "success": True,
            "chats": chats
        }
    except Exception as e:
        print(f"[FastAPI] Error en list-chats: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/delete-chat")
async def delete_chat_endpoint(request: DeleteChatRequest):
    """
    Elimina una conversación
    
    Args:
        request: Solicitud con user_id y chat_id
        
    Returns:
        Confirmación de eliminación
    """
    try:
        deleted = chat_storage.delete_chat(
            user_id=request.user_id,
            chat_id=request.chat_id
        )
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Chat no encontrado")
        
        return {
            "success": True,
            "message": "Chat eliminado correctamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error en delete-chat: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/update-chat-title")
async def update_chat_title_endpoint(request: UpdateChatTitleRequest):
    """
    Actualiza el título de una conversación
    
    Args:
        request: Solicitud con user_id, chat_id y nuevo título
        
    Returns:
        Confirmación de actualización
    """
    try:
        # Cargar el chat existente
        chat_data = chat_storage.load_chat(
            user_id=request.user_id,
            chat_id=request.chat_id
        )
        
        if not chat_data:
            raise HTTPException(status_code=404, detail="Chat no encontrado")
        
        # Actualizar solo el título
        updated_data = chat_storage.update_chat(
            user_id=request.user_id,
            chat_id=request.chat_id,
            messages=chat_data.get("messages", []),
            title=request.title,
            metadata=chat_data.get("metadata")
        )
        
        if not updated_data:
            raise HTTPException(status_code=500, detail="Error al actualizar el título")
        
        return {
            "success": True,
            "chat": updated_data
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error en update-chat-title: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/update-chat-color")
async def update_chat_color_endpoint(request: UpdateChatColorRequest):
    """
    Actualiza el color de una conversación
    
    Args:
        request: Solicitud con user_id, chat_id y nuevo color
        
    Returns:
        Confirmación de actualización
    """
    try:
        print(f"[FastAPI] update-chat-color recibido: user_id={request.user_id}, chat_id={request.chat_id}, color={request.color}, icon={request.icon}")
        
        # Validar que al menos uno de los campos esté presente y no sea string vacío
        has_color = request.color is not None and request.color.strip() != "" if request.color else False
        has_icon = request.icon is not None and request.icon.strip() != "" if request.icon else False
        
        if not has_color and not has_icon:
            print(f"[FastAPI] Error: Ningún campo válido proporcionado (color={request.color}, icon={request.icon})")
            raise HTTPException(status_code=400, detail="Al menos uno de los campos color o icon debe estar presente y no estar vacío")
        
        # Cargar el chat existente
        chat_data = chat_storage.load_chat(
            user_id=request.user_id,
            chat_id=request.chat_id
        )
        
        if not chat_data:
            raise HTTPException(status_code=404, detail="Chat no encontrado")
        
        # Actualizar el color e icono en metadata
        metadata = chat_data.get("metadata", {})
        if request.color is not None and request.color.strip() != "":
            metadata["color"] = request.color.strip()
            print(f"[FastAPI] Color actualizado: {metadata['color']}")
        if request.icon is not None and request.icon.strip() != "":
            metadata["icon"] = request.icon.strip()
            print(f"[FastAPI] Icon actualizado: {metadata['icon']}")
        
        # Guardar el chat actualizado
        updated_chat = chat_storage.save_chat(
            user_id=request.user_id,
            chat_id=request.chat_id,
            title=chat_data.get("title", "Nueva conversación"),
            messages=chat_data.get("messages", []),
            metadata=metadata
        )
        
        return {
            "success": True,
            "message": "Color actualizado correctamente",
            "chat": updated_chat
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error en update-chat-color: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Iniciar el servidor si se ejecuta directamente
if __name__ == "__main__":
    import uvicorn
    print("🚀 Iniciando Study Agents API...")
    print("📡 Servidor en: http://localhost:8000")
    print("📖 Documentación: http://localhost:8000/docs")
    print("💡 Health check: http://localhost:8000/health")
    print("\n⚠️  Presiona Ctrl+C para detener el servidor\n")
    # Ejecutar sin reload para evitar el warning cuando se ejecuta directamente
    # Si necesitas reload, usa: python -m uvicorn api.main:app --reload
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
