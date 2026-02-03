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

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Request, BackgroundTasks
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request as StarletteRequest
from pydantic import BaseModel, ValidationError
from typing import List, Optional, Dict
from threading import Lock
from datetime import datetime
import sys
import os
import importlib.util
import math

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

# Importar course_storage desde el directorio padre
course_storage_path = os.path.join(parent_dir, "course_storage.py")
spec_course = importlib.util.spec_from_file_location("course_storage", course_storage_path)
course_storage = importlib.util.module_from_spec(spec_course)
spec_course.loader.exec_module(course_storage)
print("✅ Módulo course_storage cargado correctamente")

# Importar wallet_storage desde el directorio padre
wallet_storage_path = os.path.join(parent_dir, "wallet_storage.py")
spec_wallet = importlib.util.spec_from_file_location("wallet_storage", wallet_storage_path)
wallet_storage = importlib.util.module_from_spec(spec_wallet)
spec_wallet.loader.exec_module(wallet_storage)
print("✅ Módulo wallet_storage cargado correctamente")

# Importar redeem_codes_storage
redeem_codes_storage_path = os.path.join(parent_dir, "redeem_codes_storage.py")
spec_redeem = importlib.util.spec_from_file_location("redeem_codes_storage", redeem_codes_storage_path)
redeem_codes_storage = importlib.util.module_from_spec(spec_redeem)
spec_redeem.loader.exec_module(redeem_codes_storage)
print("✅ Módulo redeem_codes_storage cargado correctamente")

# Importar flashcard_storage desde el directorio padre
flashcard_storage_path = os.path.join(parent_dir, "flashcard_storage.py")
spec_flashcard = importlib.util.spec_from_file_location("flashcard_storage", flashcard_storage_path)
flashcard_storage = importlib.util.module_from_spec(spec_flashcard)
spec_flashcard.loader.exec_module(flashcard_storage)
print("✅ Módulo flashcard_storage cargado correctamente")

# Importar gemini_summary_generator
gemini_summary_path = os.path.join(parent_dir, "gemini_summary_generator.py")
spec_gemini = importlib.util.spec_from_file_location("gemini_summary_generator", gemini_summary_path)
gemini_summary_generator = importlib.util.module_from_spec(spec_gemini)
spec_gemini.loader.exec_module(gemini_summary_generator)
print("✅ Módulo gemini_summary_generator cargado correctamente")

# Importar game_storage desde el directorio padre
game_storage_path = os.path.join(parent_dir, "game_storage.py")
spec_game = importlib.util.spec_from_file_location("game_storage", game_storage_path)
game_storage = importlib.util.module_from_spec(spec_game)
spec_game.loader.exec_module(game_storage)
print("✅ Módulo game_storage cargado correctamente")

# Importar course_guide_agent
course_guide_path = os.path.join(parent_dir, "agents", "course_guide_agent.py")
spec_guide = importlib.util.spec_from_file_location("course_guide_agent", course_guide_path)
course_guide_agent = importlib.util.module_from_spec(spec_guide)
spec_guide.loader.exec_module(course_guide_agent)
CourseGuideAgent = course_guide_agent.CourseGuideAgent
print("✅ Módulo course_guide_agent cargado correctamente")

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

# Cargar variables de entorno ANTES de cargar main.py
# Esto asegura que las variables estén disponibles cuando se inicialicen los agentes
from dotenv import load_dotenv
import os

# Buscar .env.local en la raíz del proyecto (un nivel arriba de study_agents)
api_dir = os.path.dirname(os.path.abspath(__file__))
study_agents_dir = os.path.dirname(api_dir)
project_root = os.path.dirname(study_agents_dir)

# 1. Prioridad: .env.local en la raíz del proyecto
env_local_path = os.path.join(project_root, '.env.local')
if os.path.exists(env_local_path):
    load_dotenv(env_local_path, override=True)
    print(f"✅ [API] Cargado .env.local desde: {env_local_path}")

# 2. También intentar .env en la raíz del proyecto
env_root_path = os.path.join(project_root, '.env')
if os.path.exists(env_root_path):
    load_dotenv(env_root_path, override=True)
    print(f"✅ [API] Cargado .env desde: {env_root_path}")

# 3. También intentar .env en study_agents
env_path = os.path.join(study_agents_dir, '.env')
if os.path.exists(env_path):
    load_dotenv(env_path, override=True)
    print(f"✅ [API] Cargado .env desde: {env_path}")

# 4. Cargar desde directorio actual (última opción)
load_dotenv()

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


def preload_game_questions(game_id: str, course_id: str, topic_filter: Optional[str], creator_id: str):
    """
    Pre-carga preguntas del curso para una partida
    Se ejecuta en segundo plano para no bloquear la creación de la partida
    """
    try:
        print(f"[Preload Questions] Iniciando pre-carga de preguntas para partida {game_id}")
        
        # Obtener el curso
        course = course_storage.get_course(course_id)
        if not course:
            print(f"[Preload Questions] ❌ Curso {course_id} no encontrado")
            return
        
        # Obtener sistema para generar preguntas
        api_key = os.getenv("OPENAI_API_KEY")
        system = get_or_create_system(api_key, mode="auto")
        
        # Cargar PDFs del curso
        pdf_paths = []
        for topic in course.get("topics", []):
            # Si hay topic_filter, priorizar ese tema
            if topic_filter and topic.get("name") != topic_filter:
                continue
            for pdf_url in topic.get("pdfs", []):
                if pdf_url.startswith("http://localhost:8000/api/files/") or pdf_url.startswith("http://127.0.0.1:8000/api/files/"):
                    filename = pdf_url.split("/api/files/")[-1]
                    pdf_path = os.path.join(UPLOAD_DIR, filename)
                    if os.path.exists(pdf_path) and pdf_path not in pdf_paths:
                        pdf_paths.append(pdf_path)
                elif pdf_url.startswith("/api/files/"):
                    filename = pdf_url.replace("/api/files/", "")
                    pdf_path = os.path.join(UPLOAD_DIR, filename)
                    if os.path.exists(pdf_path) and pdf_path not in pdf_paths:
                        pdf_paths.append(pdf_path)
        
        if not pdf_paths:
            print(f"[Preload Questions] ⚠️ No se encontraron PDFs para el curso {course_id}")
            return
        
        # Cargar documentos al sistema
        print(f"[Preload Questions] Cargando {len(pdf_paths)} PDFs")
        system.upload_documents(pdf_paths)
        
        # Generar banco de preguntas (50 preguntas para tener suficiente)
        topics_to_use = [topic_filter] if topic_filter else None
        print(f"[Preload Questions] Generando 50 preguntas del curso...")
        test_data, usage_info = system.generate_test(
            difficulty="medium",
            num_questions=50,
            topics=topics_to_use,
            model=None  # modo auto
        )
        
        # Deducir créditos del creador
        if usage_info:
            input_tokens = usage_info.get("inputTokens", 0)
            output_tokens = usage_info.get("outputTokens", 0)
            model_used = "gpt-3.5-turbo"
            if hasattr(system, 'test_generator') and hasattr(system.test_generator, 'current_model_config'):
                if system.test_generator.current_model_config:
                    model_used = system.test_generator.current_model_config.name
            
            if creator_id and (input_tokens > 0 or output_tokens > 0):
                save_user_cost(creator_id, input_tokens, output_tokens, model_used, system)
        
        # Extraer preguntas del test
        preloaded_questions = []
        if test_data.get("test") and test_data["test"].get("questions"):
            for q in test_data["test"]["questions"]:
                preloaded_questions.append({
                    "question": q.get("question", ""),
                    "options": q.get("options", []),
                    "correct_answer_index": q.get("correct_answer", 0) if isinstance(q.get("correct_answer"), int) else 0,
                    "explanation": q.get("explanation", "")
                })
        
        # Guardar preguntas en la partida
        game = game_storage.load_game(game_id)
        if game:
            game["preloaded_questions"] = preloaded_questions
            game["question_index"] = 0
            game_storage.save_game(game)
            print(f"[Preload Questions] ✅ {len(preloaded_questions)} preguntas pre-cargadas para partida {game_id}")
        else:
            print(f"[Preload Questions] ❌ No se pudo cargar la partida {game_id} para guardar preguntas")
            
    except Exception as e:
        print(f"[Preload Questions] ❌ Error pre-cargando preguntas: {str(e)}")
        import traceback
        traceback.print_exc()


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
    course_id: Optional[str] = None  # ID del curso si está en contexto de curso
    subtopic_name: Optional[str] = None  # Nombre del subtema/subapartado si está disponible


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
    user_id: Optional[str] = None
    course_id: Optional[str] = None  # ID del curso si está en contexto de curso
    topic: Optional[str] = None  # Tema del curso


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
    course_id: Optional[str] = None  # ID del curso si está en contexto de curso
    topic: Optional[str] = None  # Tema del curso


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


@app.get("/api/files/{filename:path}")
async def serve_file(filename: str):
    """
    Sirve archivos estáticos desde el directorio de documentos
    
    Args:
        filename: Nombre del archivo (puede incluir subdirectorios)
        
    Returns:
        Archivo solicitado
    """
    try:
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Verificar que el archivo existe y está dentro del directorio permitido
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Archivo no encontrado")
        
        # Verificar que no hay path traversal (seguridad)
        real_path = os.path.realpath(file_path)
        real_upload_dir = os.path.realpath(UPLOAD_DIR)
        if not real_path.startswith(real_upload_dir):
            raise HTTPException(status_code=403, detail="Acceso denegado")
        
        return FileResponse(file_path)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error sirviendo archivo {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload-documents")
async def upload_documents(
    files: List[UploadFile] = File(...),
    apiKey: Optional[str] = Form(None)
):
    """
    Sube documentos (PDFs o imágenes) al sistema.
    Si no se proporciona apiKey, se usará la del entorno (.env.local).
    
    Args:
        files: Lista de archivos PDF o imágenes a subir
        apiKey: API key de OpenAI del usuario (opcional, si no se proporciona usa la de .env.local)
        
    Returns:
        Información sobre el procesamiento
    """
    try:
        # Si no hay API key del frontend, usar la del entorno
        final_api_key = apiKey
        if not final_api_key:
            final_api_key = os.getenv("OPENAI_API_KEY")
            if not final_api_key:
                print("[FastAPI] ERROR: No hay API key ni en FormData ni en variables de entorno")
                raise HTTPException(
                    status_code=400, 
                    detail="API key requerida. Configúrala en .env.local o envíala como 'apiKey' en FormData."
                )
            print("[FastAPI] Usando API key del entorno (.env.local)")
        else:
            print(f"[FastAPI] API key recibida del frontend: {final_api_key[:10]}...")
        
        saved_paths = []
        
        # Guardar archivos
        for file in files:
            if not file.filename:
                raise HTTPException(status_code=400, detail="Nombre de archivo no válido")
            
            # Verificar que sea PDF o imagen
            is_pdf = file.filename.lower().endswith('.pdf')
            is_image = any(file.filename.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp'])
            
            if not is_pdf and not is_image:
                raise HTTPException(status_code=400, detail=f"El archivo {file.filename} debe ser un PDF o una imagen")
            
            file_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            # Guardar ruta relativa para acceso desde el frontend
            saved_paths.append(f"/api/files/{file.filename}")
        
        # Solo procesar documentos si son PDFs (las imágenes no se procesan con el sistema)
        pdf_paths = [path for path in saved_paths if path.lower().endswith('.pdf')]
        result = {"saved_paths": saved_paths}
        
        if pdf_paths:
            # Obtener sistema para esta API key (modo automático por defecto)
            system = get_or_create_system(final_api_key, mode="auto")
            # Procesar solo los PDFs
            pdf_result = system.upload_documents(pdf_paths)
            result.update(pdf_result)
        
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
        
        # Obtener información del curso si está disponible
        course_context = None
        exam_info = None
        if request.course_id:
            try:
                course = course_storage.get_course(request.course_id)
                if course:
                    enrollment = course_storage.get_user_enrollment(request.user_id, request.course_id)
                    course_context = {
                        "title": course.get("title", ""),
                        "description": course.get("description", ""),
                        "topics": [t.get("name", "") for t in course.get("topics", [])],
                        "subtopics": {}
                    }
                    # Añadir subtopics
                    for topic in course.get("topics", []):
                        topic_name = topic.get("name", "")
                        if topic_name:
                            course_context["subtopics"][topic_name] = [
                                st.get("name", "") for st in topic.get("subtopics", [])
                            ]
                    
                    # Información del examen si está disponible
                    if enrollment and enrollment.get("exam_date"):
                        from datetime import datetime
                        exam_date_str = enrollment.get("exam_date")
                        try:
                            exam_date = datetime.fromisoformat(exam_date_str.replace('Z', '+00:00'))
                            today = datetime.now(exam_date.tzinfo) if exam_date.tzinfo else datetime.now()
                            days_until_exam = (exam_date - today).days
                            exam_info = {
                                "exam_date": exam_date_str,
                                "days_until_exam": days_until_exam
                            }
                        except:
                            pass
            except Exception as e:
                print(f"⚠️ Error obteniendo contexto del curso: {e}")
        
        # Responder pregunta (model=None usa modo automático)
        answer, usage_info = system.ask_question(
            request.question, 
            request.user_id, 
            model=request.model if request.model else None,
            chat_id=request.chat_id,
            topic=chat_topic or request.subtopic_name,
            initial_form_data=initial_form,
            course_context=course_context,
            exam_info=exam_info
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
        
        # Si está en contexto de curso, añadir XP y actualizar progreso
        xp_gained = 0
        if request.course_id and request.user_id:
            try:
                # Calcular XP basado en el score del test
                # El feedback contiene el score_percentage
                import json
                if isinstance(feedback, str):
                    # Intentar parsear JSON del feedback
                    try:
                        feedback_data = json.loads(feedback)
                        score_percentage = feedback_data.get("score_percentage", 0)
                    except:
                        # Si no es JSON, buscar porcentaje en el texto
                        import re
                        score_match = re.search(r'(\d+(?:\.\d+)?)%', feedback)
                        score_percentage = float(score_match.group(1)) if score_match else 50
                else:
                    score_percentage = feedback.get("score_percentage", 50) if isinstance(feedback, dict) else 50
                
                # XP = porcentaje de aciertos * 10 (máximo 50 XP por test)
                xp_gained = int((score_percentage / 100) * 50)
                
                # Añadir XP
                course_storage.add_xp(request.user_id, request.course_id, xp_gained)
                
                # Actualizar progreso del tema si se proporcionó
                if request.topic:
                    # Aumentar progreso basado en el score
                    # 100% = +20%, 70% = +10%, etc.
                    progress_increase = (score_percentage / 100) * 20
                    enrollment = course_storage.get_user_enrollment(request.user_id, request.course_id)
                    if enrollment:
                        current_progress = enrollment.get("topic_progress", {}).get(request.topic, 0)
                        new_progress = min(100, current_progress + progress_increase)
                        course_storage.update_topic_progress(request.user_id, request.course_id, request.topic, new_progress)
                
                print(f"[FastAPI] XP añadido: {xp_gained} XP, progreso actualizado para tema: {request.topic}")
            except Exception as e:
                print(f"[FastAPI] Error añadiendo XP/progreso: {e}")
                import traceback
                traceback.print_exc()
        
        return {
            "success": True,
            "feedback": feedback,
            "inputTokens": input_tokens,
            "outputTokens": output_tokens,
            "xp_gained": xp_gained if request.course_id else None
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
        # Asegurar que student_answer sea un string
        # IMPORTANTE: Verificar si es lista ANTES de convertir a string
        if isinstance(request.student_answer, list):
            # Si es una lista, unir los elementos
            student_answer_text = "\n".join(str(item) for item in request.student_answer)
        else:
            # Si no es lista, convertir a string
            student_answer_text = str(request.student_answer) if request.student_answer else ""
        
        # Asegurar que student_answer_text sea definitivamente un string
        if not isinstance(student_answer_text, str):
            student_answer_text = str(student_answer_text) if student_answer_text else ""
        
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
            
            # Asegurar que student_answer_text sea un string antes de usar re.findall
            if not isinstance(student_answer_text, str):
                student_answer_text = str(student_answer_text) if student_answer_text else ""
            
            code_pattern = r'```(?:\w+)?\n?(.*?)```|```(.*?)```'
            code_matches = re.findall(code_pattern, student_answer_text, re.DOTALL)
            
            # Si no hay bloques de código, usar toda la respuesta como código
            student_code = student_answer_text.strip() if isinstance(student_answer_text, str) else ""
            if code_matches:
                # Usar el primer bloque de código encontrado
                student_code = code_matches[0][0] if code_matches[0][0] else code_matches[0][1]
                student_code = student_code.strip()
            
            print(f"[FastAPI] Extracted code (first 200 chars): {student_code[:200]}")
            
            # Obtener la respuesta esperada del ejercicio
            expected_answer_full = exercise.get("expected_answer", "")
            if not isinstance(expected_answer_full, str):
                expected_answer_full = str(expected_answer_full) if expected_answer_full else ""
            
            solution_steps = exercise.get("solution_steps", "")
            if not isinstance(solution_steps, str):
                if isinstance(solution_steps, list):
                    solution_steps = "\n".join(str(step) for step in solution_steps)
                else:
                    solution_steps = str(solution_steps) if solution_steps else ""
            
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
        xp_gained = 0
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
                
                # Si está en contexto de curso, añadir XP y actualizar progreso del tema
                if request.course_id:
                    try:
                        # Calcular XP basado en el score
                        score_percentage = (score / max_score) * 100 if max_score > 0 else 0
                        xp_gained = int((score_percentage / 100) * 30)  # Máximo 30 XP por ejercicio
                        
                        # Añadir XP
                        course_storage.add_xp(request.user_id, request.course_id, xp_gained)
                        
                        # Actualizar progreso del tema del curso
                        course_topic = request.topic or main_topic
                        if course_topic:
                            enrollment = course_storage.get_user_enrollment(request.user_id, request.course_id)
                            if enrollment:
                                current_progress = enrollment.get("topic_progress", {}).get(course_topic, 0)
                                progress_increase = (score_percentage / 100) * 15  # Máximo +15% por ejercicio
                                new_progress = min(100, current_progress + progress_increase)
                                course_storage.update_topic_progress(request.user_id, request.course_id, course_topic, new_progress)
                        
                        print(f"[FastAPI] XP añadido: {xp_gained} XP, progreso actualizado para tema: {course_topic}")
                    except Exception as e:
                        print(f"[FastAPI] Error añadiendo XP/progreso: {e}")
                        import traceback
                        traceback.print_exc()
        
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
            "outputTokens": output_tokens,
            "xp_gained": xp_gained if request.course_id else None
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


# Modelos para Cursos/Exámenes
class CreateCourseRequest(BaseModel):
    """Modelo para crear un curso/examen"""
    creator_id: str
    title: str
    description: str
    price: float  # 0, 2, 5, 10, 20, 50
    max_duration_days: Optional[int] = None  # Duración máxima del curso en días
    cover_image: Optional[str] = None  # Ruta a la imagen de portada
    is_exam: bool = False  # True si es examen, False si es curso
    topics: List[Dict]  # [{"name": str, "pdfs": List[str], "subtopics": List[Dict]}]
    exam_examples: List[str]  # Lista de rutas a PDFs
    available_tools: Dict[str, bool]  # {"flashcards": True, "code_interpreter": True, etc.}
    flashcard_questions: Optional[List[Dict]] = None
    generate_summaries: bool = False  # Si True, genera resúmenes al crear el curso
    additional_comments: Optional[str] = None  # Comentarios adicionales para la IA antes de generar resúmenes
    gemini_api_key: Optional[str] = None  # API key de Google Gemini para generar resúmenes
    gemini_model: str = "gemini-3-pro"  # Modelo de Gemini a usar: gemini-3-pro, gemini-3-flash, gemini-2.5-pro, etc.


class EnrollCourseRequest(BaseModel):
    """Modelo para inscribirse en un curso"""
    user_id: str
    course_id: str
    exam_date: Optional[str] = None  # Fecha del examen (ISO format, opcional, solo para exámenes)
    apiKey: Optional[str] = None  # API key opcional para generar resúmenes automáticamente


class GetWalletRequest(BaseModel):
    """Modelo para obtener wallet de usuario"""
    user_id: str


class CreateStripeCheckoutRequest(BaseModel):
    """Modelo para crear sesión de pago Stripe"""
    user_id: str
    amount: float


class VerifyStripePaymentRequest(BaseModel):
    """Modelo para verificar un pago de Stripe"""
    user_id: str
    session_id: str  # Cantidad en euros (10, 20, 50, etc.)


class GetCreatorEarningsRequest(BaseModel):
    """Modelo para obtener ingresos de creador"""
    creator_id: str


class RequestWithdrawalRequest(BaseModel):
    """Modelo para solicitar retiro de fondos"""
    creator_id: str
    amount: float


class AdminStatsRequest(BaseModel):
    """Modelo para obtener estadísticas de admin"""
    admin_user_id: str  # Para verificar que es admin


class AdminUsersRequest(BaseModel):
    """Modelo para obtener lista de usuarios para admin"""
    admin_user_id: str  # Para verificar que es admin


class CreateRedeemCodeRequest(BaseModel):
    """Modelo para crear un código canjeable"""
    admin_user_id: str
    amount: float
    max_uses: Optional[int] = None
    expires_at: Optional[str] = None
    description: Optional[str] = None
    code: Optional[str] = None


class RedeemCodeRequest(BaseModel):
    """Modelo para canjear un código"""
    user_id: str
    code: str


class ListRedeemCodesRequest(BaseModel):
    """Modelo para listar códigos canjeables"""
    admin_user_id: str


class GetCourseRequest(BaseModel):
    """Modelo para obtener un curso"""
    course_id: str


class GetEnrollmentRequest(BaseModel):
    """Modelo para obtener inscripción de usuario"""
    user_id: str
    course_id: str


class ListCoursesRequest(BaseModel):
    """Modelo para listar cursos"""
    creator_id: Optional[str] = None
    active_only: bool = True


class GetUserEnrollmentsRequest(BaseModel):
    """Modelo para obtener cursos de un usuario"""
    user_id: str


class UpdateEnrollmentRequest(BaseModel):
    """Modelo para actualizar inscripción"""
    user_id: str
    course_id: str
    updates: Dict


class AddXPRequest(BaseModel):
    """Modelo para añadir XP"""
    user_id: str
    course_id: str
    xp_amount: int


class UpdateTopicProgressRequest(BaseModel):
    """Modelo para actualizar progreso de tema"""
    user_id: str
    course_id: str
    topic_name: str
    percentage: float


class UseCreditsRequest(BaseModel):
    """Modelo para usar créditos"""
    user_id: str
    course_id: str
    amount: int


class GetCourseRankingRequest(BaseModel):
    """Modelo para obtener ranking de curso"""
    course_id: str
    limit: int = 10


class SubmitSatisfactionRequest(BaseModel):
    """Modelo para enviar feedback de satisfacción"""
    user_id: str
    course_id: str
    rating: int  # 1-5


class CourseGuideRequest(BaseModel):
    """Modelo para el agente guía de cursos"""
    user_id: str
    course_id: str
    question: Optional[str] = None
    apiKey: Optional[str] = None
    model: Optional[str] = None
    user_level: Optional[int] = None  # Nivel del usuario (1-10)


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


# ==================== ENDPOINT DE PROGRESO DE RESUMENES ====================

@app.get("/api/summary-progress/{course_id}")
async def get_summary_progress(course_id: str):
    """Obtiene el progreso de generación de resúmenes de un curso"""
    try:
        progress = gemini_summary_generator.get_progress(course_id)
        if not progress:
            return {
                "status": "not_found",
                "message": "No hay progreso disponible para este curso"
            }
        return progress
    except Exception as e:
        print(f"Error obteniendo progreso: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ENDPOINTS DE CURSOS/EXÁMENES ====================

@app.post("/api/create-course")
async def create_course_endpoint(request: CreateCourseRequest, background_tasks: BackgroundTasks):
    """Crea un nuevo curso/examen"""
    try:
        # Calcular estimación de costos si se van a generar resúmenes
        cost_estimate = None
        if request.generate_summaries:
            # Usar API key del request o de variables de entorno
            gemini_api_key = request.gemini_api_key or os.getenv("GEMINI_API_KEY")
            if not gemini_api_key:
                raise HTTPException(
                    status_code=400,
                    detail="Se requiere gemini_api_key (en el request o en GEMINI_API_KEY del .env) para generar resúmenes"
                )
            
            # Contar apartados y subapartados
            num_topics = len(request.topics)
            num_subtopics = sum(len(topic.get("subtopics", [])) for topic in request.topics)
            
            cost_estimate = gemini_summary_generator.estimate_gemini_cost(
                num_topics=num_topics,
                num_subtopics=num_subtopics,
                model=request.gemini_model
            )
            
            # Verificar créditos del usuario (usar wallet)
            wallet = wallet_storage.get_user_wallet(request.creator_id)
            required_euros = cost_estimate["estimated_cost_eur"]
            
            # Solo validar si el costo es mayor a 0.01€ (para evitar problemas con comparaciones de floats)
            # Si el costo es 0 o muy pequeño, significa que no hay apartados/subapartados con PDFs
            # Usar abs() para manejar posibles problemas de precisión de punto flotante
            if abs(required_euros) > 0.01 and wallet["balance"] < required_euros:
                raise HTTPException(
                    status_code=402,
                    detail=f"Créditos insuficientes. Necesitas {cost_estimate['estimated_cost_eur']:.2f}€ para generar los resúmenes. Tu saldo: {wallet['balance']:.2f}€"
                )
        
        # Crear el curso
        course = course_storage.create_course(
            creator_id=request.creator_id,
            title=request.title,
            description=request.description,
            price=request.price,
            max_duration_days=request.max_duration_days,
            cover_image=request.cover_image,
            is_exam=request.is_exam,
            topics=request.topics,
            exam_examples=request.exam_examples,
            available_tools=request.available_tools,
            flashcard_questions=request.flashcard_questions
        )
        
        # Inscribir automáticamente al creador en su propio curso (sin costo)
        try:
            course_storage.enroll_user(
                user_id=request.creator_id,
                course_id=course["course_id"],
                exam_date=None,
                skip_payment=True  # Los creadores no pagan por sus propios cursos
            )
            print(f"✅ Creador {request.creator_id} inscrito automáticamente en su curso {course['course_id']}")
        except Exception as e:
            print(f"⚠️ Error inscribiendo al creador en su curso: {e}")
            import traceback
            traceback.print_exc()
            # No fallar si hay error, solo loguear
        
        # Si se solicitan resúmenes, generarlos en background
        if request.generate_summaries and gemini_api_key:
            # Deducir créditos del wallet solo si el costo es mayor a 0.01€
            cost_eur = cost_estimate["estimated_cost_eur"]
            if cost_eur > 0.01:
                wallet_storage.deduct_from_wallet(
                    user_id=request.creator_id,
                    amount=cost_eur,
                    transaction_type="summary_generation",
                    metadata={
                        "course_id": course["course_id"],
                        "course_title": request.title,
                        "estimated_cost": cost_estimate
                    }
                )
                print(f"✅ Deducción de {cost_eur:.2f}€ de la wallet del usuario {request.creator_id} para generación de resúmenes.")
            else:
                print(f"ℹ️ Costo de generación es {cost_eur:.2f}€ (sin apartados/subapartados con PDFs), no se deducen créditos.")
            
            # Generar resúmenes en background
            # Usar exam_examples del curso como contexto para priorizar contenido
            background_tasks.add_task(
                generate_course_summaries_background,
                gemini_api_key=gemini_api_key,
                course_id=course["course_id"],
                course_title=request.title,
                course_description=request.description,
                topics=request.topics,
                additional_comments=request.additional_comments,
                model=request.gemini_model,
                exam_examples_pdfs=request.exam_examples  # Usar los exam_examples del curso
            )
        
        response = {
            "success": True,
            "course": course,
            "generating_summaries": request.generate_summaries and gemini_api_key is not None
        }
        
        if cost_estimate:
            response["cost_estimate"] = cost_estimate
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error creando curso: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


async def generate_course_summaries_background(
    gemini_api_key: str,
    course_id: str,
    course_title: str,
    course_description: str,
    topics: List[Dict],
    additional_comments: Optional[str] = None,
    model: str = "gemini-3-pro",
    exam_examples_pdfs: Optional[List[str]] = None
):
    """
    Función en background para generar resúmenes del curso
    """
    try:
        print(f"\n🚀 Iniciando generación de resúmenes en background para curso {course_id}")
        
        # Generar todos los resúmenes
        summaries = gemini_summary_generator.generate_all_course_summaries(
            gemini_api_key=gemini_api_key,
            course_id=course_id,
            course_title=course_title,
            course_description=course_description,
            topics=topics,
            additional_comments=additional_comments,
            model=model,
            exam_examples_pdfs=exam_examples_pdfs
        )
        
        # Guardar resúmenes en el curso
        course = course_storage.get_course(course_id)
        if course:
            course["summaries"] = summaries
            course["summaries_generated_at"] = datetime.now().isoformat()
            
            # Actualizar el curso usando los métodos del módulo
            all_courses = course_storage.load_all_courses()
            all_courses[course_id] = course
            course_storage.save_all_courses(all_courses)
            
            print(f"✅ Resúmenes guardados en el curso {course_id}")
        else:
            print(f"⚠️ No se encontró el curso {course_id} para guardar resúmenes")
            
    except Exception as e:
        print(f"❌ Error generando resúmenes en background: {e}")
        import traceback
        traceback.print_exc()


@app.post("/api/get-course")
async def get_course_endpoint(request: GetCourseRequest):
    """Obtiene un curso por ID"""
    try:
        course = course_storage.get_course(request.course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Curso no encontrado")
        return {
            "success": True,
            "course": course
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error obteniendo curso: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/list-courses")
async def list_courses_endpoint(request: ListCoursesRequest):
    """Lista todos los cursos"""
    try:
        courses = course_storage.list_courses(
            creator_id=request.creator_id,
            active_only=request.active_only
        )
        return {
            "success": True,
            "courses": courses
        }
    except Exception as e:
        print(f"[FastAPI] Error listando cursos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/enroll-course")
async def enroll_course_endpoint(request: EnrollCourseRequest):
    """Inscribe un usuario en un curso"""
    try:
        enrollment = course_storage.enroll_user(
            user_id=request.user_id,
            course_id=request.course_id,
            exam_date=request.exam_date,
            skip_payment=False  # Verificar wallet y procesar pago
        )
        
        # Intentar generar resúmenes automáticamente si hay API key
        # Esto se hace en background para no bloquear la respuesta
        if hasattr(request, 'apiKey') and request.apiKey:
            import asyncio
            # Ejecutar en background sin esperar
            asyncio.create_task(generate_all_course_summaries(
                user_id=request.user_id,
                course_id=request.course_id,
                api_key=request.apiKey
            ))
        
        return {
            "success": True,
            "enrollment": enrollment
        }
    except ValueError as e:
        # Si es error de saldo insuficiente, devolver 402 (Payment Required)
        if "Saldo insuficiente" in str(e):
            raise HTTPException(status_code=402, detail=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"[FastAPI] Error inscribiendo usuario: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


async def generate_all_course_summaries(user_id: str, course_id: str, api_key: str):
    """Genera resúmenes automáticamente para todos los temas y subtemas de un curso"""
    try:
        print(f"[FastAPI] Iniciando generación automática de resúmenes para curso {course_id}")
        
        # Obtener curso
        course = course_storage.get_course(course_id)
        if not course:
            print(f"[FastAPI] Curso {course_id} no encontrado")
            return
        
        # Obtener sistema
        system = get_or_create_system(api_key, mode="auto")
        
        # Obtener información del examen si está disponible
        exam_info = None
        enrollment = course_storage.get_user_enrollment(user_id, course_id)
        if enrollment and enrollment.get("exam_date"):
            from datetime import datetime
            exam_date_str = enrollment.get("exam_date")
            try:
                exam_date = datetime.fromisoformat(exam_date_str.replace('Z', '+00:00'))
                today = datetime.now(exam_date.tzinfo) if exam_date.tzinfo else datetime.now()
                days_until_exam = (exam_date - today).days
                exam_info = {
                    "exam_date": exam_date_str,
                    "days_until_exam": days_until_exam
                }
            except:
                pass
        
        # Construir contexto del curso
        course_context = {
            "title": course.get("title", ""),
            "description": course.get("description", ""),
            "topics": [t.get("name", "") for t in course.get("topics", [])],
            "subtopics": {}
        }
        # Añadir subtopics
        for t in course.get("topics", []):
            t_name = t.get("name", "")
            if t_name:
                course_context["subtopics"][t_name] = [
                    st.get("name", "") for st in t.get("subtopics", [])
                ]
        
        # Generar resúmenes para cada tema
        for topic in course.get("topics", []):
            topic_name = topic.get("name", "")
            if not topic_name:
                continue
            
            try:
                print(f"[FastAPI] Generando resumen para tema: {topic_name}")
                
                # Obtener PDFs del tema principal (sin subtopics)
                topic_pdf_paths = []
                for pdf_url in topic.get("pdfs", []):
                    pdf_path = convert_pdf_url_to_path(pdf_url)
                    if pdf_path and os.path.exists(pdf_path):
                        topic_pdf_paths.append(pdf_path)
                
                # Generar resumen para el tema principal si tiene PDFs
                if topic_pdf_paths:
                    system.upload_documents(topic_pdf_paths)
                    notes = system.generate_notes(
                        topics=[topic_name],
                        model=None,  # modo auto
                        user_id=user_id,
                        conversation_history=None,
                        topic=topic_name,
                        user_level=None,
                        chat_id=None,
                        exam_info=exam_info,
                        course_context=course_context
                    )
                    
                    # Guardar en la inscripción
                    enrollment = course_storage.get_user_enrollment(user_id, course_id)
                    if enrollment:
                        current_notes = enrollment.get("generated_notes", {})
                        if topic_name not in current_notes or not current_notes[topic_name]:
                            current_notes[topic_name] = notes
                            course_storage.update_enrollment(
                                user_id=user_id,
                                course_id=course_id,
                                updates={"generated_notes": current_notes}
                            )
                            print(f"[FastAPI] ✅ Resumen generado y guardado para tema: {topic_name}")
                
                # Generar resúmenes para cada subtopic
                for subtopic in topic.get("subtopics", []):
                    subtopic_name = subtopic.get("name", "")
                    if not subtopic_name:
                        continue
                    
                    try:
                        print(f"[FastAPI] Generando resumen para subtopic: {subtopic_name}")
                        
                        # Obtener PDFs del subtopic
                        subtopic_pdf_paths = []
                        for pdf_url in subtopic.get("pdfs", []):
                            pdf_path = convert_pdf_url_to_path(pdf_url)
                            if pdf_path and os.path.exists(pdf_path):
                                subtopic_pdf_paths.append(pdf_path)
                        
                        if not subtopic_pdf_paths:
                            print(f"[FastAPI] No hay PDFs para el subtopic {subtopic_name}, saltando...")
                            continue
                        
                        # Procesar documentos del subtopic
                        system.upload_documents(subtopic_pdf_paths)
                        
                        # Generar resumen para el subtopic (usar mismo exam_info y course_context)
                        subtopic_notes = system.generate_notes(
                            topics=[subtopic_name],
                            model=None,  # modo auto
                            user_id=user_id,
                            conversation_history=None,
                            topic=subtopic_name,
                            user_level=None,
                            chat_id=None,
                            exam_info=exam_info,
                            course_context=course_context
                        )
                        
                        # Guardar en la inscripción con el nombre del subtopic
                        enrollment = course_storage.get_user_enrollment(user_id, course_id)
                        if enrollment:
                            current_notes = enrollment.get("generated_notes", {})
                            # Usar el nombre del subtopic como clave
                            if subtopic_name not in current_notes or not current_notes[subtopic_name]:
                                current_notes[subtopic_name] = subtopic_notes
                                course_storage.update_enrollment(
                                    user_id=user_id,
                                    course_id=course_id,
                                    updates={"generated_notes": current_notes}
                                )
                                print(f"[FastAPI] ✅ Resumen generado y guardado para subtopic: {subtopic_name}")
                    
                    except Exception as e:
                        print(f"[FastAPI] Error generando resumen para subtopic {subtopic_name}: {str(e)}")
                        import traceback
                        traceback.print_exc()
                        continue
                
            except Exception as e:
                print(f"[FastAPI] Error generando resumen para tema {topic_name}: {str(e)}")
                import traceback
                traceback.print_exc()
                continue
        
        print(f"[FastAPI] ✅ Generación automática de resúmenes completada para curso {course_id}")
        
    except Exception as e:
        print(f"[FastAPI] Error en generación automática de resúmenes: {str(e)}")
        import traceback
        traceback.print_exc()


def convert_pdf_url_to_path(pdf_url: str) -> Optional[str]:
    """Convierte una URL de PDF a ruta local"""
    if not pdf_url:
        return None
    
    # URLs del servidor local
    if pdf_url.startswith("http://localhost:8000/api/files/") or pdf_url.startswith("http://127.0.0.1:8000/api/files/"):
        filename = pdf_url.split("/api/files/")[-1]
        pdf_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(pdf_path):
            return pdf_path
    elif pdf_url.startswith("/api/files/"):
        filename = pdf_url.replace("/api/files/", "")
        pdf_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(pdf_path):
            return pdf_path
    elif os.path.exists(pdf_url):
        # Ruta absoluta o relativa que existe
        return pdf_url
    
    return None


@app.post("/api/get-user-enrollments")
async def get_user_enrollments_endpoint(request: GetUserEnrollmentsRequest):
    """Obtiene todos los cursos en los que está inscrito un usuario"""
    try:
        enrollments = course_storage.get_user_enrollments(request.user_id)
        return {
            "success": True,
            "enrollments": enrollments
        }
    except Exception as e:
        print(f"[FastAPI] Error obteniendo inscripciones: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/get-enrollment")
async def get_enrollment_endpoint(request: GetEnrollmentRequest):
    """Obtiene la inscripción de un usuario en un curso específico"""
    try:
        enrollment = course_storage.get_user_enrollment(
            user_id=request.user_id,
            course_id=request.course_id
        )
        if not enrollment:
            raise HTTPException(status_code=404, detail="Inscripción no encontrada")
        return {
            "success": True,
            "enrollment": enrollment
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error obteniendo inscripción: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/update-enrollment")
async def update_enrollment_endpoint(request: UpdateEnrollmentRequest):
    """Actualiza la inscripción de un usuario"""
    try:
        enrollment = course_storage.update_enrollment(
            user_id=request.user_id,
            course_id=request.course_id,
            updates=request.updates
        )
        if not enrollment:
            raise HTTPException(status_code=404, detail="Inscripción no encontrada")
        return {
            "success": True,
            "enrollment": enrollment
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error actualizando inscripción: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class UnenrollCourseRequest(BaseModel):
    """Modelo para desapuntarse de un curso"""
    user_id: str
    course_id: str


class GenerateCourseNotesRequest(BaseModel):
    """Modelo para generar apuntes de un curso"""
    user_id: str
    course_id: str
    apiKey: str
    notes_type: str = "topic"  # "topic" o "cumulative" o "final"
    topic_name: Optional[str] = None  # Requerido si notes_type es "topic"
    model: Optional[str] = None  # None = modo auto


@app.post("/api/unenroll-course")
async def unenroll_course_endpoint(request: UnenrollCourseRequest):
    """Desapunta un usuario de un curso"""
    try:
        success = course_storage.unenroll_user(
            user_id=request.user_id,
            course_id=request.course_id
        )
        if not success:
            raise HTTPException(status_code=404, detail="Usuario no inscrito en el curso")
        return {
            "success": True,
            "message": "Desapuntado correctamente del curso"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error desapuntando usuario: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== WALLET ENDPOINTS ====================

@app.post("/api/get-wallet")
async def get_wallet_endpoint(request: GetWalletRequest):
    """Obtiene el wallet de un usuario"""
    try:
        wallet = wallet_storage.get_user_wallet(request.user_id)
        return {
            "success": True,
            "wallet": wallet
        }
    except Exception as e:
        print(f"[FastAPI] Error obteniendo wallet: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/create-stripe-checkout")
async def create_stripe_checkout_endpoint(request: CreateStripeCheckoutRequest):
    """Crea una sesión de pago Stripe para recargar wallet"""
    try:
        import stripe
        
        # Obtener clave secreta de Stripe desde variables de entorno
        stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
        if not stripe_secret_key:
            raise HTTPException(status_code=500, detail="Stripe no configurado. Falta STRIPE_SECRET_KEY en las variables de entorno")
        
        stripe.api_key = stripe_secret_key
        
        # Validar cantidad (mínimo 10€)
        if request.amount < 10:
            raise HTTPException(status_code=400, detail="El mínimo de recarga es 10€")
        
        # Crear sesión de Checkout
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': f'Recarga de Wallet - {request.amount}€',
                        'description': 'Recarga tu wallet para comprar cursos',
                    },
                    'unit_amount': int(request.amount * 100),  # Stripe usa céntimos
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{os.getenv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')}/study-agents?wallet_success=true&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')}/study-agents?wallet_canceled=true",
            metadata={
                'user_id': request.user_id,
                'amount': str(request.amount),
                'type': 'wallet_recharge'
            },
            client_reference_id=request.user_id,
        )
        
        return {
            "success": True,
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error creando sesión Stripe: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/stripe-webhook")
async def stripe_webhook_endpoint(request: Request):
    """Webhook de Stripe para confirmar pagos"""
    try:
        import stripe
        
        # Obtener claves de Stripe desde variables de entorno
        stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
        stripe_webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        
        if not stripe_secret_key:
            raise HTTPException(status_code=500, detail="Stripe no configurado. Falta STRIPE_SECRET_KEY en las variables de entorno")
        
        if not stripe_webhook_secret:
            raise HTTPException(status_code=500, detail="Stripe no configurado. Falta STRIPE_WEBHOOK_SECRET en las variables de entorno")
        
        stripe.api_key = stripe_secret_key
        
        # Obtener el body como bytes (raw)
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        print(f"[Webhook] Recibido evento de Stripe. Payload size: {len(payload)} bytes")
        print(f"[Webhook] Signature header: {sig_header[:50] if sig_header else 'None'}...")
        
        if not sig_header:
            print("[Webhook] ERROR: Missing stripe-signature header")
            raise HTTPException(status_code=400, detail="Missing stripe-signature header")
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, stripe_webhook_secret
            )
            print(f"[Webhook] Evento verificado: {event.get('type')}")
        except ValueError as e:
            print(f"[Webhook] ERROR: Invalid payload - {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            print(f"[Webhook] ERROR: Invalid signature - {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Manejar evento de pago completado
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            print(f"[Webhook] Checkout session completado: {session.get('id')}")
            print(f"[Webhook] Metadata: {session.get('metadata', {})}")
            
            # Verificar que es una recarga de wallet
            metadata = session.get('metadata', {})
            if metadata.get('type') == 'wallet_recharge':
                user_id = metadata.get('user_id')
                amount_str = metadata.get('amount', '0')
                amount = float(amount_str)
                
                print(f"[Webhook] Procesando recarga: user_id={user_id}, amount={amount}€")
                
                if user_id and amount > 0:
                    # Añadir al wallet del usuario
                    try:
                        wallet = wallet_storage.add_to_wallet(
                            user_id=user_id,
                            amount=amount,
                            transaction_type="deposit",
                            metadata={
                                "stripe_session_id": session.get('id'),
                                "payment_intent": session.get('payment_intent')
                            }
                        )
                        print(f"✅ Wallet recargado exitosamente: {user_id} +{amount}€ (Nuevo saldo: {wallet['balance']}€)")
                    except Exception as e:
                        print(f"❌ ERROR al recargar wallet: {str(e)}")
                        import traceback
                        traceback.print_exc()
                        raise
                else:
                    print(f"⚠️ ADVERTENCIA: user_id o amount inválidos. user_id={user_id}, amount={amount}")
            else:
                print(f"⚠️ ADVERTENCIA: No es una recarga de wallet. Tipo: {metadata.get('type')}")
        else:
            print(f"[Webhook] Evento no manejado: {event['type']}")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error procesando webhook Stripe: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/verify-stripe-payment")
async def verify_stripe_payment_endpoint(request: VerifyStripePaymentRequest):
    """Verifica un pago de Stripe y actualiza el wallet si es necesario"""
    try:
        import stripe
        
        # Obtener clave secreta de Stripe
        stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
        if not stripe_secret_key:
            raise HTTPException(status_code=500, detail="Stripe no configurado")
        
        stripe.api_key = stripe_secret_key
        
        # Obtener la sesión de checkout
        try:
            session = stripe.checkout.Session.retrieve(request.session_id)
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=f"Error al recuperar sesión: {str(e)}")
        
        print(f"[Verify Payment] Sesión recuperada: {session.id}, Estado: {session.payment_status}")
        
        # Verificar que el pago fue exitoso
        if session.payment_status != 'paid':
            return {
                "success": False,
                "error": f"El pago no está completado. Estado: {session.payment_status}"
            }
        
        # Verificar que es una recarga de wallet
        metadata = session.get('metadata', {})
        if metadata.get('type') != 'wallet_recharge':
            return {
                "success": False,
                "error": "Esta sesión no es una recarga de wallet"
            }
        
        # Verificar que el user_id coincide
        if metadata.get('user_id') != request.user_id:
            return {
                "success": False,
                "error": "El usuario no coincide con la sesión"
            }
        
        # Obtener el monto
        amount = float(metadata.get('amount', 0))
        if amount <= 0:
            return {
                "success": False,
                "error": "Monto inválido"
            }
        
        # Verificar si ya se procesó esta sesión (evitar duplicados)
        wallet = wallet_storage.get_user_wallet(request.user_id)
        transactions = wallet.get('transactions', [])
        
        # Buscar si ya existe una transacción con este session_id
        already_processed = any(
            t.get('metadata', {}).get('stripe_session_id') == request.session_id
            for t in transactions
        )
        
        if already_processed:
            print(f"[Verify Payment] Pago ya procesado anteriormente: {request.session_id}")
            return {
                "success": True,
                "amount": amount,
                "message": "Pago ya procesado anteriormente",
                "wallet_balance": wallet['balance']
            }
        
        # Añadir al wallet
        wallet = wallet_storage.add_to_wallet(
            user_id=request.user_id,
            amount=amount,
            transaction_type="deposit",
            metadata={
                "stripe_session_id": session.id,
                "payment_intent": session.get('payment_intent'),
                "verified_via": "direct_check"  # Marcar que se verificó directamente
            }
        )
        
        print(f"✅ Wallet recargado via verificación directa: {request.user_id} +{amount}€ (Nuevo saldo: {wallet['balance']}€)")
        
        return {
            "success": True,
            "amount": amount,
            "wallet_balance": wallet['balance']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error verificando pago Stripe: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin-stats")
async def admin_stats_endpoint(request: AdminStatsRequest):
    """Obtiene estadísticas generales para el panel de admin"""
    try:
        # TODO: Verificar que el usuario es admin
        # Por ahora, permitimos a cualquiera (en producción deberías verificar)
        
        # Obtener todos los cursos
        all_courses = course_storage.load_all_courses()
        total_courses = len(all_courses)
        
        # Contar inscripciones
        total_enrollments = 0
        active_users = set()
        enrollments_dir = course_storage.ENROLLMENTS_DIR
        if enrollments_dir.exists():
            for enrollment_file in enrollments_dir.glob("*.json"):
                try:
                    with open(enrollment_file, "r", encoding="utf-8") as f:
                        user_enrollments = json.load(f)
                        total_enrollments += len(user_enrollments)
                        for course_id in user_enrollments.keys():
                            # Obtener user_id del nombre del archivo
                            user_id = enrollment_file.stem
                            active_users.add(user_id)
                except:
                    pass
        
        # Calcular ingresos totales (sumar todos los wallets)
        total_revenue = 0.0
        wallets_dir = wallet_storage.WALLETS_DIR
        if wallets_dir.exists():
            for wallet_file in wallets_dir.glob("*.json"):
                try:
                    with open(wallet_file, "r", encoding="utf-8") as f:
                        wallet = json.load(f)
                        total_revenue += wallet.get("total_deposited", 0.0)
                except:
                    pass
        
        return {
            "success": True,
            "total_courses": total_courses,
            "total_enrollments": total_enrollments,
            "total_revenue": total_revenue,
            "active_users": len(active_users)
        }
    except Exception as e:
        print(f"[FastAPI] Error obteniendo estadísticas de admin: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin-payments")
async def admin_payments_endpoint(request: AdminStatsRequest):
    """Obtiene todos los pagos para el panel de admin"""
    try:
        # TODO: Verificar que el usuario es admin
        
        payments = []
        
        # Obtener todas las transacciones de wallets
        wallets_dir = Path("courses/wallets")
        if wallets_dir.exists():
            for wallet_file in wallets_dir.glob("*.json"):
                try:
                    with open(wallet_file, "r", encoding="utf-8") as f:
                        wallet = json.load(f)
                        user_id = wallet_file.stem  # Nombre del archivo sin extensión
                        transactions = wallet.get("transactions", [])
                        
                        for transaction in transactions:
                            if transaction.get("type") in ["deposit", "course_purchase"]:
                                payments.append({
                                    "user_id": user_id,
                                    "type": transaction.get("type"),
                                    "amount": abs(transaction.get("amount", 0)),
                                    "timestamp": transaction.get("timestamp"),
                                    "status": "completed",
                                    "metadata": transaction.get("metadata", {})
                                })
                except Exception as e:
                    print(f"Error leyendo wallet {wallet_file}: {e}")
                    pass
        
        # Ordenar por fecha (más recientes primero)
        payments.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return {
            "success": True,
            "payments": payments[:100]  # Limitar a 100 más recientes
        }
    except Exception as e:
        print(f"[FastAPI] Error obteniendo pagos de admin: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin-users")
async def admin_users_endpoint(request: AdminUsersRequest):
    """Obtiene la lista de usuarios para el panel de admin"""
    try:
        # TODO: Verificar que el usuario es admin
        
        users = []
        
        # Usar las rutas desde los módulos para asegurar que sean correctas
        enrollments_dir = course_storage.ENROLLMENTS_DIR
        wallets_dir = wallet_storage.WALLETS_DIR
        
        print(f"[Admin Users] Buscando usuarios en:")
        print(f"  - Enrollments: {enrollments_dir.absolute()}")
        print(f"  - Wallets: {wallets_dir.absolute()}")
        print(f"  - Enrollments existe: {enrollments_dir.exists()}")
        print(f"  - Wallets existe: {wallets_dir.exists()}")
        
        # Set para evitar duplicados
        user_ids = set()
        
        # Recopilar user_ids de enrollments
        if enrollments_dir.exists():
            enrollment_files = list(enrollments_dir.glob("*.json"))
            print(f"[Admin Users] Encontrados {len(enrollment_files)} archivos de enrollments")
            for enrollment_file in enrollment_files:
                user_id = enrollment_file.stem
                user_ids.add(user_id)
                print(f"  - Usuario encontrado en enrollments: {user_id}")
        else:
            print(f"[Admin Users] ⚠️ Directorio de enrollments no existe: {enrollments_dir.absolute()}")
        
        # Recopilar user_ids de wallets
        if wallets_dir.exists():
            wallet_files = list(wallets_dir.glob("*.json"))
            print(f"[Admin Users] Encontrados {len(wallet_files)} archivos de wallets")
            for wallet_file in wallet_files:
                user_id = wallet_file.stem
                user_ids.add(user_id)
                print(f"  - Usuario encontrado en wallets: {user_id}")
        else:
            print(f"[Admin Users] ⚠️ Directorio de wallets no existe: {wallets_dir.absolute()}")
        
        print(f"[Admin Users] Total de usuarios únicos encontrados: {len(user_ids)}")
        
        # Para cada usuario, obtener su información completa
        for user_id in user_ids:
            user_info = {
                "user_id": user_id,
                "wallet": None,
                "enrollments": [],
                "total_spent": 0.0,
                "total_deposited": 0.0,
                "active_courses": 0
            }
            
            # Obtener wallet usando la función del módulo
            try:
                wallet = wallet_storage.get_user_wallet(user_id)
                if wallet and wallet.get("balance") is not None:
                    user_info["wallet"] = {
                        "balance": wallet.get("balance", 0.0),
                        "total_deposited": wallet.get("total_deposited", 0.0),
                        "total_spent": wallet.get("total_spent", 0.0),
                        "transaction_count": len(wallet.get("transactions", []))
                    }
                    user_info["total_spent"] = wallet.get("total_spent", 0.0)
                    user_info["total_deposited"] = wallet.get("total_deposited", 0.0)
            except Exception as e:
                print(f"[Admin Users] Error obteniendo wallet de {user_id}: {e}")
            
            # Obtener enrollments usando la función del módulo
            try:
                enrollments_data = course_storage.get_user_enrollments(user_id)
                if enrollments_data:
                    user_info["enrollments"] = []
                    user_info["active_courses"] = len(enrollments_data)
                    
                    for enrollment_item in enrollments_data:
                        course = enrollment_item.get("course")
                        enrollment = enrollment_item.get("enrollment")
                        if course and enrollment:
                            user_info["enrollments"].append({
                                "course_id": course.get("course_id"),
                                "course_title": course.get("title", "N/A"),
                                "course_price": course.get("price", 0),
                                "enrolled_at": enrollment.get("enrolled_at"),
                                "credits_remaining": enrollment.get("credits_remaining", 0),
                                "xp": enrollment.get("xp", 0)
                            })
            except Exception as e:
                print(f"[Admin Users] Error obteniendo enrollments de {user_id}: {e}")
            
            users.append(user_info)
        
        # Ordenar por total depositado (mayor primero)
        users.sort(key=lambda x: x.get("total_deposited", 0), reverse=True)
        
        print(f"[Admin Users] Devolviendo {len(users)} usuarios")
        
        return {
            "success": True,
            "users": users
        }
    except Exception as e:
        print(f"[FastAPI] Error obteniendo usuarios de admin: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/update-streak-credits")
async def update_streak_credits_endpoint(request: GetEnrollmentRequest):
    """Actualiza la racha diaria y marca créditos como disponibles para reclamar"""
    try:
        result = course_storage.update_streak_and_credits(
            user_id=request.user_id,
            course_id=request.course_id
        )
        return {
            "success": True,
            "streak_days": result.get("streak_days", 0),
            "credits_available": result.get("credits_available", 0),
            "credits_remaining": result.get("credits_remaining", 0),
            "max_credits": result.get("max_credits", 0),
            "is_new_streak": result.get("is_new_streak", False),
            "streak_calendar": result.get("streak_calendar", {}),
            "pending_credits": result.get("pending_credits", 0),
            "today_claimed": result.get("today_claimed", False)
        }
    except Exception as e:
        print(f"[FastAPI] Error actualizando racha y créditos: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/claim-daily-credits")
async def claim_daily_credits_endpoint(request: GetEnrollmentRequest):
    """Reclama los créditos diarios disponibles"""
    try:
        print(f"[Claim Credits] Reclamando créditos para user {request.user_id}, course {request.course_id}")
        result = course_storage.claim_daily_credits(
            user_id=request.user_id,
            course_id=request.course_id
        )
        print(f"[Claim Credits] Resultado: {result}")
        if not result.get("success"):
            print(f"[Claim Credits] Error: {result.get('message')}")
            raise HTTPException(status_code=400, detail=result.get("message", "Error al reclamar créditos"))
        print(f"[Claim Credits] ✅ Créditos reclamados exitosamente: {result.get('credits_claimed')}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error reclamando créditos diarios: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/get-creator-earnings")
async def get_creator_earnings_endpoint(request: GetCreatorEarningsRequest):
    """Obtiene los ingresos de un creador"""
    try:
        earnings = wallet_storage.get_creator_earnings(request.creator_id)
        return {
            "success": True,
            "earnings": earnings
        }
    except Exception as e:
        print(f"[FastAPI] Error obteniendo ingresos de creador: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/request-withdrawal")
async def request_withdrawal_endpoint(request: RequestWithdrawalRequest):
    """Solicita retiro de fondos de un creador"""
    try:
        # Validar cantidad mínima
        if request.amount < 5:
            raise HTTPException(status_code=400, detail="El mínimo de retiro es 5€")
        
        # Obtener ingresos del creador
        earnings = wallet_storage.get_creator_earnings(request.creator_id)
        
        # Verificar que tiene suficiente disponible
        if request.amount > earnings["available_to_withdraw"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Fondos insuficientes. Disponible: {earnings['available_to_withdraw']:.2f}€"
            )
        
        # TODO: Aquí deberías procesar el retiro real (transferencia bancaria, etc.)
        # Por ahora, solo marcamos como retirado en el sistema
        
        # Actualizar ingresos (marcar como retirado)
        earnings["withdrawn"] = earnings.get("withdrawn", 0.0) + request.amount
        
        # Guardar
        earnings_file = wallet_storage.get_creator_earnings_file(request.creator_id)
        with open(earnings_file, "w", encoding="utf-8") as f:
            import json
            json.dump(earnings, f, ensure_ascii=False, indent=2)
        
        # TODO: Enviar email al creador confirmando el retiro
        # TODO: Procesar transferencia bancaria real
        
        return {
            "success": True,
            "message": f"Retiro de {request.amount}€ procesado. Se transferirá a {request.bank_account}",
            "earnings": wallet_storage.get_creator_earnings(request.creator_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error procesando retiro: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-course-notes")
async def generate_course_notes_endpoint(request: GenerateCourseNotesRequest):
    """Genera apuntes automáticamente para un tema de un curso"""
    try:
        if not request.apiKey:
            raise HTTPException(status_code=400, detail="API key requerida")
        
        # Obtener curso
        course = course_storage.get_course(request.course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Curso no encontrado")
        
        # Obtener inscripción
        enrollment = course_storage.get_user_enrollment(request.user_id, request.course_id)
        if not enrollment:
            raise HTTPException(status_code=404, detail="Usuario no inscrito en el curso")
        
        # Validar que se proporcione topic_name si es tipo "topic"
        if request.notes_type == "topic" and not request.topic_name:
            raise HTTPException(status_code=400, detail="topic_name requerido para tipo 'topic'")
        
        # Obtener sistema
        system = get_or_create_system(request.apiKey, mode="auto")
        
        # Obtener PDFs del tema (incluyendo subtopics)
        topic = None
        pdf_paths = []
        
        for t in course.get("topics", []):
            if t.get("name") == request.topic_name:
                topic = t
                # Añadir PDFs del tema principal
                for pdf_url in t.get("pdfs", []):
                    # Convertir URL a ruta local si es necesario
                    if pdf_url.startswith("http://localhost:8000/api/files/") or pdf_url.startswith("http://127.0.0.1:8000/api/files/"):
                        filename = pdf_url.split("/api/files/")[-1]
                        pdf_path = os.path.join(UPLOAD_DIR, filename)
                        if os.path.exists(pdf_path):
                            pdf_paths.append(pdf_path)
                    elif pdf_url.startswith("/api/files/"):
                        filename = pdf_url.replace("/api/files/", "")
                        pdf_path = os.path.join(UPLOAD_DIR, filename)
                        if os.path.exists(pdf_path):
                            pdf_paths.append(pdf_path)
                    else:
                        # Intentar como ruta absoluta
                        if os.path.exists(pdf_url):
                            pdf_paths.append(pdf_url)
                
                # Añadir PDFs de subtopics
                for subtopic in t.get("subtopics", []):
                    for pdf_url in subtopic.get("pdfs", []):
                        if pdf_url.startswith("http://localhost:8000/api/files/") or pdf_url.startswith("http://127.0.0.1:8000/api/files/"):
                            filename = pdf_url.split("/api/files/")[-1]
                            pdf_path = os.path.join(UPLOAD_DIR, filename)
                            if os.path.exists(pdf_path):
                                pdf_paths.append(pdf_path)
                        elif pdf_url.startswith("/api/files/"):
                            filename = pdf_url.replace("/api/files/", "")
                            pdf_path = os.path.join(UPLOAD_DIR, filename)
                            if os.path.exists(pdf_path):
                                pdf_paths.append(pdf_path)
                        else:
                            if os.path.exists(pdf_url):
                                pdf_paths.append(pdf_url)
                break
        
        if not topic:
            raise HTTPException(status_code=404, detail=f"Tema '{request.topic_name}' no encontrado en el curso")
        
        if not pdf_paths:
            raise HTTPException(status_code=400, detail=f"No hay PDFs disponibles para el tema '{request.topic_name}'")
        
        print(f"[FastAPI] Generando apuntes para tema '{request.topic_name}' con {len(pdf_paths)} PDFs")
        
        # Obtener información del examen si está disponible
        exam_info = None
        if enrollment and enrollment.get("exam_date"):
            from datetime import datetime
            exam_date_str = enrollment.get("exam_date")
            try:
                exam_date = datetime.fromisoformat(exam_date_str.replace('Z', '+00:00'))
                today = datetime.now(exam_date.tzinfo) if exam_date.tzinfo else datetime.now()
                days_until_exam = (exam_date - today).days
                exam_info = {
                    "exam_date": exam_date_str,
                    "days_until_exam": days_until_exam
                }
            except:
                pass
        
        # Construir contexto del curso
        course_context = {
            "title": course.get("title", ""),
            "description": course.get("description", ""),
            "topics": [t.get("name", "") for t in course.get("topics", [])],
            "subtopics": {}
        }
        # Añadir subtopics
        for t in course.get("topics", []):
            t_name = t.get("name", "")
            if t_name:
                course_context["subtopics"][t_name] = [
                    st.get("name", "") for st in t.get("subtopics", [])
                ]
        
        # Procesar documentos
        system.upload_documents(pdf_paths)
        
        # Generar apuntes orientados a preparación de examen
        notes = system.generate_notes(
            topics=[request.topic_name],
            model=request.model if request.model else None,  # modo auto si es None
            user_id=request.user_id,
            conversation_history=None,
            topic=request.topic_name,
            user_level=None,
            chat_id=None,
            exam_info=exam_info,
            course_context=course_context
        )
        
        # Log para debug: verificar formato del contenido
        print(f"[DEBUG] Contenido generado ({len(notes)} caracteres):")
        print(f"[DEBUG] Primeros 500 caracteres: {notes[:500]}")
        print(f"[DEBUG] ¿Comienza con '<' (HTML)? {notes.strip().startswith('<')}")
        print(f"[DEBUG] ¿Comienza con '#' (Markdown)? {notes.strip().startswith('#')}")
        print(f"[DEBUG] ¿Contiene tags HTML? {'<' in notes and '>' in notes}")
        
        # Obtener información de tokens y precio para debug
        try:
            # Intentar obtener tokens del explanation_agent
            input_tokens = 0
            output_tokens = 0
            model_used = request.model or "auto"
            cost = 0.0
            
            if hasattr(system, 'explanation_agent'):
                # Obtener modelo usado
                if hasattr(system.explanation_agent, 'current_model_config') and system.explanation_agent.current_model_config:
                    model_used = system.explanation_agent.current_model_config.name
                    # Estimar tokens (1 token ≈ 4 caracteres)
                    # Para input: estimar basándose en el tamaño de los PDFs procesados
                    input_tokens = sum(len(pdf) for pdf in pdf_paths if os.path.exists(pdf)) // 4 if pdf_paths else 0
                    output_tokens = len(notes) // 4
                    
                    # Calcular coste
                    if hasattr(system.explanation_agent, 'model_manager') and system.explanation_agent.model_manager:
                        cost = system.explanation_agent.model_manager.estimate_cost(model_used, input_tokens, output_tokens)
                    else:
                        # Fallback: usar ModelManager directamente
                        try:
                            from model_manager import ModelManager
                            temp_manager = ModelManager()
                            cost = temp_manager.estimate_cost(model_used, input_tokens, output_tokens)
                        except:
                            pass
                else:
                    # Estimar tokens si no hay información del modelo
                    input_tokens = sum(len(pdf) for pdf in pdf_paths if os.path.exists(pdf)) // 4 if pdf_paths else 0
                    output_tokens = len(notes) // 4
            
            # Logs de debug
            print(f"[DEBUG] Tokens usados - Input: {input_tokens}, Output: {output_tokens}, Total: {input_tokens + output_tokens}")
            print(f"[DEBUG] Modelo usado: {model_used}")
            print(f"[DEBUG] Precio estimado: ${cost:.6f} USD")
            # Redondear hacia arriba siempre (math.ceil)
            credits_estimated = math.ceil(cost * 10000)
            print(f"[DEBUG] Créditos estimados (1€ = 100 créditos): {credits_estimated} créditos")
            
            # Guardar coste en el sistema
            if cost > 0:
                save_user_cost(request.user_id, input_tokens, output_tokens, model_used, system)
        except Exception as e:
            print(f"[DEBUG] Error al calcular tokens/precio: {e}")
        
        # Guardar apuntes en la inscripción
        current_notes = enrollment.get("generated_notes", {})
        # Si no hay apuntes para este tema, guardar como string único
        # Si ya hay apuntes, mantener el formato existente
        if request.topic_name not in current_notes or not current_notes[request.topic_name]:
            current_notes[request.topic_name] = notes  # Guardar como string único la primera vez
        else:
            # Si ya hay apuntes, convertirlos a array si no lo son y añadir
            if isinstance(current_notes[request.topic_name], str):
                current_notes[request.topic_name] = [current_notes[request.topic_name], notes]
            elif isinstance(current_notes[request.topic_name], list):
                current_notes[request.topic_name].append(notes)
            else:
                current_notes[request.topic_name] = notes
        
        # Actualizar inscripción
        course_storage.update_enrollment(
            user_id=request.user_id,
            course_id=request.course_id,
            updates={"generated_notes": current_notes}
        )
        
        print(f"[FastAPI] Apuntes generados y guardados para tema '{request.topic_name}'")
        
        return {
            "success": True,
            "notes": notes,
            "topic_name": request.topic_name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error generando apuntes del curso: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/add-xp")
async def add_xp_endpoint(request: AddXPRequest):
    """Añade XP a un usuario en un curso"""
    try:
        enrollment = course_storage.add_xp(
            user_id=request.user_id,
            course_id=request.course_id,
            xp_amount=request.xp_amount
        )
        return {
            "success": True,
            "enrollment": enrollment
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"[FastAPI] Error añadiendo XP: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/update-topic-progress")
async def update_topic_progress_endpoint(request: UpdateTopicProgressRequest):
    """Actualiza el progreso de un tema"""
    try:
        enrollment = course_storage.update_topic_progress(
            user_id=request.user_id,
            course_id=request.course_id,
            topic_name=request.topic_name,
            percentage=request.percentage
        )
        return {
            "success": True,
            "enrollment": enrollment
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"[FastAPI] Error actualizando progreso: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/use-credits")
async def use_credits_endpoint(request: UseCreditsRequest):
    """Usa créditos de un usuario en un curso"""
    try:
        success = course_storage.use_credits(
            user_id=request.user_id,
            course_id=request.course_id,
            amount=request.amount
        )
        if not success:
            return {
                "success": False,
                "error": "Créditos insuficientes"
            }
        return {
            "success": True,
            "message": "Créditos usados correctamente"
        }
    except Exception as e:
        print(f"[FastAPI] Error usando créditos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/get-course-ranking")
async def get_course_ranking_endpoint(request: GetCourseRankingRequest):
    """Obtiene el ranking de usuarios por XP en un curso"""
    try:
        ranking = course_storage.get_course_ranking(
            course_id=request.course_id,
            limit=request.limit
        )
        return {
            "success": True,
            "ranking": ranking
        }
    except Exception as e:
        print(f"[FastAPI] Error obteniendo ranking: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/submit-satisfaction")
async def submit_satisfaction_endpoint(request: SubmitSatisfactionRequest):
    """Envía feedback de satisfacción sobre un curso"""
    try:
        course = course_storage.submit_satisfaction_feedback(
            user_id=request.user_id,
            course_id=request.course_id,
            rating=request.rating
        )
        return {
            "success": True,
            "course": course
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[FastAPI] Error enviando satisfacción: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/course-guide")
async def course_guide_endpoint(request: CourseGuideRequest):
    """
    Endpoint para el agente guía de cursos
    Responde preguntas y guía proactivamente al estudiante
    """
    try:
        if not request.apiKey:
            raise HTTPException(status_code=400, detail="API key requerida")
        
        # Obtener curso
        course = course_storage.get_course(request.course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Curso no encontrado")
        
        # Obtener inscripción
        enrollment = course_storage.get_user_enrollment(request.user_id, request.course_id)
        if not enrollment:
            raise HTTPException(status_code=404, detail="Usuario no inscrito en el curso")
        
        # Obtener sistema para memoria
        system = get_or_create_system(request.apiKey, mode="auto")
        memory = system.memory
        
        # Inicializar agente guía
        guide_agent = CourseGuideAgent(memory=memory, api_key=request.apiKey, mode="auto")
        
        # Obtener tema actual (si hay uno seleccionado)
        current_topic = None
        if request.question:
            # Intentar detectar tema de la pregunta o usar el último tema
            # Por ahora, usar el primer tema si no hay contexto
            if course.get("topics"):
                current_topic = course["topics"][0].get("name")
        
        # Llamar al agente guía
        answer, metadata = guide_agent.guide_student(
            question=request.question,
            course_title=course.get("title", ""),
            exam_date=course.get("exam_date", ""),
            topics=course.get("topics", []),
            topic_progress=enrollment.get("topic_progress", {}),
            current_topic=current_topic,
            credits_remaining=enrollment.get("credits_remaining", 0),
            conversation_history=enrollment.get("messages", []),
            available_tools=course.get("available_tools", {}),
            user_id=request.user_id,
            course_id=request.course_id,
            model=request.model,
            user_level=request.user_level
        )
        
        # Usar créditos si no se usó modelo gratuito
        if not metadata.get("use_free_model", False):
            # Estimar tokens (aproximado: 1 token ≈ 4 caracteres)
            estimated_tokens = len(answer) // 4
            credits_used = max(1, estimated_tokens // 100)  # 1 crédito por cada 100 tokens aproximados
            
            if enrollment.get("credits_remaining", 0) >= credits_used:
                course_storage.use_credits(request.user_id, request.course_id, credits_used)
                metadata["credits_used"] = credits_used
        
        return {
            "success": True,
            "answer": answer,
            "metadata": metadata
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error en course_guide: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Modelos para Flashcards
class GetFlashcardsRequest(BaseModel):
    """Modelo para obtener flashcards disponibles de un tema"""
    user_id: str
    course_id: str
    topic_name: str


class SaveFlashcardResponseRequest(BaseModel):
    """Modelo para guardar una respuesta de flashcard"""
    user_id: str
    course_id: str
    topic_name: str
    flashcard_id: str
    is_correct: bool


class GetFlashcardStatsRequest(BaseModel):
    """Modelo para obtener estadísticas de flashcards"""
    user_id: str
    course_id: str
    topic_name: Optional[str] = None


@app.post("/api/get-flashcards")
async def get_flashcards_endpoint(request: GetFlashcardsRequest):
    """Obtiene las flashcards disponibles de un tema según la lógica de repetición espaciada"""
    try:
        # Obtener el curso
        course = course_storage.get_course(request.course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Curso no encontrado")
        
        # Buscar el tema
        topics = course.get("topics", [])
        topic = None
        for t in topics:
            if t.get("name") == request.topic_name:
                topic = t
                break
        
        if not topic:
            raise HTTPException(status_code=404, detail="Tema no encontrado")
        
        # Obtener flashcards del tema
        topic_flashcards = topic.get("flashcards", [])
        
        if not topic_flashcards:
            return {
                "success": True,
                "flashcards": [],
                "message": "No hay flashcards disponibles para este tema"
            }
        
        # Filtrar flashcards disponibles según repetición espaciada
        available_flashcards = flashcard_storage.get_available_flashcards(
            request.user_id,
            request.course_id,
            request.topic_name,
            topic_flashcards
        )
        
        return {
            "success": True,
            "flashcards": available_flashcards,
            "total": len(topic_flashcards),
            "available": len(available_flashcards)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error obteniendo flashcards: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/save-flashcard-response")
async def save_flashcard_response_endpoint(request: SaveFlashcardResponseRequest):
    """Guarda una respuesta de flashcard"""
    try:
        response_data = flashcard_storage.save_flashcard_response(
            request.user_id,
            request.course_id,
            request.topic_name,
            request.flashcard_id,
            request.is_correct
        )
        
        # Añadir XP si la respuesta fue correcta
        if request.is_correct:
            course_storage.add_xp(request.user_id, request.course_id, 10)  # 10 XP por respuesta correcta
        
        return {
            "success": True,
            "response": response_data
        }
    except Exception as e:
        print(f"[FastAPI] Error guardando respuesta de flashcard: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/get-flashcard-stats")
async def get_flashcard_stats_endpoint(request: GetFlashcardStatsRequest):
    """Obtiene estadísticas de flashcards de un usuario"""
    try:
        stats = flashcard_storage.get_flashcard_stats(
            request.user_id,
            request.course_id,
            request.topic_name
        )
        
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        print(f"[FastAPI] Error obteniendo estadísticas de flashcards: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ENDPOINTS DE JUEGOS ====================

class CreateGameRequest(BaseModel):
    """Modelo para crear una partida"""
    course_id: str
    user_id: str
    max_players: int = 4
    topic_filter: Optional[str] = None


class JoinGameRequest(BaseModel):
    """Modelo para unirse a una partida"""
    game_id: str
    user_id: str
    username: Optional[str] = None  # Nombre del jugador
    invite_code: Optional[str] = None  # Código de invitación para usuarios no inscritos


class GetGameRequest(BaseModel):
    """Modelo para obtener una partida"""
    game_id: str
    user_id: str


class FindGameByCodeRequest(BaseModel):
    """Modelo para buscar una partida por código de invitación"""
    invite_code: str
    user_id: str


class RollDiceRequest(BaseModel):
    """Modelo para lanzar el dado"""
    game_id: str
    user_id: str


class AnswerQuestionRequest(BaseModel):
    """Modelo para responder una pregunta"""
    game_id: str
    user_id: str
    answer_index: int  # Índice de la respuesta seleccionada


class MovePieceRequest(BaseModel):
    """Modelo para mover una ficha"""
    game_id: str
    user_id: str
    piece_index: int  # Índice de la ficha (0-3)


class PassTurnRequest(BaseModel):
    """Modelo para pasar turno"""
    game_id: str
    user_id: str


class GetCourseGamesRequest(BaseModel):
    """Modelo para obtener partidas de un curso"""
    course_id: str
    status: Optional[str] = None  # waiting, playing, finished


@app.post("/api/study-agents/create-game")
async def create_game_endpoint(request: CreateGameRequest, background_tasks: BackgroundTasks):
    """Crea una nueva partida de parchís"""
    try:
        # Verificar que el curso existe y tiene juegos habilitados
        course = course_storage.get_course(request.course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Curso no encontrado")
        
        if not course.get("available_tools", {}).get("games", False):
            raise HTTPException(status_code=403, detail="Los juegos no están habilitados para este curso")
        
        # Verificar que el usuario está inscrito
        enrollment = course_storage.get_user_enrollment(request.user_id, request.course_id)
        if not enrollment:
            raise HTTPException(status_code=403, detail="Debes estar inscrito en el curso para crear partidas")
        
        # Validar max_players
        if request.max_players < 2 or request.max_players > 4:
            raise HTTPException(status_code=400, detail="El número de jugadores debe estar entre 2 y 4")
        
        # Limpiar partidas abandonadas ANTES de verificar partidas activas
        # NO limpiar partidas recién creadas (menos de 30 minutos)
        try:
            deleted_count = game_storage.cleanup_abandoned_games(max_age_hours=1, min_age_minutes=30)
            if deleted_count > 0:
                print(f"[FastAPI] Limpiadas {deleted_count} partidas abandonadas antes de crear nueva partida")
        except Exception as e:
            print(f"[FastAPI] Error limpiando partidas abandonadas: {str(e)}")
        
        # Verificar que el usuario no tenga otra partida activa (solo las que creó)
        try:
            # Solo buscar partidas donde el usuario es el creador
            active_games = game_storage.get_user_active_games(request.user_id, creator_only=True)
            print(f"[FastAPI] Usuario {request.user_id} tiene {len(active_games)} partidas activas (como creador)")
            if active_games:
                # Filtrar partidas del mismo curso
                same_course_games = [
                    g for g in active_games 
                    if g.get("course_id") == request.course_id
                ]
                print(f"[FastAPI] De esas, {len(same_course_games)} son del mismo curso")
                if same_course_games:
                    # Intentar eliminar automáticamente partidas en waiting que solo tienen al creador
                    for game in same_course_games:
                        if game.get("status") == "waiting":
                            players = game.get("players", [])
                            creator_id = game.get("creator_id")
                            # Si solo tiene al creador, eliminarla automáticamente
                            if len(players) == 1 and players[0].get("user_id") == creator_id:
                                print(f"[FastAPI] Eliminando automáticamente partida {game.get('game_id')} - solo tiene al creador")
                                game_storage.delete_game(game.get("game_id"))
                                same_course_games = [g for g in same_course_games if g.get("game_id") != game.get("game_id")]
                    
                    # Si aún quedan partidas activas después de la limpieza
                    if same_course_games:
                        game_ids = [g.get("game_id") for g in same_course_games]
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Ya tienes una partida activa en este curso (IDs: {', '.join(game_ids)}). Máximo una partida a la vez. Por favor, elimina o finaliza tu partida anterior antes de crear una nueva."
                        )
        except HTTPException:
            raise
        except Exception as e:
            print(f"[FastAPI] Error verificando partidas activas: {str(e)}")
            # Si hay un error al verificar, continuar (no bloquear la creación)
            import traceback
            traceback.print_exc()
        
        game = game_storage.create_game(
            course_id=request.course_id,
            creator_id=request.user_id,
            max_players=request.max_players,
            topic_filter=request.topic_filter
        )
        
        # Pre-cargar preguntas del curso en segundo plano
        background_tasks.add_task(
            preload_game_questions,
            game["game_id"],
            request.course_id,
            request.topic_filter,
            request.user_id
        )
        
        return {
            "success": True,
            "game": game
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error creando partida: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/study-agents/join-game")
async def join_game_endpoint(request: JoinGameRequest):
    """Une un jugador a una partida"""
    try:
        game = game_storage.join_game(request.game_id, request.user_id, request.username, request.invite_code)
        
        if not game:
            raise HTTPException(status_code=400, detail="No se pudo unir a la partida (partida llena, ya estás en ella, código incorrecto, o no existe)")
        
        # Verificar que el curso existe
        course = course_storage.get_course(game["course_id"])
        if not course:
            raise HTTPException(status_code=404, detail="Curso no encontrado")
        
        # Si el usuario no está inscrito, verificar que tiene código de invitación válido
        enrollment = course_storage.get_user_enrollment(request.user_id, game["course_id"])
        if not enrollment:
            if not request.invite_code or game.get("invite_code") != request.invite_code.upper():
                raise HTTPException(status_code=403, detail="Debes estar inscrito en el curso o tener un código de invitación válido para unirte a partidas")
        
        return {
            "success": True,
            "game": game
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error uniéndose a partida: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/study-agents/find-game-by-code")
async def find_game_by_code_endpoint(request: FindGameByCodeRequest):
    """Busca una partida por código de invitación"""
    try:
        invite_code = request.invite_code.upper().strip()
        
        print(f"[FastAPI] Buscando partida con código: {invite_code}")
        
        if len(invite_code) != 6:
            raise HTTPException(status_code=400, detail="El código de invitación debe tener 6 caracteres")
        
        game = game_storage.find_game_by_invite_code(invite_code)
        
        if not game:
            # Listar todas las partidas para debugging
            all_games = game_storage.get_course_games("", None)  # Obtener todas
            print(f"[FastAPI] Total de partidas encontradas: {len(all_games)}")
            for g in all_games[:5]:  # Mostrar primeras 5
                print(f"[FastAPI] Partida {g.get('game_id')}: código={g.get('invite_code')}, status={g.get('status')}")
            
            raise HTTPException(status_code=404, detail="No se encontró ninguna partida con ese código. Verifica que el código sea correcto y que la partida esté en estado 'Esperando jugadores'.")
        
        print(f"[FastAPI] Partida encontrada: {game.get('game_id')}, status={game.get('status')}")
        
        return {
            "success": True,
            "game": game
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error buscando partida por código: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/study-agents/get-game")
async def get_game_endpoint(request: GetGameRequest):
    """Obtiene el estado de una partida"""
    try:
        game = game_storage.load_game(request.game_id)
        
        if not game:
            raise HTTPException(status_code=404, detail="Partida no encontrada")
        
        # Verificar que el usuario está en la partida
        if not any(p["user_id"] == request.user_id for p in game["players"]):
            raise HTTPException(status_code=403, detail="No estás en esta partida")
        
        return {
            "success": True,
            "game": game
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error obteniendo partida: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/study-agents/start-game")
async def start_game_endpoint(request: GetGameRequest):
    """Inicia una partida"""
    try:
        game = game_storage.start_game(request.game_id, request.user_id)
        
        if not game:
            raise HTTPException(status_code=400, detail="No se pudo iniciar la partida. Verifica que seas el creador y que haya al menos 2 jugadores.")
        
        return {
            "success": True,
            "game": game
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error iniciando partida: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/study-agents/roll-dice")
async def roll_dice_endpoint(request: RollDiceRequest):
    """Lanza el dado en una partida"""
    try:
        import random
        from datetime import datetime
        
        game = game_storage.load_game(request.game_id)
        
        if not game:
            raise HTTPException(status_code=404, detail="Partida no encontrada")
        
        if game["status"] != "playing":
            raise HTTPException(status_code=400, detail="La partida no está en juego")
        
        # Verificar que es el turno del jugador
        current_player = game["players"][game["current_turn"]]
        if current_player["user_id"] != request.user_id:
            raise HTTPException(status_code=400, detail="No es tu turno")
        
        # Lanzar dado (1-6)
        dice_value = random.randint(1, 6)
        game["last_dice"] = dice_value
        game["updated_at"] = datetime.now().isoformat()
        
        # Si hay una pregunta activa, no se puede lanzar el dado
        if game.get("current_question"):
            raise HTTPException(status_code=400, detail="Debes responder la pregunta actual antes de lanzar el dado")
        
        # Usar preguntas pre-cargadas si están disponibles
        preloaded_questions = game.get("preloaded_questions", [])
        question_index = game.get("question_index", 0)
        
        if preloaded_questions and len(preloaded_questions) > 0:
            # Usar pregunta pre-cargada
            if question_index >= len(preloaded_questions):
                # Si nos quedamos sin preguntas, reiniciar el índice
                question_index = 0
            
            question = preloaded_questions[question_index]
            game["current_question"] = {
                "question": question.get("question", ""),
                "options": question.get("options", []),
                "correct_answer_index": question.get("correct_answer_index", 0),
                "explanation": question.get("explanation", "")
            }
            game["question_index"] = (question_index + 1) % len(preloaded_questions)  # Circular
            print(f"[Roll Dice] Usando pregunta pre-cargada {question_index + 1}/{len(preloaded_questions)}")
        else:
            # Fallback: generar pregunta en tiempo real (si no hay pre-cargadas)
            print(f"[Roll Dice] ⚠️ No hay preguntas pre-cargadas, generando en tiempo real...")
            course = course_storage.get_course(game["course_id"])
            if not course:
                raise HTTPException(status_code=404, detail="Curso no encontrado")
            
            api_key = os.getenv("OPENAI_API_KEY")
            system = get_or_create_system(api_key, mode="auto")
            
            topic_filter = game.get("topic_filter")
            topics_to_use = [topic_filter] if topic_filter else None
            
            pdf_paths = []
            for topic in course.get("topics", []):
                for pdf_url in topic.get("pdfs", []):
                    if pdf_url.startswith("http://localhost:8000/api/files/") or pdf_url.startswith("http://127.0.0.1:8000/api/files/"):
                        filename = pdf_url.split("/api/files/")[-1]
                        pdf_path = os.path.join(UPLOAD_DIR, filename)
                        if os.path.exists(pdf_path) and pdf_path not in pdf_paths:
                            pdf_paths.append(pdf_path)
                    elif pdf_url.startswith("/api/files/"):
                        filename = pdf_url.replace("/api/files/", "")
                        pdf_path = os.path.join(UPLOAD_DIR, filename)
                        if os.path.exists(pdf_path) and pdf_path not in pdf_paths:
                            pdf_paths.append(pdf_path)
            
            if pdf_paths:
                system.upload_documents(pdf_paths)
            
            test_data, usage_info = system.generate_test(
                difficulty="medium",
                num_questions=1,
                topics=topics_to_use,
                model=None
            )
            
            if usage_info:
                input_tokens = usage_info.get("inputTokens", 0)
                output_tokens = usage_info.get("outputTokens", 0)
                model_used = "gpt-3.5-turbo"
                if hasattr(system, 'test_generator') and hasattr(system.test_generator, 'current_model_config'):
                    if system.test_generator.current_model_config:
                        model_used = system.test_generator.current_model_config.name
                
                creator_id = game.get("creator_id")
                if creator_id and (input_tokens > 0 or output_tokens > 0):
                    save_user_cost(creator_id, input_tokens, output_tokens, model_used, system)
            
            if test_data.get("test") and test_data["test"].get("questions"):
                question = test_data["test"]["questions"][0]
                game["current_question"] = {
                    "question": question.get("question", ""),
                    "options": question.get("options", []),
                    "correct_answer_index": question.get("correct_answer", 0) if isinstance(question.get("correct_answer"), int) else 0,
                    "explanation": question.get("explanation", "")
                }
            else:
                # Fallback: pregunta simple
                game["current_question"] = {
                    "question": "¿Estás listo para continuar?",
                    "options": ["Sí", "No"],
                    "correct_answer_index": 0,
                    "explanation": ""
                }
        
        game_storage.save_game(game)
        
        return {
            "success": True,
            "game": game,
            "dice_value": dice_value
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error lanzando dado: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/study-agents/answer-question")
async def answer_question_endpoint(request: AnswerQuestionRequest):
    """Responde una pregunta en una partida"""
    try:
        from datetime import datetime
        
        game = game_storage.load_game(request.game_id)
        
        if not game:
            raise HTTPException(status_code=404, detail="Partida no encontrada")
        
        if game["status"] != "playing":
            raise HTTPException(status_code=400, detail="La partida no está en juego")
        
        # Verificar que es el turno del jugador
        current_player = game["players"][game["current_turn"]]
        if current_player["user_id"] != request.user_id:
            raise HTTPException(status_code=400, detail="No es tu turno")
        
        if not game.get("current_question"):
            raise HTTPException(status_code=400, detail="No hay pregunta activa")
        
        question = game["current_question"]
        is_correct = request.answer_index == question["correct_answer_index"]
        
        # Añadir al historial
        game["question_history"].append({
            "player_id": request.user_id,
            "question": question["question"],
            "answer_index": request.answer_index,
            "correct": is_correct,
            "timestamp": datetime.now().isoformat()
        })
        
        # Si es correcta, aumentar score
        if is_correct:
            current_player["score"] += 1
        
        # Limpiar pregunta actual
        game["current_question"] = None
        game["updated_at"] = datetime.now().isoformat()
        
        game_storage.save_game(game)
        
        return {
            "success": True,
            "game": game,
            "correct": is_correct,
            "explanation": question.get("explanation", "")
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error respondiendo pregunta: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/study-agents/move-piece")
async def move_piece_endpoint(request: MovePieceRequest):
    """Mueve una ficha en una partida"""
    try:
        from datetime import datetime
        
        game = game_storage.load_game(request.game_id)
        
        if not game:
            raise HTTPException(status_code=404, detail="Partida no encontrada")
        
        if game["status"] != "playing":
            raise HTTPException(status_code=400, detail="La partida no está en juego")
        
        # Verificar que es el turno del jugador
        current_player = game["players"][game["current_turn"]]
        if current_player["user_id"] != request.user_id:
            raise HTTPException(status_code=400, detail="No es tu turno")
        
        if not game.get("last_dice"):
            raise HTTPException(status_code=400, detail="Debes lanzar el dado primero")
        
        if game.get("current_question"):
            raise HTTPException(status_code=400, detail="Debes responder la pregunta primero")
        
        if request.piece_index < 0 or request.piece_index > 3:
            raise HTTPException(status_code=400, detail="Índice de ficha inválido")
        
        dice_value = game["last_dice"]
        piece_position = current_player["pieces"][request.piece_index]
        
        # Lógica simplificada del parchís
        # Si la ficha está en casa (0) y el dado es 6, puede salir
        if piece_position == 0:
            if dice_value == 6:
                current_player["pieces"][request.piece_index] = 1  # Salir a la casilla inicial
            else:
                raise HTTPException(status_code=400, detail="Necesitas un 6 para sacar una ficha de casa")
        else:
            # Mover la ficha
            new_position = piece_position + dice_value
            if new_position > 68:
                raise HTTPException(status_code=400, detail="Movimiento inválido (se pasa del tablero)")
            
            current_player["pieces"][request.piece_index] = new_position
            
            # Si llega a la meta (69), verificar si gana
            if new_position >= 69:
                current_player["pieces"][request.piece_index] = 69  # Meta
                # Verificar si todas las fichas están en la meta
                if all(p == 69 for p in current_player["pieces"]):
                    game["status"] = "finished"
                    game["winner"] = request.user_id
        
        # Limpiar dado y pasar turno
        game["last_dice"] = None
        game["current_turn"] = (game["current_turn"] + 1) % len(game["players"])
        game["updated_at"] = datetime.now().isoformat()
        
        game_storage.save_game(game)
        
        return {
            "success": True,
            "game": game
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error moviendo ficha: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/study-agents/pass-turn")
async def pass_turn_endpoint(request: PassTurnRequest):
    """Pasa el turno en una partida"""
    try:
        from datetime import datetime
        
        game = game_storage.load_game(request.game_id)
        
        if not game:
            raise HTTPException(status_code=404, detail="Partida no encontrada")
        
        if game["status"] != "playing":
            raise HTTPException(status_code=400, detail="La partida no está en juego")
        
        # Verificar que es el turno del jugador
        current_player = game["players"][game["current_turn"]]
        if current_player["user_id"] != request.user_id:
            raise HTTPException(status_code=400, detail="No es tu turno")
        
        if not game.get("last_dice"):
            raise HTTPException(status_code=400, detail="Debes lanzar el dado primero")
        
        if game.get("current_question"):
            raise HTTPException(status_code=400, detail="Debes responder la pregunta primero")
        
        # Verificar que no tiene fichas en juego y el dado es menor que 5
        has_pieces_in_play = any(p > 0 and p < 69 for p in current_player["pieces"])
        if has_pieces_in_play:
            raise HTTPException(status_code=400, detail="Tienes fichas en juego, no puedes pasar turno")
        
        if game["last_dice"] >= 5:
            raise HTTPException(status_code=400, detail="Solo puedes pasar turno si sacaste menos de 5 y no tienes fichas")
        
        # Limpiar dado y pasar turno
        game["last_dice"] = None
        game["current_turn"] = (game["current_turn"] + 1) % len(game["players"])
        game["updated_at"] = datetime.now().isoformat()
        
        game_storage.save_game(game)
        
        return {
            "success": True,
            "game": game
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error pasando turno: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/study-agents/get-course-games")
async def get_course_games_endpoint(request: GetCourseGamesRequest):
    """Obtiene las partidas de un curso"""
    try:
        # Limpiar partidas abandonadas antes de listar (más agresivo: 1 hora en lugar de 24)
        # NO eliminar partidas recién creadas (menos de 30 minutos)
        deleted_count = game_storage.cleanup_abandoned_games(max_age_hours=1, min_age_minutes=30)
        if deleted_count > 0:
            print(f"[FastAPI] Limpiadas {deleted_count} partidas abandonadas")
        
        games = game_storage.get_course_games(request.course_id, request.status)
        
        return {
            "success": True,
            "games": games
        }
    except Exception as e:
        print(f"[FastAPI] Error obteniendo partidas: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


class DeleteUserGamesRequest(BaseModel):
    """Modelo para eliminar todas las partidas de un usuario"""
    user_id: str
    course_id: Optional[str] = None  # Si se proporciona, solo elimina partidas de ese curso


@app.post("/api/study-agents/delete-user-games")
async def delete_user_games_endpoint(request: DeleteUserGamesRequest):
    """Elimina todas las partidas de un usuario (solo las que creó)"""
    try:
        print(f"[FastAPI] Eliminando partidas del usuario {request.user_id} en curso {request.course_id}")
        
        # Primero limpiar partidas abandonadas (NO eliminar partidas recién creadas)
        game_storage.cleanup_abandoned_games(max_age_hours=1, min_age_minutes=30)
        
        # Luego eliminar partidas del usuario
        deleted_count = game_storage.delete_user_games(request.user_id, request.course_id)
        
        print(f"[FastAPI] Eliminadas {deleted_count} partidas del usuario {request.user_id}")
        
        return {
            "success": True,
            "deleted_count": deleted_count,
            "message": f"Se eliminaron {deleted_count} partida(s)" if deleted_count > 0 else "No se encontraron partidas para eliminar"
        }
    except Exception as e:
        print(f"[FastAPI] Error eliminando partidas del usuario: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al eliminar partidas: {str(e)}")


class LeaveGameRequest(BaseModel):
    """Modelo para abandonar una partida"""
    game_id: str
    user_id: str


class DeleteGameRequest(BaseModel):
    """Modelo para eliminar una partida"""
    game_id: str
    user_id: str


@app.post("/api/study-agents/leave-game")
async def leave_game_endpoint(request: LeaveGameRequest):
    """Abandona una partida (solo si está en estado waiting)"""
    try:
        game = game_storage.leave_game(request.game_id, request.user_id)
        
        if game is None:
            # Si es None, puede ser que se eliminó la partida o que no se pudo abandonar
            return {
                "success": True,
                "message": "Partida abandonada o eliminada",
                "game": None
            }
        
        return {
            "success": True,
            "game": game
        }
    except Exception as e:
        print(f"[FastAPI] Error abandonando partida: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/study-agents/delete-game")
async def delete_game_endpoint(request: DeleteGameRequest):
    """Elimina una partida (solo el creador puede eliminarla si está en estado waiting)"""
    try:
        game = game_storage.load_game(request.game_id)
        
        if not game:
            raise HTTPException(status_code=404, detail="Partida no encontrada")
        
        # Solo el creador puede eliminar
        if game["creator_id"] != request.user_id:
            raise HTTPException(status_code=403, detail="Solo el creador puede eliminar la partida")
        
        # Solo se puede eliminar si está en estado waiting
        if game["status"] != "waiting":
            raise HTTPException(status_code=400, detail="Solo se pueden eliminar partidas que están esperando jugadores")
        
        success = game_storage.delete_game(request.game_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Error al eliminar la partida")
        
        return {
            "success": True,
            "message": "Partida eliminada correctamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error eliminando partida: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CÓDIGOS CANJEABLES ====================

@app.post("/api/study-agents/admin/create-redeem-code")
async def create_redeem_code_endpoint(request: CreateRedeemCodeRequest):
    """Crea un nuevo código canjeable (solo admin)"""
    try:
        # TODO: Verificar que el usuario es admin
        
        code_data = redeem_codes_storage.create_redeem_code(
            amount=request.amount,
            creator_id=request.admin_user_id,
            max_uses=request.max_uses,
            expires_at=request.expires_at,
            description=request.description,
            code=request.code
        )
        
        return {
            "success": True,
            "code": code_data
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[FastAPI] Error creando código canjeable: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/study-agents/redeem-code")
async def redeem_code_endpoint(request: RedeemCodeRequest):
    """Canjea un código para añadir saldo a la wallet"""
    try:
        # Canjear el código
        redeem_result = redeem_codes_storage.redeem_code(request.code, request.user_id)
        
        # Añadir saldo a la wallet
        wallet_storage.add_to_wallet(
            request.user_id,
            redeem_result["amount"],
            description=f"Código canjeado: {redeem_result['code']}"
        )
        
        return {
            "success": True,
            "amount": redeem_result["amount"],
            "message": redeem_result["message"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[FastAPI] Error canjeando código: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/study-agents/admin/list-redeem-codes")
async def list_redeem_codes_endpoint(request: ListRedeemCodesRequest):
    """Lista todos los códigos canjeables (solo admin)"""
    try:
        # TODO: Verificar que el usuario es admin
        
        codes = redeem_codes_storage.list_codes(creator_id=None, active_only=False)
        
        return {
            "success": True,
            "codes": codes
        }
    except Exception as e:
        print(f"[FastAPI] Error listando códigos: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/study-agents/admin/deactivate-redeem-code")
async def deactivate_redeem_code_endpoint(request: RedeemCodeRequest):
    """Desactiva un código canjeable (solo admin)"""
    try:
        # TODO: Verificar que el usuario es admin
        
        success = redeem_codes_storage.deactivate_code(request.code)
        
        if not success:
            raise HTTPException(status_code=404, detail="Código no encontrado")
        
        return {
            "success": True,
            "message": "Código desactivado correctamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI] Error desactivando código: {str(e)}")
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
