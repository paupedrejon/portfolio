<div align="center">
  <a href="https://github.com/paupedrejon/portfolio">
    <img src="public/StudyAgentsLogo.png" alt="Study Agents Logo" width="80" height="80">
  </a>

  <h1 align="center">Study Agents - Portfolio & Capstone Project</h1>

  <p align="center">
    Sistema Multi-Agente de IA para Autoaprendizaje Personalizado
    <br />
    <a href="#cómo-probar"><strong>Explorar los docs »</strong></a>
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

</div>

## Tabla de Contenidos

- [Introducción](#introducción)
- [Qué es Study Agents](#qué-es-study-agents)
- [Cómo Probar](#cómo-probar)
- [Agentes del Sistema](#agentes-del-sistema)
- [Características Detalladas](#características-detalladas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Herramientas Utilizadas](#herramientas-utilizadas)
- [Despliegue](#despliegue)
- [Contacto](#contacto)

---

## Introducción

Bienvenidos a mi **Capstone Project: Study Agents**.

**Sobre mí:** Me llamo Pau, tengo 20 años y soy estudiante de ingeniería informática en la UPC (Universitat Politècnica de Barcelona).

### El Problema que Resuelve Study Agents

Como estudiante, empecé a usar herramientas de inteligencia artificial hace ya unos años para ayudarme a estudiar cuando estaba en bachillerato (por 2022 descubrí el OpenAI Playground). Muchas veces me salían dudas mientras me tenía que preparar algún examen o al realizar algún ejercicio, y **no siempre había un profesor disponible para ayudarme en ese momento**.

Durante este tiempo he visto evolucionar los modelos de lenguaje. Recuerdo cuando usaba el Playground de OpenAI e intentar corregir algún test, este hacía muchos errores y alucinaba mucho, pero con los años han ido mejorando de forma espectacular en cuanto a la calidad de las respuestas. Sin embargo, **había algo que echaba en falta** y que hasta hace poco con herramientas como Gemini no han empezado a conseguir, y es **la parte interactiva del lenguaje**.

**Ejemplos concretos del problema:**

- Cuando le pedía a ChatGPT que me ayudara a preparar un examen, solía devolver un texto larguísimo lleno de preguntas, y tenías que ir copiando y pegando una por una para responderle.
- Cuando le pedía apuntes para estudiar antes de un examen, me generaba textos largos que tenía que guardar a base de capturas de pantalla si me lo quería estudiar antes del examen.

**En resumen:** Actualmente usar ChatGPT o Gemini para estudiar es una buena herramienta pero es **poco práctico y bastante pesado**.

---

## Qué es Study Agents

**Study Agents** es un sistema multi-agente de inteligencia artificial diseñado para facilitar el aprendizaje personalizado. El objetivo de este proyecto es precisamente **facilitar el aprendizaje** combinando las herramientas que mejor funcionan a la hora de estudiar (resúmenes, flashcards, tests, etc.) con un sistema de agentes especializados en enseñar de manera que no se haga una carga estudiar, que sean capaces de enseñar, corregir y dar feedback al estudiante, buscando que el proceso sea **mucho más interactivo, útil y accesible**.

Este proyecto está construido sobre mi portfolio personal (hecho con React/Next.js), integrando Study Agents como una aplicación completa dentro del mismo.

### Características Principales

- **Procesamiento Inteligente**: Sube PDFs y documentos que se procesan automáticamente usando RAG (Retrieval-Augmented Generation)
- **Chat Interactivo**: Asistente de preguntas y respuestas contextualizado con tu material de estudio
- **Generación de Apuntes**: Convierte documentos densos en apuntes claros y estructurados
- **Tests Personalizados**: Genera evaluaciones adaptadas a tu nivel de conocimiento (escala 0-10)
- **Sistema de Progreso**: Rastrea tu aprendizaje y ajusta la dificultad automáticamente
- **Flashcards**: Sistema de tarjetas para aprendizaje de vocabulario en idiomas
- **Intérprete de Código**: Ejecuta código Python, JavaScript, Java, C++, SQL directamente en el navegador

> **Nota:** Este proyecto requiere una API Key de OpenAI para funcionar. Los usuarios pueden configurar su propia API key desde la interfaz web.

---

## Cómo Probar

Sigue estos pasos para poner en marcha Study Agents en tu máquina local.

<a href="https://www.paupedrejon.com/study-agents" target="_blank">
  <img src="https://cdn.vectorstock.com/i/500p/63/72/try-now-sticker-sign-on-transparent-vector-52026372.jpg" alt="Probar">
</a>

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

## Agentes del Sistema

El sistema está compuesto por **8 agentes especializados** que trabajan en conjunto para proporcionar una experiencia de aprendizaje completa y personalizada. Cada agente tiene una función específica y utiliza técnicas avanzadas de IA para optimizar su rendimiento.

### 1. Content Processor Agent

**Función Principal:** Procesa y estructura documentos subidos (PDFs, textos) para que sean accesibles por el resto del sistema.

**Tecnología:** Utiliza RAG (Retrieval-Augmented Generation) con ChromaDB como base de datos vectorial.

**Características Técnicas:**
- Extracción de texto de PDFs usando PyPDF
- Segmentación inteligente de contenido en chunks semánticos
- Generación de embeddings vectoriales para búsqueda semántica
- Indexación vectorial en ChromaDB para recuperación rápida
- Almacenamiento persistente de documentos por usuario
- Gestión de memoria por tema y usuario

**Cuándo se usa:** Automáticamente cuando un usuario sube un documento PDF o texto. Prepara el contenido para que los demás agentes puedan acceder a información relevante de forma contextualizada.

### 2. Explanation Agent

**Función Principal:** Transforma información compleja en explicaciones claras y estructuradas adaptadas al nivel del usuario.

**Características Técnicas:**
- Adapta el nivel de explicación según el conocimiento del usuario (escala 0-10)
- Genera apuntes en formato Markdown con estructura jerárquica
- Incluye ejemplos prácticos, tablas comparativas y diagramas conceptuales
- Integra contenido multimedia (videos de YouTube, imágenes de Unsplash)
- Utiliza el contexto de documentos subidos para generar explicaciones relevantes
- Optimización de costes mediante selección automática de modelos (GPT-3.5 vs GPT-4)

**Cuándo se usa:** Cuando el usuario solicita generar apuntes de un tema o cuando necesita una explicación detallada de un concepto. El agente analiza el nivel del usuario y ajusta la complejidad del contenido generado.

### 3. Q&A Assistant Agent

**Función Principal:** Responde preguntas del estudiante de forma contextualizada utilizando el material de estudio subido.

**Características Técnicas:**
- Utiliza RAG para buscar información relevante en los documentos subidos
- Mantiene historial de conversación para contexto continuo
- Personaliza respuestas según el nivel del usuario (0-10)
- Soporte para múltiples idiomas y temas
- Integración con búsqueda de imágenes de Unsplash cuando es relevante
- Optimización de modelos según la complejidad de la pregunta

**Cuándo se usa:** En cada interacción del chat cuando el usuario hace una pregunta. El agente busca información relevante en los documentos procesados y genera una respuesta contextualizada.

### 4. Test Generator Agent

**Función Principal:** Crea tests y evaluaciones personalizadas adaptadas al nivel y contenido estudiado por el usuario.

**Características Técnicas:**
- Genera preguntas de opción múltiple y verdadero/falso
- Adapta la dificultad al nivel del estudiante (0-10)
- Crea tests temáticos según el contenido estudiado
- Genera feedback automático para cada respuesta
- Evalúa expresiones matemáticas en respuestas numéricas
- Utiliza el contexto de documentos para generar preguntas relevantes
- Optimización de costes mediante selección inteligente de modelos

**Cuándo se usa:** Cuando el usuario solicita generar un test sobre un tema específico. El agente analiza el contenido disponible y el nivel del usuario para crear preguntas apropiadas.

### 5. Feedback Agent

**Función Principal:** Proporciona retroalimentación detallada sobre el rendimiento del estudiante en tests y ejercicios.

**Características Técnicas:**
- Analiza respuestas del estudiante en tests generados
- Proporciona explicaciones detalladas de cada respuesta (correcta o incorrecta)
- Sugerencias de mejora personalizadas
- Análisis del rendimiento general del estudiante
- Identificación de áreas de mejora
- Actualización del sistema de progreso basado en resultados

**Cuándo se usa:** Después de que un usuario completa un test. El agente analiza todas las respuestas y genera un reporte detallado con feedback constructivo.

### 6. Exercise Corrector Agent

**Función Principal:** Corrige ejercicios prácticos y proporciona retroalimentación educativa detallada.

**Características Técnicas:**
- Corrección automática de ejercicios prácticos
- Evaluación de respuestas con asignación de notas
- Explicaciones detalladas de cada corrección
- Sugerencias de mejora específicas
- Análisis del rendimiento del estudiante
- Integración con el sistema de progreso

**Cuándo se usa:** Cuando el usuario completa un ejercicio práctico generado por el Exercise Generator Agent. Evalúa la respuesta y proporciona feedback educativo.

### 7. Exercise Generator Agent

**Función Principal:** Genera ejercicios prácticos personalizados adaptados al nivel y tema de estudio del usuario.

**Características Técnicas:**
- Genera ejercicios adaptados al nivel del usuario (0-10)
- Diferentes tipos de ejercicios según el tema (matemáticas, programación, ciencias, etc.)
- Integración con el sistema de corrección automática
- Feedback inmediato tras la corrección
- Sistema de progreso y estadísticas por ejercicio
- Utiliza el contexto de documentos para generar ejercicios relevantes

**Cuándo se usa:** Cuando el usuario solicita generar un ejercicio práctico sobre un tema específico. El agente crea un ejercicio apropiado para el nivel del usuario.

### 8. Correction Agent

**Función Principal:** Revisa y corrige respuestas del chat para asegurar coherencia y calidad educativa.

**Características Técnicas:**
- Analiza si las respuestas tienen sentido en el contexto de la conversación
- Detecta y corrige alucinaciones o información incorrecta
- Asegura que las respuestas sean apropiadas para el nivel del usuario
- Mantiene coherencia en el historial de conversación
- Optimización de costes mediante uso selectivo de modelos más potentes

**Cuándo se usa:** Opcionalmente después de que el Q&A Assistant Agent genera una respuesta. El Correction Agent revisa la respuesta y la corrige si es necesario antes de mostrarla al usuario.

### Arquitectura de los Agentes

Todos los agentes comparten:
- **Sistema de Memoria Compartido**: Utilizan el mismo MemoryManager para acceder a documentos procesados
- **Optimización de Costes**: Sistema de selección automática de modelos (ModelManager) que elige entre GPT-3.5 y GPT-4 según la complejidad de la tarea
- **Personalización por Usuario**: Cada agente adapta su comportamiento según el nivel y preferencias del usuario
- **API Keys Personales**: Cada usuario puede configurar su propia API key de OpenAI

---

## Características Detalladas

### Generación de Apuntes

- Convierte documentos PDF en apuntes estructurados y legibles
- Formato Markdown con soporte completo para tablas, listas, código y fórmulas
- Descarga en PDF con formato profesional usando jsPDF
- Integración automática de videos de YouTube cuando son relevantes al tema
- Diagramas y esquemas visuales generados mediante texto estructurado
- Personalización del nivel de detalle según el conocimiento del usuario

### Sistema de Niveles Inteligente

- Rastrea tu nivel de conocimiento por tema en una escala de 0 a 10
- Ajusta automáticamente la dificultad del contenido generado
- Sistema de experiencia y progreso visual con gráficas
- Recomendaciones personalizadas de estudio basadas en tu progreso
- Actualización dinámica del nivel según tu rendimiento en tests y ejercicios

### Flashcards para Idiomas

- Sistema de tarjetas interactivas para aprendizaje de vocabulario
- Soporte para múltiples idiomas (Inglés, Francés, Alemán, Italiano, Portugués, Chino, Japonés, Coreano, etc.)
- Sistema de repetición espaciada para optimizar el aprendizaje
- Seguimiento de palabras aprendidas por usuario
- Generación automática de ejercicios tipo test basados en las flashcards
- Integración con el sistema de progreso general

### Intérprete de Código Integrado

- Ejecuta código directamente en el navegador sin necesidad de servidor externo
- Soporte para múltiples lenguajes: Python, JavaScript, Java, C++, SQL
- Resaltado de sintaxis con CodeMirror para mejor legibilidad
- Entrada y salida interactivas para programas que requieren input del usuario
- Ideal para aprender programación y probar conceptos en tiempo real
- Ejecución segura en un entorno controlado

### Dashboard de Progreso

- Visualización completa de tu progreso por temas
- Estadísticas detalladas de uso: tokens consumidos, costes estimados, número de solicitudes
- Desglose por modelo de IA utilizado (GPT-3.5 vs GPT-4)
- Gráficas interactivas de nivel y experiencia a lo largo del tiempo
- Análisis de áreas de fortaleza y mejora
- Historial de conversaciones y documentos procesados

### Autenticación y Multi-usuario

- Autenticación segura con Google OAuth mediante NextAuth.js
- Sistema multi-usuario con datos completamente privados
- Cada usuario tiene su propio progreso, chats y documentos
- API keys personales: cada usuario configura y usa su propia clave de OpenAI
- Gestión de sesiones y seguridad de datos

---

## Estructura del Proyecto

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
│   │   ├── exercise_generator.py
│   │   ├── exercise_corrector.py
│   │   └── correction_agent.py
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

## Herramientas Utilizadas

### Frontend

- **Next.js 15.5.9**: Framework React con App Router para renderizado del lado del servidor y routing optimizado
- **TypeScript 5**: Tipado estático para mayor seguridad y productividad en el desarrollo
- **React 19**: Biblioteca de UI para construir interfaces de usuario interactivas y reactivas
- **Tailwind CSS 4**: Framework de estilos utility-first para diseño rápido y consistente
- **NextAuth.js**: Sistema de autenticación completo con soporte para múltiples proveedores OAuth
- **React Markdown**: Librería para renderizar contenido Markdown de forma segura y estilizada
- **CodeMirror**: Editor de código con resaltado de sintaxis para múltiples lenguajes
- **jsPDF**: Generación de documentos PDF desde el navegador
- **html2canvas**: Captura de elementos HTML como imágenes para exportación

### Backend

- **FastAPI 0.109**: Framework web moderno y rápido de Python con documentación automática
- **Uvicorn**: Servidor ASGI de alto rendimiento para aplicaciones Python asíncronas
- **LangChain 0.1.20**: Framework completo para construir aplicaciones con modelos de lenguaje
- **LangChain OpenAI**: Integración oficial de LangChain con los modelos de OpenAI
- **ChromaDB 0.4.22**: Base de datos vectorial open-source para almacenamiento y búsqueda de embeddings
- **PyPDF**: Librería para extracción y procesamiento de texto desde archivos PDF
- **TikToken**: Tokenización eficiente y cálculo preciso de costes de tokens para modelos de OpenAI

### Inteligencia Artificial y Machine Learning

- **OpenAI GPT-4**: Modelo de lenguaje más avanzado para tareas complejas que requieren razonamiento profundo
- **OpenAI GPT-3.5-turbo**: Modelo optimizado para tareas generales con mejor relación coste-rendimiento
- **RAG (Retrieval-Augmented Generation)**: Técnica que combina recuperación de información con generación de texto para respuestas contextualizadas
- **Embeddings**: Vectorización de texto para búsqueda semántica y recuperación de información relevante

### Almacenamiento y Base de Datos

- **ChromaDB**: Base de datos vectorial persistente para almacenar embeddings y realizar búsquedas semánticas
- **JSON Files**: Sistema de almacenamiento ligero para chats, progreso de usuarios y configuración
- **File System**: Almacenamiento directo de documentos PDF y archivos subidos por usuarios

### DevOps y Despliegue

- **Vercel**: Plataforma de hosting optimizada para aplicaciones Next.js con despliegue automático desde GitHub
- **Railway**: Plataforma de hosting para aplicaciones backend con soporte nativo para Python y despliegue continuo
- **Render**: Alternativa de hosting para backend con soporte para múltiples lenguajes y bases de datos
- **GitHub**: Control de versiones y repositorio de código con integración CI/CD

### Herramientas de Desarrollo

- **Cursor**: IDE avanzado con capacidades de IA para asistencia en código, autocompletado inteligente y generación de código
- **Git**: Sistema de control de versiones distribuido para gestión de código
- **Node.js / npm**: Entorno de ejecución y gestor de paquetes para JavaScript/TypeScript
- **Python / pip**: Entorno de ejecución y gestor de paquetes para Python
- **ESLint / TypeScript Compiler**: Herramientas de linting y compilación para mantener calidad de código

### APIs y Servicios Externos

- **OpenAI API**: API para acceder a modelos GPT-3.5 y GPT-4 para generación de texto y embeddings
- **Google OAuth 2.0**: Sistema de autenticación mediante cuentas de Google
- **Unsplash API**: Búsqueda y obtención de imágenes de alta calidad para enriquecer contenido educativo (opcional)

---

## Despliegue

### Frontend en Vercel

1. Conecta tu repositorio a Vercel desde el dashboard
2. Vercel detectará automáticamente Next.js y configurará el build
3. Configura las variables de entorno necesarias:
   - `NEXTAUTH_URL`: URL de producción de tu aplicación
   - `NEXTAUTH_SECRET`: Secret aleatorio para firmar cookies (genera uno con `openssl rand -base64 32`)
   - `GOOGLE_CLIENT_ID`: ID de cliente de Google OAuth
   - `GOOGLE_CLIENT_SECRET`: Secret de cliente de Google OAuth
   - `FASTAPI_URL`: URL pública de tu backend desplegado (Railway o Render)
4. Haz deploy - Vercel desplegará automáticamente en cada push a la rama principal

### Backend en Railway o Render

**Railway (Recomendado):**

1. Crea un nuevo proyecto en Railway
2. Conecta tu repositorio GitHub desde el dashboard
3. Configura el **Root Directory** a `study_agents` en la configuración del servicio
4. Railway detectará Python automáticamente y usará `requirements.txt`
5. Configura las variables de entorno si es necesario (OPENAI_API_KEY es opcional, los usuarios pueden configurarla desde la web)
6. Railway generará automáticamente una URL pública para tu backend
7. Copia esta URL y configúrala como `FASTAPI_URL` en Vercel

**Render (Alternativa):**

1. Crea un nuevo Web Service en Render
2. Conecta tu repositorio GitHub
3. Configura los siguientes parámetros:
   - **Root Directory**: `study_agents`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `cd api && uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Añade variable de entorno: `PYTHON_VERSION = 3.11.9`
5. Render generará una URL pública para tu backend
6. Copia esta URL y configúrala como `FASTAPI_URL` en Vercel

**Guía detallada**: Ver [GUIA_DESPLIEGUE_BACKEND.md](./GUIA_DESPLIEGUE_BACKEND.md)

---

## Próximamente...
Mi objetivo és continuar este proyecto, ya que lo que hay ahora solo és una pequeña parte de lo que podría ser. 

En un futuro no muy lejano me gustaría hacer lo siguiente:
  - **Root Directory**: `study_agents`
---


## Contacto

**Pau Pedrejón**

- **Portfolio Web**: [www.paupedrejon.com](https://www.paupedrejon.com)
- **GitHub**: [@paupedrejon](https://github.com/paupedrejon)
- **Mail**: [pau.pedrejon@gmail.com](mailto:pau.pedrejon@gmail.com)

---
