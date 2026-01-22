<div align="center">
  <a href="https://github.com/paupedrejon/portfolio">
    <img src="public/StudyAgentsLogo.png" alt="Study Agents Logo" width="80" height="80">
  </a>

  <h1 align="center">🎓 Study Agents - Portfolio & Capstone Project</h1>

  <p align="center">
    Sistema Multi-Agente de IA para Autoaprendizaje Personalizado
    <br />
    <a href="#-cómo-probar"><strong>Explorar los docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/paupedrejon/portfolio/issues">Reportar Bug</a>
    ·
    <a href="https://github.com/paupedrejon/portfolio/issues">Solicitar Feature</a>
  </p>
</div>

<div align="center">

![Status](https://img.shields.io/badge/Status-Producción-brightgreen?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15.5.9-black?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green?style=for-the-badge&logo=fastapi&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

</div>

<details>
  <summary><strong>📝 Tabla de Contenidos</strong> (Haz click para expandir)</summary>
  <ol>
    <li><a href="#-introducción">Introducción</a></li>
    <li><a href="#-cómo-probar">Cómo Probar</a></li>
    <li><a href="#-agentes">Agentes</a></li>
    <li><a href="#-características">Características</a></li>
    <li><a href="#-estructura-del-proyecto">Estructura del Proyecto</a></li>
    <li><a href="#-herramientas-utilizadas">Herramientas Utilizadas</a></li>
    <li><a href="#-despliegue">Despliegue</a></li>
    <li><a href="#-contacto">Contacto</a></li>
  </ol>
</details>

---

## ⚡ INTRODUCCIÓN

Bienvenidos a mi Capstone Project **StudyAgents**.

Primero de todo me gustaría presentarme, me llamo Pau, tengo 20 años y soy estudiante de informática en la UPC (Universidad Politécnica de Barcelona).

Como estudiante empezé a usar herramientas de IA ya hace tiempo para ayudarme con el estudio (empecé a usar el OpenAI Playground por 2022) ya que muchas veces 
me salían dudas mientras me tenia que preparar algun examen o al realizar algun ejercicio, y no había ningun profesor que me pudiese estar todo el rato ayudando.

He visto evolucionar estos LLMs y he visto la gran mejora que han tenido (al principio me daban todas las respuestas mal), pero hay algo que no he visto mejora
hasta hace muy poco con Gemini, que es la parte interactiva. Cuando me quería preparar un examen y le pedía a ChatGPT que me hiciese preguntas me daba un texto
largo con muchas preguntas y tenia que ir pregunta por pregunta respondiendole, o cuando le pedía apuntes para descargarme para antes del exámen, me daba textos
largos y tenía que hacer captura de pantalla para poderlo tener mas accesible y no tener que ir al momento del chat donde le pedí estos apuntes, total un rollo.

Mi objetivo en este proyecto ha sido facilitar el aprendizaje, he buscado las herramientas que mejores resulados dan en el aprendizaje (hacer resumenes, flashcards, tests...) y unirlos con agentes especializados en enseñar, corregir y dar feedback al estudiante.






Study Agents es una orquestación de **múltiples agentes especializados de IA** que trabajan en conjunto para facilitar el proceso de aprendizaje autónomo. Utiliza tecnologías avanzadas de procesamiento de lenguaje natural (LLMs), RAG (Retrieval-Augmented Generation) y ChromaDB para crear una experiencia de aprendizaje personalizada e interactiva.

### 🎯 Características Principales

- **📚 Procesamiento Inteligente**: Sube PDFs y documentos que se procesan automáticamente usando RAG
- **💬 Chat Interactivo**: Asistente de preguntas y respuestas contextualizado con tu material de estudio
- **📝 Generación de Apuntes**: Convierte documentos densos en apuntes claros y estructurados
- **📊 Tests Personalizados**: Genera evaluaciones adaptadas a tu nivel de conocimiento (0-10)
- **🎯 Sistema de Progreso**: Rastrea tu aprendizaje y ajusta la dificultad automáticamente
- **🃏 Flashcards**: Sistema de tarjetas para aprendizaje de vocabulario en idiomas
- **💻 Intérprete de Código**: Ejecuta código Python, JavaScript, Java, C++, SQL directamente en el navegador

> **Nota:** Este proyecto requiere una API Key de OpenAI para funcionar. Los usuarios pueden configurar su propia API key desde la interfaz web.

---

## 🛠️ Cómo Probar

Sigue estos pasos para poner en marcha Study Agents en tu máquina local.

### Prerrequisitos

* **Python 3.11+** (recomendado 3.11.9)
* **Node.js 18+** y npm
* **Pip** (gestor de paquetes de Python)
* **API Key de OpenAI** (puedes obtenerla en https://platform.openai.com/api-keys)

### Instalación del Backend (FastAPI)

1. **Clona el repositorio**
    ```bash
    git clone https://github.com/paupedrejon/portfolio.git
    cd portfolio
    ```

2. **Navega al directorio del backend**
    ```bash
    cd study_agents
    ```

3. **Crea un entorno virtual (recomendado)**
    ```bash
    # En Windows
    python -m venv venv
    .\venv\Scripts\activate
    
    # En Mac/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

4. **Instala las dependencias de Python**
    ```bash
    pip install -r requirements.txt
    ```

5. **Configura las variables de entorno (opcional)**
    Puedes crear un archivo `.env` en `study_agents/` o configurar la API key desde la interfaz web:
    ```ini
    OPENAI_API_KEY=tu_api_key_aqui
    FASTAPI_URL=http://localhost:8000
    ```

### Instalación del Frontend (Next.js)

1. **Desde la raíz del proyecto, instala las dependencias de Node.js**
    ```bash
    npm install
    ```

2. **Configura las variables de entorno**
    Crea un archivo `.env.local` en la raíz del proyecto:
    ```ini
    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET=tu_secret_aqui
    GOOGLE_CLIENT_ID=tu_google_client_id
    GOOGLE_CLIENT_SECRET=tu_google_client_secret
    FASTAPI_URL=http://localhost:8000
    ```

### Ejecución

**Opción 1: Ejecutar manualmente**

1. **Inicia el backend (desde `study_agents/`)**
    ```bash
    cd api
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```

2. **Inicia el frontend (desde la raíz del proyecto)**
    ```bash
    npm run dev
    ```

3. **Abre tu navegador**
    - Frontend: http://localhost:3000
    - Backend API: http://localhost:8000
    - Backend Health Check: http://localhost:8000/health

**Opción 2: Usar los scripts incluidos**

En Windows:
```bash
# Backend
cd study_agents
.\start_api.bat

# Frontend (en otra terminal)
npm run dev
```

### Uso Rápido

1. Accede a http://localhost:3000/study-agents
2. Configura tu API Key de OpenAI (si no la configuraste en el .env)
3. Sube un PDF con contenido de estudio
4. Haz preguntas, genera apuntes o crea tests personalizados

---

## 🤖 Agentes

El sistema está compuesto por **5 agentes especializados** que trabajan en conjunto:

### 1. 📚 **Content Processor Agent**
- **Función**: Procesa y estructura documentos subidos (PDFs, textos)
- **Tecnología**: RAG (Retrieval-Augmented Generation) con ChromaDB
- **Características**: 
  - Extracción de texto de PDFs
  - Segmentación inteligente de contenido
  - Indexación vectorial para búsqueda semántica
  - Almacenamiento persistente de documentos

### 2. 💡 **Explanation Agent**
- **Función**: Transforma información compleja en explicaciones claras y estructuradas
- **Características**:
  - Adapta el nivel de explicación según el conocimiento del usuario (0-10)
  - Genera apuntes en formato Markdown
  - Incluye ejemplos, tablas comparativas y diagramas
  - Integra contenido multimedia (videos de YouTube, imágenes)

### 3. 💬 **Q&A Assistant Agent**
- **Función**: Responde preguntas del estudiante de forma contextualizada
- **Características**:
  - Utiliza el contexto de los documentos subidos
  - Mantiene historial de conversación
  - Personaliza respuestas según el nivel del usuario
  - Soporte para múltiples idiomas y temas

### 4. 📊 **Test Generator Agent**
- **Función**: Crea tests y evaluaciones personalizadas
- **Características**:
  - Genera preguntas de opción múltiple y verdadero/falso
  - Adapta la dificultad al nivel del estudiante
  - Crea tests temáticos según el contenido estudiado
  - Genera feedback automático

### 5. ✅ **Feedback & Correction Agent**
- **Función**: Corrige ejercicios y proporciona retroalimentación detallada
- **Características**:
  - Corrección automática de respuestas
  - Explicaciones detalladas de cada respuesta
  - Sugerencias de mejora
  - Análisis del rendimiento del estudiante

### 6. 🎯 **Exercise Generator Agent** (Bonus)
- **Función**: Genera ejercicios prácticos personalizados
- **Características**:
  - Ejercicios adaptados al nivel del usuario
  - Diferentes tipos de ejercicios según el tema
  - Corrección automática con feedback
  - Sistema de progreso y estadísticas

---

## ✨ Características Detalladas

### 📖 **Generación de Apuntes**
- Convierte documentos PDF en apuntes estructurados
- Formato Markdown con soporte para tablas, listas y código
- Descarga en PDF con formato profesional
- Integración de videos de YouTube automática
- Diagramas y esquemas visuales

### 🎯 **Sistema de Niveles Inteligente**
- Rastrea tu nivel de conocimiento por tema (escala 0-10)
- Ajusta automáticamente la dificultad del contenido
- Sistema de experiencia y progreso visual
- Recomendaciones personalizadas de estudio

### 🃏 **Flashcards para Idiomas**
- Sistema de tarjetas interactivas para aprendizaje de vocabulario
- Soporte para múltiples idiomas (Inglés, Francés, Alemán, Italiano, Portugués, Chino, Japonés, Coreano, etc.)
- Sistema de repetición espaciada
- Seguimiento de palabras aprendidas
- Generación automática de ejercicios tipo test

### 💻 **Intérprete de Código Integrado**
- Ejecuta código directamente en el navegador
- Soporte para: Python, JavaScript, Java, C++, SQL
- Resaltado de sintaxis con CodeMirror
- Entrada y salida interactivas
- Ideal para aprender programación

### 📊 **Dashboard de Progreso**
- Visualización de tu progreso por temas
- Estadísticas de uso (tokens, costes, solicitudes)
- Desglose por modelo de IA utilizado
- Gráficas de nivel y experiencia

### 🔐 **Autenticación y Multi-usuario**
- Autenticación con Google (NextAuth)
- Sistema multi-usuario con datos privados
- Cada usuario tiene su propio progreso y chats
- API keys personales (cada usuario usa su propia clave)

---

## 📁 Estructura del Proyecto

```
portfolio/
├── app/                          # Frontend Next.js (App Router)
│   ├── api/                      # API Routes de Next.js
│   │   └── study-agents/         # Endpoints para Study Agents
│   ├── study-agents/             # Página principal de Study Agents
│   ├── auth/                     # Autenticación
│   └── ...                       # Otras páginas del portfolio
│
├── components/                   # Componentes React
│   ├── StudyChat.tsx            # Componente principal del chat
│   ├── ChatSidebar.tsx          # Sidebar de conversaciones
│   ├── ProfileView.tsx          # Vista de progreso del usuario
│   ├── APIKeyConfig.tsx         # Configuración de API keys
│   └── ...                      # Otros componentes
│
├── study_agents/                 # Backend Python/FastAPI
│   ├── api/
│   │   └── main.py              # Servidor FastAPI principal
│   ├── agents/                   # Agentes especializados
│   │   ├── content_processor.py
│   │   ├── explanation_agent.py
│   │   ├── qa_assistant.py
│   │   ├── test_generator.py
│   │   ├── feedback_agent.py
│   │   └── exercise_generator.py
│   ├── memory/                   # Sistema de memoria (RAG)
│   ├── chroma_db/               # Base de datos vectorial
│   ├── documents/               # Documentos procesados
│   ├── chats/                   # Conversaciones guardadas
│   ├── requirements.txt         # Dependencias Python
│   ├── Procfile                 # Configuración para Render
│   ├── railway.json             # Configuración para Railway
│   └── runtime.txt              # Versión de Python
│
├── public/                       # Archivos estáticos
├── lib/                         # Utilidades
├── package.json                 # Dependencias Node.js
├── next.config.ts              # Configuración Next.js
└── README.md                    # Este archivo
```

---

## 🛠️ Herramientas Utilizadas

### Frontend
- **Next.js 15.5.9** - Framework React con App Router
- **TypeScript** - Tipado estático
- **React 19** - Biblioteca de UI
- **Tailwind CSS 4** - Framework de estilos
- **NextAuth.js** - Autenticación
- **React Markdown** - Renderizado de Markdown
- **CodeMirror** - Editor de código
- **jsPDF** - Generación de PDFs
- **html2canvas** - Captura de pantalla

### Backend
- **FastAPI 0.109** - Framework web de Python
- **Uvicorn** - Servidor ASGI
- **LangChain 0.1.20** - Framework para aplicaciones LLM
- **LangChain OpenAI** - Integración con OpenAI
- **ChromaDB 0.4.22** - Base de datos vectorial
- **PyPDF** - Procesamiento de PDFs
- **TikToken** - Tokenización y cálculo de costes

### IA y Machine Learning
- **OpenAI GPT-4 / GPT-3.5** - Modelos de lenguaje
- **RAG (Retrieval-Augmented Generation)** - Técnica de recuperación aumentada
- **Embeddings** - Vectorización de texto

### Almacenamiento
- **ChromaDB** - Base de datos vectorial para RAG
- **JSON Files** - Almacenamiento de chats y progreso
- **File System** - Almacenamiento de documentos

### DevOps y Despliegue
- **Vercel** - Hosting del frontend
- **Railway / Render** - Hosting del backend
- **GitHub** - Control de versiones

---

## 🚀 Despliegue

### Frontend en Vercel

1. Conecta tu repositorio a Vercel
2. Vercel detectará automáticamente Next.js
3. Configura las variables de entorno:
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `FASTAPI_URL` (URL de tu backend desplegado)
4. Haz deploy - Vercel desplegará automáticamente

### Backend en Railway o Render

**Railway (Recomendado):**
1. Crea un proyecto en Railway
2. Conecta tu repositorio GitHub
3. Configura el **Root Directory** a `study_agents`
4. Railway detectará Python automáticamente
5. Obtén la URL del backend

**Render (Alternativa):**
1. Crea un Web Service en Render
2. Conecta tu repositorio
3. Configura:
   - Root Directory: `study_agents`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `cd api && uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Añade variable: `PYTHON_VERSION = 3.11.9`

📖 **Guía detallada**: Ver [GUIA_DESPLIEGUE_BACKEND.md](./GUIA_DESPLIEGUE_BACKEND.md)

---

## 📞 Contacto

**Pau Pedrejón**

- 🌐 **Portfolio Web**: [Ver en producción](https://tu-url.vercel.app)
- 📧 **Email**: [Tu email]
- 💼 **LinkedIn**: [Tu LinkedIn]
- 🐙 **GitHub**: [@paupedrejon](https://github.com/paupedrejon)
- 🎓 **Universidad**: UPC (Universidad Politécnica de Barcelona)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

<div align="center">

**Hecho con ❤️ por Pau Pedrejón**

⭐ Si te gusta este proyecto, ¡dale una estrella!

</div>