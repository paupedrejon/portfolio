# 🚀 Paso a Paso: Crear tu Sistema de Agentes

## ✅ Checklist de Implementación

### Fase 1: Configuración Básica (15 minutos)

- [ ] **1.1** Instalar dependencias
  ```bash
  pip install openai python-dotenv
  ```

- [ ] **1.2** Crear archivo `.env`
  ```env
  OPENAI_API_KEY=sk-tu-key-aqui
  ```

- [ ] **1.3** Probar conexión con OpenAI
  ```python
  from openai import OpenAI
  import os
  from dotenv import load_dotenv
  
  load_dotenv()
  client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
  
  response = client.chat.completions.create(
      model="gpt-4",
      messages=[{"role": "user", "content": "Hola"}]
  )
  print(response.choices[0].message.content)
  ```

### Fase 2: Primer Agente (30 minutos)

- [ ] **2.1** Crear estructura de carpetas
  ```
  study_agents/
  ├── agents/
  │   └── simple_qa.py
  ├── .env
  └── test.py
  ```

- [ ] **2.2** Crear agente básico (`agents/simple_qa.py`)
  ```python
  from openai import OpenAI
  import os
  from dotenv import load_dotenv
  
  load_dotenv()
  
  class SimpleAgent:
      def __init__(self):
          self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
      
      def ask(self, question: str):
          response = self.client.chat.completions.create(
              model="gpt-4",
              messages=[
                  {"role": "system", "content": "Eres un asistente educativo."},
                  {"role": "user", "content": question}
              ]
          )
          return response.choices[0].message.content
  ```

- [ ] **2.3** Probar el agente (`test.py`)
  ```python
  from agents.simple_qa import SimpleAgent
  
  agent = SimpleAgent()
  answer = agent.ask("¿Qué es Python?")
  print(answer)
  ```

### Fase 3: Añadir Memoria (45 minutos)

- [ ] **3.1** Instalar ChromaDB
  ```bash
  pip install chromadb langchain-openai
  ```

- [ ] **3.2** Crear gestor de memoria (`memory/simple_memory.py`)
  ```python
  import chromadb
  from langchain_openai import OpenAIEmbeddings
  
  class SimpleMemory:
      def __init__(self):
          self.client = chromadb.Client()
          self.collection = self.client.get_or_create_collection("knowledge")
          self.embeddings = OpenAIEmbeddings()
      
      def store(self, text: str):
          embedding = self.embeddings.embed_query(text)
          self.collection.add(
              documents=[text],
              embeddings=[embedding],
              ids=[f"doc_{len(self.collection.get()['ids'])}"]
          )
      
      def search(self, query: str, n=3):
          query_embedding = self.embeddings.embed_query(query)
          results = self.collection.query(
              query_embeddings=[query_embedding],
              n_results=n
          )
          return results['documents'][0]
  ```

- [ ] **3.3** Conectar agente con memoria
  ```python
  class AgentWithMemory:
      def __init__(self):
          self.memory = SimpleMemory()
          self.client = OpenAI(...)
      
      def learn(self, text: str):
          self.memory.store(text)
      
      def ask(self, question: str):
          # Buscar información relevante
          relevant = self.memory.search(question)
          
          # Usar esa información en el prompt
          prompt = f"Contexto: {relevant}\n\nPregunta: {question}"
          # ... llamar a OpenAI
  ```

### Fase 4: Crear Segundo Agente (30 minutos)

- [ ] **4.1** Crear agente generador de tests
  ```python
  class TestGenerator:
      def __init__(self, memory):
          self.memory = memory
          self.client = OpenAI(...)
      
      def generate(self, num_questions=5):
          # Usar memoria para generar preguntas
          content = self.memory.search("", n=10)
          # ... generar test con GPT
  ```

- [ ] **4.2** Probar que ambos agentes funcionen
  ```python
  memory = SimpleMemory()
  
  qa_agent = QAAgent(memory)
  test_agent = TestAgent(memory)
  
  # Ambos comparten la misma memoria
  ```

### Fase 5: Sistema Coordinador (30 minutos)

- [ ] **5.1** Crear clase coordinadora
  ```python
  class StudySystem:
      def __init__(self):
          self.memory = SimpleMemory()
          self.qa = QAAgent(self.memory)
          self.test = TestAgent(self.memory)
      
      def upload_document(self, text):
          self.memory.store(text)
      
      def ask_question(self, question):
          return self.qa.ask(question)
      
      def generate_test(self):
          return self.test.generate()
  ```

### Fase 6: API REST (1 hora)

- [ ] **6.1** Instalar FastAPI
  ```bash
  pip install fastapi uvicorn
  ```

- [ ] **6.2** Crear API básica (`api/main.py`)
  ```python
  from fastapi import FastAPI
  from main import StudySystem
  
  app = FastAPI()
  system = StudySystem()
  
  @app.post("/api/ask")
  def ask(question: str):
      return {"answer": system.ask_question(question)}
  ```

- [ ] **6.3** Probar API
  ```bash
  python api/main.py
  # Abre: http://localhost:8000/docs
  ```

### Fase 7: Conectar con Next.js (30 minutos)

- [ ] **7.1** Crear API route en Next.js
  ```typescript
  // app/api/study/ask/route.ts
  export async function POST(req: Request) {
    const { question } = await req.json();
    
    const res = await fetch('http://localhost:8000/api/ask', {
      method: 'POST',
      body: JSON.stringify({ question })
    });
    
    return Response.json(await res.json());
  }
  ```

- [ ] **7.2** Modificar componente React
  ```typescript
  const askQuestion = async (q: string) => {
    const res = await fetch('/api/study/ask', {
      method: 'POST',
      body: JSON.stringify({ question: q })
    });
    const data = await res.json();
    // ... mostrar respuesta
  };
  ```

---

## 📅 Timeline Sugerido

- **Día 1:** Fase 1-2 (Configuración + Primer Agente)
- **Día 2:** Fase 3-4 (Memoria + Segundo Agente)
- **Día 3:** Fase 5-6 (Sistema + API)
- **Día 4:** Fase 7 (Integración Next.js)

---

## 🎯 Orden Recomendado de Implementación

1. **Empezar Simple:** Un solo agente básico
2. **Añadir Memoria:** Para que "recuerde" cosas
3. **Crear Más Agentes:** Uno a uno, probando cada uno
4. **Conectar Todo:** Sistema coordinador
5. **Añadir API:** Para poder usar desde fuera
6. **Integrar Frontend:** Conectar con Next.js

---

## ❓ ¿Problemas?

### Error: "API key not found"
- Verifica que `.env` existe
- Verifica que tiene `OPENAI_API_KEY=...`
- Reinicia el servidor

### Error: "No module named 'openai'"
- Ejecuta: `pip install openai`

### Las respuestas son lentas
- Usa `gpt-3.5-turbo` en lugar de `gpt-4` (más rápido y barato)
- Cachea respuestas comunes

---

¡Sigue estos pasos y tendrás tu sistema funcionando! 🚀

