# 🎓 Guía Completa: Implementación de Agentes Multi-Agente con Python

## 📚 Índice

1. [Conceptos Básicos](#conceptos-básicos)
2. [Configuración Inicial](#configuración-inicial)
3. [Crear tu Primer Agente](#crear-tu-primer-agente)
4. [Sistema de Memoria Compartida](#sistema-de-memoria-compartida)
5. [Comunicación entre Agentes](#comunicación-entre-agentes)
6. [Integración Completa](#integración-completa)
7. [Conectar con Next.js](#conectar-con-nextjs)

---

## 🎯 Conceptos Básicos

### ¿Qué es un Agente?

Un **agente** es un programa que:
- Tiene un **objetivo específico** (ej: responder preguntas)
- Usa **IA (GPT-4)** para pensar y actuar
- Tiene acceso a **información/memoria**
- Puede **comunicarse** con otros agentes

### Arquitectura Multi-Agente

```
┌─────────────────────────────────────────┐
│        Sistema Study Agents             │
│                                         │
│  ┌──────────┐      ┌──────────┐       │
│  │ Agente 1 │ ←──→ │ Agente 2 │       │
│  └──────────┘      └──────────┘       │
│       ↓                   ↓            │
│  ┌──────────────────────────────┐     │
│  │   Memoria Compartida (RAG)   │     │
│  │      - Documentos            │     │
│  │      - Historial             │     │
│  │      - Contexto              │     │
│  └──────────────────────────────┘     │
└─────────────────────────────────────────┘
```

---

## ⚙️ Configuración Inicial

### Paso 1: Instalar Dependencias

```bash
cd study_agents
pip install -r requirements.txt
```

**Dependencias principales:**
- `openai` - Para usar ChatGPT API
- `langchain` - Framework para agentes
- `chromadb` - Base de datos vectorial (memoria)
- `python-dotenv` - Variables de entorno

### Paso 2: Obtener API Key de OpenAI

1. Ve a: https://platform.openai.com/api-keys
2. Inicia sesión o crea cuenta
3. Clic en "Create new secret key"
4. Cópiala (solo se muestra una vez)

### Paso 3: Configurar Variables de Entorno

Crea archivo `.env`:

```env
OPENAI_API_KEY=sk-tu-api-key-aqui
```

**IMPORTANTE:** Nunca subas este archivo a GitHub. Añádelo a `.gitignore`.

---

## 🤖 Crear tu Primer Agente

### Paso 1: Estructura Básica de un Agente

```python
# agents/qa_assistant.py

from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

class QAAssistantAgent:
    """Agente que responde preguntas"""
    
    def __init__(self):
        # 1. Inicializar el modelo de IA
        self.llm = ChatOpenAI(
            model="gpt-4",           # Modelo a usar
            temperature=0.7,         # Creatividad (0-1)
            api_key=os.getenv("OPENAI_API_KEY")
        )
    
    def answer_question(self, question: str, context: str = ""):
        """Responde una pregunta"""
        
        # 2. Crear el prompt (instrucciones para la IA)
        prompt = f"""
        Eres un asistente educativo experto.
        
        Contexto del temario:
        {context}
        
        Pregunta del estudiante: {question}
        
        Responde de manera clara y educativa.
        """
        
        # 3. Llamar a la IA
        response = self.llm.invoke(prompt)
        
        # 4. Retornar la respuesta
        return response.content
```

### Paso 2: Probar tu Primer Agente

Crea `test_agent.py`:

```python
from agents.qa_assistant import QAAssistantAgent
from dotenv import load_dotenv
import os

load_dotenv()

# Crear agente
agent = QAAssistantAgent()

# Hacer pregunta
answer = agent.answer_question(
    question="¿Qué es la inteligencia artificial?",
    context="La IA es una rama de la informática..."
)

print(answer)
```

Ejecuta:
```bash
python test_agent.py
```

---

## 💾 Sistema de Memoria Compartida

Los agentes necesitan compartir información. Usamos **ChromaDB** (base de datos vectorial).

### Paso 1: Crear el Gestor de Memoria

```python
# memory/memory_manager.py

import chromadb
from chromadb.config import Settings
from langchain_openai import OpenAIEmbeddings

class MemoryManager:
    """Gestiona la memoria compartida entre agentes"""
    
    def __init__(self):
        # 1. Inicializar ChromaDB
        self.client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory="./chroma_db"
        ))
        
        # 2. Crear colección
        self.collection = self.client.get_or_create_collection(
            name="study_content"
        )
        
        # 3. Embeddings para búsqueda semántica
        self.embeddings = OpenAIEmbeddings()
    
    def store_document(self, text: str, metadata: dict = None):
        """Almacena un documento"""
        # Dividir en chunks
        chunks = self._split_text(text)
        
        # Crear embeddings
        embeddings_list = self.embeddings.embed_documents(chunks)
        
        # Almacenar
        self.collection.add(
            documents=chunks,
            embeddings=embeddings_list,
            ids=[f"doc_{i}" for i in range(len(chunks))]
        )
    
    def search_relevant(self, query: str, n_results: int = 5):
        """Busca información relevante"""
        # Crear embedding de la consulta
        query_embedding = self.embeddings.embed_query(query)
        
        # Buscar en la base de datos
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        
        return results['documents'][0]
```

---

## 🔗 Comunicación entre Agentes

### Estrategia 1: Memoria Compartida (Recomendada)

Todos los agentes comparten la misma memoria:

```python
# main.py

from memory.memory_manager import MemoryManager
from agents.qa_assistant import QAAssistantAgent
from agents.test_generator import TestGeneratorAgent

# 1. Crear memoria compartida
memory = MemoryManager()

# 2. Crear agentes con la misma memoria
qa_agent = QAAssistantAgent(memory=memory)
test_agent = TestGeneratorAgent(memory=memory)

# 3. Los agentes pueden acceder a la misma información
# Cuando Q&A busca información, Test también la puede usar
```

### Estrategia 2: Comunicación Directa

Los agentes pueden pasar información entre sí:

```python
class StudyAgentsSystem:
    def __init__(self):
        self.memory = MemoryManager()
        
        # Crear agentes
        self.qa_agent = QAAssistantAgent(memory=self.memory)
        self.test_agent = TestGeneratorAgent(memory=self.memory)
        self.explanation_agent = ExplanationAgent(memory=self.memory)
    
    def generate_test_from_questions(self, questions: list):
        """Genera test basado en preguntas frecuentes"""
        
        # 1. El Q&A agent identifica temas importantes
        important_topics = self.qa_agent.extract_topics(questions)
        
        # 2. Pasa esa información al Test Generator
        test = self.test_agent.generate_test(
            topics=important_topics,
            based_on_questions=True
        )
        
        return test
```

---

## 🏗️ Integración Completa

### Paso 1: Crear Todos los Agentes

```python
# agents/content_processor.py

class ContentProcessorAgent:
    """Procesa documentos y los almacena"""
    
    def __init__(self, memory: MemoryManager):
        self.memory = memory
        self.llm = ChatOpenAI(model="gpt-4")
    
    def process_document(self, file_path: str):
        # 1. Leer PDF
        text = self._read_pdf(file_path)
        
        # 2. Dividir en chunks
        chunks = self._split_text(text)
        
        # 3. Almacenar en memoria
        for chunk in chunks:
            self.memory.store_document(chunk)
        
        # 4. Extraer conceptos clave
        concepts = self.llm.invoke(
            f"Extrae los conceptos clave de: {text}"
        )
        
        return concepts.content
```

### Paso 2: Sistema Coordinador

```python
# main.py

class StudyAgentsSystem:
    """Coordina todos los agentes"""
    
    def __init__(self):
        # Memoria compartida
        self.memory = MemoryManager()
        
        # Crear agentes
        self.content_processor = ContentProcessorAgent(self.memory)
        self.qa_assistant = QAAssistantAgent(self.memory)
        self.test_generator = TestGeneratorAgent(self.memory)
        self.feedback_agent = FeedbackAgent(self.memory)
    
    def upload_and_process(self, file_path: str):
        """Proceso completo: subir → procesar → listo"""
        
        # Agente 1: Procesa documento
        concepts = self.content_processor.process_document(file_path)
        
        # Agente 2: Genera explicaciones
        explanations = self.explanation_agent.generate(concepts)
        
        return {
            "concepts": concepts,
            "explanations": explanations,
            "status": "ready"
        }
    
    def answer_question(self, question: str):
        """Responde pregunta usando memoria compartida"""
        
        # 1. Buscar información relevante
        context = self.memory.search_relevant(question)
        
        # 2. Agente Q&A responde con contexto
        answer = self.qa_assistant.answer_question(
            question=question,
            context=context
        )
        
        return answer
```

---

## 🌐 Conectar con Next.js

### Opción 1: API Routes en Next.js (Recomendada)

Crea `app/api/study-agents/ask/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();
    
    // Llamar a tu servidor Python
    const response = await fetch('http://localhost:8000/api/ask-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Opción 2: Llamar Directamente a Python desde Next.js

Modifica `components/StudyChat.tsx`:

```typescript
const askQuestion = async (question: string) => {
  const response = await fetch('http://localhost:8000/api/ask-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  
  const data = await response.json();
  
  addMessage({
    role: "assistant",
    content: data.answer,
    type: "message",
  });
};
```

---

## 🔄 Flujo Completo de Trabajo

### Ejemplo: Proceso Completo

```python
# 1. Usuario sube documento
system = StudyAgentsSystem()
system.upload_and_process("temario.pdf")

# 2. Usuario pregunta
answer = system.answer_question("¿Qué es la IA?")
# → Q&A Agent busca en memoria → Responde

# 3. Usuario pide test
test = system.test_generator.generate_test()
# → Test Agent usa la misma memoria → Genera preguntas

# 4. Usuario responde test
feedback = system.feedback_agent.grade_test(test, answers)
# → Feedback Agent corrige → Da feedback
```

---

## 💡 Mejores Prácticas

### 1. **Prompts Efectivos**

```python
# ❌ Malo
prompt = f"Responde: {question}"

# ✅ Bueno
prompt = f"""
Eres un profesor experto de {subject}.
El estudiante pregunta: {question}

Contexto del temario:
{context}

Responde:
- De manera clara y educativa
- Con ejemplos si es necesario
- Citando conceptos relevantes del temario
"""
```

### 2. **Manejo de Errores**

```python
def answer_question(self, question: str):
    try:
        response = self.llm.invoke(prompt)
        return response.content
    except Exception as e:
        return f"Lo siento, hubo un error: {str(e)}"
```

### 3. **Optimización de Costos**

```python
# Usa modelos más baratos cuando sea posible
self.llm = ChatOpenAI(
    model="gpt-3.5-turbo",  # Más barato que gpt-4
    temperature=0.7
)

# Cachea respuestas comunes
from functools import lru_cache

@lru_cache(maxsize=100)
def answer_common_question(question: str):
    # ...
```

---

## 📝 Ejemplo Completo Simplificado

```python
# simple_agent.py

from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

class SimpleAgent:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.memory = []  # Memoria simple (lista)
    
    def remember(self, text: str):
        """Almacena información en memoria"""
        self.memory.append(text)
    
    def think(self, prompt: str):
        """Piensa usando GPT"""
        # Construir contexto
        context = "\n".join(self.memory[-5:])  # Últimas 5 cosas
        
        full_prompt = f"""
        Contexto: {context}
        
        Tarea: {prompt}
        """
        
        # Llamar a OpenAI
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Eres un asistente educativo."},
                {"role": "user", "content": full_prompt}
            ]
        )
        
        return response.choices[0].message.content

# Usar
agent = SimpleAgent()
agent.remember("La IA es...")
agent.remember("Machine Learning es...")

answer = agent.think("Explica qué es la IA")
print(answer)
```

---

## 🚀 Siguiente Paso

1. **Empieza Simple:** Crea un agente básico
2. **Añade Memoria:** Conecta con ChromaDB
3. **Crea Más Agentes:** Cada uno con su función
4. **Conecta Todo:** Sistema coordinador
5. **Integra con Next.js:** API routes

---

## 📚 Recursos Adicionales

- **Documentación OpenAI:** https://platform.openai.com/docs
- **LangChain Docs:** https://python.langchain.com/
- **ChromaDB Docs:** https://docs.trychroma.com/

---

¿Listo para empezar? Empieza con el ejemplo simple y ve construyendo paso a paso! 🎓

