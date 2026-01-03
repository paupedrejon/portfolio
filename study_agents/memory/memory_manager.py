"""
Memory Manager - Gestiona la memoria del sistema con RAG
Usa ChromaDB para almacenar y recuperar documentos con embeddings
"""

from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
import os
from dotenv import load_dotenv

load_dotenv()

class MemoryManager:
    """
    Gestiona la memoria del sistema usando ChromaDB para RAG con embeddings
    """
    
    def __init__(self, memory_type: str = "StudyAgents", api_key: Optional[str] = None):
        """
        Inicializa el gestor de memoria
        
        Args:
            memory_type: Tipo de memoria (por defecto "StudyAgents")
            api_key: API key de OpenAI para embeddings (opcional)
        """
        self.memory_type = memory_type
        
        # Usar API key proporcionada o de entorno
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        
        # Configurar función de embeddings
        if self.api_key:
            embedding_function = embedding_functions.OpenAIEmbeddingFunction(
                api_key=self.api_key,
                model_name="text-embedding-3-small"
            )
        else:
            # Usar embeddings por defecto si no hay API key
            embedding_function = embedding_functions.DefaultEmbeddingFunction()
        
        # Inicializar ChromaDB
        self.client = chromadb.PersistentClient(
            path="./chroma_db"
        )
        
        # Intentar obtener la colección existente primero
        try:
            self.collection = self.client.get_collection(
                name="study_content"
            )
            # Si existe, verificar que la función de embedding sea compatible
            print("📚 Colección existente encontrada")
        except Exception:
            # Si no existe, crear una nueva con la función de embedding especificada
            try:
                self.collection = self.client.create_collection(
                    name="study_content",
                    embedding_function=embedding_function,
                    metadata={"description": "Contenido educativo procesado"}
                )
                print("✨ Nueva colección creada")
            except Exception as e:
                # Si falla, puede ser por conflicto de embedding function
                # Eliminar y recrear
                try:
                    self.client.delete_collection(name="study_content")
                    print("🗑️ Colección anterior eliminada (conflicto de embedding)")
                except:
                    pass
                self.collection = self.client.create_collection(
                    name="study_content",
                    embedding_function=embedding_function,
                    metadata={"description": "Contenido educativo procesado"}
                )
                print("✨ Nueva colección creada después de limpiar conflicto")
        
        # Historial de conversación por usuario (en memoria por ahora)
        self.conversation_histories: Dict[str, List[Dict[str, str]]] = {}
        
        print(f"💾 Memoria inicializada: {memory_type}")
        if self.api_key:
            print("✅ Usando embeddings de OpenAI")
    
    def get_memory_type(self) -> str:
        """Retorna el tipo de memoria"""
        return self.memory_type
    
    def store_documents(self, documents: List[str], metadatas: Optional[List[Dict]] = None):
        """
        Almacena documentos en la memoria con embeddings
        
        Args:
            documents: Lista de textos de documentos
            metadatas: Metadatos opcionales para cada documento
        """
        if not documents:
            return
        
        if metadatas is None:
            metadatas = [{}] * len(documents)
        
        # Generar IDs únicos
        existing_count = self.collection.count()
        ids = [f"doc_{existing_count + i}" for i in range(len(documents))]
        
        # Añadir documentos con embeddings automáticos
        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        
        print(f"📚 {len(documents)} documentos almacenados en memoria")
    
    def retrieve_relevant_content(self, query: str, n_results: int = 5) -> List[str]:
        """
        Recupera contenido relevante para una consulta usando búsqueda semántica
        
        Args:
            query: Consulta de búsqueda
            n_results: Número de resultados a retornar
            
        Returns:
            Lista de documentos relevantes
        """
        # Verificar si hay documentos en la colección
        collection_count = self.collection.count()
        if collection_count == 0:
            # No hay documentos, retornar lista vacía sin intentar búsqueda
            return []
        
        if not query.strip():
            # Si la query está vacía, retornar algunos documentos aleatorios
            results = self.collection.get(limit=min(n_results, collection_count))
            documents = results.get('documents', [])
            # Asegurarse de que es una lista plana
            if documents and isinstance(documents, list):
                return documents if isinstance(documents[0], str) else []
            return []
        
        try:
            # Asegurarse de que n_results sea al menos 1 y no mayor que el número de documentos
            safe_n_results = max(1, min(n_results, collection_count))
            
            results = self.collection.query(
                query_texts=[query],
                n_results=safe_n_results
            )
            
            documents = results.get('documents', [])
            # ChromaDB retorna documents como lista de listas: [['doc1', 'doc2', ...]]
            # Necesitamos extraer la primera lista interna
            if documents and len(documents) > 0:
                # documents es una lista de listas, tomar la primera
                doc_list = documents[0] if isinstance(documents[0], list) else documents
                # Asegurarse de que es una lista de strings
                if isinstance(doc_list, list):
                    return [str(doc) for doc in doc_list if doc]
                return []
            return []
        except Exception as e:
            print(f"⚠️ Error al buscar contenido: {e}")
            # Fallback: retornar algunos documentos si hay disponibles
            if collection_count > 0:
                try:
                    results = self.collection.get(limit=min(n_results, collection_count))
                    documents = results.get('documents', [])
                    # Asegurarse de que es una lista plana
                    if documents and isinstance(documents, list):
                        return documents if isinstance(documents[0], str) else []
                except Exception as e2:
                    print(f"⚠️ Error en fallback: {e2}")
            return []
    
    def get_conversation_history(self, user_id: str) -> List[Dict]:
        """
        Obtiene el historial de conversación de un usuario
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Historial de conversación
        """
        return self.conversation_histories.get(user_id, [])
    
    def add_to_conversation_history(self, user_id: str, role: str, content: str):
        """
        Añade un mensaje al historial de conversación
        
        Args:
            user_id: ID del usuario
            role: Rol (user/assistant/system)
            content: Contenido del mensaje
        """
        if user_id not in self.conversation_histories:
            self.conversation_histories[user_id] = []
        
        self.conversation_histories[user_id].append({
            "role": role,
            "content": content
        })
        
        # Limitar historial a últimos 50 mensajes
        if len(self.conversation_histories[user_id]) > 50:
            self.conversation_histories[user_id] = self.conversation_histories[user_id][-50:]
    
    def clear_conversation_history(self, user_id: str):
        """
        Limpia el historial de conversación de un usuario
        
        Args:
            user_id: ID del usuario
        """
        if user_id in self.conversation_histories:
            self.conversation_histories[user_id] = []
    
    def get_all_documents(self, limit: int = 100) -> List[str]:
        """
        Obtiene todos los documentos almacenados
        
        Args:
            limit: Límite de documentos a retornar
            
        Returns:
            Lista de documentos
        """
        try:
            count = self.collection.count()
            print(f"📚 Total de documentos en memoria: {count}")
            
            if count == 0:
                print("⚠️ No hay documentos en la colección")
                return []
            
            results = self.collection.get(limit=min(limit, count))
            documents = results.get('documents', [])
            
            # Filtrar documentos vacíos
            valid_documents = [doc for doc in documents if doc and doc.strip()]
            
            print(f"📚 Documentos recuperados: {len(valid_documents)} de {len(documents)} (válidos)")
            if valid_documents:
                print(f"📄 Primer documento (primeros 100 chars): {valid_documents[0][:100]}...")
            
            return valid_documents
        except Exception as e:
            print(f"❌ Error al obtener documentos: {e}")
            return []
    
    def clear_all_documents(self):
        """
        Elimina todos los documentos de la memoria
        
        Nota: Esto elimina todos los documentos pero mantiene la colección.
        La colección se puede seguir usando después de limpiar.
        """
        try:
            # Obtener todos los IDs de documentos
            results = self.collection.get()
            ids = results.get('ids', [])
            
            if ids:
                # Eliminar todos los documentos por sus IDs
                self.collection.delete(ids=ids)
                print(f"🗑️ {len(ids)} documentos eliminados de la memoria")
            else:
                print("ℹ️ No hay documentos para eliminar")
        except Exception as e:
            print(f"⚠️ Error al limpiar documentos: {e}")
            # Si falla, intentar eliminar la colección y recrearla
            try:
                self.client.delete_collection(name="study_content")
                # Recrear la colección
                if self.api_key:
                    embedding_function = embedding_functions.OpenAIEmbeddingFunction(
                        api_key=self.api_key,
                        model_name="text-embedding-3-small"
                    )
                else:
                    embedding_function = embedding_functions.DefaultEmbeddingFunction()
                
                self.collection = self.client.create_collection(
                    name="study_content",
                    embedding_function=embedding_function,
                    metadata={"description": "Contenido educativo procesado"}
                )
                print("✨ Colección recreada después de limpiar")
            except Exception as e2:
                print(f"❌ Error crítico al limpiar: {e2}")

            if count == 0:
                print("⚠️ No hay documentos en la colección")
                return []
            
            results = self.collection.get(limit=min(limit, count))
            documents = results.get('documents', [])
            
            # Filtrar documentos vacíos
            valid_documents = [doc for doc in documents if doc and doc.strip()]
            
            print(f"📚 Documentos recuperados: {len(valid_documents)} de {len(documents)} (válidos)")
            if valid_documents:
                print(f"📄 Primer documento (primeros 100 chars): {valid_documents[0][:100]}...")
            
            return valid_documents
        except Exception as e:
            print(f"❌ Error al obtener documentos: {e}")
            return []
    
    def clear_all_documents(self):
        """
        Elimina todos los documentos de la memoria
        
        Nota: Esto elimina todos los documentos pero mantiene la colección.
        La colección se puede seguir usando después de limpiar.
        """
        try:
            # Obtener todos los IDs de documentos
            results = self.collection.get()
            ids = results.get('ids', [])
            
            if ids:
                # Eliminar todos los documentos por sus IDs
                self.collection.delete(ids=ids)
                print(f"🗑️ {len(ids)} documentos eliminados de la memoria")
            else:
                print("ℹ️ No hay documentos para eliminar")
        except Exception as e:
            print(f"⚠️ Error al limpiar documentos: {e}")
            # Si falla, intentar eliminar la colección y recrearla
            try:
                self.client.delete_collection(name="study_content")
                # Recrear la colección con la misma función de embeddings
                embedding_function = self._build_embedding_function()
                self.collection = self.client.create_collection(
                    name="study_content",
                    embedding_function=embedding_function,
                    metadata={"description": "Contenido educativo procesado"}
                )
                print("✨ Colección recreada después de limpiar")
            except Exception as e2:
                print(f"❌ Error crítico al limpiar: {e2}")
    
    def save_test_result(self, user_id: str, test_id: str, score: float, 
                         difficulty: str, num_questions: int, correct: int, 
                         total: int, topics: Optional[List[str]] = None,
                         feedback: Optional[Dict] = None) -> bool:
        """
        Guarda el resultado de un test para tracking de progreso
        
        Args:
            user_id: ID del usuario
            test_id: ID del test
            score: Puntuación (0.0 a 1.0)
            difficulty: Dificultad del test (easy, medium, hard)
            num_questions: Número de preguntas
            correct: Número de respuestas correctas
            total: Total de preguntas
            topics: Temas del test (opcional)
            
        Returns:
            True si se guardó correctamente
        """
        try:
            result_data = {
                "user_id": user_id,
                "test_id": test_id,
                "score": score,
                "difficulty": difficulty,
                "num_questions": num_questions,
                "correct": correct,
                "total": total,
                "topics": topics or [],
                "feedback": feedback or {},
                "timestamp": datetime.now().isoformat()
            }
            
            # Guardar en ChromaDB si está disponible
            if self.progress_collection:
                result_id = f"{user_id}_{test_id}_{uuid.uuid4().hex[:8]}"
                self.progress_collection.add(
                    documents=[json.dumps(result_data)],
                    metadatas=[{
                        "user_id": user_id,
                        "test_id": test_id,
                        "score": str(score),
                        "difficulty": difficulty,
                        "timestamp": result_data["timestamp"]
                    }],
                    ids=[result_id]
                )
            
            # También guardar en cache en memoria
            if user_id not in self.progress_cache:
                self.progress_cache[user_id] = []
            self.progress_cache[user_id].append(result_data)
            
            # Limitar cache a últimos 100 resultados
            if len(self.progress_cache[user_id]) > 100:
                self.progress_cache[user_id] = self.progress_cache[user_id][-100:]
            
            print(f"📊 Resultado guardado: {user_id} - {score:.2%} ({difficulty})")
            return True
        except Exception as e:
            print(f"⚠️ Error al guardar resultado: {e}")
            # Fallback: solo guardar en memoria
            if user_id not in self.progress_cache:
                self.progress_cache[user_id] = []
            self.progress_cache[user_id].append({
                "user_id": user_id,
                "test_id": test_id,
                "score": score,
                "difficulty": difficulty,
                "num_questions": num_questions,
                "correct": correct,
                "total": total,
                "topics": topics or [],
                "feedback": feedback or {},
                "timestamp": datetime.now().isoformat()
            })
            return True
    
    def get_user_progress(self, user_id: str, limit: int = 50) -> List[Dict]:
        """
        Obtiene el historial de progreso de un usuario
        
        Args:
            user_id: ID del usuario
            limit: Número máximo de resultados a retornar
            
        Returns:
            Lista de resultados de tests ordenados por fecha (más reciente primero)
        """
        results = []
        
        # Intentar obtener de ChromaDB
        if self.progress_collection:
            try:
                db_results = self.progress_collection.get(
                    where={"user_id": user_id},
                    limit=limit
                )
                if db_results and db_results.get('documents'):
                    for doc in db_results['documents']:
                        try:
                            result = json.loads(doc)
                            results.append(result)
                        except:
                            pass
            except Exception as e:
                print(f"⚠️ Error al obtener progreso de ChromaDB: {e}")
        
        # Combinar con cache en memoria
        if user_id in self.progress_cache:
            results.extend(self.progress_cache[user_id])
        
        # Eliminar duplicados y ordenar por timestamp
        seen = set()
        unique_results = []
        for result in results:
            key = (result.get("test_id"), result.get("timestamp"))
            if key not in seen:
                seen.add(key)
                unique_results.append(result)
        
        # Ordenar por timestamp (más reciente primero)
        unique_results.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return unique_results[:limit]
    
    def get_user_performance_metrics(self, user_id: str) -> Dict[str, Any]:
        """
        Calcula métricas de rendimiento del usuario para adaptación de dificultad
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Diccionario con métricas:
            - average_score: Puntuación promedio
            - recent_average: Puntuación promedio de últimos 5 tests
            - total_tests: Total de tests realizados
            - difficulty_distribution: Distribución por dificultad
            - trend: Tendencia (improving, stable, declining)
            - recommended_difficulty: Dificultad recomendada
        """
        progress = self.get_user_progress(user_id, limit=50)
        
        if not progress:
            return {
                "average_score": 0.0,
                "recent_average": 0.0,
                "total_tests": 0,
                "difficulty_distribution": {},
                "trend": "stable",
                "recommended_difficulty": "medium"
            }
        
        # Calcular promedio general
        scores = [r["score"] for r in progress]
        average_score = sum(scores) / len(scores) if scores else 0.0
        
        # Calcular promedio reciente (últimos 5)
        recent_scores = scores[:5]
        recent_average = sum(recent_scores) / len(recent_scores) if recent_scores else 0.0
        
        # Distribución por dificultad
        difficulty_distribution = {}
        for result in progress:
            diff = result.get("difficulty", "medium")
            difficulty_distribution[diff] = difficulty_distribution.get(diff, 0) + 1
        
        # Calcular tendencia (comparar últimos 5 con anteriores 5)
        if len(scores) >= 10:
            recent_5 = sum(scores[:5]) / 5
            previous_5 = sum(scores[5:10]) / 5
            if recent_5 > previous_5 + 0.1:
                trend = "improving"
            elif recent_5 < previous_5 - 0.1:
                trend = "declining"
            else:
                trend = "stable"
        elif len(scores) >= 5:
            # Si hay menos de 10, comparar primeros vs últimos
            first_half = sum(scores[len(scores)//2:]) / (len(scores) - len(scores)//2)
            second_half = sum(scores[:len(scores)//2]) / (len(scores)//2)
            if second_half > first_half + 0.1:
                trend = "improving"
            elif second_half < first_half - 0.1:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "stable"
        
        # Recomendar dificultad basada en rendimiento reciente
        if recent_average >= 0.8:
            recommended_difficulty = "hard"
        elif recent_average >= 0.6:
            recommended_difficulty = "medium"
        else:
            recommended_difficulty = "easy"
        
        return {
            "average_score": average_score,
            "recent_average": recent_average,
            "total_tests": len(progress),
            "difficulty_distribution": difficulty_distribution,
            "trend": trend,
            "recommended_difficulty": recommended_difficulty
        }
    
    def get_progress_by_topic(self, user_id: str) -> Dict[str, Dict[str, Any]]:
        """
        Obtiene el progreso agrupado por tema
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Diccionario con progreso por tema
        """
        progress = self.get_user_progress(user_id, limit=1000)
        topic_progress = {}
        
        for result in progress:
            topics = result.get("topics", [])
            if not topics:
                topics = ["General"]
            
            for topic in topics:
                if topic not in topic_progress:
                    topic_progress[topic] = {
                        "scores": [],
                        "dates": [],
                        "difficulties": [],
                        "total_tests": 0,
                        "average_score": 0.0,
                        "trend": "stable"
                    }
                
                topic_progress[topic]["scores"].append(result["score"])
                topic_progress[topic]["dates"].append(result["timestamp"])
                topic_progress[topic]["difficulties"].append(result["difficulty"])
                topic_progress[topic]["total_tests"] += 1
        
        # Calcular promedios y tendencias por tema
        for topic, data in topic_progress.items():
            if data["scores"]:
                data["average_score"] = sum(data["scores"]) / len(data["scores"])
                
                # Calcular tendencia (comparar primeros vs últimos)
                if len(data["scores"]) >= 4:
                    first_half = sum(data["scores"][len(data["scores"])//2:]) / (len(data["scores"]) - len(data["scores"])//2)
                    second_half = sum(data["scores"][:len(data["scores"])//2]) / (len(data["scores"])//2)
                    if second_half > first_half + 0.1:
                        data["trend"] = "improving"
                    elif second_half < first_half - 0.1:
                        data["trend"] = "declining"
                    else:
                        data["trend"] = "stable"
        
        return topic_progress
    
    def get_temporal_progress(self, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """
        Obtiene el progreso temporal del usuario
        
        Args:
            user_id: ID del usuario
            days: Número de días a analizar
            
        Returns:
            Lista de progreso diario
        """
        from datetime import timedelta
        
        progress = self.get_user_progress(user_id, limit=1000)
        
        # Agrupar por día
        daily_progress = {}
        cutoff_date = datetime.now() - timedelta(days=days)
        
        for result in progress:
            try:
                result_date = datetime.fromisoformat(result["timestamp"].replace('Z', '+00:00'))
                if result_date.tzinfo:
                    result_date = result_date.replace(tzinfo=None)
                
                if result_date < cutoff_date:
                    continue
                
                date_key = result_date.date().isoformat()
                
                if date_key not in daily_progress:
                    daily_progress[date_key] = {
                        "date": date_key,
                        "scores": [],
                        "tests_count": 0,
                        "topics": set()
                    }
                
                daily_progress[date_key]["scores"].append(result["score"])
                daily_progress[date_key]["tests_count"] += 1
                daily_progress[date_key]["topics"].update(result.get("topics", []))
            except Exception as e:
                print(f"⚠️ Error procesando fecha: {e}")
                continue
        
        # Convertir a lista y calcular promedios
        temporal_data = []
        for date_key in sorted(daily_progress.keys()):
            day_data = daily_progress[date_key]
            temporal_data.append({
                "date": date_key,
                "average_score": sum(day_data["scores"]) / len(day_data["scores"]) if day_data["scores"] else 0.0,
                "tests_count": day_data["tests_count"],
                "topics_count": len(day_data["topics"])
            })
        
        return temporal_data
    
    def predict_mastery_time(self, user_id: str, topic: Optional[str] = None) -> Dict[str, Any]:
        """
        Predice el tiempo necesario para dominar un concepto/tema
        
        Args:
            user_id: ID del usuario
            topic: Tema específico (opcional, si no se proporciona analiza todos)
            
        Returns:
            Diccionario con predicción de tiempo
        """
        if topic:
            topic_progress = self.get_progress_by_topic(user_id)
            if topic not in topic_progress:
                return {
                    "topic": topic,
                    "current_mastery": 0.0,
                    "predicted_days": None,
                    "confidence": "low",
                    "message": "No hay datos suficientes para este tema"
                }
            
            data = topic_progress[topic]
        else:
            metrics = self.get_user_performance_metrics(user_id)
            data = {
                "scores": [metrics["average_score"]],
                "total_tests": metrics["total_tests"]
            }
        
        if not data.get("scores") or len(data["scores"]) < 3:
            return {
                "topic": topic or "General",
                "current_mastery": data.get("average_score", 0.0) if isinstance(data, dict) and "average_score" in data else 0.0,
                "predicted_days": None,
                "confidence": "low",
                "message": "Se necesitan al menos 3 tests para hacer una predicción"
            }
        
        # Calcular tasa de mejora
        scores = data["scores"]
        if len(scores) >= 3:
            # Calcular pendiente de mejora
            recent_scores = scores[:min(5, len(scores))]
            improvement_rate = 0.0
            
            if len(recent_scores) >= 2:
                # Calcular mejora promedio por test
                improvements = []
                for i in range(1, len(recent_scores)):
                    improvement = recent_scores[i-1] - recent_scores[i]
                    improvements.append(improvement)
                
                if improvements:
                    improvement_rate = sum(improvements) / len(improvements)
            
            current_mastery = scores[0] if scores else 0.0
            target_mastery = 0.85  # 85% considerado dominio
            
            if improvement_rate > 0:
                # Calcular días necesarios
                points_needed = target_mastery - current_mastery
                tests_needed = points_needed / improvement_rate if improvement_rate > 0 else None
                
                # Asumir 1 test cada 2 días en promedio
                days_needed = tests_needed * 2 if tests_needed else None
                
                # Calcular confianza
                confidence = "high" if len(scores) >= 5 else "medium" if len(scores) >= 3 else "low"
                
                return {
                    "topic": topic or "General",
                    "current_mastery": current_mastery,
                    "target_mastery": target_mastery,
                    "improvement_rate": improvement_rate,
                    "predicted_days": int(days_needed) if days_needed else None,
                    "predicted_tests": int(tests_needed) if tests_needed else None,
                    "confidence": confidence,
                    "message": f"Basado en tu progreso, necesitarías aproximadamente {int(days_needed)} días" if days_needed else "Progreso insuficiente para predecir"
                }
            else:
                return {
                    "topic": topic or "General",
                    "current_mastery": current_mastery,
                    "target_mastery": target_mastery,
                    "improvement_rate": improvement_rate,
                    "predicted_days": None,
                    "confidence": "low",
                    "message": "No se detecta mejora suficiente para hacer una predicción"
                }
        
        return {
            "topic": topic or "General",
            "current_mastery": 0.0,
            "predicted_days": None,
            "confidence": "low",
            "message": "Datos insuficientes"
        }
    
    def save_chat(self, user_id: str, chat_id: str, messages: List[Dict], title: Optional[str] = None) -> bool:
        """
        Guarda un chat completo para un usuario
        
        Args:
            user_id: ID del usuario
            chat_id: ID único del chat
            messages: Lista de mensajes del chat
            title: Título opcional del chat (se genera automáticamente si no se proporciona)
            
        Returns:
            True si se guardó correctamente
        """
        try:
            if not self.chats_collection:
                return False
            
            if not title:
                # Generar título automático del primer mensaje
                first_user_msg = next((msg for msg in messages if msg.get("role") == "user"), None)
                if first_user_msg:
                    title = first_user_msg.get("content", "Chat sin título")[:50]
                else:
                    title = f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            
            chat_data = {
                "user_id": user_id,
                "chat_id": chat_id,
                "title": title,
                "messages": json.dumps(messages, default=str),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "message_count": len(messages)
            }
            
            # Guardar en ChromaDB
            self.chats_collection.upsert(
                documents=[json.dumps(chat_data)],
                metadatas=[{
                    "user_id": user_id,
                    "chat_id": chat_id,
                    "title": title,
                    "created_at": chat_data["created_at"],
                    "updated_at": chat_data["updated_at"],
                    "message_count": str(len(messages))
                }],
                ids=[f"{user_id}_{chat_id}"]
            )
            
            print(f"💬 Chat guardado: {user_id} - {title}")
            return True
        except Exception as e:
            print(f"⚠️ Error al guardar chat: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_user_chats(self, user_id: str, limit: int = 50) -> List[Dict]:
        """
        Obtiene todos los chats de un usuario
        
        Args:
            user_id: ID del usuario
            limit: Número máximo de chats a retornar
            
        Returns:
            Lista de chats ordenados por fecha (más reciente primero)
        """
        try:
            if not self.chats_collection:
                return []
            
            results = self.chats_collection.get(
                where={"user_id": user_id},
                limit=limit
            )
            
            chats = []
            if results and results.get('documents'):
                for doc in results['documents']:
                    try:
                        chat_data = json.loads(doc)
                        chats.append({
                            "chat_id": chat_data.get("chat_id"),
                            "title": chat_data.get("title", "Chat sin título"),
                            "created_at": chat_data.get("created_at"),
                            "updated_at": chat_data.get("updated_at"),
                            "message_count": chat_data.get("message_count", 0)
                        })
                    except:
                        pass
            
            # Ordenar por fecha de actualización (más reciente primero)
            chats.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
            return chats
        except Exception as e:
            print(f"⚠️ Error al obtener chats: {e}")
            return []
    
    def load_chat(self, user_id: str, chat_id: str) -> Optional[Dict]:
        """
        Carga un chat específico
        
        Args:
            user_id: ID del usuario
            chat_id: ID del chat
            
        Returns:
            Diccionario con los datos del chat o None si no existe
        """
        try:
            if not self.chats_collection:
                return None
            
            results = self.chats_collection.get(
                ids=[f"{user_id}_{chat_id}"],
                limit=1
            )
            
            if results and results.get('documents'):
                chat_data = json.loads(results['documents'][0])
                # Parsear mensajes de vuelta
                messages = json.loads(chat_data.get("messages", "[]"))
                return {
                    "chat_id": chat_data.get("chat_id"),
                    "title": chat_data.get("title", "Chat sin título"),
                    "messages": messages,
                    "created_at": chat_data.get("created_at"),
                    "updated_at": chat_data.get("updated_at")
                }
            return None
        except Exception as e:
            print(f"⚠️ Error al cargar chat: {e}")
            return None
    
    def delete_chat(self, user_id: str, chat_id: str) -> bool:
        """
        Elimina un chat
        
        Args:
            user_id: ID del usuario
            chat_id: ID del chat
            
        Returns:
            True si se eliminó correctamente
        """
        try:
            if not self.chats_collection:
                return False
            
            self.chats_collection.delete(ids=[f"{user_id}_{chat_id}"])
            print(f"🗑️ Chat eliminado: {user_id} - {chat_id}")
            return True
        except Exception as e:
            print(f"⚠️ Error al eliminar chat: {e}")
            return False
    
    def save_user_stats(self, user_id: str, input_tokens: int, output_tokens: int, cost: float, model: str) -> bool:
        """
        Guarda estadísticas de tokens y costos para un usuario
        
        Args:
            user_id: ID del usuario
            input_tokens: Tokens de entrada
            output_tokens: Tokens de salida
            cost: Costo total
            model: Modelo usado
            
        Returns:
            True si se guardó correctamente
        """
        try:
            if not self.stats_collection:
                return False
            
            # Obtener estadísticas actuales
            existing = self.stats_collection.get(
                ids=[f"{user_id}_stats"],
                limit=1
            )
            
            if existing and existing.get('documents'):
                # Actualizar estadísticas existentes
                current_stats = json.loads(existing['documents'][0])
                current_stats["total_input_tokens"] += input_tokens
                current_stats["total_output_tokens"] += output_tokens
                current_stats["total_cost"] += cost
                current_stats["total_requests"] += 1
                current_stats["updated_at"] = datetime.now().isoformat()
                
                # Actualizar por modelo
                if "by_model" not in current_stats:
                    current_stats["by_model"] = {}
                if model not in current_stats["by_model"]:
                    current_stats["by_model"][model] = {
                        "input_tokens": 0,
                        "output_tokens": 0,
                        "cost": 0.0,
                        "requests": 0
                    }
                current_stats["by_model"][model]["input_tokens"] += input_tokens
                current_stats["by_model"][model]["output_tokens"] += output_tokens
                current_stats["by_model"][model]["cost"] += cost
                current_stats["by_model"][model]["requests"] += 1
            else:
                # Crear nuevas estadísticas
                current_stats = {
                    "user_id": user_id,
                    "total_input_tokens": input_tokens,
                    "total_output_tokens": output_tokens,
                    "total_cost": cost,
                    "total_requests": 1,
                    "by_model": {
                        model: {
                            "input_tokens": input_tokens,
                            "output_tokens": output_tokens,
                            "cost": cost,
                            "requests": 1
                        }
                    },
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
            
            # Guardar en ChromaDB
            self.stats_collection.upsert(
                documents=[json.dumps(current_stats)],
                metadatas=[{
                    "user_id": user_id,
                    "total_cost": str(current_stats["total_cost"]),
                    "updated_at": current_stats["updated_at"]
                }],
                ids=[f"{user_id}_stats"]
            )
            
            return True
        except Exception as e:
            print(f"⚠️ Error al guardar estadísticas: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_user_stats(self, user_id: str) -> Dict:
        """
        Obtiene las estadísticas de tokens y costos de un usuario
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Diccionario con las estadísticas
        """
        try:
            if not self.stats_collection:
                return {
                    "total_input_tokens": 0,
                    "total_output_tokens": 0,
                    "total_cost": 0.0,
                    "total_requests": 0,
                    "by_model": {}
                }
            
            results = self.stats_collection.get(
                ids=[f"{user_id}_stats"],
                limit=1
            )
            
            if results and results.get('documents'):
                return json.loads(results['documents'][0])
            
            return {
                "total_input_tokens": 0,
                "total_output_tokens": 0,
                "total_cost": 0.0,
                "total_requests": 0,
                "by_model": {}
            }
        except Exception as e:
            print(f"⚠️ Error al obtener estadísticas: {e}")
            return {
                "total_input_tokens": 0,
                "total_output_tokens": 0,
                "total_cost": 0.0,
                "total_requests": 0,
                "by_model": {}
            }

            if count == 0:
                print("⚠️ No hay documentos en la colección")
                return []
            
            results = self.collection.get(limit=min(limit, count))
            documents = results.get('documents', [])
            
            # Filtrar documentos vacíos
            valid_documents = [doc for doc in documents if doc and doc.strip()]
            
            print(f"📚 Documentos recuperados: {len(valid_documents)} de {len(documents)} (válidos)")
            if valid_documents:
                print(f"📄 Primer documento (primeros 100 chars): {valid_documents[0][:100]}...")
            
            return valid_documents
        except Exception as e:
            print(f"❌ Error al obtener documentos: {e}")
            return []
    
    def clear_all_documents(self):
        """
        Elimina todos los documentos de la memoria
        
        Nota: Esto elimina todos los documentos pero mantiene la colección.
        La colección se puede seguir usando después de limpiar.
        """
        try:
            # Obtener todos los IDs de documentos
            results = self.collection.get()
            ids = results.get('ids', [])
            
            if ids:
                # Eliminar todos los documentos por sus IDs
                self.collection.delete(ids=ids)
                print(f"🗑️ {len(ids)} documentos eliminados de la memoria")
            else:
                print("ℹ️ No hay documentos para eliminar")
        except Exception as e:
            print(f"⚠️ Error al limpiar documentos: {e}")
            # Si falla, intentar eliminar la colección y recrearla
            try:
                self.client.delete_collection(name="study_content")
                # Recrear la colección con la misma función de embeddings
                embedding_function = self._build_embedding_function()
                self.collection = self.client.create_collection(
                    name="study_content",
                    embedding_function=embedding_function,
                    metadata={"description": "Contenido educativo procesado"}
                )
                print("✨ Colección recreada después de limpiar")
            except Exception as e2:
                print(f"❌ Error crítico al limpiar: {e2}")
    
    def save_test_result(self, user_id: str, test_id: str, score: float, 
                         difficulty: str, num_questions: int, correct: int, 
                         total: int, topics: Optional[List[str]] = None,
                         feedback: Optional[Dict] = None) -> bool:
        """
        Guarda el resultado de un test para tracking de progreso
        
        Args:
            user_id: ID del usuario
            test_id: ID del test
            score: Puntuación (0.0 a 1.0)
            difficulty: Dificultad del test (easy, medium, hard)
            num_questions: Número de preguntas
            correct: Número de respuestas correctas
            total: Total de preguntas
            topics: Temas del test (opcional)
            
        Returns:
            True si se guardó correctamente
        """
        try:
            result_data = {
                "user_id": user_id,
                "test_id": test_id,
                "score": score,
                "difficulty": difficulty,
                "num_questions": num_questions,
                "correct": correct,
                "total": total,
                "topics": topics or [],
                "feedback": feedback or {},
                "timestamp": datetime.now().isoformat()
            }
            
            # Guardar en ChromaDB si está disponible
            if self.progress_collection:
                result_id = f"{user_id}_{test_id}_{uuid.uuid4().hex[:8]}"
                self.progress_collection.add(
                    documents=[json.dumps(result_data)],
                    metadatas=[{
                        "user_id": user_id,
                        "test_id": test_id,
                        "score": str(score),
                        "difficulty": difficulty,
                        "timestamp": result_data["timestamp"]
                    }],
                    ids=[result_id]
                )
            
            # También guardar en cache en memoria
            if user_id not in self.progress_cache:
                self.progress_cache[user_id] = []
            self.progress_cache[user_id].append(result_data)
            
            # Limitar cache a últimos 100 resultados
            if len(self.progress_cache[user_id]) > 100:
                self.progress_cache[user_id] = self.progress_cache[user_id][-100:]
            
            print(f"📊 Resultado guardado: {user_id} - {score:.2%} ({difficulty})")
            return True
        except Exception as e:
            print(f"⚠️ Error al guardar resultado: {e}")
            # Fallback: solo guardar en memoria
            if user_id not in self.progress_cache:
                self.progress_cache[user_id] = []
            self.progress_cache[user_id].append({
                "user_id": user_id,
                "test_id": test_id,
                "score": score,
                "difficulty": difficulty,
                "num_questions": num_questions,
                "correct": correct,
                "total": total,
                "topics": topics or [],
                "feedback": feedback or {},
                "timestamp": datetime.now().isoformat()
            })
            return True
    
    def get_user_progress(self, user_id: str, limit: int = 50) -> List[Dict]:
        """
        Obtiene el historial de progreso de un usuario
        
        Args:
            user_id: ID del usuario
            limit: Número máximo de resultados a retornar
            
        Returns:
            Lista de resultados de tests ordenados por fecha (más reciente primero)
        """
        results = []
        
        # Intentar obtener de ChromaDB
        if self.progress_collection:
            try:
                db_results = self.progress_collection.get(
                    where={"user_id": user_id},
                    limit=limit
                )
                if db_results and db_results.get('documents'):
                    for doc in db_results['documents']:
                        try:
                            result = json.loads(doc)
                            results.append(result)
                        except:
                            pass
            except Exception as e:
                print(f"⚠️ Error al obtener progreso de ChromaDB: {e}")
        
        # Combinar con cache en memoria
        if user_id in self.progress_cache:
            results.extend(self.progress_cache[user_id])
        
        # Eliminar duplicados y ordenar por timestamp
        seen = set()
        unique_results = []
        for result in results:
            key = (result.get("test_id"), result.get("timestamp"))
            if key not in seen:
                seen.add(key)
                unique_results.append(result)
        
        # Ordenar por timestamp (más reciente primero)
        unique_results.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return unique_results[:limit]
    
    def get_user_performance_metrics(self, user_id: str) -> Dict[str, Any]:
        """
        Calcula métricas de rendimiento del usuario para adaptación de dificultad
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Diccionario con métricas:
            - average_score: Puntuación promedio
            - recent_average: Puntuación promedio de últimos 5 tests
            - total_tests: Total de tests realizados
            - difficulty_distribution: Distribución por dificultad
            - trend: Tendencia (improving, stable, declining)
            - recommended_difficulty: Dificultad recomendada
        """
        progress = self.get_user_progress(user_id, limit=50)
        
        if not progress:
            return {
                "average_score": 0.0,
                "recent_average": 0.0,
                "total_tests": 0,
                "difficulty_distribution": {},
                "trend": "stable",
                "recommended_difficulty": "medium"
            }
        
        # Calcular promedio general
        scores = [r["score"] for r in progress]
        average_score = sum(scores) / len(scores) if scores else 0.0
        
        # Calcular promedio reciente (últimos 5)
        recent_scores = scores[:5]
        recent_average = sum(recent_scores) / len(recent_scores) if recent_scores else 0.0
        
        # Distribución por dificultad
        difficulty_distribution = {}
        for result in progress:
            diff = result.get("difficulty", "medium")
            difficulty_distribution[diff] = difficulty_distribution.get(diff, 0) + 1
        
        # Calcular tendencia (comparar últimos 5 con anteriores 5)
        if len(scores) >= 10:
            recent_5 = sum(scores[:5]) / 5
            previous_5 = sum(scores[5:10]) / 5
            if recent_5 > previous_5 + 0.1:
                trend = "improving"
            elif recent_5 < previous_5 - 0.1:
                trend = "declining"
            else:
                trend = "stable"
        elif len(scores) >= 5:
            # Si hay menos de 10, comparar primeros vs últimos
            first_half = sum(scores[len(scores)//2:]) / (len(scores) - len(scores)//2)
            second_half = sum(scores[:len(scores)//2]) / (len(scores)//2)
            if second_half > first_half + 0.1:
                trend = "improving"
            elif second_half < first_half - 0.1:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "stable"
        
        # Recomendar dificultad basada en rendimiento reciente
        if recent_average >= 0.8:
            recommended_difficulty = "hard"
        elif recent_average >= 0.6:
            recommended_difficulty = "medium"
        else:
            recommended_difficulty = "easy"
        
        return {
            "average_score": average_score,
            "recent_average": recent_average,
            "total_tests": len(progress),
            "difficulty_distribution": difficulty_distribution,
            "trend": trend,
            "recommended_difficulty": recommended_difficulty
        }
    
    def get_progress_by_topic(self, user_id: str) -> Dict[str, Dict[str, Any]]:
        """
        Obtiene el progreso agrupado por tema
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Diccionario con progreso por tema
        """
        progress = self.get_user_progress(user_id, limit=1000)
        topic_progress = {}
        
        for result in progress:
            topics = result.get("topics", [])
            if not topics:
                topics = ["General"]
            
            for topic in topics:
                if topic not in topic_progress:
                    topic_progress[topic] = {
                        "scores": [],
                        "dates": [],
                        "difficulties": [],
                        "total_tests": 0,
                        "average_score": 0.0,
                        "trend": "stable"
                    }
                
                topic_progress[topic]["scores"].append(result["score"])
                topic_progress[topic]["dates"].append(result["timestamp"])
                topic_progress[topic]["difficulties"].append(result["difficulty"])
                topic_progress[topic]["total_tests"] += 1
        
        # Calcular promedios y tendencias por tema
        for topic, data in topic_progress.items():
            if data["scores"]:
                data["average_score"] = sum(data["scores"]) / len(data["scores"])
                
                # Calcular tendencia (comparar primeros vs últimos)
                if len(data["scores"]) >= 4:
                    first_half = sum(data["scores"][len(data["scores"])//2:]) / (len(data["scores"]) - len(data["scores"])//2)
                    second_half = sum(data["scores"][:len(data["scores"])//2]) / (len(data["scores"])//2)
                    if second_half > first_half + 0.1:
                        data["trend"] = "improving"
                    elif second_half < first_half - 0.1:
                        data["trend"] = "declining"
                    else:
                        data["trend"] = "stable"
        
        return topic_progress
    
    def get_temporal_progress(self, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """
        Obtiene el progreso temporal del usuario
        
        Args:
            user_id: ID del usuario
            days: Número de días a analizar
            
        Returns:
            Lista de progreso diario
        """
        from datetime import timedelta
        
        progress = self.get_user_progress(user_id, limit=1000)
        
        # Agrupar por día
        daily_progress = {}
        cutoff_date = datetime.now() - timedelta(days=days)
        
        for result in progress:
            try:
                result_date = datetime.fromisoformat(result["timestamp"].replace('Z', '+00:00'))
                if result_date.tzinfo:
                    result_date = result_date.replace(tzinfo=None)
                
                if result_date < cutoff_date:
                    continue
                
                date_key = result_date.date().isoformat()
                
                if date_key not in daily_progress:
                    daily_progress[date_key] = {
                        "date": date_key,
                        "scores": [],
                        "tests_count": 0,
                        "topics": set()
                    }
                
                daily_progress[date_key]["scores"].append(result["score"])
                daily_progress[date_key]["tests_count"] += 1
                daily_progress[date_key]["topics"].update(result.get("topics", []))
            except Exception as e:
                print(f"⚠️ Error procesando fecha: {e}")
                continue
        
        # Convertir a lista y calcular promedios
        temporal_data = []
        for date_key in sorted(daily_progress.keys()):
            day_data = daily_progress[date_key]
            temporal_data.append({
                "date": date_key,
                "average_score": sum(day_data["scores"]) / len(day_data["scores"]) if day_data["scores"] else 0.0,
                "tests_count": day_data["tests_count"],
                "topics_count": len(day_data["topics"])
            })
        
        return temporal_data
    
    def predict_mastery_time(self, user_id: str, topic: Optional[str] = None) -> Dict[str, Any]:
        """
        Predice el tiempo necesario para dominar un concepto/tema
        
        Args:
            user_id: ID del usuario
            topic: Tema específico (opcional, si no se proporciona analiza todos)
            
        Returns:
            Diccionario con predicción de tiempo
        """
        if topic:
            topic_progress = self.get_progress_by_topic(user_id)
            if topic not in topic_progress:
                return {
                    "topic": topic,
                    "current_mastery": 0.0,
                    "predicted_days": None,
                    "confidence": "low",
                    "message": "No hay datos suficientes para este tema"
                }
            
            data = topic_progress[topic]
        else:
            metrics = self.get_user_performance_metrics(user_id)
            data = {
                "scores": [metrics["average_score"]],
                "total_tests": metrics["total_tests"]
            }
        
        if not data.get("scores") or len(data["scores"]) < 3:
            return {
                "topic": topic or "General",
                "current_mastery": data.get("average_score", 0.0) if isinstance(data, dict) and "average_score" in data else 0.0,
                "predicted_days": None,
                "confidence": "low",
                "message": "Se necesitan al menos 3 tests para hacer una predicción"
            }
        
        # Calcular tasa de mejora
        scores = data["scores"]
        if len(scores) >= 3:
            # Calcular pendiente de mejora
            recent_scores = scores[:min(5, len(scores))]
            improvement_rate = 0.0
            
            if len(recent_scores) >= 2:
                # Calcular mejora promedio por test
                improvements = []
                for i in range(1, len(recent_scores)):
                    improvement = recent_scores[i-1] - recent_scores[i]
                    improvements.append(improvement)
                
                if improvements:
                    improvement_rate = sum(improvements) / len(improvements)
            
            current_mastery = scores[0] if scores else 0.0
            target_mastery = 0.85  # 85% considerado dominio
            
            if improvement_rate > 0:
                # Calcular días necesarios
                points_needed = target_mastery - current_mastery
                tests_needed = points_needed / improvement_rate if improvement_rate > 0 else None
                
                # Asumir 1 test cada 2 días en promedio
                days_needed = tests_needed * 2 if tests_needed else None
                
                # Calcular confianza
                confidence = "high" if len(scores) >= 5 else "medium" if len(scores) >= 3 else "low"
                
                return {
                    "topic": topic or "General",
                    "current_mastery": current_mastery,
                    "target_mastery": target_mastery,
                    "improvement_rate": improvement_rate,
                    "predicted_days": int(days_needed) if days_needed else None,
                    "predicted_tests": int(tests_needed) if tests_needed else None,
                    "confidence": confidence,
                    "message": f"Basado en tu progreso, necesitarías aproximadamente {int(days_needed)} días" if days_needed else "Progreso insuficiente para predecir"
                }
            else:
                return {
                    "topic": topic or "General",
                    "current_mastery": current_mastery,
                    "target_mastery": target_mastery,
                    "improvement_rate": improvement_rate,
                    "predicted_days": None,
                    "confidence": "low",
                    "message": "No se detecta mejora suficiente para hacer una predicción"
                }
        
        return {
            "topic": topic or "General",
            "current_mastery": 0.0,
            "predicted_days": None,
            "confidence": "low",
            "message": "Datos insuficientes"
        }
    
    def save_chat(self, user_id: str, chat_id: str, messages: List[Dict], title: Optional[str] = None) -> bool:
        """
        Guarda un chat completo para un usuario
        
        Args:
            user_id: ID del usuario
            chat_id: ID único del chat
            messages: Lista de mensajes del chat
            title: Título opcional del chat (se genera automáticamente si no se proporciona)
            
        Returns:
            True si se guardó correctamente
        """
        try:
            if not self.chats_collection:
                return False
            
            if not title:
                # Generar título automático del primer mensaje
                first_user_msg = next((msg for msg in messages if msg.get("role") == "user"), None)
                if first_user_msg:
                    title = first_user_msg.get("content", "Chat sin título")[:50]
                else:
                    title = f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            
            chat_data = {
                "user_id": user_id,
                "chat_id": chat_id,
                "title": title,
                "messages": json.dumps(messages, default=str),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "message_count": len(messages)
            }
            
            # Guardar en ChromaDB
            self.chats_collection.upsert(
                documents=[json.dumps(chat_data)],
                metadatas=[{
                    "user_id": user_id,
                    "chat_id": chat_id,
                    "title": title,
                    "created_at": chat_data["created_at"],
                    "updated_at": chat_data["updated_at"],
                    "message_count": str(len(messages))
                }],
                ids=[f"{user_id}_{chat_id}"]
            )
            
            print(f"💬 Chat guardado: {user_id} - {title}")
            return True
        except Exception as e:
            print(f"⚠️ Error al guardar chat: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_user_chats(self, user_id: str, limit: int = 50) -> List[Dict]:
        """
        Obtiene todos los chats de un usuario
        
        Args:
            user_id: ID del usuario
            limit: Número máximo de chats a retornar
            
        Returns:
            Lista de chats ordenados por fecha (más reciente primero)
        """
        try:
            if not self.chats_collection:
                return []
            
            results = self.chats_collection.get(
                where={"user_id": user_id},
                limit=limit
            )
            
            chats = []
            if results and results.get('documents'):
                for doc in results['documents']:
                    try:
                        chat_data = json.loads(doc)
                        chats.append({
                            "chat_id": chat_data.get("chat_id"),
                            "title": chat_data.get("title", "Chat sin título"),
                            "created_at": chat_data.get("created_at"),
                            "updated_at": chat_data.get("updated_at"),
                            "message_count": chat_data.get("message_count", 0)
                        })
                    except:
                        pass
            
            # Ordenar por fecha de actualización (más reciente primero)
            chats.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
            return chats
        except Exception as e:
            print(f"⚠️ Error al obtener chats: {e}")
            return []
    
    def load_chat(self, user_id: str, chat_id: str) -> Optional[Dict]:
        """
        Carga un chat específico
        
        Args:
            user_id: ID del usuario
            chat_id: ID del chat
            
        Returns:
            Diccionario con los datos del chat o None si no existe
        """
        try:
            if not self.chats_collection:
                return None
            
            results = self.chats_collection.get(
                ids=[f"{user_id}_{chat_id}"],
                limit=1
            )
            
            if results and results.get('documents'):
                chat_data = json.loads(results['documents'][0])
                # Parsear mensajes de vuelta
                messages = json.loads(chat_data.get("messages", "[]"))
                return {
                    "chat_id": chat_data.get("chat_id"),
                    "title": chat_data.get("title", "Chat sin título"),
                    "messages": messages,
                    "created_at": chat_data.get("created_at"),
                    "updated_at": chat_data.get("updated_at")
                }
            return None
        except Exception as e:
            print(f"⚠️ Error al cargar chat: {e}")
            return None
    
    def delete_chat(self, user_id: str, chat_id: str) -> bool:
        """
        Elimina un chat
        
        Args:
            user_id: ID del usuario
            chat_id: ID del chat
            
        Returns:
            True si se eliminó correctamente
        """
        try:
            if not self.chats_collection:
                return False
            
            self.chats_collection.delete(ids=[f"{user_id}_{chat_id}"])
            print(f"🗑️ Chat eliminado: {user_id} - {chat_id}")
            return True
        except Exception as e:
            print(f"⚠️ Error al eliminar chat: {e}")
            return False
    
    def save_user_stats(self, user_id: str, input_tokens: int, output_tokens: int, cost: float, model: str) -> bool:
        """
        Guarda estadísticas de tokens y costos para un usuario
        
        Args:
            user_id: ID del usuario
            input_tokens: Tokens de entrada
            output_tokens: Tokens de salida
            cost: Costo total
            model: Modelo usado
            
        Returns:
            True si se guardó correctamente
        """
        try:
            if not self.stats_collection:
                return False
            
            # Obtener estadísticas actuales
            existing = self.stats_collection.get(
                ids=[f"{user_id}_stats"],
                limit=1
            )
            
            if existing and existing.get('documents'):
                # Actualizar estadísticas existentes
                current_stats = json.loads(existing['documents'][0])
                current_stats["total_input_tokens"] += input_tokens
                current_stats["total_output_tokens"] += output_tokens
                current_stats["total_cost"] += cost
                current_stats["total_requests"] += 1
                current_stats["updated_at"] = datetime.now().isoformat()
                
                # Actualizar por modelo
                if "by_model" not in current_stats:
                    current_stats["by_model"] = {}
                if model not in current_stats["by_model"]:
                    current_stats["by_model"][model] = {
                        "input_tokens": 0,
                        "output_tokens": 0,
                        "cost": 0.0,
                        "requests": 0
                    }
                current_stats["by_model"][model]["input_tokens"] += input_tokens
                current_stats["by_model"][model]["output_tokens"] += output_tokens
                current_stats["by_model"][model]["cost"] += cost
                current_stats["by_model"][model]["requests"] += 1
            else:
                # Crear nuevas estadísticas
                current_stats = {
                    "user_id": user_id,
                    "total_input_tokens": input_tokens,
                    "total_output_tokens": output_tokens,
                    "total_cost": cost,
                    "total_requests": 1,
                    "by_model": {
                        model: {
                            "input_tokens": input_tokens,
                            "output_tokens": output_tokens,
                            "cost": cost,
                            "requests": 1
                        }
                    },
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
            
            # Guardar en ChromaDB
            self.stats_collection.upsert(
                documents=[json.dumps(current_stats)],
                metadatas=[{
                    "user_id": user_id,
                    "total_cost": str(current_stats["total_cost"]),
                    "updated_at": current_stats["updated_at"]
                }],
                ids=[f"{user_id}_stats"]
            )
            
            return True
        except Exception as e:
            print(f"⚠️ Error al guardar estadísticas: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_user_stats(self, user_id: str) -> Dict:
        """
        Obtiene las estadísticas de tokens y costos de un usuario
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Diccionario con las estadísticas
        """
        try:
            if not self.stats_collection:
                return {
                    "total_input_tokens": 0,
                    "total_output_tokens": 0,
                    "total_cost": 0.0,
                    "total_requests": 0,
                    "by_model": {}
                }
            
            results = self.stats_collection.get(
                ids=[f"{user_id}_stats"],
                limit=1
            )
            
            if results and results.get('documents'):
                return json.loads(results['documents'][0])
            
            return {
                "total_input_tokens": 0,
                "total_output_tokens": 0,
                "total_cost": 0.0,
                "total_requests": 0,
                "by_model": {}
            }
        except Exception as e:
            print(f"⚠️ Error al obtener estadísticas: {e}")
            return {
                "total_input_tokens": 0,
                "total_output_tokens": 0,
                "total_cost": 0.0,
                "total_requests": 0,
                "by_model": {}
            }

            if count == 0:
                print("⚠️ No hay documentos en la colección")
                return []
            
            results = self.collection.get(limit=min(limit, count))
            documents = results.get('documents', [])
            
            # Filtrar documentos vacíos
            valid_documents = [doc for doc in documents if doc and doc.strip()]
            
            print(f"📚 Documentos recuperados: {len(valid_documents)} de {len(documents)} (válidos)")
            if valid_documents:
                print(f"📄 Primer documento (primeros 100 chars): {valid_documents[0][:100]}...")
            
            return valid_documents
        except Exception as e:
            print(f"❌ Error al obtener documentos: {e}")
            return []
    
    def clear_all_documents(self):
        """
        Elimina todos los documentos de la memoria
        
        Nota: Esto elimina todos los documentos pero mantiene la colección.
        La colección se puede seguir usando después de limpiar.
        """
        try:
            # Obtener todos los IDs de documentos
            results = self.collection.get()
            ids = results.get('ids', [])
            
            if ids:
                # Eliminar todos los documentos por sus IDs
                self.collection.delete(ids=ids)
                print(f"🗑️ {len(ids)} documentos eliminados de la memoria")
            else:
                print("ℹ️ No hay documentos para eliminar")
        except Exception as e:
            print(f"⚠️ Error al limpiar documentos: {e}")
            # Si falla, intentar eliminar la colección y recrearla
            try:
                self.client.delete_collection(name="study_content")
                # Recrear la colección con la misma función de embeddings
                embedding_function = self._build_embedding_function()
                self.collection = self.client.create_collection(
                    name="study_content",
                    embedding_function=embedding_function,
                    metadata={"description": "Contenido educativo procesado"}
                )
                print("✨ Colección recreada después de limpiar")
            except Exception as e2:
                print(f"❌ Error crítico al limpiar: {e2}")
    
    def save_test_result(self, user_id: str, test_id: str, score: float, 
                         difficulty: str, num_questions: int, correct: int, 
                         total: int, topics: Optional[List[str]] = None,
                         feedback: Optional[Dict] = None) -> bool:
        """
        Guarda el resultado de un test para tracking de progreso
        
        Args:
            user_id: ID del usuario
            test_id: ID del test
            score: Puntuación (0.0 a 1.0)
            difficulty: Dificultad del test (easy, medium, hard)
            num_questions: Número de preguntas
            correct: Número de respuestas correctas
            total: Total de preguntas
            topics: Temas del test (opcional)
            
        Returns:
            True si se guardó correctamente
        """
        try:
            result_data = {
                "user_id": user_id,
                "test_id": test_id,
                "score": score,
                "difficulty": difficulty,
                "num_questions": num_questions,
                "correct": correct,
                "total": total,
                "topics": topics or [],
                "feedback": feedback or {},
                "timestamp": datetime.now().isoformat()
            }
            
            # Guardar en ChromaDB si está disponible
            if self.progress_collection:
                result_id = f"{user_id}_{test_id}_{uuid.uuid4().hex[:8]}"
                self.progress_collection.add(
                    documents=[json.dumps(result_data)],
                    metadatas=[{
                        "user_id": user_id,
                        "test_id": test_id,
                        "score": str(score),
                        "difficulty": difficulty,
                        "timestamp": result_data["timestamp"]
                    }],
                    ids=[result_id]
                )
            
            # También guardar en cache en memoria
            if user_id not in self.progress_cache:
                self.progress_cache[user_id] = []
            self.progress_cache[user_id].append(result_data)
            
            # Limitar cache a últimos 100 resultados
            if len(self.progress_cache[user_id]) > 100:
                self.progress_cache[user_id] = self.progress_cache[user_id][-100:]
            
            print(f"📊 Resultado guardado: {user_id} - {score:.2%} ({difficulty})")
            return True
        except Exception as e:
            print(f"⚠️ Error al guardar resultado: {e}")
            # Fallback: solo guardar en memoria
            if user_id not in self.progress_cache:
                self.progress_cache[user_id] = []
            self.progress_cache[user_id].append({
                "user_id": user_id,
                "test_id": test_id,
                "score": score,
                "difficulty": difficulty,
                "num_questions": num_questions,
                "correct": correct,
                "total": total,
                "topics": topics or [],
                "feedback": feedback or {},
                "timestamp": datetime.now().isoformat()
            })
            return True
    
    def get_user_progress(self, user_id: str, limit: int = 50) -> List[Dict]:
        """
        Obtiene el historial de progreso de un usuario
        
        Args:
            user_id: ID del usuario
            limit: Número máximo de resultados a retornar
            
        Returns:
            Lista de resultados de tests ordenados por fecha (más reciente primero)
        """
        results = []
        
        # Intentar obtener de ChromaDB
        if self.progress_collection:
            try:
                db_results = self.progress_collection.get(
                    where={"user_id": user_id},
                    limit=limit
                )
                if db_results and db_results.get('documents'):
                    for doc in db_results['documents']:
                        try:
                            result = json.loads(doc)
                            results.append(result)
                        except:
                            pass
            except Exception as e:
                print(f"⚠️ Error al obtener progreso de ChromaDB: {e}")
        
        # Combinar con cache en memoria
        if user_id in self.progress_cache:
            results.extend(self.progress_cache[user_id])
        
        # Eliminar duplicados y ordenar por timestamp
        seen = set()
        unique_results = []
        for result in results:
            key = (result.get("test_id"), result.get("timestamp"))
            if key not in seen:
                seen.add(key)
                unique_results.append(result)
        
        # Ordenar por timestamp (más reciente primero)
        unique_results.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return unique_results[:limit]
    
    def get_user_performance_metrics(self, user_id: str) -> Dict[str, Any]:
        """
        Calcula métricas de rendimiento del usuario para adaptación de dificultad
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Diccionario con métricas:
            - average_score: Puntuación promedio
            - recent_average: Puntuación promedio de últimos 5 tests
            - total_tests: Total de tests realizados
            - difficulty_distribution: Distribución por dificultad
            - trend: Tendencia (improving, stable, declining)
            - recommended_difficulty: Dificultad recomendada
        """
        progress = self.get_user_progress(user_id, limit=50)
        
        if not progress:
            return {
                "average_score": 0.0,
                "recent_average": 0.0,
                "total_tests": 0,
                "difficulty_distribution": {},
                "trend": "stable",
                "recommended_difficulty": "medium"
            }
        
        # Calcular promedio general
        scores = [r["score"] for r in progress]
        average_score = sum(scores) / len(scores) if scores else 0.0
        
        # Calcular promedio reciente (últimos 5)
        recent_scores = scores[:5]
        recent_average = sum(recent_scores) / len(recent_scores) if recent_scores else 0.0
        
        # Distribución por dificultad
        difficulty_distribution = {}
        for result in progress:
            diff = result.get("difficulty", "medium")
            difficulty_distribution[diff] = difficulty_distribution.get(diff, 0) + 1
        
        # Calcular tendencia (comparar últimos 5 con anteriores 5)
        if len(scores) >= 10:
            recent_5 = sum(scores[:5]) / 5
            previous_5 = sum(scores[5:10]) / 5
            if recent_5 > previous_5 + 0.1:
                trend = "improving"
            elif recent_5 < previous_5 - 0.1:
                trend = "declining"
            else:
                trend = "stable"
        elif len(scores) >= 5:
            # Si hay menos de 10, comparar primeros vs últimos
            first_half = sum(scores[len(scores)//2:]) / (len(scores) - len(scores)//2)
            second_half = sum(scores[:len(scores)//2]) / (len(scores)//2)
            if second_half > first_half + 0.1:
                trend = "improving"
            elif second_half < first_half - 0.1:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "stable"
        
        # Recomendar dificultad basada en rendimiento reciente
        if recent_average >= 0.8:
            recommended_difficulty = "hard"
        elif recent_average >= 0.6:
            recommended_difficulty = "medium"
        else:
            recommended_difficulty = "easy"
        
        return {
            "average_score": average_score,
            "recent_average": recent_average,
            "total_tests": len(progress),
            "difficulty_distribution": difficulty_distribution,
            "trend": trend,
            "recommended_difficulty": recommended_difficulty
        }
    
    def get_progress_by_topic(self, user_id: str) -> Dict[str, Dict[str, Any]]:
        """
        Obtiene el progreso agrupado por tema
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Diccionario con progreso por tema
        """
        progress = self.get_user_progress(user_id, limit=1000)
        topic_progress = {}
        
        for result in progress:
            topics = result.get("topics", [])
            if not topics:
                topics = ["General"]
            
            for topic in topics:
                if topic not in topic_progress:
                    topic_progress[topic] = {
                        "scores": [],
                        "dates": [],
                        "difficulties": [],
                        "total_tests": 0,
                        "average_score": 0.0,
                        "trend": "stable"
                    }
                
                topic_progress[topic]["scores"].append(result["score"])
                topic_progress[topic]["dates"].append(result["timestamp"])
                topic_progress[topic]["difficulties"].append(result["difficulty"])
                topic_progress[topic]["total_tests"] += 1
        
        # Calcular promedios y tendencias por tema
        for topic, data in topic_progress.items():
            if data["scores"]:
                data["average_score"] = sum(data["scores"]) / len(data["scores"])
                
                # Calcular tendencia (comparar primeros vs últimos)
                if len(data["scores"]) >= 4:
                    first_half = sum(data["scores"][len(data["scores"])//2:]) / (len(data["scores"]) - len(data["scores"])//2)
                    second_half = sum(data["scores"][:len(data["scores"])//2]) / (len(data["scores"])//2)
                    if second_half > first_half + 0.1:
                        data["trend"] = "improving"
                    elif second_half < first_half - 0.1:
                        data["trend"] = "declining"
                    else:
                        data["trend"] = "stable"
        
        return topic_progress
    
    def get_temporal_progress(self, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """
        Obtiene el progreso temporal del usuario
        
        Args:
            user_id: ID del usuario
            days: Número de días a analizar
            
        Returns:
            Lista de progreso diario
        """
        from datetime import timedelta
        
        progress = self.get_user_progress(user_id, limit=1000)
        
        # Agrupar por día
        daily_progress = {}
        cutoff_date = datetime.now() - timedelta(days=days)
        
        for result in progress:
            try:
                result_date = datetime.fromisoformat(result["timestamp"].replace('Z', '+00:00'))
                if result_date.tzinfo:
                    result_date = result_date.replace(tzinfo=None)
                
                if result_date < cutoff_date:
                    continue
                
                date_key = result_date.date().isoformat()
                
                if date_key not in daily_progress:
                    daily_progress[date_key] = {
                        "date": date_key,
                        "scores": [],
                        "tests_count": 0,
                        "topics": set()
                    }
                
                daily_progress[date_key]["scores"].append(result["score"])
                daily_progress[date_key]["tests_count"] += 1
                daily_progress[date_key]["topics"].update(result.get("topics", []))
            except Exception as e:
                print(f"⚠️ Error procesando fecha: {e}")
                continue
        
        # Convertir a lista y calcular promedios
        temporal_data = []
        for date_key in sorted(daily_progress.keys()):
            day_data = daily_progress[date_key]
            temporal_data.append({
                "date": date_key,
                "average_score": sum(day_data["scores"]) / len(day_data["scores"]) if day_data["scores"] else 0.0,
                "tests_count": day_data["tests_count"],
                "topics_count": len(day_data["topics"])
            })
        
        return temporal_data
    
    def predict_mastery_time(self, user_id: str, topic: Optional[str] = None) -> Dict[str, Any]:
        """
        Predice el tiempo necesario para dominar un concepto/tema
        
        Args:
            user_id: ID del usuario
            topic: Tema específico (opcional, si no se proporciona analiza todos)
            
        Returns:
            Diccionario con predicción de tiempo
        """
        if topic:
            topic_progress = self.get_progress_by_topic(user_id)
            if topic not in topic_progress:
                return {
                    "topic": topic,
                    "current_mastery": 0.0,
                    "predicted_days": None,
                    "confidence": "low",
                    "message": "No hay datos suficientes para este tema"
                }
            
            data = topic_progress[topic]
        else:
            metrics = self.get_user_performance_metrics(user_id)
            data = {
                "scores": [metrics["average_score"]],
                "total_tests": metrics["total_tests"]
            }
        
        if not data.get("scores") or len(data["scores"]) < 3:
            return {
                "topic": topic or "General",
                "current_mastery": data.get("average_score", 0.0) if isinstance(data, dict) and "average_score" in data else 0.0,
                "predicted_days": None,
                "confidence": "low",
                "message": "Se necesitan al menos 3 tests para hacer una predicción"
            }
        
        # Calcular tasa de mejora
        scores = data["scores"]
        if len(scores) >= 3:
            # Calcular pendiente de mejora
            recent_scores = scores[:min(5, len(scores))]
            improvement_rate = 0.0
            
            if len(recent_scores) >= 2:
                # Calcular mejora promedio por test
                improvements = []
                for i in range(1, len(recent_scores)):
                    improvement = recent_scores[i-1] - recent_scores[i]
                    improvements.append(improvement)
                
                if improvements:
                    improvement_rate = sum(improvements) / len(improvements)
            
            current_mastery = scores[0] if scores else 0.0
            target_mastery = 0.85  # 85% considerado dominio
            
            if improvement_rate > 0:
                # Calcular días necesarios
                points_needed = target_mastery - current_mastery
                tests_needed = points_needed / improvement_rate if improvement_rate > 0 else None
                
                # Asumir 1 test cada 2 días en promedio
                days_needed = tests_needed * 2 if tests_needed else None
                
                # Calcular confianza
                confidence = "high" if len(scores) >= 5 else "medium" if len(scores) >= 3 else "low"
                
                return {
                    "topic": topic or "General",
                    "current_mastery": current_mastery,
                    "target_mastery": target_mastery,
                    "improvement_rate": improvement_rate,
                    "predicted_days": int(days_needed) if days_needed else None,
                    "predicted_tests": int(tests_needed) if tests_needed else None,
                    "confidence": confidence,
                    "message": f"Basado en tu progreso, necesitarías aproximadamente {int(days_needed)} días" if days_needed else "Progreso insuficiente para predecir"
                }
            else:
                return {
                    "topic": topic or "General",
                    "current_mastery": current_mastery,
                    "target_mastery": target_mastery,
                    "improvement_rate": improvement_rate,
                    "predicted_days": None,
                    "confidence": "low",
                    "message": "No se detecta mejora suficiente para hacer una predicción"
                }
        
        return {
            "topic": topic or "General",
            "current_mastery": 0.0,
            "predicted_days": None,
            "confidence": "low",
            "message": "Datos insuficientes"
        }
    
    def save_chat(self, user_id: str, chat_id: str, messages: List[Dict], title: Optional[str] = None) -> bool:
        """
        Guarda un chat completo para un usuario
        
        Args:
            user_id: ID del usuario
            chat_id: ID único del chat
            messages: Lista de mensajes del chat
            title: Título opcional del chat (se genera automáticamente si no se proporciona)
            
        Returns:
            True si se guardó correctamente
        """
        try:
            if not self.chats_collection:
                return False
            
            if not title:
                # Generar título automático del primer mensaje
                first_user_msg = next((msg for msg in messages if msg.get("role") == "user"), None)
                if first_user_msg:
                    title = first_user_msg.get("content", "Chat sin título")[:50]
                else:
                    title = f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            
            chat_data = {
                "user_id": user_id,
                "chat_id": chat_id,
                "title": title,
                "messages": json.dumps(messages, default=str),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "message_count": len(messages)
            }
            
            # Guardar en ChromaDB
            self.chats_collection.upsert(
                documents=[json.dumps(chat_data)],
                metadatas=[{
                    "user_id": user_id,
                    "chat_id": chat_id,
                    "title": title,
                    "created_at": chat_data["created_at"],
                    "updated_at": chat_data["updated_at"],
                    "message_count": str(len(messages))
                }],
                ids=[f"{user_id}_{chat_id}"]
            )
            
            print(f"💬 Chat guardado: {user_id} - {title}")
            return True
        except Exception as e:
            print(f"⚠️ Error al guardar chat: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_user_chats(self, user_id: str, limit: int = 50) -> List[Dict]:
        """
        Obtiene todos los chats de un usuario
        
        Args:
            user_id: ID del usuario
            limit: Número máximo de chats a retornar
            
        Returns:
            Lista de chats ordenados por fecha (más reciente primero)
        """
        try:
            if not self.chats_collection:
                return []
            
            results = self.chats_collection.get(
                where={"user_id": user_id},
                limit=limit
            )
            
            chats = []
            if results and results.get('documents'):
                for doc in results['documents']:
                    try:
                        chat_data = json.loads(doc)
                        chats.append({
                            "chat_id": chat_data.get("chat_id"),
                            "title": chat_data.get("title", "Chat sin título"),
                            "created_at": chat_data.get("created_at"),
                            "updated_at": chat_data.get("updated_at"),
                            "message_count": chat_data.get("message_count", 0)
                        })
                    except:
                        pass
            
            # Ordenar por fecha de actualización (más reciente primero)
            chats.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
            return chats
        except Exception as e:
            print(f"⚠️ Error al obtener chats: {e}")
            return []
    
    def load_chat(self, user_id: str, chat_id: str) -> Optional[Dict]:
        """
        Carga un chat específico
        
        Args:
            user_id: ID del usuario
            chat_id: ID del chat
            
        Returns:
            Diccionario con los datos del chat o None si no existe
        """
        try:
            if not self.chats_collection:
                return None
            
            results = self.chats_collection.get(
                ids=[f"{user_id}_{chat_id}"],
                limit=1
            )
            
            if results and results.get('documents'):
                chat_data = json.loads(results['documents'][0])
                # Parsear mensajes de vuelta
                messages = json.loads(chat_data.get("messages", "[]"))
                return {
                    "chat_id": chat_data.get("chat_id"),
                    "title": chat_data.get("title", "Chat sin título"),
                    "messages": messages,
                    "created_at": chat_data.get("created_at"),
                    "updated_at": chat_data.get("updated_at")
                }
            return None
        except Exception as e:
            print(f"⚠️ Error al cargar chat: {e}")
            return None
    
    def delete_chat(self, user_id: str, chat_id: str) -> bool:
        """
        Elimina un chat
        
        Args:
            user_id: ID del usuario
            chat_id: ID del chat
            
        Returns:
            True si se eliminó correctamente
        """
        try:
            if not self.chats_collection:
                return False
            
            self.chats_collection.delete(ids=[f"{user_id}_{chat_id}"])
            print(f"🗑️ Chat eliminado: {user_id} - {chat_id}")
            return True
        except Exception as e:
            print(f"⚠️ Error al eliminar chat: {e}")
            return False
    
    def save_user_stats(self, user_id: str, input_tokens: int, output_tokens: int, cost: float, model: str) -> bool:
        """
        Guarda estadísticas de tokens y costos para un usuario
        
        Args:
            user_id: ID del usuario
            input_tokens: Tokens de entrada
            output_tokens: Tokens de salida
            cost: Costo total
            model: Modelo usado
            
        Returns:
            True si se guardó correctamente
        """
        try:
            if not self.stats_collection:
                return False
            
            # Obtener estadísticas actuales
            existing = self.stats_collection.get(
                ids=[f"{user_id}_stats"],
                limit=1
            )
            
            if existing and existing.get('documents'):
                # Actualizar estadísticas existentes
                current_stats = json.loads(existing['documents'][0])
                current_stats["total_input_tokens"] += input_tokens
                current_stats["total_output_tokens"] += output_tokens
                current_stats["total_cost"] += cost
                current_stats["total_requests"] += 1
                current_stats["updated_at"] = datetime.now().isoformat()
                
                # Actualizar por modelo
                if "by_model" not in current_stats:
                    current_stats["by_model"] = {}
                if model not in current_stats["by_model"]:
                    current_stats["by_model"][model] = {
                        "input_tokens": 0,
                        "output_tokens": 0,
                        "cost": 0.0,
                        "requests": 0
                    }
                current_stats["by_model"][model]["input_tokens"] += input_tokens
                current_stats["by_model"][model]["output_tokens"] += output_tokens
                current_stats["by_model"][model]["cost"] += cost
                current_stats["by_model"][model]["requests"] += 1
            else:
                # Crear nuevas estadísticas
                current_stats = {
                    "user_id": user_id,
                    "total_input_tokens": input_tokens,
                    "total_output_tokens": output_tokens,
                    "total_cost": cost,
                    "total_requests": 1,
                    "by_model": {
                        model: {
                            "input_tokens": input_tokens,
                            "output_tokens": output_tokens,
                            "cost": cost,
                            "requests": 1
                        }
                    },
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
            
            # Guardar en ChromaDB
            self.stats_collection.upsert(
                documents=[json.dumps(current_stats)],
                metadatas=[{
                    "user_id": user_id,
                    "total_cost": str(current_stats["total_cost"]),
                    "updated_at": current_stats["updated_at"]
                }],
                ids=[f"{user_id}_stats"]
            )
            
            return True
        except Exception as e:
            print(f"⚠️ Error al guardar estadísticas: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_user_stats(self, user_id: str) -> Dict:
        """
        Obtiene las estadísticas de tokens y costos de un usuario
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Diccionario con las estadísticas
        """
        try:
            if not self.stats_collection:
                return {
                    "total_input_tokens": 0,
                    "total_output_tokens": 0,
                    "total_cost": 0.0,
                    "total_requests": 0,
                    "by_model": {}
                }
            
            results = self.stats_collection.get(
                ids=[f"{user_id}_stats"],
                limit=1
            )
            
            if results and results.get('documents'):
                return json.loads(results['documents'][0])
            
            return {
                "total_input_tokens": 0,
                "total_output_tokens": 0,
                "total_cost": 0.0,
                "total_requests": 0,
                "by_model": {}
            }
        except Exception as e:
            print(f"⚠️ Error al obtener estadísticas: {e}")
            return {
                "total_input_tokens": 0,
                "total_output_tokens": 0,
                "total_cost": 0.0,
                "total_requests": 0,
                "by_model": {}
            }
