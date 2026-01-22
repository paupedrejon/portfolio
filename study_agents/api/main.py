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

# Importar progress_tracker desde el directorio padre
progress_tracker_path = os.path.join(parent_dir, "progress_tracker.py")
spec_progress = importlib.util.spec_from_file_location("progress_tracker", progress_tracker_path)
progress_tracker = importlib.util.module_from_spec(spec_progress)
spec_progress.loader.exec_module(progress_tracker)
ProgressTracker = progress_tracker.ProgressTracker

# Importar learned_words_storage desde el directorio padre
learned_words_path = os.path.join(parent_dir, "learned_words_storage.py")
spec_words = importlib.util.spec_from_file_location("learned_words_storage", learned_words_path)
learned_words_storage = importlib.util.module_from_spec(spec_words)
spec_words.loader.exec_module(learned_words_storage)
print("✅ Módulo learned_words_storage cargado correctamente")
print("✅ Módulo progress_tracker cargado correctamente")

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

# Inicializar ProgressTracker
progress_tracker_instance = ProgressTracker()

# Crear directorio para documentos subidos
UPLOAD_DIR = "documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_user_cost(user_id: str, input_tokens: int, output_tokens: int, model: str, system: StudyAgentsSystem) -> bool:
    """
    Calcula y guarda el coste de una llamada a la API
    
    Args:
        user_id: ID del usuario
        input_tokens: Tokens de entrada
        output_tokens: Tokens de salida
        model: Nombre del modelo usado
        system: Sistema de agentes (para acceder al ModelManager)
        
    Returns:
        True si se guardó correctamente
    """
    try:
        if not user_id or (input_tokens == 0 and output_tokens == 0):
            return False
        
        # Calcular coste usando ModelManager
        # Intentar obtener ModelManager desde los agentes (todos usan el mismo)
        cost = 0.0
        model_manager = None
        
        # Intentar obtener ModelManager desde cualquier agente
        if hasattr(system, 'qa_assistant') and hasattr(system.qa_assistant, 'model_manager'):
            model_manager = system.qa_assistant.model_manager
        elif hasattr(system, 'explanation_agent') and hasattr(system.explanation_agent, 'model_manager'):
            model_manager = system.explanation_agent.model_manager
        elif hasattr(system, 'test_generator') and hasattr(system.test_generator, 'model_manager'):
            model_manager = system.test_generator.model_manager
        
        if model_manager:
            cost = model_manager.estimate_cost(model, input_tokens, output_tokens)
        else:
            # Fallback: calcular manualmente usando precios estándar
            try:
                # Importar ModelManager desde el directorio padre
                import sys
                import os
                parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                if parent_dir not in sys.path:
                    sys.path.insert(0, parent_dir)
                from model_manager import ModelManager
                temp_manager = ModelManager()
                cost = temp_manager.estimate_cost(model, input_tokens, output_tokens)
            except Exception as e:
                print(f"⚠️ Error al calcular coste con ModelManager: {e}")
                # Si todo falla, usar estimación básica
                cost = 0.0
        
        # Guardar estadísticas (el coste solo puede aumentar, nunca disminuir)
        # El método save_user_stats ya suma al coste existente, así que el coste total nunca disminuirá
        if hasattr(system, 'memory') and hasattr(system.memory, 'save_user_stats'):
            if cost > 0:
                return system.memory.save_user_stats(user_id, input_tokens, output_tokens, cost, model)
        
        return False
    except Exception as e:
        print(f"⚠️ Error al guardar coste del usuario: {e}")
        import traceback
        traceback.print_exc()
        return False


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
                print(f"[FastAPI] Inicializando StudyAgentsSystem con api_key={'***' + api_key[-4:] if api_key and api_key != 'default' else 'None'}, mode={mode}")
                system = StudyAgentsSystem(
                    api_key=api_key if api_key != "default" else None,
                    mode=mode
                )
                systems_cache[cache_key] = system
                print(f"[FastAPI] ✅ StudyAgentsSystem inicializado correctamente")
                return system
            except Exception as e:
                error_msg = str(e)
                print(f"[FastAPI] ❌ Error al inicializar el sistema: {error_msg}")
                import traceback
                traceback.print_exc()
                raise HTTPException(status_code=500, detail=f"Error al inicializar el sistema: {error_msg}")
    
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
    chat_id: Optional[str] = None  # ID de la conversación para obtener el nivel y tema
    topic: Optional[str] = None  # Tema del chat si está disponible
    initial_form_data: Optional[Dict] = None  # Datos del formulario inicial (nivel, objetivo, tiempo)


class TestRequest(BaseModel):
    """Modelo para generar un test"""
    apiKey: str
    difficulty: str = "medium"
    num_questions: int = 10
    topics: Optional[List[str]] = None
    constraints: Optional[str] = None
    model: Optional[str] = "gpt-4-turbo"
    conversation_history: Optional[List[Dict[str, str]]] = None
    user_id: Optional[str] = None
    chat_id: Optional[str] = None  # ID de la conversación para obtener el nivel


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
    user_id: Optional[str] = None
    chat_id: Optional[str] = None  # ID de la conversación para obtener el nivel
    conversation_history: Optional[List[dict]] = None
    topic: Optional[str] = None

class GenerateExerciseRequest(BaseModel):
    """Modelo para generar un ejercicio"""
    apiKey: str
    difficulty: str = "medium"
    topics: Optional[List[str]] = None
    exercise_type: Optional[str] = None
    constraints: Optional[str] = None
    model: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = None
    user_id: Optional[str] = None
    chat_id: Optional[str] = None

class CorrectExerciseRequest(BaseModel):
    """Modelo para corregir un ejercicio"""
    exercise: Dict
    student_answer: str
    student_answer_image: Optional[str] = None
    user_id: Optional[str] = None
    chat_id: Optional[str] = None  # ID de la conversación (opcional)
    apiKey: Optional[str] = None
    model: Optional[str] = None


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
    topic: Optional[str] = None  # Si es None, eliminar el tema (chat personalizado)


class ListChatsRequest(BaseModel):
    """Modelo para listar conversaciones"""
    user_id: str


class AddLearnedWordRequest(BaseModel):
    """Modelo para agregar una palabra aprendida"""
    user_id: str
    language: str
    word: str
    translation: str
    source: Optional[str] = "unknown"
    example: Optional[str] = None
    romanization: Optional[str] = None


class GetLearnedWordsRequest(BaseModel):
    """Modelo para obtener palabras aprendidas"""
    user_id: str
    language: str


class ExecuteCodeRequest(BaseModel):
    """Modelo para ejecutar código"""
    code: str
    language: str
    inputs: Optional[str] = None  # Inputs separados por saltos de línea para programas que usan input()


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
        
        # El resultado ya incluye detected_topic si se detectó
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
        
        print("[FastAPI] Generando resumen (esto puede tardar)...")
        # Usar el tema de la conversación si está disponible
        final_topics = request.topics
        if not final_topics and request.topic:
            final_topics = [request.topic]
        
        # Obtener nivel del usuario desde la conversación si hay chat_id
        user_level = None
        if request.user_id and request.chat_id:
            try:
                chat_data = progress_tracker_instance.get_chat_level(request.user_id, request.chat_id)
                user_level = chat_data.get("level", 0)
                print(f"📊 Nivel del usuario en conversación '{request.chat_id}': {user_level}/10")
            except Exception as e:
                print(f"⚠️ No se pudo obtener el nivel del usuario desde chat_id: {e}")
        
        # Generar resumen basado en la conversación y temas (model=None usa modo automático)
        notes = system.generate_notes(
            topics=final_topics, 
            model=request.model if request.model else None, 
            user_id=request.user_id,
            conversation_history=request.conversation_history,
            topic=request.topic,
            user_level=user_level,  # Pasar el nivel obtenido del chat
            chat_id=request.chat_id  # Pasar chat_id para mantener chats separados
        )
        
        print(f"[FastAPI] Apuntes generados exitosamente ({len(notes)} caracteres)")
        
        # generate_notes ahora devuelve usage_info internamente, pero no lo expone
        # Necesitamos obtenerlo del agente si está disponible
        if request.user_id:
            # Intentar obtener el modelo usado y tokens del agente
            model_used = request.model or "gpt-3.5-turbo"
            input_tokens = 0
            output_tokens = 0
            
            if hasattr(system, 'explanation_agent') and hasattr(system.explanation_agent, 'current_model_config'):
                if system.explanation_agent.current_model_config:
                    model_used = system.explanation_agent.current_model_config.name
            
            # Estimar tokens basándose en la longitud del contenido si no están disponibles
            # Aproximación: 1 token ≈ 4 caracteres
            if input_tokens == 0 and output_tokens == 0:
                input_tokens = len(str(request.conversation_history or "")) // 4 if request.conversation_history else 1000
                output_tokens = len(notes) // 4
            
            save_user_cost(request.user_id, input_tokens, output_tokens, model_used, system)
        
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
        
        # Obtener tema del chat si está disponible
        chat_topic = request.topic
        initial_form = request.initial_form_data
        if not chat_topic and request.chat_id:
            try:
                chat_data = progress_tracker_instance.get_chat_level(request.user_id, request.chat_id)
                chat_topic = chat_data.get("topic")
            except Exception as e:
                print(f"⚠️ No se pudo obtener el tema del chat: {e}")
        
        # Si no se proporcionó initial_form_data, intentar obtenerlo del chat
        if not initial_form and request.chat_id:
            try:
                # Cargar chat para obtener metadata
                from chat_storage import load_chat
                chat_data = load_chat(request.user_id, request.chat_id)
                if chat_data and chat_data.get("metadata", {}).get("initialForm"):
                    initial_form = chat_data["metadata"]["initialForm"]
                    print(f"📋 Datos del formulario inicial obtenidos del chat: nivel={initial_form.get('level')}, objetivo={initial_form.get('learningGoal', '')[:50]}...")
            except Exception as e:
                print(f"⚠️ No se pudo obtener datos del formulario inicial: {e}")
        
        # Responder pregunta (model=None usa modo automático)
        answer, usage_info = system.ask_question(
            request.question, 
            request.user_id, 
            model=request.model if request.model else None,
            chat_id=request.chat_id,
            topic=chat_topic,
            initial_form_data=initial_form
        )
        
        # Calcular y guardar coste
        input_tokens = usage_info.get("inputTokens", 0)
        output_tokens = usage_info.get("outputTokens", 0)
        model_used = usage_info.get("model") or request.model or "gpt-3.5-turbo"
        
        if request.user_id:
            save_user_cost(request.user_id, input_tokens, output_tokens, model_used, system)
        
        return {
            "success": True,
            "answer": answer,
            "question": request.question,
            "inputTokens": input_tokens,
            "outputTokens": output_tokens
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
        
        # Obtener nivel del usuario desde la conversación si hay chat_id
        user_level = None
        if request.user_id and request.chat_id:
            try:
                chat_data = progress_tracker_instance.get_chat_level(request.user_id, request.chat_id)
                user_level = chat_data.get("level", 0)
                print(f"📊 Nivel del usuario en conversación '{request.chat_id}': {user_level}/10")
            except Exception as e:
                print(f"⚠️ No se pudo obtener el nivel del usuario: {e}")
        
        # Generar test (model=None usa modo automático)
        test, usage_info = system.generate_test(
            difficulty=request.difficulty,
            num_questions=request.num_questions,
            topics=request.topics,
            constraints=request.constraints,
            model=request.model if request.model else None,
            conversation_history=request.conversation_history,
            user_id=request.user_id,
            chat_id=request.chat_id,
            user_level=user_level
        )
        
        # Calcular y guardar coste
        input_tokens = usage_info.get("inputTokens", 0)
        output_tokens = usage_info.get("outputTokens", 0)
        model_used = usage_info.get("model") or request.model or "gpt-3.5-turbo"
        
        if request.user_id:
            save_user_cost(request.user_id, input_tokens, output_tokens, model_used, system)
        
        return {
            "success": True,
            "test": test,
            "inputTokens": input_tokens,
            "outputTokens": output_tokens
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
        
        # Calcular y guardar coste (necesitamos user_id, pero no está en el request)
        # Por ahora, no guardamos coste para grade_test si no hay user_id
        input_tokens = usage_info.get("inputTokens", 0)
        output_tokens = usage_info.get("outputTokens", 0)
        
        return {
            "success": True,
            "feedback": feedback,
            "inputTokens": input_tokens,
            "outputTokens": output_tokens
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error en grade_test: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-exercise")
async def generate_exercise(request: GenerateExerciseRequest):
    """
    Genera un ejercicio personalizado
    
    Args:
        request: Solicitud con dificultad, temas, tipo de ejercicio y API key
        
    Returns:
        Ejercicio generado
    """
    try:
        if not request.apiKey:
            raise HTTPException(status_code=400, detail="API key requerida")
        
        system = get_or_create_system(request.apiKey, mode="auto")
        
        # Log para debug
        print(f"[FastAPI] generate-exercise recibido: topics={request.topics}, difficulty={request.difficulty}, user_id={request.user_id}")
        
        # Generar ejercicio (model=None usa modo automático)
        # Obtener nivel del usuario si hay user_id y topics
        user_level = None
        if request.user_id and request.topics and len(request.topics) > 0:
            try:
                main_topic = request.topics[0] if isinstance(request.topics, list) else str(request.topics)
                topic_data = progress_tracker_instance.get_topic_level(request.user_id, main_topic)
                user_level = topic_data.get("level", 0)
                print(f"📊 Nivel del usuario en '{main_topic}': {user_level}/10")
            except Exception as e:
                print(f"⚠️ No se pudo obtener el nivel del usuario: {e}")
        
        exercise, usage_info = system.generate_exercise(
            difficulty=request.difficulty,
            topics=request.topics,
            exercise_type=request.exercise_type,
            constraints=request.constraints,
            model=request.model if request.model else None,
            conversation_history=request.conversation_history,
            user_id=request.user_id if request.user_id else None,
            user_level=user_level,
            chat_id=request.chat_id
        )
        
        # Calcular y guardar coste
        input_tokens = usage_info.get("inputTokens", 0)
        output_tokens = usage_info.get("outputTokens", 0)
        model_used = usage_info.get("model") or request.model or "gpt-3.5-turbo"
        
        if request.user_id:
            save_user_cost(request.user_id, input_tokens, output_tokens, model_used, system)
        
        return {
            "success": True,
            "exercise": exercise,
            "exercise_id": exercise.get("exercise_id", ""),
            "inputTokens": input_tokens,
            "outputTokens": output_tokens
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error en generate_exercise: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/correct-exercise")
async def correct_exercise(request: CorrectExerciseRequest):
    """
    Corrige un ejercicio y proporciona feedback
    
    Args:
        request: Solicitud con ejercicio, respuesta del estudiante y API key
        
    Returns:
        Corrección detallada
    """
    try:
        if not request.apiKey:
            raise HTTPException(status_code=400, detail="API key requerida")
        
        system = get_or_create_system(request.apiKey, mode="auto")
        
        # Si hay imagen, incluirla en la respuesta del estudiante
        student_answer_text = request.student_answer
        if request.student_answer_image:
            student_answer_text += f"\n\n[Imagen adjunta: {request.student_answer_image[:100]}...]"
        
        # Detectar si es un ejercicio de programación
        exercise = request.exercise
        topics = exercise.get("topics", [])
        is_programming = False
        programming_language = None
        
        # Lista de lenguajes de programación
        programming_keywords = ["python", "javascript", "java", "sql", "c++", "c#", "programación", "programming", "código", "code"]
        
        # Verificar si alguno de los temas es de programación
        topics_str = " ".join(topics).lower() if isinstance(topics, list) else str(topics).lower()
        print(f"[FastAPI] Detecting programming language. Topics: {topics}, Topics string: {topics_str}")
        
        for keyword in programming_keywords:
            if keyword in topics_str:
                is_programming = True
                # Detectar el lenguaje específico
                if "python" in topics_str:
                    programming_language = "python"
                elif "javascript" in topics_str or "js" in topics_str:
                    programming_language = "javascript"
                elif "java" in topics_str:
                    programming_language = "java"
                elif "sql" in topics_str:
                    programming_language = "sql"
                break
        
        print(f"[FastAPI] Programming detection: is_programming={is_programming}, language={programming_language}")
        
        # Si es programación y tenemos intérprete, ejecutar el código
        if is_programming and programming_language:
            print(f"[FastAPI] Attempting to execute code for {programming_language} exercise")
            # Intentar extraer código de la respuesta del estudiante
            # Buscar bloques de código entre ``` o en el texto
            import re
            code_pattern = r'```(?:\w+)?\n?(.*?)```|```(.*?)```'
            code_matches = re.findall(code_pattern, student_answer_text, re.DOTALL)
            
            # Si no hay bloques de código, usar toda la respuesta como código
            student_code = student_answer_text.strip()
            if code_matches:
                # Usar el primer bloque de código encontrado
                student_code = code_matches[0][0] if code_matches[0][0] else code_matches[0][1]
                student_code = student_code.strip()
            
            print(f"[FastAPI] Extracted code (first 200 chars): {student_code[:200]}")
            
            # Obtener la respuesta esperada del ejercicio
            expected_answer_full = exercise.get("expected_answer", "")
            solution_steps = exercise.get("solution_steps", "")
            
            # Extraer código y salida esperada de expected_answer
            # Formato esperado: código entre ``` y luego "Salida esperada: ..."
            expected_code = None
            expected_output = None
            
            # Buscar bloques de código en expected_answer
            code_pattern = r'```(?:\w+)?\n?(.*?)```'
            code_matches = re.findall(code_pattern, expected_answer_full, re.DOTALL)
            if code_matches:
                expected_code = code_matches[0].strip()
                print(f"[FastAPI] Found expected code in expected_answer (first 200 chars): {expected_code[:200]}")
            
            # Buscar "Salida esperada:" después del código
            # Buscar después del último bloque de código
            if code_matches:
                # Buscar después del último ```
                after_code = expected_answer_full.split('```')[-1] if '```' in expected_answer_full else expected_answer_full
                output_match = re.search(r'(?:salida\s+esperada|output|resultado\s+esperado|resultado).*?:\s*(.*?)(?:\n\n|\Z|$)', after_code, re.IGNORECASE | re.DOTALL)
                if output_match:
                    expected_output = output_match.group(1).strip()
                    print(f"[FastAPI] Found expected output: {expected_output[:200]}")
            
            # Si no encontramos salida esperada, buscar en solution_steps
            if not expected_output:
                output_match = re.search(r'(?:salida\s+esperada|output|resultado\s+esperado|resultado).*?:\s*(.*?)(?:\n\n|\Z|$)', solution_steps, re.IGNORECASE | re.DOTALL)
                if output_match:
                    expected_output = output_match.group(1).strip()
                    print(f"[FastAPI] Found expected output in solution_steps: {expected_output[:200]}")
            
            # Si aún no encontramos salida esperada, intentar usar toda la expected_answer (sin el código)
            if not expected_output or len(expected_output) < 3:
                # Si hay código, usar solo la parte después del código
                if expected_code:
                    parts = expected_answer_full.split('```')
                    if len(parts) > 2:
                        after_code_text = parts[-1].strip()
                        # Remover "Salida esperada:" si está presente
                        after_code_text = re.sub(r'^(?:salida\s+esperada|output|resultado).*?:\s*', '', after_code_text, flags=re.IGNORECASE)
                        if after_code_text and len(after_code_text) > 3:
                            expected_output = after_code_text.strip()
                else:
                    # No hay código, usar toda la expected_answer
                    expected_output = expected_answer_full.strip()
            
            print(f"[FastAPI] Final expected_output (first 200 chars): {expected_output[:200] if expected_output else 'None'}")
            
            # Ejecutar el código del estudiante
            execution_result = None
            if programming_language == "python":
                # Usar el endpoint de ejecución de código
                try:
                    print(f"[FastAPI] Executing Python code (length: {len(student_code)} chars)...")
                    execute_request = ExecuteCodeRequest(code=student_code, language="python")
                    execution_result = await execute_code_endpoint(execute_request)
                    print(f"[FastAPI] Execution result: success={execution_result.get('success') if execution_result else None}, has_output={bool(execution_result.get('output') if execution_result else None)}")
                except Exception as e:
                    print(f"[FastAPI] Error ejecutando código Python: {e}")
                    import traceback
                    traceback.print_exc()
            elif programming_language == "javascript":
                # Para JavaScript, no podemos ejecutarlo en el servidor fácilmente
                # Dejamos que el LLM lo corrija
                pass
            
            # Si la ejecución fue exitosa, usar la salida para la corrección
            if execution_result:
                if execution_result.get("success"):
                    # Código ejecutado sin errores
                    actual_output = execution_result.get("output", "").strip()
                    expected_output_clean = expected_output.strip()
                    
                    # Si hay salida esperada, comparar
                    if expected_output_clean and len(expected_output_clean) > 3:
                        # Comparar salidas (normalizar espacios y saltos de línea)
                        actual_normalized = "\n".join([line.strip() for line in actual_output.split("\n") if line.strip()])
                        expected_normalized = "\n".join([line.strip() for line in expected_output_clean.split("\n") if line.strip()])
                        
                        if actual_normalized == expected_normalized:
                            # Salidas coinciden, ejercicio correcto
                            points = exercise.get("points", 10)
                            score = float(points)
                            
                            # Actualizar progreso si hay user_id y temas
                            progress_update = None
                            if request.user_id and topics:
                                main_topic = topics[0] if isinstance(topics, list) else str(topics)
                                chat_id = getattr(request, 'chat_id', None)
                                progress_update = progress_tracker_instance.add_exercise_completion(
                                    user_id=request.user_id,
                                    topic=main_topic,
                                    score=score,
                                    max_score=points,
                                    chat_id=chat_id
                                )
                            
                            return {
                                "success": True,
                                "correction": {
                                    "score": score,
                                    "score_percentage": 100.0,
                                    "is_correct": True,
                                    "feedback": f"¡Excelente! Tu código se ejecutó correctamente y produce la salida esperada.\n\nSalida obtenida:\n{actual_output}\n\nSalida esperada:\n{expected_output_clean}",
                                    "detailed_analysis": "El código ejecutado produce exactamente la salida esperada. La solución es correcta.",
                                    "correct_answer_explanation": f"La salida correcta es:\n{expected_output_clean}"
                                },
                                "progress_update": progress_update,
                                "inputTokens": 0,
                                "outputTokens": 0
                            }
                        else:
                            # Salidas no coinciden, usar LLM para dar feedback detallado
                            student_answer_text = f"Código enviado:\n```{programming_language}\n{student_code}\n```\n\nSalida obtenida al ejecutar:\n{actual_output}\n\nSalida esperada:\n{expected_output_clean}\n\nEl código se ejecutó pero la salida no coincide con la esperada."
                    else:
                        # No hay salida esperada específica, pero el código se ejecutó sin errores
                        # Usar LLM para evaluar si el código cumple con los requisitos del ejercicio
                        student_answer_text = f"Código enviado:\n```{programming_language}\n{student_code}\n```\n\nEl código se ejecutó sin errores. Salida obtenida:\n{actual_output}\n\nPor favor, evalúa si el código cumple con los requisitos del ejercicio."
                else:
                    # Código tiene errores de ejecución
                    error_msg = execution_result.get("error", "Error desconocido al ejecutar el código")
                    student_answer_text = f"Código enviado:\n```{programming_language}\n{student_code}\n```\n\nError al ejecutar el código:\n{error_msg}\n\nPor favor, identifica los errores y proporciona feedback sobre cómo corregirlos."
            else:
                # No se pudo ejecutar el código (por ejemplo, JavaScript)
                # Continuar con corrección normal usando LLM
                pass
        
        # Corregir ejercicio con LLM (model=None usa modo automático)
        correction, usage_info = system.correct_exercise(
            exercise=exercise,
            student_answer=student_answer_text,
            model=request.model if request.model else None
        )
        
        # Actualizar progreso si hay user_id y temas
        progress_update = None
        if request.user_id and request.exercise.get("topics"):
            topics = request.exercise.get("topics", [])
            if topics:
                # Usar el primer tema para el progreso
                main_topic = topics[0] if isinstance(topics, list) else str(topics)
                score = correction.get("score", 0)
                max_score = request.exercise.get("points", 10)
                
                chat_id = getattr(request, 'chat_id', None)
                progress_update = progress_tracker_instance.add_exercise_completion(
                    user_id=request.user_id,
                    topic=main_topic,
                    score=score,
                    max_score=max_score,
                    chat_id=chat_id  # Pasar chat_id si está disponible
                )
        
        # Calcular y guardar coste
        input_tokens = usage_info.get("inputTokens", 0)
        output_tokens = usage_info.get("outputTokens", 0)
        model_used = usage_info.get("model") or request.model or "gpt-3.5-turbo"
        
        if request.user_id:
            save_user_cost(request.user_id, input_tokens, output_tokens, model_used, system)
        
        return {
            "success": True,
            "correction": correction,
            "progress_update": progress_update,
            "inputTokens": input_tokens,
            "outputTokens": output_tokens
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error en correct_exercise: {str(e)}")
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
    Carga una conversación y sincroniza el historial con MemoryManager
    
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
        
        # Sincronizar historial con MemoryManager para mantener chats separados
        # Nota: Esto solo funciona si hay un sistema ya creado con la misma API key
        # En la práctica, el historial se sincronizará cuando se use el chat por primera vez
        # ya que get_or_create_system requiere una API key
        print(f"📝 Chat cargado: {request.chat_id} con {len(chat_data.get('messages', []))} mensajes")
        
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
        
        # Eliminar también el progreso asociado al chat
        try:
            progress_tracker_instance.delete_chat_progress(
                user_id=request.user_id,
                chat_id=request.chat_id
            )
            print(f"[FastAPI] Progreso del chat {request.chat_id} eliminado correctamente")
        except Exception as progress_error:
            print(f"[FastAPI] Error al eliminar progreso del chat: {str(progress_error)}")
            # No fallar la eliminación del chat si falla la eliminación del progreso
        
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


class GetProgressRequest(BaseModel):
    """Modelo para obtener progreso"""
    user_id: str
    topic: Optional[str] = None

class GetChatProgressRequest(BaseModel):
    """Modelo para obtener progreso de una conversación"""
    user_id: str
    chat_id: str

class UpdateTestProgressRequest(BaseModel):
    """Modelo para actualizar progreso con test"""
    user_id: str
    topic: str
    score_percentage: float
    chat_id: Optional[str] = None  # ID de la conversación (opcional)

class UpdateChatUnderstandingRequest(BaseModel):
    """Modelo para actualizar progreso con comprensión del chat"""
    user_id: str
    topic: str
    understanding_score: float  # 0.0 a 1.0

class SetChatLevelRequest(BaseModel):
    """Modelo para establecer manualmente el nivel de una conversación"""
    user_id: str
    chat_id: str
    level: int  # 0-10
    topic: Optional[str] = None


class GetUserStatsRequest(BaseModel):
    """Modelo para obtener estadísticas de un usuario"""
    user_id: str


class ProcessURLRequest(BaseModel):
    """Modelo para procesar una URL"""
    url: str
    user_id: Optional[str] = None
    apiKey: Optional[str] = None
    model: Optional[str] = None


@app.post("/api/get-progress")
async def get_progress_endpoint(request: GetProgressRequest):
    """
    Obtiene el progreso de un usuario
    
    Args:
        request: Solicitud con user_id
        
    Returns:
        Progreso del usuario por tema
    """
    try:
        if not request.user_id:
            raise HTTPException(status_code=400, detail="user_id requerido")
        
        if request.topic:
            # Obtener progreso de un tema específico
            topic_data = progress_tracker_instance.get_topic_level(request.user_id, request.topic)
            return {
                "success": True,
                "progress": {request.topic: topic_data}
            }
        else:
            # Obtener progreso de todos los temas
            all_topics = progress_tracker_instance.get_all_topics(request.user_id)
            return {
                "success": True,
                "progress": all_topics
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error en get-progress: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/get-chat-progress")
async def get_chat_progress_endpoint(request: GetChatProgressRequest):
    """
    Obtiene el progreso de una conversación específica
    
    Args:
        request: Solicitud con user_id y chat_id
        
    Returns:
        Progreso de la conversación
    """
    try:
        if not request.user_id or not request.chat_id:
            raise HTTPException(status_code=400, detail="user_id y chat_id requeridos")
        
        chat_data = progress_tracker_instance.get_chat_level(request.user_id, request.chat_id)
        print(f"[FastAPI] get-chat-progress: user_id={request.user_id}, chat_id={request.chat_id}, topic={chat_data.get('topic')}, level={chat_data.get('level')}")
        return {
            "success": True,
            "progress": chat_data
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error en get-chat-progress: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/update-test-progress")
async def update_test_progress_endpoint(request: UpdateTestProgressRequest):
    """
    Actualiza el progreso de un usuario después de completar un test
    
    Args:
        request: Solicitud con user_id, topic y score_percentage
        
    Returns:
        Información sobre el progreso actualizado
    """
    try:
        print(f"[FastAPI] update-test-progress recibido: user_id={request.user_id}, topic={request.topic}, score_percentage={request.score_percentage}, chat_id={request.chat_id}")
        print(f"[FastAPI] Tipo de score_percentage: {type(request.score_percentage)}, valor: {request.score_percentage}")
        progress_update = progress_tracker_instance.add_test_completion(
            user_id=request.user_id,
            topic=request.topic,
            score_percentage=float(request.score_percentage),  # Asegurar que sea float
            chat_id=request.chat_id  # Pasar chat_id si está disponible
        )
        print(f"[FastAPI] Progreso actualizado: {progress_update}")
        print(f"[FastAPI] level_up: {progress_update.get('level_up')}, levels_changed: {progress_update.get('levels_changed')}")
        return {"success": True, "progress_update": progress_update}
    except Exception as e:
        print(f"[FastAPI] Error en update-test-progress: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/update-chat-understanding")
async def update_chat_understanding_endpoint(request: UpdateChatUnderstandingRequest):
    """
    Actualiza el progreso de un usuario basado en comprensión detectada en el chat
    
    Args:
        request: Solicitud con user_id, topic y understanding_score (0.0 a 1.0)
        
    Returns:
        Información sobre el progreso actualizado
    """
    try:
        progress_update = progress_tracker_instance.add_chat_understanding(
            user_id=request.user_id,
            topic=request.topic,
            understanding_score=request.understanding_score
        )
        return {"success": True, "progress_update": progress_update}
    except Exception as e:
        print(f"[FastAPI] Error en update-chat-understanding: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/add-learned-word")
async def add_learned_word_endpoint(request: AddLearnedWordRequest):
    """
    Agrega una palabra aprendida para un usuario e idioma y actualiza el nivel si es un idioma
    
    Args:
        request: Solicitud con datos de la palabra
        
    Returns:
        Confirmación de agregado y actualización de nivel
    """
    try:
        success = learned_words_storage.add_learned_word(
            user_id=request.user_id,
            language=request.language,
            word=request.word,
            translation=request.translation,
            source=request.source,
            example=request.example,
            romanization=request.romanization
        )
        
        level_update = None
        # Si se agregó correctamente y es un idioma, actualizar el nivel basado en palabras aprendidas
        if success:
            # Detectar si es un idioma (lista de idiomas comunes)
            language_lower = request.language.lower()
            is_language = any(lang in language_lower for lang in [
                "inglés", "english", "francés", "francais", "alemán", "deutsch",
                "italiano", "portugués", "chino", "japonés", "japones", "coreano",
                "catalán", "catalan", "ruso", "árabe", "español", "espanol"
            ])
            
            if is_language:
                # Obtener conteo actual de palabras
                word_count = learned_words_storage.get_all_learned_words_count(
                    user_id=request.user_id,
                    language=request.language
                )
                
                # Calcular nivel basado en palabras aprendidas
                new_level = learned_words_storage.calculate_level_from_words(word_count)
                
                # Obtener nivel actual del tema
                topic_data = progress_tracker_instance.get_topic_level(
                    user_id=request.user_id,
                    topic=request.language
                )
                old_level = topic_data.get("level", 0)
                
                # Solo actualizar si el nivel cambió
                if new_level != old_level:
                    # Buscar todos los chats asociados a este idioma
                    user_progress = progress_tracker_instance.get_user_progress(request.user_id)
                    updated_chats = []
                    
                    # Buscar en los chats del usuario
                    if "chats" in user_progress:
                        for chat_id, chat_data in user_progress["chats"].items():
                            if chat_data.get("topic") == request.language:
                                level_update = progress_tracker_instance.set_chat_level(
                                    user_id=request.user_id,
                                    chat_id=chat_id,
                                    level=new_level,
                                    topic=request.language
                                )
                                updated_chats.append(chat_id)
                    
                    # Si no hay chats, crear uno temporal para mantener el nivel del tema
                    if not updated_chats:
                        # Usar un chat_id basado en el idioma para mantener consistencia
                        temp_chat_id = f"lang_{request.language.lower().replace(' ', '_').replace('/', '_')}"
                        level_update = progress_tracker_instance.set_chat_level(
                            user_id=request.user_id,
                            chat_id=temp_chat_id,
                            level=new_level,
                            topic=request.language
                        )
                        updated_chats.append(temp_chat_id)
                    
                    print(f"[FastAPI] Nivel actualizado para {request.language}: {old_level} → {new_level} ({word_count} palabras) en {len(updated_chats)} chat(s)")
                    level_update = {
                        "old_level": old_level,
                        "new_level": new_level,
                        "word_count": word_count
                    }
        
        result = {
            "success": success,
            "message": "Palabra agregada" if success else "Palabra ya existe"
        }
        
        if level_update:
            result["level_update"] = level_update
        
        return result
    except Exception as e:
        print(f"[FastAPI] Error en add-learned-word: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/get-learned-words")
async def get_learned_words_endpoint(request: GetLearnedWordsRequest):
    """
    Obtiene todas las palabras aprendidas para un usuario e idioma
    
    Args:
        request: Solicitud con user_id y language
        
    Returns:
        Lista de palabras aprendidas
    """
    try:
        words = learned_words_storage.get_learned_words(
            user_id=request.user_id,
            language=request.language
        )
        
        return {
            "success": True,
            "words": words,
            "count": len(words)
        }
    except Exception as e:
        print(f"[FastAPI] Error en get-learned-words: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/get-learned-words-count")
async def get_learned_words_count_endpoint(request: GetLearnedWordsRequest):
    """
    Obtiene el conteo de palabras aprendidas para un usuario e idioma
    
    Args:
        request: Solicitud con user_id y language
        
    Returns:
        Número de palabras aprendidas
    """
    try:
        count = learned_words_storage.get_all_learned_words_count(
            user_id=request.user_id,
            language=request.language
        )
        
        return {
            "success": True,
            "count": count
        }
    except Exception as e:
        print(f"[FastAPI] Error en get-learned-words-count: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/get-user-stats")
async def get_user_stats_endpoint(request: GetUserStatsRequest):
    """
    Obtiene las estadísticas de tokens y costes de un usuario
    
    Args:
        request: Solicitud con user_id
        
    Returns:
        Estadísticas del usuario (tokens, costes, etc.)
    """
    try:
        if not request.user_id:
            raise HTTPException(status_code=400, detail="user_id requerido")
        
        # Obtener sistema para acceder a memory_manager
        system = get_or_create_system(api_key=None, mode="auto")
        
        # Obtener estadísticas del usuario
        if hasattr(system, 'memory') and hasattr(system.memory, 'get_user_stats'):
            stats = system.memory.get_user_stats(request.user_id)
            return {
                "success": True,
                "stats": stats
            }
        else:
            return {
                "success": True,
                "stats": {
                    "total_input_tokens": 0,
                    "total_output_tokens": 0,
                    "total_cost": 0.0,
                    "total_requests": 0,
                    "by_model": {}
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error en get-user-stats: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/process-url")
async def process_url_endpoint(request: ProcessURLRequest):
    """
    Procesa una URL: extrae contenido de texto o resume videos
    
    Args:
        request: Solicitud con URL a procesar
        
    Returns:
        Contenido extraído o resumen del video
    """
    try:
        import re
        import requests
        from bs4 import BeautifulSoup
        from urllib.parse import urlparse
        
        # Limpiar URL: eliminar saltos de línea, retornos de carro y espacios
        url = request.url.strip().replace('\n', '').replace('\r', '').replace(' ', '')
        
        # Validar que sea una URL válida
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Detectar si es un video (YouTube, Vimeo, etc.)
        is_video = False
        video_platform = None
        
        if 'youtube.com' in url or 'youtu.be' in url:
            is_video = True
            video_platform = 'youtube'
        elif 'vimeo.com' in url:
            is_video = True
            video_platform = 'vimeo'
        
        if is_video:
            # Para videos, intentar obtener información y resumir
            try:
                # Obtener información básica del video
                response = requests.get(url, timeout=10, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                })
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Extraer título y descripción
                title = soup.find('title')
                title_text = title.text if title else "Video"
                
                # Buscar descripción (varía según la plataforma)
                description = ""
                if video_platform == 'youtube':
                    meta_desc = soup.find('meta', {'name': 'description'})
                    if meta_desc:
                        description = meta_desc.get('content', '')
                
                # Si hay API key, usar el sistema para generar un resumen
                if request.apiKey:
                    system = get_or_create_system(request.apiKey, mode="auto")
                    
                    prompt = f"""Resume el siguiente video de {video_platform}:

Título: {title_text}
Descripción: {description}
URL: {url}

Proporciona un resumen completo y detallado del contenido del video, incluyendo:
- Los temas principales tratados
- Los puntos clave explicados
- Cualquier información importante mencionada
- Conclusiones o recomendaciones si las hay

Resumen:"""
                    
                    # Usar el agente de QA para generar el resumen
                    answer, usage_info = system.ask_question(
                        prompt,
                        request.user_id or "default",
                        model=request.model if request.model else None
                    )
                    
                    # Guardar coste si hay user_id
                    if request.user_id:
                        input_tokens = usage_info.get("inputTokens", 0)
                        output_tokens = usage_info.get("outputTokens", 0)
                        model_used = usage_info.get("model") or request.model or "gpt-3.5-turbo"
                        save_user_cost(request.user_id, input_tokens, output_tokens, model_used, system)
                    
                    return {
                        "success": True,
                        "type": "video",
                        "platform": video_platform,
                        "title": title_text,
                        "summary": answer,
                        "url": url
                    }
                else:
                    # Sin API key, devolver información básica
                    return {
                        "success": True,
                        "type": "video",
                        "platform": video_platform,
                        "title": title_text,
                        "description": description,
                        "url": url,
                        "message": "Para obtener un resumen detallado, configura tu API key de OpenAI"
                    }
                    
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Error al procesar video: {str(e)}",
                    "url": url
                }
        else:
            # Para páginas web de texto, extraer contenido
            try:
                response = requests.get(url, timeout=10, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                })
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Eliminar scripts y estilos
                for script in soup(["script", "style", "nav", "footer", "header", "aside"]):
                    script.decompose()
                
                # Extraer texto principal
                title = soup.find('title')
                title_text = title.text if title else ""
                
                # Buscar contenido principal
                main_content = soup.find('main') or soup.find('article') or soup.find('div', class_=re.compile('content|main|article', re.I))
                
                if main_content:
                    text = main_content.get_text(separator='\n', strip=True)
                else:
                    # Si no hay main/article, usar body
                    body = soup.find('body')
                    if body:
                        text = body.get_text(separator='\n', strip=True)
                    else:
                        text = soup.get_text(separator='\n', strip=True)
                
                # Limpiar texto (eliminar líneas vacías múltiples y URLs rotas)
                lines = [line.strip() for line in text.split('\n') if line.strip()]
                # Unir líneas que parecen ser parte de una URL rota
                cleaned_lines = []
                for i, line in enumerate(lines):
                    # Si la línea anterior termina con parte de una URL y esta línea parece continuarla
                    if (cleaned_lines and 
                        cleaned_lines[-1] and 
                        ('http' in cleaned_lines[-1] or cleaned_lines[-1].endswith('/') or 
                         any(char in cleaned_lines[-1] for char in ['?', '&', '='])) and
                        not line.startswith('http') and len(line) < 50 and 
                        not line[0].isupper() and not line.endswith('.')):
                        # Probablemente es continuación de URL, unir sin espacio
                        cleaned_lines[-1] = cleaned_lines[-1] + line
                    else:
                        cleaned_lines.append(line)
                cleaned_text = '\n'.join(cleaned_lines[:500])  # Limitar a 500 líneas
                
                # Almacenar contenido en memoria para que esté disponible en preguntas
                if request.user_id:
                    try:
                        system = get_or_create_system(request.apiKey, mode="auto") if request.apiKey else None
                        if system and system.memory:
                            # Crear documento con título y contenido
                            document_text = f"Título: {title_text}\nURL: {url}\n\nContenido:\n{cleaned_text}"
                            system.memory.store_documents(
                                [document_text],
                                [{"source": "url", "url": url, "title": title_text, "user_id": request.user_id}],
                                chat_id=request.chat_id if hasattr(request, 'chat_id') else None,
                                user_id=request.user_id
                            )
                            print(f"📚 Contenido de URL almacenado en memoria: {url}")
                    except Exception as e:
                        print(f"⚠️ Error al almacenar contenido de URL en memoria: {e}")
                
                return {
                    "success": True,
                    "type": "text",
                    "title": title_text,
                    "content": cleaned_text,
                    "url": url
                }
                
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Error al procesar URL: {str(e)}",
                    "url": url
                }
                
    except Exception as e:
        print(f"[FastAPI] Error en process-url: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/set-chat-level")
async def set_chat_level_endpoint(request: SetChatLevelRequest):
    """
    Establece manualmente el nivel de una conversación
    
    Args:
        request: Solicitud con user_id, chat_id, level (0-10) y topic opcional
        
    Returns:
        Información sobre el nivel establecido
    """
    try:
        print(f"[FastAPI] set-chat-level recibido: user_id={request.user_id}, chat_id={request.chat_id}, level={request.level}, topic={request.topic}")
        
        # Si no se proporciona el topic, intentar obtenerlo del chat almacenado
        topic_to_use = request.topic
        if not topic_to_use:
            try:
                from chat_storage import load_chat
                chat_data = load_chat(request.user_id, request.chat_id)
                if chat_data:
                    # Intentar obtener el tema desde metadata o título
                    if chat_data.get("metadata", {}).get("topic"):
                        topic_to_use = chat_data["metadata"]["topic"]
                        print(f"[FastAPI] Tema obtenido desde metadata: {topic_to_use}")
                    elif chat_data.get("title"):
                        topic_to_use = chat_data["title"]
                        print(f"[FastAPI] Tema obtenido desde título del chat: {topic_to_use}")
                    else:
                        # Intentar obtener desde progress_tracker
                        chat_level_data = progress_tracker_instance.get_chat_level(request.user_id, request.chat_id)
                        if chat_level_data and chat_level_data.get("topic"):
                            topic_to_use = chat_level_data["topic"]
                            print(f"[FastAPI] Tema obtenido desde progress_tracker: {topic_to_use}")
            except Exception as e:
                print(f"[FastAPI] No se pudo obtener el tema del chat: {e}")
        
        # Si aún no hay tema, usar "General" por defecto
        if not topic_to_use:
            topic_to_use = "General"
            print(f"[FastAPI] Usando tema por defecto: {topic_to_use}")
        
        result = progress_tracker_instance.set_chat_level(
            user_id=request.user_id,
            chat_id=request.chat_id,
            level=request.level,
            topic=topic_to_use
        )
        print(f"[FastAPI] Nivel establecido: {result}")
        return {"success": True, "result": result}
    except Exception as e:
        print(f"[FastAPI] Error en set-chat-level: {str(e)}")
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
        # Manejar el tema: si es None, eliminar del metadata (chat personalizado), si tiene valor, actualizarlo
        if hasattr(request, 'topic') and request.topic is not None:
            if request.topic.strip() == "":
                # Si es string vacío o solo espacios, eliminar el tema
                metadata.pop("topic", None)
                print(f"[FastAPI] Tema eliminado (chat personalizado)")
            else:
                metadata["topic"] = request.topic.strip()
                print(f"[FastAPI] Tema actualizado: {metadata['topic']}")
        elif hasattr(request, 'topic') and request.topic is None:
            # Si explícitamente se envía None, eliminar el tema
            metadata.pop("topic", None)
            print(f"[FastAPI] Tema eliminado (chat personalizado)")
        
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


@app.post("/api/execute-code")
async def execute_code_endpoint(request: ExecuteCodeRequest):
    """
    Ejecuta código en el servidor (Python, JavaScript, SQL, Java, HTML, React, C++)
    
    Args:
        request: Solicitud con código, lenguaje e inputs opcionales
        
    Returns:
        Salida de la ejecución o error
    """
    import subprocess
    import tempfile
    import os
    from pathlib import Path
    
    try:
        language_lower = request.language.lower()
        
        # Python
        if "python" in language_lower:
            # Detectar si el código usa input() y si hay inputs proporcionados
            code_uses_input = "input(" in request.code
            has_inputs = request.inputs and request.inputs.strip()
            
            if code_uses_input and not has_inputs:
                return {
                    "success": False,
                    "error": "Este código requiere entrada (usa input()). Por favor, proporciona los valores de entrada en el campo 'Inputs' (uno por línea).",
                    "output": ""
                }
            
            # Crear un archivo temporal para el código con codificación UTF-8
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
                f.write("# -*- coding: utf-8 -*-\n")
                f.write(request.code)
                temp_file = f.name
            
            try:
                # Preparar inputs si están presentes
                # Si hay múltiples inputs, cada línea debe terminar con \n
                input_data = None
                if request.inputs:
                    input_data = request.inputs
                    # Asegurar que termine con \n si no termina ya
                    if not input_data.endswith('\n'):
                        input_data += '\n'
                
                # Ejecutar código con timeout de 10 segundos
                result = subprocess.run(
                    ["python3", temp_file] if os.path.exists("/usr/bin/python3") else ["python", temp_file],
                    input=input_data,
                    capture_output=True,
                    text=True,
                    timeout=10,
                    cwd=os.path.dirname(temp_file),
                    encoding='utf-8'
                )
                
                output = result.stdout
                error_output = result.stderr
                
                # Manejar EOFError específicamente
                if "EOFError" in error_output or "EOF when reading a line" in error_output:
                    return {
                        "success": False,
                        "error": "El código requiere entrada (input()) pero no se proporcionaron valores. Por favor, añade los valores de entrada en el campo 'Inputs' (uno por línea).",
                        "output": output
                    }
                
                if result.returncode != 0:
                    return {
                        "success": False,
                        "error": error_output or f"Código terminó con código de salida {result.returncode}",
                        "output": output
                    }
                
                return {
                    "success": True,
                    "output": output or "Código ejecutado sin errores.",
                    "error": ""
                }
            finally:
                try:
                    os.unlink(temp_file)
                except:
                    pass
        
        # JavaScript (Node.js)
        elif "javascript" in language_lower or "js" in language_lower:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False, encoding='utf-8') as f:
                f.write(request.code)
                temp_file = f.name
            
            try:
                input_data = None
                if request.inputs:
                    input_data = request.inputs  # Ya es string, no necesitamos encode
                
                result = subprocess.run(
                    ["node", temp_file],
                    input=input_data,
                    capture_output=True,
                    text=True,
                    timeout=10,
                    cwd=os.path.dirname(temp_file),
                    encoding='utf-8'
                )
                
                output = result.stdout
                error_output = result.stderr
                
                if result.returncode != 0:
                    return {
                        "success": False,
                        "error": error_output or f"Código terminó con código de salida {result.returncode}",
                        "output": output
                    }
                
                return {
                    "success": True,
                    "output": output or "Código ejecutado sin errores.",
                    "error": ""
                }
            finally:
                try:
                    os.unlink(temp_file)
                except:
                    pass
        
        # SQL (usando sqlite3 o Python sqlite3)
        elif "sql" in language_lower:
            # Usar Python sqlite3 directamente (viene incluido con Python, más confiable en producción)
            # No intentar usar sqlite3 como comando ya que puede no estar instalado en Railway
            use_python_sqlite = True  # Siempre usar Python sqlite3 para mayor compatibilidad
            
            if use_python_sqlite:
                # Usar Python con sqlite3 (viene incluido con Python)
                # Crear un script Python que ejecute el SQL
                sql_code = request.code.strip()
                # Escapar comillas y saltos de línea en el código SQL para el script Python
                sql_code_escaped = sql_code.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')
                python_sql_script = f"""# -*- coding: utf-8 -*-
import sqlite3
import sys
import os

# Crear base de datos temporal en memoria
db_file = ':memory:'
conn = sqlite3.connect(db_file)
cursor = conn.cursor()

# Ejecutar cada comando SQL (separados por ;)
sql_commands = "{sql_code_escaped}".split(';')

output_lines = []
for cmd in sql_commands:
    cmd = cmd.strip()
    if not cmd:
        continue
    try:
        cursor.execute(cmd)
        # Si es SELECT, mostrar resultados
        if cmd.strip().upper().startswith('SELECT'):
            results = cursor.fetchall()
            if results:
                # Obtener nombres de columnas
                columns = [description[0] for description in cursor.description]
                output_lines.append('|'.join(str(col) for col in columns))
                for row in results:
                    output_lines.append('|'.join(str(val) if val is not None else 'NULL' for val in row))
            else:
                output_lines.append("(0 filas)")
        else:
            # Para otros comandos (INSERT, UPDATE, etc.), mostrar mensaje de éxito
            cmd_preview = cmd[:50] + "..." if len(cmd) > 50 else cmd
            output_lines.append(f"Comando ejecutado: {{cmd_preview}}")
    except Exception as e:
        output_lines.append(f"Error: {{str(e)}}")
        conn.rollback()

conn.commit()
conn.close()

# Imprimir salida
for line in output_lines:
    print(line)
"""
                
                with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
                    f.write(python_sql_script)
                    temp_file = f.name
                
                try:
                    result = subprocess.run(
                        ["python3", temp_file] if os.path.exists("/usr/bin/python3") else ["python", temp_file],
                        capture_output=True,
                        text=True,
                        timeout=10,
                        encoding='utf-8'
                    )
                    
                    output = result.stdout
                    error_output = result.stderr
                    
                    if result.returncode != 0:
                        return {
                            "success": False,
                            "error": error_output or f"SQL terminó con código de salida {result.returncode}",
                            "output": output
                        }
                    
                    return {
                        "success": True,
                        "output": output or "SQL ejecutado sin errores.",
                        "error": ""
                    }
                finally:
                    try:
                        os.unlink(temp_file)
                    except:
                        pass
            else:
                # Usar sqlite3 como comando (método original)
                with tempfile.NamedTemporaryFile(mode='w', suffix='.sql', delete=False, encoding='utf-8') as f:
                    f.write(request.code)
                    temp_file = f.name
                
                try:
                    # Ejecutar SQL usando sqlite3
                    db_file = temp_file.replace('.sql', '.db')
                    result = subprocess.run(
                        ["sqlite3", db_file],
                        input=request.code,
                        capture_output=True,
                        text=True,
                        timeout=10,
                        encoding='utf-8'
                    )
                    
                    output = result.stdout
                    error_output = result.stderr
                    
                    if result.returncode != 0:
                        return {
                            "success": False,
                            "error": error_output or f"SQL terminó con código de salida {result.returncode}",
                            "output": output
                        }
                    
                    return {
                        "success": True,
                        "output": output or "SQL ejecutado sin errores.",
                        "error": ""
                    }
                finally:
                    try:
                        os.unlink(temp_file)
                        db_file = temp_file.replace('.sql', '.db')
                        if os.path.exists(db_file):
                            os.unlink(db_file)
                    except:
                        pass
        
        # Java
        elif "java" in language_lower:
            # Java requiere compilación primero
            with tempfile.NamedTemporaryFile(mode='w', suffix='.java', delete=False, encoding='utf-8') as f:
                f.write(request.code)
                temp_file = f.name
            
            try:
                # Compilar Java
                compile_result = subprocess.run(
                    ["javac", temp_file],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    encoding='utf-8'
                )
                
                if compile_result.returncode != 0:
                    return {
                        "success": False,
                        "error": compile_result.stderr or "Error de compilación",
                        "output": compile_result.stdout
                    }
                
                # Ejecutar Java (clase principal sin extensión)
                class_name = os.path.basename(temp_file).replace('.java', '')
                class_dir = os.path.dirname(temp_file)
                
                input_data = None
                if request.inputs:
                    input_data = request.inputs  # Ya es string, no necesitamos encode
                
                run_result = subprocess.run(
                    ["java", "-cp", class_dir, class_name],
                    input=input_data,
                    capture_output=True,
                    text=True,
                    timeout=10,
                    encoding='utf-8'
                )
                
                output = run_result.stdout
                error_output = run_result.stderr
                
                if run_result.returncode != 0:
                    return {
                        "success": False,
                        "error": error_output or f"Java terminó con código de salida {run_result.returncode}",
                        "output": output
                    }
                
                return {
                    "success": True,
                    "output": output or "Código ejecutado sin errores.",
                    "error": ""
                }
            finally:
                try:
                    os.unlink(temp_file)
                    class_file = temp_file.replace('.java', '.class')
                    if os.path.exists(class_file):
                        os.unlink(class_file)
                except:
                    pass
        
        # C++
        elif "c++" in language_lower or "cpp" in language_lower or "cplusplus" in language_lower:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.cpp', delete=False, encoding='utf-8') as f:
                f.write(request.code)
                temp_file = f.name
            
            try:
                # Compilar C++
                exe_file = temp_file.replace('.cpp', '.exe') if os.name == 'nt' else temp_file.replace('.cpp', '')
                compile_result = subprocess.run(
                    ["g++", temp_file, "-o", exe_file],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    encoding='utf-8'
                )
                
                if compile_result.returncode != 0:
                    return {
                        "success": False,
                        "error": compile_result.stderr or "Error de compilación",
                        "output": compile_result.stdout
                    }
                
                # Ejecutar C++
                input_data = None
                if request.inputs:
                    input_data = request.inputs  # Ya es string, no necesitamos encode
                
                run_result = subprocess.run(
                    [exe_file],
                    input=input_data,
                    capture_output=True,
                    text=True,
                    timeout=10,
                    encoding='utf-8'
                )
                
                output = run_result.stdout
                error_output = run_result.stderr
                
                if run_result.returncode != 0:
                    return {
                        "success": False,
                        "error": error_output or f"C++ terminó con código de salida {run_result.returncode}",
                        "output": output
                    }
                
                return {
                    "success": True,
                    "output": output or "Código ejecutado sin errores.",
                    "error": ""
                }
            finally:
                try:
                    os.unlink(temp_file)
                    if os.path.exists(exe_file):
                        os.unlink(exe_file)
                except:
                    pass
        
        # HTML/React (solo validación básica, no ejecución real)
        elif "html" in language_lower or "react" in language_lower:
            # Para HTML/React, solo validamos la sintaxis básica
            return {
                "success": True,
                "output": "HTML/React no se puede ejecutar directamente. Usa un navegador o entorno de desarrollo para ver el resultado.",
                "error": ""
            }
        
        # Lenguaje no soportado
        else:
            return {
                "success": False,
                "error": f"El lenguaje '{request.language}' no está soportado. Lenguajes disponibles: Python, JavaScript, SQL, Java, C++, HTML, React.",
                "output": ""
            }
                
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "El código tardó más de 10 segundos en ejecutarse y fue cancelado.",
            "output": ""
        }
    except FileNotFoundError as e:
        # Comando no encontrado (ej: node, javac, g++)
        missing_cmd = str(e).split("'")[1] if "'" in str(e) else "comando"
        return {
            "success": False,
            "error": f"El comando '{missing_cmd}' no está instalado. Por favor, instala las herramientas necesarias para ejecutar {request.language}.",
            "output": ""
        }
    except Exception as e:
        error_msg = str(e)
        print(f"[FastAPI] Error ejecutando código: {error_msg}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": f"Error al ejecutar el código: {error_msg}",
            "output": ""
        }


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
