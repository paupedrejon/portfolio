"""
Sistema de seguimiento de progreso por conversación
Guarda el nivel de conocimiento del usuario en cada conversación (chat)
Cada conversación tiene un tema asociado que se detecta automáticamente
"""

import json
import os
from typing import Dict, Optional, List
from datetime import datetime

# Usar ruta absoluta para el archivo de progreso
import os
PROGRESS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "user_progress.json")

class ProgressTracker:
    """Gestiona el progreso de conocimiento por conversación (chat)"""
    
    def __init__(self):
        self.progress_file = PROGRESS_FILE
        print(f"📊 [ProgressTracker] Archivo de progreso: {self.progress_file}")
        self._ensure_file_exists()
    
    def _ensure_file_exists(self):
        """Asegura que el archivo de progreso existe"""
        if not os.path.exists(self.progress_file):
            with open(self.progress_file, 'w', encoding='utf-8') as f:
                json.dump({}, f, ensure_ascii=False, indent=2)
    
    def _load_progress(self) -> Dict:
        """Carga el progreso desde el archivo"""
        try:
            with open(self.progress_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}
    
    def _save_progress(self, progress: Dict):
        """Guarda el progreso en el archivo"""
        print(f"📊 [ProgressTracker] Guardando progreso en: {self.progress_file}")
        with open(self.progress_file, 'w', encoding='utf-8') as f:
            json.dump(progress, f, ensure_ascii=False, indent=2)
        print(f"📊 [ProgressTracker] Progreso guardado exitosamente")
    
    def get_user_progress(self, user_id: str) -> Dict:
        """Obtiene el progreso de un usuario"""
        progress = self._load_progress()
        return progress.get(user_id, {})
    
    def get_topic_level(self, user_id: str, topic: str) -> Dict:
        """Obtiene el nivel actual de un tema para un usuario"""
        user_progress = self.get_user_progress(user_id)
        topic_data = user_progress.get(topic, {
            "level": 0,  # Nivel 0 por defecto
            "experience": 0,
            "exercises_completed": 0,
            "tests_completed": 0,
            "last_updated": None
        })
        return topic_data
    
    def add_exercise_completion(self, user_id: str, topic: str, score: float, max_score: float, chat_id: Optional[str] = None) -> Dict:
        """
        Añade experiencia por completar un ejercicio
        Retorna información sobre si subió de nivel
        
        Lógica de niveles para ejercicios:
        - Menos de 3 (30%): baja 1 nivel
        - Más de 7 (70%): sube 1 nivel
        - Más de 8.5 (85%): sube 2 niveles
        
        Args:
            user_id: ID del usuario
            topic: Tema del ejercicio (se usa para detectar tema si chat_id no tiene tema)
            score: Puntuación obtenida
            max_score: Puntuación máxima posible
            chat_id: ID de la conversación (opcional, si se proporciona se usa en lugar de topic)
        """
        # Si se proporciona chat_id, usar sistema por conversación
        if chat_id:
            return self._add_exercise_completion_by_chat(user_id, chat_id, topic, score, max_score)
        
        # Sistema legacy por tema (mantener compatibilidad)
        print(f"📊 [ProgressTracker] add_exercise_completion (legacy): user_id={user_id}, topic={topic}, score={score}/{max_score}")
        progress = self._load_progress()
        
        if user_id not in progress:
            progress[user_id] = {}
        
        if topic not in progress[user_id]:
            progress[user_id][topic] = {
                "level": 0,  # Empezar en nivel 0
                "experience": 0,
                "exercises_completed": 0,
                "tests_completed": 0,
                "last_updated": None
            }
        
        topic_data = progress[user_id][topic]
        old_level = topic_data["level"]
        old_exp = topic_data["experience"]
        
        # Calcular porcentaje de aciertos
        score_percentage = (score / max_score) * 100 if max_score > 0 else 0
        
        # NUEVA LÓGICA BASADA EN RANGOS
        level_up = False
        level_down = False
        levels_changed = 0
        
        if score_percentage >= 85:
            # Más de 8.5 (85%): sube 2 niveles
            if old_level < 9:  # No puede subir más allá del nivel 10
                new_level = min(10, old_level + 2)
                level_up = True
                levels_changed = 2
                print(f"📊 [ProgressTracker] ¡Sube 2 niveles! {old_level} → {new_level} (score: {score_percentage:.1f}%)")
            elif old_level < 10:
                new_level = 10
                level_up = True
                levels_changed = 1
                print(f"📊 [ProgressTracker] ¡Sube 1 nivel! {old_level} → {new_level} (score: {score_percentage:.1f}%)")
            else:
                new_level = old_level
        elif score_percentage >= 70:
            # Más de 7 (70%): sube 1 nivel
            if old_level < 10:
                new_level = old_level + 1
                level_up = True
                levels_changed = 1
                print(f"📊 [ProgressTracker] ¡Sube 1 nivel! {old_level} → {new_level} (score: {score_percentage:.1f}%)")
            else:
                new_level = old_level
        elif score_percentage < 30:
            # Menos de 3 (30%): baja 1 nivel
            if old_level > 0:
                new_level = max(0, old_level - 1)
                level_down = True
                levels_changed = -1
                print(f"📊 [ProgressTracker] ⚠️ Baja 1 nivel: {old_level} → {new_level} (score: {score_percentage:.1f}%)")
            else:
                new_level = old_level
        else:
            # Entre 30% y 70%: mantener nivel actual
            new_level = old_level
            print(f"📊 [ProgressTracker] Nivel mantenido: {old_level} (score: {score_percentage:.1f}%)")
        
        # Calcular experiencia ganada (basado en la puntuación)
        # Score perfecto (100%) = 100 XP, score 50% = 50 XP, etc.
        experience_gained = int((score / max_score) * 100) if max_score > 0 else 0
        topic_data["experience"] += experience_gained
        topic_data["exercises_completed"] += 1
        topic_data["last_updated"] = datetime.now().isoformat()
        topic_data["level"] = new_level
        
        print(f"📊 [ProgressTracker] Experiencia: {old_exp} + {experience_gained} = {topic_data['experience']}")
        print(f"📊 [ProgressTracker] Nivel: {old_level} → {new_level} (exp: {topic_data['experience']})")
        
        # Guardar progreso
        progress[user_id][topic] = topic_data
        self._save_progress(progress)
        
        # Generar conceptos clave a repasar si subió de nivel
        key_concepts = []
        if level_up:
            key_concepts = self._get_key_concepts_for_level(topic, new_level)
        
        return {
            "level_up": level_up,
            "level_down": level_down,
            "levels_changed": levels_changed,  # Número de niveles cambiados (+2, +1, 0, -1)
            "old_level": old_level,
            "new_level": new_level,
            "experience_gained": experience_gained,
            "total_experience": topic_data["experience"],
            "topic": topic,
            "exercises_completed": topic_data["exercises_completed"],
            "key_concepts": key_concepts
        }
    
    def add_test_completion(self, user_id: str, topic: str, score_percentage: float, chat_id: Optional[str] = None) -> Dict:
        """
        Añade experiencia por completar un test
        Retorna información sobre si subió de nivel
        
        Args:
            user_id: ID del usuario
            topic: Tema del test (se usa para detectar tema si chat_id no tiene tema)
            score_percentage: Porcentaje de aciertos (0-100)
            chat_id: ID de la conversación (opcional, si se proporciona se usa en lugar de topic)
        """
        # Si se proporciona chat_id, usar sistema por conversación
        if chat_id:
            return self._add_test_completion_by_chat(user_id, chat_id, topic, score_percentage)
        
        # Sistema legacy por tema (mantener compatibilidad)
        print(f"📊 [ProgressTracker] add_test_completion (legacy): user_id={user_id}, topic={topic}, score_percentage={score_percentage}")
        progress = self._load_progress()
        print(f"📊 [ProgressTracker] Progreso cargado: {len(progress)} usuarios")
        
        if user_id not in progress:
            progress[user_id] = {}
            print(f"📊 [ProgressTracker] Nuevo usuario: {user_id}")
        
        if topic not in progress[user_id]:
            progress[user_id][topic] = {
                "level": 0,  # Empezar en nivel 0
                "experience": 0,
                "exercises_completed": 0,
                "tests_completed": 0,
                "consecutive_failures": 0,  # Contador de fallos consecutivos
                "last_updated": None
            }
            print(f"📊 [ProgressTracker] Nuevo tema: {topic}")
        
        topic_data = progress[user_id][topic]
        old_level = topic_data["level"]
        old_exp = topic_data["experience"]
        
        # NUEVA LÓGICA BASADA EN RANGOS PARA TESTS
        # - Menos de 4 (40%): baja 1 nivel
        # - Más de 7 (70%): sube 1 nivel
        # - Más de 9 (90%): sube 2 niveles
        level_up = False
        level_down = False
        levels_changed = 0
        
        if score_percentage >= 90:
            # Más de 9 (90%): sube 2 niveles
            if old_level < 9:  # No puede subir más allá del nivel 10
                new_level = min(10, old_level + 2)
                level_up = True
                levels_changed = 2
                print(f"📊 [ProgressTracker] ¡Sube 2 niveles! {old_level} → {new_level} (score: {score_percentage}%)")
            elif old_level < 10:
                new_level = 10
                level_up = True
                levels_changed = 1
                print(f"📊 [ProgressTracker] ¡Sube 1 nivel! {old_level} → {new_level} (score: {score_percentage}%)")
            else:
                new_level = old_level
        elif score_percentage >= 70:
            # Más de 7 (70%): sube 1 nivel
            if old_level < 10:
                new_level = old_level + 1
                level_up = True
                levels_changed = 1
                print(f"📊 [ProgressTracker] ¡Sube 1 nivel! {old_level} → {new_level} (score: {score_percentage}%)")
            else:
                new_level = old_level
        elif score_percentage < 40:
            # Menos de 4 (40%): baja 1 nivel
            if old_level > 0:
                new_level = max(0, old_level - 1)
                level_down = True
                levels_changed = -1
                print(f"📊 [ProgressTracker] ⚠️ Baja 1 nivel: {old_level} → {new_level} (score: {score_percentage}%)")
            else:
                new_level = old_level
        else:
            # Entre 40% y 70%: mantener nivel actual
            new_level = old_level
            print(f"📊 [ProgressTracker] Nivel mantenido: {old_level} (score: {score_percentage}%)")
        
        # Calcular experiencia ganada (basado en el porcentaje de aciertos)
        # 100% = 50 XP, 50% = 25 XP, etc.
        experience_gained = int((score_percentage / 100) * 50)
        topic_data["experience"] += experience_gained
        topic_data["tests_completed"] = topic_data.get("tests_completed", 0) + 1
        topic_data["last_updated"] = datetime.now().isoformat()
        topic_data["level"] = new_level
        
        print(f"📊 [ProgressTracker] Experiencia: {old_exp} + {experience_gained} = {topic_data['experience']}")
        print(f"📊 [ProgressTracker] Nivel: {old_level} → {new_level} (exp: {topic_data['experience']})")
        
        # Guardar progreso
        progress[user_id][topic] = topic_data
        self._save_progress(progress)
        print(f"📊 [ProgressTracker] Progreso guardado en: {self.progress_file}")
        
        # Generar conceptos clave a repasar si subió de nivel
        key_concepts = []
        if level_up:
            # Conceptos clave según el nivel (ejemplos genéricos, se pueden personalizar por tema)
            key_concepts = self._get_key_concepts_for_level(topic, new_level)
        
        result = {
            "level_up": level_up,
            "level_down": level_down,
            "levels_changed": levels_changed,  # Número de niveles cambiados (+2, +1, 0, -1)
            "old_level": old_level,
            "new_level": new_level,
            "experience_gained": experience_gained,
            "total_experience": topic_data["experience"],
            "topic": topic,
            "tests_completed": topic_data["tests_completed"],
            "key_concepts": key_concepts  # Conceptos clave a repasar
        }
        print(f"📊 [ProgressTracker] Resultado: {result}")
        return result
    
    def _get_key_concepts_for_level(self, topic: str, level: int) -> List[str]:
        """
        Retorna conceptos clave a repasar según el nivel alcanzado
        Estos conceptos se pueden personalizar por tema
        """
        # Conceptos genéricos por nivel (se pueden expandir con conceptos específicos por tema)
        concepts_by_level = {
            1: ["Conceptos básicos", "Fundamentos esenciales", "Principios fundamentales"],
            2: ["Aplicación básica", "Ejemplos prácticos", "Casos de uso simples"],
            3: ["Conceptos intermedios", "Técnicas básicas", "Mejores prácticas"],
            4: ["Aplicación intermedia", "Patrones comunes", "Optimización básica"],
            5: ["Conceptos avanzados", "Técnicas avanzadas", "Arquitectura"],
            6: ["Aplicación avanzada", "Patrones complejos", "Optimización avanzada"],
            7: ["Dominio experto", "Técnicas especializadas", "Diseño avanzado"],
            8: ["Maestría técnica", "Optimización experta", "Arquitectura compleja"],
            9: ["Nivel experto", "Técnicas de élite", "Diseño de sistemas"],
            10: ["Maestría total", "Dominio completo", "Excelencia técnica"]
        }
        
        # Retornar conceptos del nivel actual y anteriores para repaso
        concepts = []
        for lvl in range(1, min(level + 1, 11)):
            if lvl in concepts_by_level:
                concepts.extend(concepts_by_level[lvl])
        
        # Limitar a los más relevantes (últimos 5-7 conceptos)
        return concepts[-7:] if len(concepts) > 7 else concepts
    
    def add_chat_understanding(self, user_id: str, topic: str, understanding_score: float) -> Dict:
        """
        Añade experiencia basada en comprensión detectada en el chat
        understanding_score: 0.0 a 1.0 (0 = no entiende, 1 = entiende perfectamente)
        Retorna información sobre si subió de nivel
        """
        progress = self._load_progress()
        
        if user_id not in progress:
            progress[user_id] = {}
        
        if topic not in progress[user_id]:
            progress[user_id][topic] = {
                "level": 0,  # Empezar en nivel 0
                "experience": 0,
                "exercises_completed": 0,
                "tests_completed": 0,
                "last_updated": None
            }
        
        topic_data = progress[user_id][topic]
        old_level = topic_data["level"]
        
        # Calcular experiencia ganada (más conservador que ejercicios/tests)
        # understanding_score 1.0 = 10 XP, 0.5 = 5 XP, etc.
        experience_gained = int(understanding_score * 10)
        topic_data["experience"] += experience_gained
        topic_data["last_updated"] = datetime.now().isoformat()
        
        # Calcular nuevo nivel
        new_level = self._calculate_level(topic_data["experience"])
        topic_data["level"] = new_level
        
        # Guardar progreso
        progress[user_id][topic] = topic_data
        self._save_progress(progress)
        
        # Verificar si subió de nivel
        level_up = new_level > old_level
        
        return {
            "level_up": level_up,
            "old_level": old_level,
            "new_level": new_level,
            "experience_gained": experience_gained,
            "total_experience": topic_data["experience"],
            "topic": topic
        }
    
    def _calculate_level(self, exp: int) -> int:
        """
        Calcula el nivel basado en la experiencia
        Nivel 0: 0 XP (no sabe nada)
        Nivel 1: 1-100 XP
        Nivel 2: 100-250 XP
        ...
        Nivel 10: 2700+ XP (lo sabe todo)
        """
        if exp == 0:
            return 0
        elif exp < 100:
            return 1
        elif exp < 250:
            return 2
        elif exp < 450:
            return 3
        elif exp < 700:
            return 4
        elif exp < 1000:
            return 5
        elif exp < 1350:
            return 6
        elif exp < 1750:
            return 7
        elif exp < 2200:
            return 8
        elif exp < 2700:
            return 9
        else:
            return 10
    
    def get_all_topics(self, user_id: str) -> Dict[str, Dict]:
        """
        Obtiene todos los temas con su progreso para un usuario
        Incluye tanto los temas tradicionales como los niveles de las conversaciones (chats)
        """
        progress = self._load_progress()
        
        print(f"📊 [ProgressTracker] get_all_topics: user_id={user_id}")
        print(f"📊 [ProgressTracker] Progress keys: {list(progress.keys())}")
        
        if user_id not in progress:
            print(f"📊 [ProgressTracker] Usuario {user_id} no encontrado en progreso")
            return {}
        
        user_progress = progress[user_id]
        result = {}
        
        print(f"📊 [ProgressTracker] User progress keys: {list(user_progress.keys())}")
        
        # Primero, copiar los temas tradicionales (si existen)
        for key, value in user_progress.items():
            if key != "chats" and isinstance(value, dict) and "level" in value:
                result[key] = value.copy()
                print(f"📊 [ProgressTracker] Tema tradicional encontrado: {key} (nivel: {value.get('level', 0)})")
        
        # Luego, agregar los niveles de los chats agrupados por tema
        # Validar que los chats existan antes de incluirlos
        if "chats" in user_progress and isinstance(user_progress["chats"], dict):
            print(f"📊 [ProgressTracker] Encontrados {len(user_progress['chats'])} chats en progreso")
            
            # Importar chat_storage para validar existencia
            try:
                import sys
                import os
                parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                chat_storage_path = os.path.join(parent_dir, "chat_storage.py")
                if os.path.exists(chat_storage_path):
                    import importlib.util
                    spec = importlib.util.spec_from_file_location("chat_storage", chat_storage_path)
                    chat_storage = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(chat_storage)
                    
                    chats_to_remove = []
                    for chat_id, chat_data in user_progress["chats"].items():
                        # Validar que el chat existe
                        chat_file = chat_storage.get_chat_file_path(user_id, chat_id)
                        if not chat_file.exists():
                            print(f"📊 [ProgressTracker] Chat {chat_id} no existe, marcado para eliminar del progreso")
                            chats_to_remove.append(chat_id)
                            continue
                        
                        if isinstance(chat_data, dict) and "topic" in chat_data and chat_data["topic"]:
                            topic = chat_data["topic"]
                            chat_level = chat_data.get("level", 0)
                            
                            print(f"📊 [ProgressTracker] Chat {chat_id}: tema={topic}, nivel={chat_level}")
                            
                            # Si el tema ya existe, usar el nivel más alto entre el tema tradicional y los chats
                            if topic in result:
                                existing_level = result[topic].get("level", 0)
                                if chat_level > existing_level:
                                    result[topic]["level"] = chat_level
                                    print(f"📊 [ProgressTracker] Actualizado nivel de {topic}: {existing_level} -> {chat_level}")
                                # Combinar experiencia si existe
                                chat_exp = chat_data.get("experience", 0)
                                existing_exp = result[topic].get("experience", 0)
                                result[topic]["experience"] = max(existing_exp, chat_exp)
                            else:
                                # Si el tema no existe, crear una entrada nueva basada en el chat
                                result[topic] = {
                                    "level": chat_level,
                                    "experience": chat_data.get("experience", 0),
                                    "exercises_completed": chat_data.get("exercises_completed", 0),
                                    "tests_completed": chat_data.get("tests_completed", 0),
                                    "last_updated": chat_data.get("last_updated"),
                                }
                                print(f"📊 [ProgressTracker] Nuevo tema desde chat: {topic} (nivel: {chat_level})")
                        else:
                            print(f"📊 [ProgressTracker] Chat {chat_id} sin tema válido: {chat_data}")
                    
                    # Limpiar chats huérfanos del progreso
                    if chats_to_remove:
                        print(f"📊 [ProgressTracker] Limpiando {len(chats_to_remove)} chats huérfanos del progreso")
                        for chat_id in chats_to_remove:
                            del user_progress["chats"][chat_id]
                        self._save_progress(progress)
                        print(f"📊 [ProgressTracker] Chats huérfanos eliminados del progreso")
                else:
                    # Si no se puede importar chat_storage, usar lógica sin validación
                    print(f"📊 [ProgressTracker] No se pudo importar chat_storage, usando lógica sin validación")
                    for chat_id, chat_data in user_progress["chats"].items():
                        if isinstance(chat_data, dict) and "topic" in chat_data and chat_data["topic"]:
                            topic = chat_data["topic"]
                            chat_level = chat_data.get("level", 0)
                            
                            if topic in result:
                                existing_level = result[topic].get("level", 0)
                                if chat_level > existing_level:
                                    result[topic]["level"] = chat_level
                                chat_exp = chat_data.get("experience", 0)
                                existing_exp = result[topic].get("experience", 0)
                                result[topic]["experience"] = max(existing_exp, chat_exp)
                            else:
                                result[topic] = {
                                    "level": chat_level,
                                    "experience": chat_data.get("experience", 0),
                                    "exercises_completed": chat_data.get("exercises_completed", 0),
                                    "tests_completed": chat_data.get("tests_completed", 0),
                                    "last_updated": chat_data.get("last_updated"),
                                }
            except Exception as e:
                print(f"📊 [ProgressTracker] Error al validar chats: {e}")
                # En caso de error, usar lógica sin validación
                for chat_id, chat_data in user_progress["chats"].items():
                    if isinstance(chat_data, dict) and "topic" in chat_data and chat_data["topic"]:
                        topic = chat_data["topic"]
                        chat_level = chat_data.get("level", 0)
                        
                        if topic in result:
                            existing_level = result[topic].get("level", 0)
                            if chat_level > existing_level:
                                result[topic]["level"] = chat_level
                            chat_exp = chat_data.get("experience", 0)
                            existing_exp = result[topic].get("experience", 0)
                            result[topic]["experience"] = max(existing_exp, chat_exp)
                        else:
                            result[topic] = {
                                "level": chat_level,
                                "experience": chat_data.get("experience", 0),
                                "exercises_completed": chat_data.get("exercises_completed", 0),
                                "tests_completed": chat_data.get("tests_completed", 0),
                                "last_updated": chat_data.get("last_updated"),
                            }
        else:
            print(f"📊 [ProgressTracker] No se encontraron chats o no es un diccionario")
        
        print(f"📊 [ProgressTracker] Resultado final: {len(result)} temas - {list(result.keys())}")
        return result
    
    def get_chat_level(self, user_id: str, chat_id: str) -> Dict:
        """Obtiene el nivel actual de una conversación (chat) para un usuario"""
        progress = self._load_progress()
        if user_id not in progress:
            return {
                "level": 0,
                "experience": 0,
                "exercises_completed": 0,
                "tests_completed": 0,
                "topic": None,
                "last_updated": None
            }
        
        # Buscar en chats
        if "chats" not in progress[user_id]:
            progress[user_id]["chats"] = {}
        
        chat_data = progress[user_id]["chats"].get(chat_id, {
            "level": 0,
            "experience": 0,
            "exercises_completed": 0,
            "tests_completed": 0,
            "topic": None,
            "last_updated": None
        })
        return chat_data
    
    def set_chat_level(self, user_id: str, chat_id: str, level: int, topic: Optional[str] = None) -> Dict:
        """
        Establece manualmente el nivel de una conversación (chat) para un usuario
        
        Args:
            user_id: ID del usuario
            chat_id: ID de la conversación
            level: Nivel a establecer (0-10)
            topic: Tema de la conversación (opcional, se detecta si no se proporciona)
        
        Returns:
            Información sobre el nivel establecido
        """
        # Validar nivel
        level = max(0, min(10, int(level)))
        
        print(f"📊 [ProgressTracker] set_chat_level: user_id={user_id}, chat_id={chat_id}, level={level}, topic={topic}")
        progress = self._load_progress()
        
        if user_id not in progress:
            progress[user_id] = {"chats": {}}
        
        if "chats" not in progress[user_id]:
            progress[user_id]["chats"] = {}
        
        if chat_id not in progress[user_id]["chats"]:
            progress[user_id]["chats"][chat_id] = {
                "level": 0,
                "experience": 0,
                "exercises_completed": 0,
                "tests_completed": 0,
                "topic": topic or "General",
                "last_updated": None
            }
        
        chat_data = progress[user_id]["chats"][chat_id]
        old_level = chat_data["level"]
        
        # Actualizar nivel
        chat_data["level"] = level
        if topic:
            chat_data["topic"] = topic
        chat_data["last_updated"] = datetime.now().isoformat()
        
        # Guardar progreso
        progress[user_id]["chats"][chat_id] = chat_data
        self._save_progress(progress)
        
        print(f"📊 [ProgressTracker] Nivel establecido manualmente: {old_level} → {level}")
        
        return {
            "old_level": old_level,
            "new_level": level,
            "topic": chat_data.get("topic"),
            "chat_id": chat_id
        }
    
    def delete_chat_progress(self, user_id: str, chat_id: str) -> bool:
        """
        Elimina el progreso asociado a un chat cuando se elimina la conversación
        
        Args:
            user_id: ID del usuario
            chat_id: ID de la conversación a eliminar
            
        Returns:
            True si se eliminó correctamente, False si no existía
        """
        print(f"📊 [ProgressTracker] delete_chat_progress: user_id={user_id}, chat_id={chat_id}")
        progress = self._load_progress()
        
        if user_id not in progress:
            print(f"📊 [ProgressTracker] Usuario {user_id} no encontrado en progreso")
            return False
        
        if "chats" not in progress[user_id]:
            print(f"📊 [ProgressTracker] No hay chats en el progreso del usuario {user_id}")
            return False
        
        if chat_id not in progress[user_id]["chats"]:
            print(f"📊 [ProgressTracker] Chat {chat_id} no encontrado en el progreso")
            return False
        
        # Eliminar el chat del progreso
        del progress[user_id]["chats"][chat_id]
        self._save_progress(progress)
        
        print(f"📊 [ProgressTracker] Progreso del chat {chat_id} eliminado correctamente")
        return True
    
    def detect_topic_from_messages(self, messages: list) -> str:
        """Detecta el tema principal de una conversación basado en los mensajes"""
        if not messages:
            return "General"
        
        # Analizar los últimos mensajes para detectar el tema
        recent_messages = messages[-10:] if len(messages) > 10 else messages
        content = " ".join([msg.get("content", "") for msg in recent_messages]).lower()
        
        # Detectar temas técnicos PRIMERO (antes de idiomas para evitar falsos positivos)
        # NoSQL debe detectarse ANTES que Japonés para evitar confusión
        if "nosql" in content or "no-sql" in content or "no sql" in content or ("non-relational" in content and "database" in content):
            return "NoSQL"
        elif "mongodb" in content or "cassandra" in content or "redis" in content or "dynamodb" in content:
            return "NoSQL"
        elif "sql" in content or "database" in content or "query" in content or "relational" in content:
            return "SQL"
        elif "python" in content:
            return "Python"
        elif "javascript" in content or "js" in content:
            return "JavaScript"
        elif "react" in content:
            return "React"
        elif "api" in content or "apis" in content:
            return "APIs"
        # Detectar idiomas SOLO si hay contexto claro de aprendizaje de idiomas
        # Requiere palabras específicas de idiomas para evitar falsos positivos
        elif ("japonés" in content or "japones" in content) and ("hiragana" in content or "katakana" in content or "kanji" in content or "nihongo" in content or "aprender" in content or "vocabulario" in content):
            return "Japonés"
        elif "matemáticas" in content or "matematicas" in content or "math" in content:
            return "Matemáticas"
        elif "física" in content or "fisica" in content or "physics" in content:
            return "Física"
        elif "química" in content or "quimica" in content or "chemistry" in content:
            return "Química"
        else:
            return "General"
    
    def _add_test_completion_by_chat(self, user_id: str, chat_id: str, topic: str, score_percentage: float) -> Dict:
        """
        Añade experiencia por completar un test en una conversación específica
        """
        print(f"📊 [ProgressTracker] add_test_completion_by_chat: user_id={user_id}, chat_id={chat_id}, topic={topic}, score_percentage={score_percentage}")
        progress = self._load_progress()
        
        if user_id not in progress:
            progress[user_id] = {"chats": {}}
            print(f"📊 [ProgressTracker] Nuevo usuario: {user_id}")
        
        if "chats" not in progress[user_id]:
            progress[user_id]["chats"] = {}
        
        if chat_id not in progress[user_id]["chats"]:
            progress[user_id]["chats"][chat_id] = {
                "level": 0,  # Empezar en nivel 0
                "experience": 0,
                "exercises_completed": 0,
                "tests_completed": 0,
                "topic": topic,  # Guardar el tema detectado
                "last_updated": None
            }
            print(f"📊 [ProgressTracker] Nueva conversación: {chat_id} (tema: {topic})")
        
        chat_data = progress[user_id]["chats"][chat_id]
        old_level = chat_data["level"]
        old_exp = chat_data["experience"]
        
        # Actualizar tema si es más específico
        if not chat_data.get("topic") or chat_data["topic"] == "General":
            chat_data["topic"] = topic
        
        # NUEVA LÓGICA BASADA EN RANGOS PARA TESTS
        # - Menos de 4 (40%): baja 1 nivel
        # - Más de 7 (70%): sube 1 nivel
        # - Más de 9 (90%): sube 2 niveles
        level_up = False
        level_down = False
        levels_changed = 0
        
        if score_percentage >= 90:
            # Más de 9 (90%): sube 2 niveles
            if old_level < 9:  # No puede subir más allá del nivel 10
                new_level = min(10, old_level + 2)
                level_up = True
                levels_changed = 2
                print(f"📊 [ProgressTracker] ¡Sube 2 niveles! {old_level} → {new_level} (score: {score_percentage}%)")
            elif old_level < 10:
                new_level = 10
                level_up = True
                levels_changed = 1
                print(f"📊 [ProgressTracker] ¡Sube 1 nivel! {old_level} → {new_level} (score: {score_percentage}%)")
            else:
                new_level = old_level
        elif score_percentage >= 70:
            # Más de 7 (70%): sube 1 nivel
            if old_level < 10:
                new_level = old_level + 1
                level_up = True
                levels_changed = 1
                print(f"📊 [ProgressTracker] ¡Sube 1 nivel! {old_level} → {new_level} (score: {score_percentage}%)")
            else:
                new_level = old_level
        elif score_percentage < 40:
            # Menos de 4 (40%): baja 1 nivel
            if old_level > 0:
                new_level = max(0, old_level - 1)
                level_down = True
                levels_changed = -1
                print(f"📊 [ProgressTracker] ⚠️ Baja 1 nivel: {old_level} → {new_level} (score: {score_percentage}%)")
            else:
                new_level = old_level
        else:
            # Entre 40% y 70%: mantener nivel actual
            new_level = old_level
            print(f"📊 [ProgressTracker] Nivel mantenido: {old_level} (score: {score_percentage}%)")
        
        # Calcular experiencia ganada
        experience_gained = int((score_percentage / 100) * 50)
        chat_data["experience"] += experience_gained
        chat_data["tests_completed"] = chat_data.get("tests_completed", 0) + 1
        chat_data["last_updated"] = datetime.now().isoformat()
        chat_data["level"] = new_level
        
        print(f"📊 [ProgressTracker] Experiencia: {old_exp} + {experience_gained} = {chat_data['experience']}")
        print(f"📊 [ProgressTracker] Nivel: {old_level} → {new_level} (exp: {chat_data['experience']})")
        
        # Guardar progreso
        progress[user_id]["chats"][chat_id] = chat_data
        self._save_progress(progress)
        
        # Generar conceptos clave a repasar si subió de nivel
        key_concepts = []
        if level_up:
            key_concepts = self._get_key_concepts_for_level(chat_data["topic"] or topic, new_level)
        
        result = {
            "level_up": level_up,
            "level_down": level_down,
            "levels_changed": levels_changed,
            "old_level": old_level,
            "new_level": new_level,
            "experience_gained": experience_gained,
            "total_experience": chat_data["experience"],
            "topic": chat_data["topic"] or topic,
            "chat_id": chat_id,
            "tests_completed": chat_data["tests_completed"],
            "key_concepts": key_concepts
        }
        print(f"📊 [ProgressTracker] Resultado: {result}")
        return result
    
    def _add_exercise_completion_by_chat(self, user_id: str, chat_id: str, topic: str, score: float, max_score: float) -> Dict:
        """
        Añade experiencia por completar un ejercicio en una conversación específica
        """
        print(f"📊 [ProgressTracker] add_exercise_completion_by_chat: user_id={user_id}, chat_id={chat_id}, topic={topic}, score={score}/{max_score}")
        progress = self._load_progress()
        
        if user_id not in progress:
            progress[user_id] = {"chats": {}}
        
        if "chats" not in progress[user_id]:
            progress[user_id]["chats"] = {}
        
        if chat_id not in progress[user_id]["chats"]:
            progress[user_id]["chats"][chat_id] = {
                "level": 0,
                "experience": 0,
                "exercises_completed": 0,
                "tests_completed": 0,
                "topic": topic,
                "last_updated": None
            }
            print(f"📊 [ProgressTracker] Nueva conversación: {chat_id} (tema: {topic})")
        
        chat_data = progress[user_id]["chats"][chat_id]
        old_level = chat_data["level"]
        old_exp = chat_data["experience"]
        
        # Actualizar tema si es más específico
        if not chat_data.get("topic") or chat_data["topic"] == "General":
            chat_data["topic"] = topic
        
        # Calcular porcentaje de aciertos
        score_percentage = (score / max_score) * 100 if max_score > 0 else 0
        
        # NUEVA LÓGICA BASADA EN RANGOS PARA EJERCICIOS
        # - Menos de 3 (30%): baja 1 nivel
        # - Más de 7 (70%): sube 1 nivel
        # - Más de 8.5 (85%): sube 2 niveles
        level_up = False
        level_down = False
        levels_changed = 0
        
        if score_percentage >= 85:
            # Más de 8.5 (85%): sube 2 niveles
            if old_level < 9:
                new_level = min(10, old_level + 2)
                level_up = True
                levels_changed = 2
                print(f"📊 [ProgressTracker] ¡Sube 2 niveles! {old_level} → {new_level} (score: {score_percentage:.1f}%)")
            elif old_level < 10:
                new_level = 10
                level_up = True
                levels_changed = 1
                print(f"📊 [ProgressTracker] ¡Sube 1 nivel! {old_level} → {new_level} (score: {score_percentage:.1f}%)")
            else:
                new_level = old_level
        elif score_percentage >= 70:
            # Más de 7 (70%): sube 1 nivel
            if old_level < 10:
                new_level = old_level + 1
                level_up = True
                levels_changed = 1
                print(f"📊 [ProgressTracker] ¡Sube 1 nivel! {old_level} → {new_level} (score: {score_percentage:.1f}%)")
            else:
                new_level = old_level
        elif score_percentage < 30:
            # Menos de 3 (30%): baja 1 nivel
            if old_level > 0:
                new_level = max(0, old_level - 1)
                level_down = True
                levels_changed = -1
                print(f"📊 [ProgressTracker] ⚠️ Baja 1 nivel: {old_level} → {new_level} (score: {score_percentage:.1f}%)")
            else:
                new_level = old_level
        else:
            # Entre 30% y 70%: mantener nivel actual
            new_level = old_level
            print(f"📊 [ProgressTracker] Nivel mantenido: {old_level} (score: {score_percentage:.1f}%)")
        
        # Calcular experiencia ganada
        experience_gained = int((score / max_score) * 100) if max_score > 0 else 0
        chat_data["experience"] += experience_gained
        chat_data["exercises_completed"] += 1
        chat_data["last_updated"] = datetime.now().isoformat()
        chat_data["level"] = new_level
        
        print(f"📊 [ProgressTracker] Experiencia: {old_exp} + {experience_gained} = {chat_data['experience']}")
        print(f"📊 [ProgressTracker] Nivel: {old_level} → {new_level} (exp: {chat_data['experience']})")
        
        # Guardar progreso
        progress[user_id]["chats"][chat_id] = chat_data
        self._save_progress(progress)
        
        # Generar conceptos clave a repasar si subió de nivel
        key_concepts = []
        if level_up:
            key_concepts = self._get_key_concepts_for_level(chat_data["topic"] or topic, new_level)
        
        return {
            "level_up": level_up,
            "level_down": level_down,
            "levels_changed": levels_changed,
            "old_level": old_level,
            "new_level": new_level,
            "experience_gained": experience_gained,
            "total_experience": chat_data["experience"],
            "topic": chat_data["topic"] or topic,
            "chat_id": chat_id,
            "exercises_completed": chat_data["exercises_completed"],
            "key_concepts": key_concepts
        }

