# 🎓 Study Agents - Sistema Multi-Agente para Autoaprendizaje

<div align="center">

![Study Agents Logo](public/StudyAgentsLogo.png)

**Tu asistente inteligente para aprender cualquier tema**

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)](https://fastapi.tiangolo.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange.svg)](https://openai.com/)

</div>

---

## 📖 ¿Qué es Study Agents?

**Study Agents** es un sistema revolucionario de autoaprendizaje asistido por IA que transforma cualquier temario en una experiencia educativa personalizada e interactiva. 

Imagina tener un equipo completo de profesores especializados trabajando 24/7 solo para ti:
- 📚 **Un profesor que explica** conceptos complejos de forma clara
- 💬 **Un tutor que responde** todas tus dudas al instante
- 📝 **Un examinador que crea** tests personalizados
- ✅ **Un corrector que te da** feedback detallado
- 🎯 **Un entrenador que adapta** el contenido a tu nivel

---

## ✨ Características Principales

### 🧠 **Procesamiento Inteligente de Documentos**
- Sube PDFs de tus temarios y el sistema los procesa automáticamente
- Extrae conceptos clave y estructura la información
- Almacena todo en una memoria inteligente (RAG) para acceso rápido

### 📖 **Generación de Apuntes Personalizados**
- Convierte documentos densos en apuntes claros y estructurados
- Adapta el contenido a tu nivel de conocimiento (0-10)
- Incluye ejemplos, tablas comparativas y explicaciones visuales
- Integra videos de YouTube y imágenes relevantes automáticamente

### 💡 **Asistente de Preguntas y Respuestas**
- Haz cualquier pregunta sobre el temario
- Respuestas contextualizadas usando el contenido subido
- Mantiene el historial de conversación para contexto continuo
- Personaliza respuestas según tu nivel y objetivos de aprendizaje

### 📊 **Tests y Ejercicios Interactivos**
- Genera tests personalizados adaptados a tu nivel
- Diferentes tipos de preguntas: opción múltiple, verdadero/falso
- Ejercicios prácticos con corrección automática
- Feedback detallado explicando cada respuesta

### 🎯 **Sistema de Progreso Inteligente**
- Rastrea tu nivel de conocimiento por tema (0-10)
- Ajusta automáticamente la dificultad según tu progreso
- Sistema de flashcards para aprendizaje de vocabulario
- Estadísticas de aprendizaje y palabras aprendidas

### 🌐 **Interfaz Web Moderna**
- Diseño responsive y atractivo
- Chat interactivo con animaciones fluidas
- Visualización de apuntes con markdown enriquecido
- Soporte para múltiples chats por tema

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Python 3.8+** instalado
- **Node.js 18+** y npm instalados
- **API Key de OpenAI** (o usar modelos gratuitos como Llama)

### Paso 1: Clonar el Repositorio

```bash
git clone <tu-repositorio>
cd portfolio
```

### Paso 2: Configurar el Backend (Python/FastAPI)

```bash
# Navegar a la carpeta del backend
cd study_agents

# Instalar dependencias
pip install -r requirements.txt

# Configurar API Key (opcional, también puedes configurarla en la web)
# Crear archivo .env en study_agents/
echo "OPENAI_API_KEY=tu-api-key-aqui" > .env
```

### Paso 3: Iniciar el Servidor Backend

**Windows:**
```bash
# Opción 1: Usar el script incluido
iniciar_api.bat

# Opción 2: Manualmente
python -m uvicorn api.main:app --reload --port 8000
```

**Linux/Mac:**
```bash
# Opción 1: Usar el script incluido
chmod +x start_api.sh
./start_api.sh

# Opción 2: Manualmente
python -m uvicorn api.main:app --reload --port 8000
```

El servidor estará disponible en: `http://localhost:8000`

### Paso 4: Configurar el Frontend (Next.js)

```bash
# Volver a la raíz del proyecto
cd ..

# Instalar dependencias
npm install
```

### Paso 5: Iniciar el Frontend

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000`

### Paso 6: Acceder a Study Agents

1. Abre tu navegador en `http://localhost:3000`
2. Inicia sesión con Google (o crea una cuenta)
3. Navega a `/study-agents`
4. ¡Comienza a aprender!

---

## 📚 Guía de Uso

### 1️⃣ Subir Documentos

1. Haz clic en el botón **"Subir archivos"** (📎)
2. Selecciona uno o varios PDFs de tu temario
3. Espera a que se procesen (verás un indicador de progreso)
4. ✅ Los documentos se almacenan automáticamente en la memoria del sistema

### 2️⃣ Generar Apuntes

1. Escribe en el chat: **"Genera apuntes sobre [tema]"**
2. O haz clic en la pestaña **"Apuntes"**
3. El sistema generará apuntes estructurados y claros
4. Los apuntes incluyen:
   - Conceptos clave
   - Explicaciones detalladas
   - Tablas comparativas
   - Videos de YouTube relevantes
   - Imágenes explicativas

### 3️⃣ Hacer Preguntas

1. Simplemente escribe tu pregunta en el chat
2. Ejemplos:
   - "¿Qué es la normalización en bases de datos?"
   - "Explícame el concepto de herencia en programación"
   - "¿Cuál es la diferencia entre X e Y?"
3. El sistema responderá usando el contenido de tus documentos

### 4️⃣ Crear Tests

1. Escribe: **"Genera un test sobre [tema]"**
2. O haz clic en la pestaña **"Tests"**
3. Selecciona:
   - Número de preguntas
   - Dificultad (fácil, medio, difícil)
4. Responde las preguntas
5. Obtén feedback detallado al finalizar

### 5️⃣ Usar Flashcards

1. Para idiomas: **"Genera flashcards de [idioma]"**
2. Para conceptos: **"Crea flashcards sobre [tema]"**
3. Practica con opciones múltiples
4. El sistema rastrea tus palabras/conceptos aprendidos

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │  StudyChat Component - Interfaz de Usuario       │   │
│  │  - Chat interactivo                              │   │
│  │  - Visualización de apuntes                      │   │
│  │  - Tests y ejercicios                            │   │
│  │  - Flashcards                                    │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/REST API
┌───────────────────────┴─────────────────────────────────┐
│              Backend (FastAPI)                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │         StudyAgentsSystem (Orquestador)          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Explanation  │  │   Q&A        │  │    Test      │ │
│  │   Agent      │  │  Assistant   │  │  Generator   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Feedback    │  │  Exercise    │  │  Correction │ │
│  │   Agent      │  │  Generator   │  │    Agent     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         MemoryManager (RAG con ChromaDB)         │   │
│  │  - Almacenamiento de documentos                  │   │
│  │  - Búsqueda semántica                            │   │
│  │  - Gestión de contexto por chat                  │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

---

## 🤖 Agentes del Sistema

### 📄 **Content Processor Agent**
- Procesa documentos PDF
- Divide en chunks optimizados
- Extrae texto y metadatos
- Almacena en memoria vectorial

### 📖 **Explanation Agent**
- Genera apuntes estructurados
- Explica conceptos complejos
- Crea resúmenes ejecutivos
- Adapta contenido al nivel del usuario

### 💬 **Q&A Assistant Agent**
- Responde preguntas contextualizadas
- Usa RAG para buscar información relevante
- Mantiene historial de conversación
- Personaliza respuestas según el usuario

### 📝 **Test Generator Agent**
- Genera tests personalizados
- Múltiples tipos de preguntas
- Adapta dificultad al nivel
- Incluye explicaciones

### ✅ **Feedback Agent**
- Corrige tests automáticamente
- Proporciona feedback detallado
- Explica respuestas correctas/incorrectas
- Ofrece recomendaciones de estudio

### 🎯 **Exercise Generator Agent**
- Crea ejercicios prácticos
- Diferentes tipos de ejercicios
- Corrección automática
- Feedback personalizado

### 🔍 **Correction Agent**
- Revisa y mejora respuestas
- Asegura calidad y precisión
- Detecta errores comunes

---

## ⚙️ Configuración Avanzada

### Variables de Entorno

Crea un archivo `.env` en `study_agents/`:

```env
# API Key de OpenAI (requerida para funcionalidad completa)
OPENAI_API_KEY=sk-tu-api-key-aqui

# Puerto del servidor FastAPI (opcional, por defecto 8000)
PORT=8000

# Modo de selección de modelo (auto/manual)
MODEL_MODE=auto
```

### Modelos Disponibles

El sistema soporta múltiples modelos de OpenAI:
- **GPT-5.2** (Premium, mejor calidad)
- **GPT-4** (Alta calidad)
- **GPT-4o-mini** (Balance calidad/coste)
- **Llama 3.1** (Gratuito, requiere configuración adicional)

El modo **automático** selecciona el mejor modelo según:
- Tipo de tarea
- Longitud del contexto
- Coste vs calidad
- Feedback del usuario

### Gestión de Memoria

El sistema usa **ChromaDB** para almacenamiento vectorial:
- Los documentos se dividen en chunks
- Se generan embeddings con OpenAI
- Búsqueda semántica para encontrar información relevante
- Contexto aislado por chat (cada chat tiene su propia memoria)

---

## 🎨 Características de la Interfaz

### 🎯 **Sistema de Niveles**
- Cada chat tiene un nivel asociado (0-10)
- El sistema adapta el contenido a tu nivel
- Progreso automático según tu actividad

### 💰 **Calculadora de Costes**
- Visualización en tiempo real del coste estimado
- Cálculo por mensaje y acumulado mensual
- Optimización automática de costes

### 🌓 **Temas Claro/Oscuro**
- Interfaz adaptable a tus preferencias
- Cambio automático según sistema
- Personalizable

### 📱 **Diseño Responsive**
- Funciona en desktop, tablet y móvil
- Interfaz adaptativa
- Experiencia optimizada en todos los dispositivos

---

## 🔧 Solución de Problemas

### El servidor FastAPI no inicia

```bash
# Verificar que Python está instalado
python --version

# Verificar que las dependencias están instaladas
pip list | grep fastapi

# Reinstalar dependencias si es necesario
pip install -r requirements.txt
```

### Error de API Key

1. Verifica que tu API Key es válida
2. Configúrala en la interfaz web (Configuración → API Keys)
3. O en el archivo `.env` del backend

### El frontend no se conecta al backend

1. Verifica que el backend está corriendo en `http://localhost:8000`
2. Abre `http://localhost:8000/health` en el navegador
3. Deberías ver: `{"status": "ok"}`

### Los documentos no se procesan

1. Verifica que los PDFs no estén corruptos
2. Asegúrate de que el backend tiene permisos de escritura
3. Revisa los logs del servidor para errores específicos

---

## 📊 Estructura del Proyecto

```
portfolio/
├── study_agents/              # Backend (Python/FastAPI)
│   ├── agents/                # Agentes especializados
│   │   ├── explanation_agent.py
│   │   ├── qa_assistant.py
│   │   ├── test_generator.py
│   │   └── ...
│   ├── api/                   # API FastAPI
│   │   └── main.py
│   ├── memory/                # Gestión de memoria (RAG)
│   │   └── memory_manager.py
│   ├── main.py                # Sistema principal
│   └── requirements.txt
│
├── components/                # Componentes React
│   └── StudyChat.tsx          # Componente principal
│
├── app/                       # Páginas Next.js
│   └── study-agents/
│       └── page.tsx
│
└── package.json               # Dependencias Node.js
```

---

## 🌐 Despliegue en Producción

### Opción Recomendada: Vercel + Railway

**Frontend (Next.js)** → Desplegado en [Vercel](https://vercel.com)  
**Backend (FastAPI)** → Desplegado en [Railway](https://railway.app)

#### Inicio Rápido

1. **Backend en Railway:**
   - Crea cuenta en [railway.app](https://railway.app)
   - Conecta tu repositorio GitHub
   - Configura `Root Directory: study_agents`
   - Añade variable `OPENAI_API_KEY`
   - Genera dominio y copia la URL

2. **Frontend en Vercel:**
   - Crea cuenta en [vercel.com](https://vercel.com)
   - Importa tu repositorio
   - Configura `FASTAPI_URL` con la URL de Railway
   - Deploy automático

**📖 Guía completa:** Ver `GUIA_DESPLIEGUE.md`  
**⚡ Inicio rápido:** Ver `DESPLIEGUE_RAPIDO.md`

#### Costos

- **Vercel:** Gratis (hasta 100GB/mes)
- **Railway:** Gratis ($5 crédito/mes)
- **Total:** $0/mes para desarrollo y proyectos pequeños

---

## 🚀 Próximas Mejoras

- [ ] Soporte para más formatos de documentos (Word, PowerPoint)
- [ ] Integración con más modelos de IA (Claude, Gemini)
- [ ] Exportación de apuntes a PDF
- [ ] Modo offline con modelos locales
- [ ] Colaboración entre estudiantes
- [ ] Análisis de progreso avanzado
- [ ] Integración con calendarios de estudio

---

## 📝 Licencia

Este proyecto es de uso personal/educativo.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📧 Contacto

Para preguntas o sugerencias, abre un issue en el repositorio.

---

<div align="center">

**Hecho con ❤️ para facilitar el aprendizaje**

⭐ Si te gusta el proyecto, ¡dale una estrella!

</div>

