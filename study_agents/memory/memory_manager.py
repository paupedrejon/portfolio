"""
Memory Manager - Gestiona la memoria del sistema con RAG
Usa ChromaDB para almacenar y recuperar documentos con embeddings
"""

from typing import List, Dict, Any, Optional
import chromadb
import os
from dotenv import load_dotenv
# Asegurar parche de proxies aplicado antes de usar openai
import openai_proxy_patch  # noqa: F401
import openai

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
        
        self.embedding_function = self._build_embedding_function()
        
        # Inicializar ChromaDB en memoria (evita configuraciones persistidas con proxies)
        from chromadb.config import Settings
        self.client = chromadb.Client(Settings(anonymized_telemetry=False))

        # Crear la colección sin embedding_function; embebemos manualmente
        self.collection = self.client.create_collection(
            name="study_content",
            metadata={"description": "Contenido educativo procesado"}
        )
        print("✨ Colección en memoria creada (embedding manual)")
        
        # Historial de conversación por usuario (en memoria por ahora)
        self.conversation_histories: Dict[str, List[Dict[str, str]]] = {}
        
        print(f"💾 Memoria inicializada: {memory_type}")
        if self.api_key:
            print("✅ Usando embeddings de OpenAI")

    def _build_embedding_function(self):
        """
        Construye una función de embeddings usando OpenAI sin pasar argumentos incompatibles (como proxies).
        """
        if self.api_key:
            class OpenAIEmbeddingAdapter:
                def __init__(self, api_key: str, model: str = "text-embedding-3-small"):
                    self.client = openai.OpenAI(api_key=api_key)
                    self.model = model

                def __call__(self, texts: List[str]) -> List[List[float]]:
                    result = self.client.embeddings.create(model=self.model, input=texts)
                    return [item.embedding for item in result.data]

            return OpenAIEmbeddingAdapter(self.api_key)
        else:
            from chromadb.utils import embedding_functions
            return embedding_functions.DefaultEmbeddingFunction()
    
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
        
        # Generar embeddings manualmente para evitar que Chroma instancie clientes con proxies
        embeddings = self.embedding_function(documents) if self.embedding_function else None

        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids,
            embeddings=embeddings
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
        if not query.strip():
            # Si la query está vacía, retornar algunos documentos aleatorios
            results = self.collection.get(limit=n_results)
            return results.get('documents', [])
        
        try:
            # Calcular embedding manual
            query_embedding = self.embedding_function([query]) if self.embedding_function else None
            results = self.collection.query(
                query_embeddings=query_embedding,
                n_results=min(n_results, self.collection.count())
            )
            
            documents = results.get('documents', [])
            return documents[0] if documents else []
        except Exception as e:
            print(f"⚠️ Error al buscar contenido: {e}")
            # Fallback: retornar algunos documentos
            results = self.collection.get(limit=n_results)
            return results.get('documents', [])
    
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
