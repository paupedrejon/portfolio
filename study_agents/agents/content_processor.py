"""
Content Processor Agent - Procesa documentos usando RAG
Lee PDFs, los divide en chunks y los almacena en memoria
"""

from typing import List, Dict, Optional
import os
import uuid
from datetime import datetime, timezone
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from memory.memory_manager import MemoryManager

class ContentProcessorAgent:
    """
    Agente especializado en procesar y organizar documentos educativos
    """
    
    def __init__(self, memory: MemoryManager):
        """
        Inicializa el agente procesador de contenido
        
        Args:
            memory: Gestor de memoria del sistema
        """
        self.memory = memory
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        print("🤖 Content Processor Agent inicializado")
    
    def process_documents(
        self,
        document_paths: List[str],
        chat_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> dict:
        """
        Procesa documentos PDF y los almacena en memoria
        
        Args:
            document_paths: Lista de rutas a documentos PDF
            
        Returns:
            Diccionario con información del procesamiento
        """
        all_documents = []
        all_metadatas = []
        total_chunks = 0
        
        for doc_path in document_paths:
            # Resolver rutas /api/files/… → documents/…
            resolved = doc_path
            if doc_path.startswith("/api/files/"):
                filename = doc_path.replace("/api/files/", "", 1)
                candidates = [
                    os.path.join("documents", filename),
                    os.path.join(os.path.dirname(os.path.dirname(__file__)), "documents", filename),
                    os.path.join(os.getcwd(), "documents", filename),
                ]
                resolved = next((c for c in candidates if os.path.exists(c)), doc_path)

            if not os.path.exists(resolved):
                print(f"⚠️ Archivo no encontrado: {doc_path} (resolved={resolved})")
                continue
                
            print(f"📄 Procesando: {os.path.basename(resolved)}")
            doc_id = f"doc_{uuid.uuid4().hex[:12]}"
            uploaded_at = datetime.now(timezone.utc).isoformat()
            
            try:
                # Cargar documento PDF
                loader = PyPDFLoader(resolved)
                pages = loader.load()
                
                if not pages:
                    print(f"⚠️ No se pudieron leer páginas de: {resolved}")
                    continue
                
                # Dividir en chunks
                chunks = self.text_splitter.split_documents(pages)
                
                # Extraer textos y metadatos
                for chunk in chunks:
                    all_documents.append(chunk.page_content)
                    all_metadatas.append({
                        "source": os.path.basename(resolved),
                        "full_path": resolved,
                        "page": chunk.metadata.get("page", 0),
                        "doc_id": doc_id,
                        "uploaded_at": uploaded_at,
                    })
                    total_chunks += 1
                
                print(f"✅ {len(chunks)} chunks creados de {len(pages)} páginas (chat_id={chat_id})")
                
            except Exception as e:
                print(f"❌ Error procesando {resolved}: {str(e)}")
                continue
        
        # Almacenar todos los documentos en memoria (acumula por chat, no reemplaza)
        if all_documents:
            self.memory.store_documents(
                all_documents,
                all_metadatas,
                chat_id=chat_id,
                user_id=user_id,
            )
        
        existing_count = sum(
            1 for p in document_paths
            if os.path.exists(p) or (
                p.startswith("/api/files/") and any(
                    os.path.exists(os.path.join(d, p.replace("/api/files/", "", 1)))
                    for d in ("documents", os.path.join(os.getcwd(), "documents"))
                )
            )
        )
        return {
            "total_documents": existing_count or (1 if all_documents else 0),
            "total_chunks": total_chunks,
            "status": "processed" if all_documents else "error",
            "processed_files": [
                os.path.basename(m.get("source", ""))
                for m in all_metadatas
            ][:20],
            "chat_id": chat_id,
            "user_id": user_id,
        }
    
    def process_text(self, text: str, metadata: Dict = None) -> dict:
        """
        Procesa texto directamente sin archivo
        
        Args:
            text: Texto a procesar
            metadata: Metadatos opcionales
            
        Returns:
            Información del procesamiento
        """
        if not text or not text.strip():
            return {"error": "Texto vacío"}
        
        # Dividir en chunks
        chunks = self.text_splitter.split_text(text)
        
        # Preparar metadatas
        metadatas = [metadata or {}] * len(chunks)
        
        # Almacenar en memoria
        self.memory.store_documents(chunks, metadatas)
        
        return {
            "total_chunks": len(chunks),
            "status": "processed"
        }
