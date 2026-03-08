"""
Sistema de almacenamiento de Cursos/Exámenes
Guarda los cursos creados por usuarios y las inscripciones
"""

import json
import os
import shutil
from typing import List, Dict, Optional
from datetime import datetime
from pathlib import Path

# Directorio para almacenar cursos
COURSES_DIR = Path("courses")
COURSES_DIR.mkdir(exist_ok=True)

# Archivo principal de cursos (todos los cursos públicos)
COURSES_FILE = COURSES_DIR / "all_courses.json"

# Directorio para inscripciones de usuarios
ENROLLMENTS_DIR = COURSES_DIR / "enrollments"
ENROLLMENTS_DIR.mkdir(exist_ok=True)

# Directorio para PDFs de cursos (guardados permanentemente)
COURSE_PDFS_DIR = COURSES_DIR / "course_pdfs"
COURSE_PDFS_DIR.mkdir(exist_ok=True)


def get_courses_file() -> Path:
    """Obtiene la ruta del archivo de cursos"""
    return COURSES_FILE


def get_enrollment_file(user_id: str) -> Path:
    """Obtiene la ruta del archivo de inscripciones de un usuario"""
    return ENROLLMENTS_DIR / f"{user_id}.json"


def create_course(
    creator_id: str,
    title: str,
    description: str,
    price: float,
    max_duration_days: Optional[int] = None,  # Duración máxima del curso en días (opcional)
    cover_image: Optional[str] = None,  # Ruta a la imagen de portada
    topics: List[Dict] = None,  # Lista de temas con sus PDFs y flashcards
    exam_examples: List[str] = None,  # Lista de rutas a PDFs de ejemplos de exámenes
    available_tools: Dict[str, bool] = None,  # {"flashcards": True, "code_interpreter": True, etc.}
    flashcard_questions: Optional[List[Dict]] = None,  # Preguntas predefinidas para flashcards
    course_id: Optional[str] = None,
    is_exam: bool = False,  # Si es True, es un examen (no curso)
    institution: Optional[Dict] = None,  # {"name": str, "logo": Optional[str]}
    subject: Optional[str] = None  # Asignatura/Curso/Tipo de examen (ej: B2, Bases de Datos)
) -> Dict:
    """
    Crea un nuevo curso/examen
    
    Args:
        creator_id: ID del usuario creador
        title: Título del curso
        description: Descripción del curso
        price: Precio en euros (0, 2, 5, 10, 20, 50)
        exam_date: Fecha del examen en formato ISO
        topics: Lista de temas, cada tema tiene: {"name": str, "pdfs": List[str]}
        exam_examples: Lista de rutas a PDFs de ejemplos de exámenes
        available_tools: Diccionario con herramientas disponibles
        flashcard_questions: Preguntas predefinidas para flashcards (opcional)
        course_id: ID del curso (se genera si no se proporciona)
        
    Returns:
        Datos del curso creado
    """
    if course_id is None:
        course_id = f"course_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
    
    # Calcular distribución de ingresos según el precio
    revenue_split = calculate_revenue_split(price)
    
    # Inicializar available_tools si no se proporciona
    if available_tools is None:
        available_tools = {}
    
    # Si el precio es >= 10€ y los juegos no están explícitamente configurados, habilitarlos automáticamente
    # Si el usuario los ha desactivado explícitamente (games: False), respetar esa decisión
    if price >= 10.0 and "games" not in available_tools:
        available_tools["games"] = True
    # Si el precio es < 10€, asegurarse de que los juegos estén desactivados
    elif price < 10.0:
        available_tools["games"] = False
    
    # Copiar PDFs a carpeta del curso para guardarlos permanentemente
    course_pdfs_dir = COURSE_PDFS_DIR / course_id
    course_pdfs_dir.mkdir(exist_ok=True)
    
    # Función para copiar PDF desde URL a carpeta del curso
    def copy_pdf_to_course(pdf_url: str, upload_dir: str = "documents") -> Optional[str]:
        """Copia un PDF desde su ubicación actual a la carpeta del curso"""
        try:
            # Extraer nombre del archivo de la URL
            if pdf_url.startswith("http://localhost:8000/api/files/") or pdf_url.startswith("http://127.0.0.1:8000/api/files/"):
                filename = pdf_url.split("/api/files/")[-1]
                source_path = Path(upload_dir) / filename
            elif pdf_url.startswith("/api/files/"):
                filename = pdf_url.replace("/api/files/", "")
                source_path = Path(upload_dir) / filename
            elif os.path.exists(pdf_url):
                # Ya es una ruta local
                source_path = Path(pdf_url)
                filename = source_path.name
            else:
                print(f"⚠️ No se pudo encontrar el PDF: {pdf_url}")
                return None
            
            if not source_path.exists():
                print(f"⚠️ El archivo no existe: {source_path}")
                return None
            
            # Copiar a la carpeta del curso
            dest_path = course_pdfs_dir / filename
            shutil.copy2(source_path, dest_path)
            print(f"✅ PDF copiado a carpeta del curso: {dest_path}")
            
            # Retornar ruta relativa para guardar en el curso
            return str(dest_path)
        except Exception as e:
            print(f"⚠️ Error copiando PDF {pdf_url}: {e}")
            return None
    
    # Copiar PDFs de topics
    topics_with_saved_pdfs = []
    for topic in (topics or []):
        topic_copy = topic.copy()
        saved_pdfs = []
        for pdf_url in topic.get("pdfs", []):
            saved_path = copy_pdf_to_course(pdf_url)
            if saved_path:
                saved_pdfs.append(saved_path)
            else:
                # Si no se pudo copiar, mantener la URL original
                saved_pdfs.append(pdf_url)
        
        # Guardar tanto las URLs originales como las rutas guardadas
        topic_copy["pdfs"] = topic.get("pdfs", [])  # URLs originales
        topic_copy["saved_pdf_paths"] = saved_pdfs  # Rutas guardadas
        topics_with_saved_pdfs.append(topic_copy)
    
    # Copiar PDFs de exam_examples
    saved_exam_pdfs = []
    for exam_pdf_url in (exam_examples or []):
        saved_path = copy_pdf_to_course(exam_pdf_url)
        if saved_path:
            saved_exam_pdfs.append(saved_path)
        else:
            saved_exam_pdfs.append(exam_pdf_url)
    
    course_data = {
        "course_id": course_id,
        "creator_id": creator_id,
        "title": title,
        "description": description,
        "price": price,
        "max_duration_days": max_duration_days,
        "cover_image": cover_image,
        "topics": topics_with_saved_pdfs,  # Topics con PDFs guardados
        "exam_examples": exam_examples or [],  # URLs originales
        "saved_exam_pdf_paths": saved_exam_pdfs,  # Rutas guardadas
        "available_tools": available_tools,
        "flashcard_questions": flashcard_questions or [],
        "revenue_split": revenue_split,
        "is_exam": is_exam,  # True si es examen, False si es curso
        "institution": institution,  # {"name": str, "logo": Optional[str]}
        "subject": subject,  # Asignatura/Curso/Tipo de examen
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "enrollment_count": 0,
        "satisfaction_rating": None,  # Promedio de satisfacción
        "satisfaction_count": 0,  # Número de evaluaciones
        "is_active": True
    }
    
    # Cargar cursos existentes
    all_courses = load_all_courses()
    
    # Añadir o actualizar curso
    all_courses[course_id] = course_data
    
    # Guardar
    save_all_courses(all_courses)
    
    return course_data


def calculate_revenue_split(price: float) -> Dict[str, float]:
    """
    Calcula la distribución de ingresos según el precio
    
    Returns:
        Diccionario con {"ai_usage": float, "platform": float, "creator": float}
    """
    splits = {
        0: {"ai_usage": 0, "platform": 0, "creator": 0},
        2: {"ai_usage": 1.0, "platform": 0.5, "creator": 0.5},
        5: {"ai_usage": 3.0, "platform": 1.0, "creator": 1.0},  # 3€ IA, 1€ admin, 1€ creador
        10: {"ai_usage": 6.0, "platform": 2.0, "creator": 2.0},  # 6€ IA, 2€ admin, 2€ creador
        20: {"ai_usage": 10.0, "platform": 6.0, "creator": 4.0},  # 10€ IA, 6€ admin, 4€ creador
        50: {"ai_usage": 20.0, "platform": 20.0, "creator": 10.0}  # 20€ IA, 20€ admin, 10€ creador
    }
    
    return splits.get(price, splits[0])


def load_all_courses() -> Dict[str, Dict]:
    """Carga todos los cursos"""
    if not COURSES_FILE.exists():
        return {}
    
    try:
        with open(COURSES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error al cargar cursos: {e}")
        return {}


def save_all_courses(courses: Dict[str, Dict]):
    """Guarda todos los cursos"""
    with open(COURSES_FILE, "w", encoding="utf-8") as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)


def get_course(course_id: str) -> Optional[Dict]:
    """Obtiene un curso por ID"""
    all_courses = load_all_courses()
    return all_courses.get(course_id)


def list_courses(creator_id: Optional[str] = None, active_only: bool = True) -> List[Dict]:
    """
    Lista todos los cursos
    
    Args:
        creator_id: Si se proporciona, filtra por creador
        active_only: Si es True, solo muestra cursos activos
        
    Returns:
        Lista de cursos
    """
    all_courses = load_all_courses()
    
    courses_list = []
    for course_id, course_data in all_courses.items():
        if active_only and not course_data.get("is_active", True):
            continue
        
        if creator_id and course_data.get("creator_id") != creator_id:
            continue
        
        # Preparar datos para respuesta (sin información sensible)
        course_info = {
            "course_id": course_id,
            "creator_id": course_data.get("creator_id"),
            "title": course_data.get("title"),
            "description": course_data.get("description"),
            "price": course_data.get("price"),
            "max_duration_days": course_data.get("max_duration_days"),
            "cover_image": course_data.get("cover_image"),
            "is_exam": course_data.get("is_exam", False),
            "topics": course_data.get("topics", []),
            "available_tools": course_data.get("available_tools", {}),
            "enrollment_count": course_data.get("enrollment_count", 0),
            "satisfaction_rating": course_data.get("satisfaction_rating"),
            "satisfaction_count": course_data.get("satisfaction_count", 0),
            "created_at": course_data.get("created_at"),
            "updated_at": course_data.get("updated_at")
        }
        
        courses_list.append(course_info)
    
    # Ordenar por fecha de creación (más reciente primero)
    courses_list.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return courses_list


def enroll_user(user_id: str, course_id: str, exam_date: Optional[str] = None, skip_payment: bool = False) -> Dict:
    """
    Inscribe un usuario en un curso
    
    Args:
        user_id: ID del usuario
        course_id: ID del curso
        exam_date: Fecha del examen (ISO format, opcional, solo para exámenes)
        skip_payment: Si es True, no verifica ni procesa el pago (para cursos gratis)
        
    Returns:
        Datos de la inscripción
    
    Raises:
        ValueError: Si el curso no existe o no hay suficiente saldo
    """
    course = get_course(course_id)
    if not course:
        raise ValueError(f"Curso {course_id} no encontrado")
    
    # Cargar inscripciones del usuario
    enrollment_file = get_enrollment_file(user_id)
    enrollments = {}
    
    if enrollment_file.exists():
        with open(enrollment_file, "r", encoding="utf-8") as f:
            enrollments = json.load(f)
    
    # Verificar si ya está inscrito
    if course_id in enrollments:
        return enrollments[course_id]
    
    # Procesar pago si el curso es de pago
    course_price = course.get("price", 0)
    if course_price > 0 and not skip_payment:
        # Importación tardía para evitar importación circular
        try:
            from study_agents.wallet_storage import distribute_course_payment, get_user_wallet
        except ImportError:
            # Si falla, intentar importación relativa
            import sys
            import os
            wallet_storage_path = os.path.join(os.path.dirname(__file__), "wallet_storage.py")
            if os.path.exists(wallet_storage_path):
                import importlib.util
                spec = importlib.util.spec_from_file_location("wallet_storage", wallet_storage_path)
                wallet_storage = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(wallet_storage)
                distribute_course_payment = wallet_storage.distribute_course_payment
                get_user_wallet = wallet_storage.get_user_wallet
            else:
                raise ImportError("No se pudo importar wallet_storage")
        
        # Verificar saldo
        wallet = get_user_wallet(user_id)
        if wallet["balance"] < course_price:
            raise ValueError(
                f"Saldo insuficiente. Necesitas {course_price:.2f}€. "
                f"Tu saldo actual: {wallet['balance']:.2f}€. "
                f"Por favor, recarga tu wallet."
            )
        
        # Distribuir el pago
        distribute_course_payment(user_id, course_id, course_price, course)
    
    # Calcular créditos máximos según el precio
    max_credits_map = {
        2: 100,
        5: 250,
        10: 500,
        20: 1000,
        50: 2500
    }
    course_price = course.get("price", 0)
    max_credits = max_credits_map.get(course_price, 0)
    
    # Al inscribirse, el usuario recibe la mitad de los créditos máximos
    initial_credits = max_credits // 2
    
    # Crear inscripción
    enrollment = {
        "user_id": user_id,
        "course_id": course_id,
        "enrolled_at": datetime.now().isoformat(),
        "credits_remaining": initial_credits,
        "credits_used": 0,
        "max_credits": max_credits,  # Créditos máximos que puede tener
        "initial_credits": initial_credits,  # Créditos iniciales recibidos
        "streak_days": 0,  # Días consecutivos de conexión
        "last_connection_date": None,  # Última fecha de conexión (ISO format)
        "credits_from_streak": 0,  # Créditos ganados por racha
        "streak_calendar": {},  # {"YYYY-MM-DD": {"claimed": bool, "credits": int}}
        "pending_credits": 0,  # Créditos pendientes de reclamar
        "xp": 0,
        "topic_progress": {},  # {"topic_name": percentage (0-100)}
        "messages": [],  # Mensajes del chat del curso
        "generated_notes": {},  # {"topic_name": [notes]}
        "completed_tests": [],
        "completed_exercises": [],
        "flashcard_responses": {}  # {"topic_name": [responses]}
    }
    
    # Añadir fecha de examen si se proporciona
    if exam_date:
        enrollment["exam_date"] = exam_date
    
    # Inicializar progreso por tema
    for topic in course.get("topics", []):
        topic_name = topic.get("name", "")
        enrollment["topic_progress"][topic_name] = 0
        enrollment["flashcard_responses"][topic_name] = []
    
    enrollments[course_id] = enrollment
    
    # Guardar inscripción
    with open(enrollment_file, "w", encoding="utf-8") as f:
        json.dump(enrollments, f, ensure_ascii=False, indent=2)
    
    # Actualizar contador de inscripciones del curso
    all_courses = load_all_courses()
    if course_id in all_courses:
        all_courses[course_id]["enrollment_count"] = all_courses[course_id].get("enrollment_count", 0) + 1
        save_all_courses(all_courses)
    
    return enrollment


def get_user_enrollment(user_id: str, course_id: str) -> Optional[Dict]:
    """Obtiene la inscripción de un usuario en un curso"""
    enrollment_file = get_enrollment_file(user_id)
    
    if not enrollment_file.exists():
        return None
    
    with open(enrollment_file, "r", encoding="utf-8") as f:
        enrollments = json.load(f)
    
    return enrollments.get(course_id)


def get_user_enrollments(user_id: str) -> List[Dict]:
    """Obtiene todos los cursos en los que está inscrito un usuario"""
    enrollment_file = get_enrollment_file(user_id)
    
    if not enrollment_file.exists():
        return []
    
    with open(enrollment_file, "r", encoding="utf-8") as f:
        enrollments = json.load(f)
    
    # Obtener información completa de cada curso
    enrolled_courses = []
    for course_id, enrollment_data in enrollments.items():
        course = get_course(course_id)
        if course:
            enrolled_courses.append({
                "course": course,
                "enrollment": enrollment_data
            })
    
    return enrolled_courses


def update_enrollment(user_id: str, course_id: str, updates: Dict) -> Optional[Dict]:
    """Actualiza la inscripción de un usuario"""
    enrollment_file = get_enrollment_file(user_id)
    
    if not enrollment_file.exists():
        return None
    
    with open(enrollment_file, "r", encoding="utf-8") as f:
        enrollments = json.load(f)
    
    if course_id not in enrollments:
        return None
    
    # Actualizar campos
    enrollments[course_id].update(updates)
    enrollments[course_id]["updated_at"] = datetime.now().isoformat()
    
    # Guardar
    with open(enrollment_file, "w", encoding="utf-8") as f:
        json.dump(enrollments, f, ensure_ascii=False, indent=2)
    
    return enrollments[course_id]


def unenroll_user(user_id: str, course_id: str) -> bool:
    """
    Desapunta un usuario de un curso
    
    Args:
        user_id: ID del usuario
        course_id: ID del curso
        
    Returns:
        True si se desapuntó correctamente, False si no estaba inscrito
    """
    enrollment_file = get_enrollment_file(user_id)
    
    if not enrollment_file.exists():
        return False
    
    with open(enrollment_file, "r", encoding="utf-8") as f:
        enrollments = json.load(f)
    
    if course_id not in enrollments:
        return False
    
    # Eliminar inscripción
    del enrollments[course_id]
    
    # Guardar
    with open(enrollment_file, "w", encoding="utf-8") as f:
        json.dump(enrollments, f, ensure_ascii=False, indent=2)
    
    # Actualizar contador de inscripciones del curso
    all_courses = load_all_courses()
    if course_id in all_courses:
        current_count = all_courses[course_id].get("enrollment_count", 0)
        if current_count > 0:
            all_courses[course_id]["enrollment_count"] = current_count - 1
        save_all_courses(all_courses)
    
    return True


def add_xp(user_id: str, course_id: str, xp_amount: int) -> Dict:
    """Añade XP a un usuario en un curso"""
    enrollment = get_user_enrollment(user_id, course_id)
    if not enrollment:
        raise ValueError(f"Usuario {user_id} no está inscrito en curso {course_id}")
    
    current_xp = enrollment.get("xp", 0)
    new_xp = current_xp + xp_amount
    
    return update_enrollment(user_id, course_id, {"xp": new_xp})


def update_topic_progress(user_id: str, course_id: str, topic_name: str, percentage: float) -> Dict:
    """Actualiza el progreso de un tema"""
    enrollment = get_user_enrollment(user_id, course_id)
    if not enrollment:
        raise ValueError(f"Usuario {user_id} no está inscrito en curso {course_id}")
    
    topic_progress = enrollment.get("topic_progress", {})
    topic_progress[topic_name] = min(100, max(0, percentage))  # Asegurar 0-100
    
    return update_enrollment(user_id, course_id, {"topic_progress": topic_progress})


def use_credits(user_id: str, course_id: str, amount: int) -> bool:
    """
    Usa créditos de un usuario en un curso
    
    Returns:
        True si se pudieron usar los créditos, False si no hay suficientes
    """
    enrollment = get_user_enrollment(user_id, course_id)
    if not enrollment:
        return False
    
    credits_remaining = enrollment.get("credits_remaining", 0)
    
    if credits_remaining < amount:
        return False
    
    credits_remaining -= amount
    credits_used = enrollment.get("credits_used", 0) + amount
    
    update_enrollment(user_id, course_id, {
        "credits_remaining": credits_remaining,
        "credits_used": credits_used
    })
    
    return True


def get_course_ranking(course_id: str, limit: int = 10) -> List[Dict]:
    """
    Obtiene el ranking de usuarios por XP en un curso
    
    Returns:
        Lista de usuarios ordenados por XP (mayor a menor)
    """
    all_enrollments = []
    
    # Buscar en todos los archivos de inscripciones
    for enrollment_file in ENROLLMENTS_DIR.glob("*.json"):
        with open(enrollment_file, "r", encoding="utf-8") as f:
            user_enrollments = json.load(f)
            
            if course_id in user_enrollments:
                enrollment = user_enrollments[course_id]
                all_enrollments.append({
                    "user_id": enrollment.get("user_id"),
                    "xp": enrollment.get("xp", 0),
                    "enrolled_at": enrollment.get("enrolled_at")
                })
    
    # Ordenar por XP (mayor a menor)
    all_enrollments.sort(key=lambda x: x.get("xp", 0), reverse=True)
    
    return all_enrollments[:limit]


def submit_satisfaction_feedback(user_id: str, course_id: str, rating: int, comment: Optional[str] = None) -> Dict:
    """
    Envía feedback de satisfacción sobre un curso
    
    Args:
        user_id: ID del usuario
        course_id: ID del curso
        rating: Calificación de 1 a 5
        comment: Comentario opcional
        
    Returns:
        Datos actualizados del curso
    """
    if rating < 1 or rating > 5:
        raise ValueError("La calificación debe estar entre 1 y 5")
    
    course = get_course(course_id)
    if not course:
        raise ValueError(f"Curso {course_id} no encontrado")
    
    # Cargar o crear archivo de reviews
    reviews_file = COURSES_DIR / "reviews.json"
    if reviews_file.exists():
        with open(reviews_file, "r", encoding="utf-8") as f:
            all_reviews = json.load(f)
    else:
        all_reviews = {}
    
    # Inicializar reviews del curso si no existe
    if course_id not in all_reviews:
        all_reviews[course_id] = []
    
    # Verificar si el usuario ya hizo una review
    existing_review_index = None
    for i, review in enumerate(all_reviews[course_id]):
        if review.get("user_id") == user_id:
            existing_review_index = i
            break
    
    # Crear nueva review
    new_review = {
        "user_id": user_id,
        "rating": rating,
        "comment": comment or "",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    if existing_review_index is not None:
        # Actualizar review existente
        old_rating = all_reviews[course_id][existing_review_index].get("rating", rating)
        all_reviews[course_id][existing_review_index] = new_review
    else:
        # Añadir nueva review
        all_reviews[course_id].append(new_review)
    
    # Guardar reviews
    with open(reviews_file, "w", encoding="utf-8") as f:
        json.dump(all_reviews, f, ensure_ascii=False, indent=2)
    
    # Actualizar satisfacción del curso
    all_courses = load_all_courses()
    if course_id in all_courses:
        reviews = all_reviews.get(course_id, [])
        if reviews:
            total_rating = sum(r.get("rating", 0) for r in reviews)
            new_count = len(reviews)
            new_rating = total_rating / new_count
        else:
            new_rating = None
            new_count = 0
        
        all_courses[course_id]["satisfaction_rating"] = new_rating
        all_courses[course_id]["satisfaction_count"] = new_count
        save_all_courses(all_courses)
    
    return get_course(course_id)


def get_course_reviews(course_id: str, limit: int = 50) -> List[Dict]:
    """
    Obtiene las reviews de un curso
    
    Args:
        course_id: ID del curso
        limit: Límite de reviews a retornar
        
    Returns:
        Lista de reviews ordenadas por fecha (más recientes primero)
    """
    reviews_file = COURSES_DIR / "reviews.json"
    if not reviews_file.exists():
        return []
    
    with open(reviews_file, "r", encoding="utf-8") as f:
        all_reviews = json.load(f)
    
    reviews = all_reviews.get(course_id, [])
    # Ordenar por fecha (más recientes primero)
    reviews.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return reviews[:limit]


def update_streak_and_credits(user_id: str, course_id: str) -> Dict:
    """
    Actualiza la racha diaria y marca créditos como disponibles para reclamar
    
    Returns:
        {
            "streak_days": int,
            "credits_available": int,  # Créditos disponibles para reclamar hoy
            "credits_remaining": int,
            "max_credits": int,
            "is_new_streak": bool,
            "streak_calendar": dict,  # Calendario de racha
            "pending_credits": int,  # Total de créditos pendientes
            "today_claimed": bool  # Si ya se reclamaron los créditos de hoy
        }
    """
    enrollment_file = get_enrollment_file(user_id)
    
    if not enrollment_file.exists():
        return {
            "streak_days": 0,
            "credits_available": 0,
            "credits_remaining": 0,
            "max_credits": 0,
            "is_new_streak": False,
            "streak_calendar": {},
            "pending_credits": 0,
            "today_claimed": False
        }
    
    with open(enrollment_file, "r", encoding="utf-8") as f:
        enrollments = json.load(f)
    
    if course_id not in enrollments:
        return {
            "streak_days": 0,
            "credits_available": 0,
            "credits_remaining": 0,
            "max_credits": 0,
            "is_new_streak": False,
            "streak_calendar": {},
            "pending_credits": 0,
            "today_claimed": False
        }
    
    enrollment = enrollments[course_id]
    today = datetime.now().date().isoformat()
    last_connection = enrollment.get("last_connection_date")
    
    # Inicializar campos si no existen (para enrollments antiguos)
    if "max_credits" not in enrollment:
        # Calcular max_credits basado en el precio del curso
        course = get_course(course_id)
        if course:
            max_credits_map = {
                2: 100,
                5: 250,
                10: 500,
                20: 1000,
                50: 2500
            }
            course_price = course.get("price", 0)
            enrollment["max_credits"] = max_credits_map.get(course_price, 0)
        else:
            enrollment["max_credits"] = enrollment.get("credits_remaining", 0) * 2
    
    if "streak_days" not in enrollment:
        enrollment["streak_days"] = 0
    
    if "credits_from_streak" not in enrollment:
        enrollment["credits_from_streak"] = 0
    
    if "streak_calendar" not in enrollment:
        enrollment["streak_calendar"] = {}
    
    if "pending_credits" not in enrollment:
        enrollment["pending_credits"] = 0
    
    max_credits = enrollment.get("max_credits", 0)
    current_credits = enrollment.get("credits_remaining", 0)
    credits_from_streak = enrollment.get("credits_from_streak", 0)
    streak_days = enrollment.get("streak_days", 0)
    
    # Verificar si es un nuevo día
    is_new_streak = False
    credits_available_today = 0
    today_claimed = False
    
    if last_connection != today:
        # Calcular días desde la última conexión
        if last_connection:
            try:
                last_date = datetime.fromisoformat(last_connection).date()
                today_date = datetime.now().date()
                days_diff = (today_date - last_date).days
                
                if days_diff == 1:
                    # Racha continua
                    streak_days += 1
                    is_new_streak = True
                elif days_diff > 1:
                    # Racha rota, empezar de nuevo
                    streak_days = 1
                    is_new_streak = True
                else:
                    # Mismo día, no hacer nada
                    pass
            except:
                # Si hay error parseando la fecha, empezar racha nueva
                streak_days = 1
                is_new_streak = True
        else:
            # Primera conexión
            streak_days = 1
            is_new_streak = True
        
        # Calcular créditos disponibles para reclamar hoy
        if is_new_streak and current_credits < max_credits:
            # Verificar si ya se reclamaron los créditos de hoy
            if today in enrollment["streak_calendar"]:
                today_claimed = enrollment["streak_calendar"][today].get("claimed", False)
                if today_claimed:
                    credits_available_today = 0
                else:
                    credits_available_today = enrollment["streak_calendar"][today].get("credits", 0)
            else:
                # Calcular cuántos créditos faltan por ganar
                credits_to_earn = max_credits - current_credits
                
                # Calcular créditos por día (distribuir en aproximadamente 30 días)
                # Pero ajustar según el precio del curso
                course = get_course(course_id)
                if course:
                    course_price = course.get("price", 0)
                    # Para cursos más caros, dar más créditos por día
                    if course_price == 2:
                        credits_per_day = max(1, credits_to_earn // 30)
                    elif course_price == 5:
                        credits_per_day = max(2, credits_to_earn // 25)
                    elif course_price == 10:
                        credits_per_day = max(3, credits_to_earn // 20)
                    elif course_price == 20:
                        credits_per_day = max(5, credits_to_earn // 15)
                    elif course_price == 50:
                        credits_per_day = max(10, credits_to_earn // 10)
                    else:
                        credits_per_day = max(1, credits_to_earn // 20)
                else:
                    credits_per_day = max(1, credits_to_earn // 20)
                
                # Bonus por racha: más días consecutivos = más créditos
                streak_bonus = min(streak_days // 3, 5)  # Bonus máximo de 5 créditos extra
                credits_available_today = credits_per_day + streak_bonus
                
                # Asegurar que no exceda el máximo disponible
                max_available = max_credits - current_credits
                credits_available_today = min(credits_available_today, max_available)
                
                # Guardar en el calendario
                enrollment["streak_calendar"][today] = {
                    "claimed": False,
                    "credits": credits_available_today,
                    "streak_day": streak_days
                }
                enrollment["pending_credits"] = enrollment.get("pending_credits", 0) + credits_available_today
    else:
        # Mismo día, verificar si ya se reclamaron
        if today in enrollment.get("streak_calendar", {}):
            today_claimed = enrollment["streak_calendar"][today].get("claimed", False)
            if not today_claimed:
                credits_available_today = enrollment["streak_calendar"][today].get("credits", 0)
    
    enrollment["last_connection_date"] = today
    enrollment["streak_days"] = streak_days
    
    # Guardar cambios
    with open(enrollment_file, "w", encoding="utf-8") as f:
        json.dump(enrollments, f, ensure_ascii=False, indent=2)
    
    return {
        "streak_days": enrollment.get("streak_days", 0),
        "credits_available": credits_available_today,
        "credits_remaining": enrollment.get("credits_remaining", 0),
        "max_credits": max_credits,
        "is_new_streak": is_new_streak,
        "streak_calendar": enrollment.get("streak_calendar", {}),
        "pending_credits": enrollment.get("pending_credits", 0),
        "today_claimed": today_claimed
    }


def claim_daily_credits(user_id: str, course_id: str) -> Dict:
    """
    Reclama los créditos diarios disponibles
    
    Returns:
        {
            "success": bool,
            "credits_claimed": int,
            "credits_remaining": int,
            "message": str
        }
    """
    enrollment_file = get_enrollment_file(user_id)
    
    if not enrollment_file.exists():
        return {
            "success": False,
            "credits_claimed": 0,
            "credits_remaining": 0,
            "message": "Inscripción no encontrada"
        }
    
    with open(enrollment_file, "r", encoding="utf-8") as f:
        enrollments = json.load(f)
    
    if course_id not in enrollments:
        return {
            "success": False,
            "credits_claimed": 0,
            "credits_remaining": 0,
            "message": "Curso no encontrado"
        }
    
    enrollment = enrollments[course_id]
    today = datetime.now().date().isoformat()
    
    print(f"[Claim Credits] Buscando créditos para hoy: {today}")
    print(f"[Claim Credits] Calendario disponible: {list(enrollment.get('streak_calendar', {}).keys())}")
    
    # Verificar si hay créditos disponibles para reclamar hoy
    streak_calendar = enrollment.get("streak_calendar", {})
    if today not in streak_calendar:
        print(f"[Claim Credits] ❌ No hay entrada en el calendario para hoy: {today}")
        return {
            "success": False,
            "credits_claimed": 0,
            "credits_remaining": enrollment.get("credits_remaining", 0),
            "message": "No hay créditos disponibles para reclamar hoy. Asegúrate de haber accedido al curso hoy."
        }
    
    today_entry = streak_calendar[today]
    print(f"[Claim Credits] Entrada de hoy: {today_entry}")
    
    if today_entry.get("claimed", False):
        return {
            "success": False,
            "credits_claimed": 0,
            "credits_remaining": enrollment.get("credits_remaining", 0),
            "message": "Ya has reclamado los créditos de hoy"
        }
    
    credits_to_claim = today_entry.get("credits", 0)
    if credits_to_claim <= 0:
        return {
            "success": False,
            "credits_claimed": 0,
            "credits_remaining": enrollment.get("credits_remaining", 0),
            "message": "No hay créditos disponibles para reclamar"
        }
    
    # Obtener max_credits
    max_credits = enrollment.get("max_credits", 0)
    if not max_credits:
        course = get_course(course_id)
        if course:
            max_credits_map = {
                2: 100,
                5: 250,
                10: 500,
                20: 1000,
                50: 2500
            }
            course_price = course.get("price", 0)
            max_credits = max_credits_map.get(course_price, 0)
            enrollment["max_credits"] = max_credits
    
    # Calcular créditos finales (no exceder el máximo)
    current_credits = enrollment.get("credits_remaining", 0)
    new_credits = min(current_credits + credits_to_claim, max_credits)
    actual_credits_claimed = new_credits - current_credits
    
    # Actualizar enrollment
    enrollment["credits_remaining"] = new_credits
    enrollment["credits_from_streak"] = enrollment.get("credits_from_streak", 0) + actual_credits_claimed
    enrollment["pending_credits"] = max(0, enrollment.get("pending_credits", 0) - actual_credits_claimed)
    today_entry["claimed"] = True
    today_entry["claimed_at"] = datetime.now().isoformat()
    
    print(f"[Claim Credits] ✅ Actualizando enrollment:")
    print(f"  - Créditos antes: {current_credits}")
    print(f"  - Créditos reclamados: {actual_credits_claimed}")
    print(f"  - Créditos después: {new_credits}")
    print(f"  - Máximo: {max_credits}")
    
    # Guardar cambios
    with open(enrollment_file, "w", encoding="utf-8") as f:
        json.dump(enrollments, f, ensure_ascii=False, indent=2)
    
    print(f"[Claim Credits] ✅ Archivo guardado correctamente")
    
    return {
        "success": True,
        "credits_claimed": actual_credits_claimed,
        "credits_remaining": new_credits,
        "message": f"¡Has reclamado {actual_credits_claimed} créditos!"
    }

