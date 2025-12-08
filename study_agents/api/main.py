"""
API FastAPI para Study Agents
Interfaz web para interactuar con los agentes
Soporta API keys por usuario
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import sys
from threading import Lock

# Añadir el directorio padre al path para importar los módulos
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Importar desde el directorio raíz usando importlib para evitar conflictos de nombres
import importlib.util
main_module_path = os.path.join(parent_dir, "main.py")
spec = importlib.util.spec_from_file_location("study_agents_main", main_module_path)
study_agents_main = importlib.util.module_from_spec(spec)
spec.loader.exec_module(study_agents_main)
StudyAgentsSystem = study_agents_main.StudyAgentsSystem

# Inicializar FastAPI
app = FastAPI(
    title="Study Agents API",
    description="API para el sistema multi-agente de autoaprendizaje",
    version="1.0.0"
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


def get_or_create_system(api_key: Optional[str] = None) -> StudyAgentsSystem:
    """
    Obtiene o crea un sistema de agentes para una API key
    
    Args:
        api_key: API key de OpenAI del usuario
        
    Returns:
        Sistema de agentes configurado
    """
    if not api_key:
        api_key = "default"
    
    # Usar caché para evitar recrear sistemas
    if api_key in systems_cache:
        return systems_cache[api_key]
    
    # Crear nuevo sistema
    with cache_lock:
        # Verificar de nuevo por si otro thread lo creó
        if api_key not in systems_cache:
            try:
                system = StudyAgentsSystem(api_key=api_key if api_key != "default" else None)
                systems_cache[api_key] = system
                return system
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error al inicializar el sistema: {str(e)}")
    
    return systems_cache[api_key]


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
        
        # Obtener sistema para esta API key
        system = get_or_create_system(apiKey)
        
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
        system = get_or_create_system(request.apiKey)
        
        print("[FastAPI] Generando apuntes (esto puede tardar)...")
        # Generar apuntes
        notes = system.generate_notes(topics=request.topics, model=request.model)
        
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
        
        system = get_or_create_system(request.apiKey)
        
        # Responder pregunta
        answer, usage_info = system.ask_question(request.question, request.user_id, model=request.model)
        
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
        
        system = get_or_create_system(request.apiKey)
        
        # Generar test
        test, usage_info = system.generate_test(
            difficulty=request.difficulty,
            num_questions=request.num_questions,
            topics=request.topics,
            constraints=request.constraints,
            model=request.model
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
        
        system = get_or_create_system(request.apiKey)
        
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
