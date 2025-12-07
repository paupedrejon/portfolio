# 🎓 Guía Completa: Cómo Funcionan los Agentes en Python

## ¿Qué es un Agente de IA?

Un **agente de IA** es un programa que puede:
- **Pensar** usando modelos de lenguaje (como GPT-4)
- **Actuar** ejecutando tareas específicas
- **Recordar** información para usarla después
- **Tomar decisiones** basándose en el contexto

Piensa en un agente como un **asistente inteligente** que tiene un trabajo específico.

---

## 🏗️ Arquitectura de Study Agents

### Sistema Multi-Agente

En lugar de tener un solo agente que haga todo, tenemos **5 agentes especializados** que trabajan juntos:

```
┌─────────────────────────────────────────────────┐
│         Study Agents System                     │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐           │
│  │   Content    │  │ Explanation │           │
│  │  Processor   │  │   Agent     │           │
│  └──────────────┘  └──────────────┘           │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐           │
│  │     Q&A      │  │     Test     │           │
│  │  Assistant   │  │  Generator  │           │
│  └──────────────┘  └──────────────┘           │
│                                                 │
│  ┌──────────────┐                              │
│  │   Feedback   │                              │
│  │    Agent     │                              │
│  └──────────────┘                              │
│                                                 │
│  ┌──────────────────────────────────────┐     │
│  │      Memory Manager (ChromaDB)        │     │
│  │  - Almacena documentos                │     │
│  │  - Recupera información relevante     │     │
│  │  - Guarda historial de conversación   │     │
│  └──────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

---

## 📚 Conceptos Clave

### 1. **RAG (Retrieval-Augmented Generation)**

**¿Qué es?**
- Técnica que combina búsqueda de información + generación de texto
- En lugar de que el modelo "recuerde" todo, busca información relevante cuando la necesita

**Cómo funciona:**
```
1. Documentos → Se dividen en "chunks" (pedazos)
2. Chunks → Se convierten en "embeddings" (vectores numéricos)
3. Embeddings → Se almacenan en una base de datos (ChromaDB)
4. Cuando preguntas algo → Busca chunks similares
5. Chunks encontrados → Se envían al LLM como contexto
6. LLM → Genera respuesta usando ese contexto
```

**Ejemplo:**
```python
# 1. Procesar documento
documents = ["La IA es...", "Machine Learning es...", ...]

# 2. Buscar información relevante
query = "¿Qué es inteligencia artificial?"
relevant_docs = memory.retrieve_relevant_content(query)

# 3. Generar respuesta con contexto
answer = llm.generate(context=relevant_docs, question=query)
```

---

### 2. **LangChain**

**¿Qué es?**
- Framework para construir aplicaciones con LLMs
- Facilita conectar diferentes componentes (modelos, bases de datos, etc.)

**Componentes principales:**
- **LLMs**: Modelos de lenguaje (GPT-4, etc.)
- **Chains**: Secuencias de operaciones
- **Prompts**: Plantillas para instrucciones al modelo
- **Memory**: Gestión de conversaciones

**Ejemplo:**
```python
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

# 1. Inicializar modelo
llm = ChatOpenAI(model="gpt-4")

# 2. Crear prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", "Eres un profesor experto"),
    ("user", "Explica: {concept}")
])

# 3. Crear chain (cadena de operaciones)
chain = prompt | llm

# 4. Ejecutar
response = chain.invoke({"concept": "Machine Learning"})
```

---

### 3. **ChromaDB**

**¿Qué es?**
- Base de datos vectorial (almacena embeddings)
- Permite búsqueda semántica (buscar por significado, no solo palabras exactas)

**Cómo funciona:**
```python
# 1. Crear colección
collection = client.create_collection("study_content")

# 2. Almacenar documentos
collection.add(
    documents=["Texto 1", "Texto 2", ...],
    ids=["doc1", "doc2", ...]
)

# 3. Buscar documentos similares
results = collection.query(
    query_texts=["¿Qué es la IA?"],
    n_results=5
)
```

---

## 🤖 Los 5 Agentes Explicados

### 1. Content Processor Agent

**Función:** Procesa documentos PDF y los almacena

**Cómo funciona:**
```python
class ContentProcessorAgent:
    def process_documents(self, document_paths):
        # 1. Cargar PDFs
        pages = PyPDFLoader(path).load()
        
        # 2. Dividir en chunks
        chunks = text_splitter.split_documents(pages)
        
        # 3. Almacenar en memoria
        memory.store_documents(chunks)
```

**Flujo:**
```
PDF → Cargar → Dividir en chunks → Crear embeddings → Guardar en ChromaDB
```

---

### 2. Explanation Agent

**Función:** Genera explicaciones claras del contenido

**Cómo funciona:**
```python
class ExplanationAgent:
    def generate_explanations(self):
        # 1. Recuperar contenido
        content = memory.retrieve_relevant_content("")
        
        # 2. Crear prompt educativo
        prompt = "Explica esto de manera clara: {content}"
        
        # 3. Generar explicación
        explanation = llm.invoke(prompt)
        
        return explanation
```

**Flujo:**
```
Contenido → Prompt educativo → LLM → Explicación clara
```

---

### 3. Q&A Assistant Agent

**Función:** Responde preguntas del estudiante

**Cómo funciona:**
```python
class QAAssistantAgent:
    def answer_question(self, question):
        # 1. Buscar contenido relevante
        relevant = memory.retrieve_relevant_content(question)
        
        # 2. Obtener historial
        history = memory.get_conversation_history()
        
        # 3. Generar respuesta con contexto
        answer = llm.invoke({
            "context": relevant,
            "history": history,
            "question": question
        })
        
        # 4. Guardar en historial
        memory.add_to_history(question, answer)
        
        return answer
```

**Flujo:**
```
Pregunta → Buscar contexto → Añadir historial → LLM → Respuesta
```

---

### 4. Test Generator Agent

**Función:** Genera tests personalizados

**Cómo funciona:**
```python
class TestGeneratorAgent:
    def generate_test(self, difficulty, num_questions):
        # 1. Recuperar contenido
        content = memory.retrieve_relevant_content("")
        
        # 2. Crear prompt para generar test
        prompt = f"""
        Genera {num_questions} preguntas de nivel {difficulty}
        basándote en: {content}
        """
        
        # 3. Generar test (formato JSON)
        test = llm.invoke(prompt)
        
        # 4. Almacenar test
        self.generated_tests[test_id] = test
        
        return test
```

**Flujo:**
```
Contenido → Prompt de test → LLM → Test en JSON → Almacenar
```

---

### 5. Feedback Agent

**Función:** Corrige tests y da feedback

**Cómo funciona:**
```python
class FeedbackAgent:
    def grade_test(self, test_id, answers):
        # 1. Obtener test original
        test = test_generator.get_test(test_id)
        
        # 2. Comparar respuestas
        for question in test.questions:
            is_correct = answers[question.id] == question.correct_answer
            
            # 3. Generar feedback
            feedback = llm.invoke({
                "question": question,
                "student_answer": answers[question.id],
                "is_correct": is_correct
            })
        
        # 4. Generar feedback general
        general_feedback = self._generate_general_feedback(score)
        
        return {
            "score": score,
            "feedback": feedback,
            "recommendations": recommendations
        }
```

**Flujo:**
```
Respuestas → Comparar → Generar feedback → Recomendaciones
```

---

## 🔄 Flujo Completo del Sistema

```
1. Usuario sube PDFs
   ↓
2. Content Processor procesa y almacena
   ↓
3. Explanation Agent genera explicaciones
   ↓
4. Usuario hace preguntas
   ↓
5. Q&A Assistant responde
   ↓
6. Usuario solicita test
   ↓
7. Test Generator crea test
   ↓
8. Usuario responde test
   ↓
9. Feedback Agent corrige y da feedback
   ↓
10. Usuario puede repetir desde paso 4
```

---

## 🛠️ Cómo Usar el Sistema

### Paso 1: Instalar Dependencias

```bash
cd study_agents
pip install -r requirements.txt
```

### Paso 2: Configurar API Key

```bash
# Crear archivo .env
echo "OPENAI_API_KEY=tu_key_aqui" > .env
```

### Paso 3: Ejecutar la API

```bash
# Opción 1: Directamente
python api/main.py

# Opción 2: Con uvicorn
uvicorn api.main:app --reload
```

### Paso 4: Abrir Interfaz Web

Abre tu navegador en: `http://localhost:8000`

---

## 📝 Ejemplo de Código Completo

```python
from main import StudyAgentsSystem

# 1. Inicializar sistema
system = StudyAgentsSystem()

# 2. Subir documentos
system.upload_documents(["documents/temario.pdf"])

# 3. Generar explicaciones
explanations = system.generate_explanations()

# 4. Hacer pregunta
answer = system.ask_question("¿Qué es la IA?")

# 5. Generar test
test = system.generate_test(difficulty="medium", num_questions=5)

# 6. Corregir test
feedback = system.grade_test(
    test_id=test["test_id"],
    answers={"q1": "A", "q2": "True", ...}
)
```

---

## 🎯 Puntos Clave para Entender

1. **Cada agente tiene un trabajo específico** - Especialización
2. **Comparten la misma memoria** - ChromaDB almacena todo
3. **Usan LLMs para generar texto** - GPT-4 para respuestas
4. **RAG para contexto** - Buscan información relevante antes de responder
5. **Sistema modular** - Fácil añadir nuevos agentes

---

## 🚀 Próximos Pasos

1. **Experimenta** con la interfaz web
2. **Lee el código** de cada agente
3. **Modifica prompts** para personalizar respuestas
4. **Añade nuevos agentes** si lo necesitas
5. **Mejora la memoria** con más funcionalidades

---

## ❓ Preguntas Frecuentes

**P: ¿Necesito entender todo esto para usarlo?**
R: No, puedes usar la interfaz web sin saber programar.

**P: ¿Cómo funciona RAG exactamente?**
R: Busca información relevante en los documentos antes de generar la respuesta.

**P: ¿Puedo usar otros modelos además de GPT-4?**
R: Sí, LangChain soporta muchos modelos (Claude, Llama, etc.)

**P: ¿Cómo mejoro las respuestas?**
R: Ajusta los prompts en cada agente para ser más específico.

---

¡Espero que esta guía te ayude a entender cómo funcionan los agentes! 🎓

