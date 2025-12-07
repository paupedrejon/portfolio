# 🚀 Guía de Despliegue - StudyAgents

Esta guía explica cómo desplegar StudyAgents en producción.

## 📋 Arquitectura

El sistema tiene dos partes:
1. **Frontend (Next.js)** → Se despliega en **Vercel**
2. **Backend (FastAPI)** → Se despliega en **Railway** o **Render**

---

## 🔧 Paso 1: Desplegar el Backend (FastAPI)

### Opción A: Railway (Recomendado)

1. **Crear cuenta en Railway**
   - Ve a https://railway.app
   - Inicia sesión con GitHub

2. **Crear nuevo proyecto**
   - Click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Conecta tu repositorio
   - Selecciona el directorio `study_agents`

3. **Configurar el despliegue**
   - Railway detectará automáticamente que es Python
   - El archivo `railway.json` configurará el comando de inicio
   - Railway asignará automáticamente un puerto

4. **Obtener la URL del backend**
   - Una vez desplegado, Railway te dará una URL como: `https://tu-proyecto.railway.app`
   - **Copia esta URL** - la necesitarás para el frontend

### Opción B: Render

1. **Crear cuenta en Render**
   - Ve a https://render.com
   - Inicia sesión con GitHub

2. **Crear nuevo Web Service**
   - Click en "New" → "Web Service"
   - Conecta tu repositorio
   - Configuración:
     - **Name**: `study-agents-backend`
     - **Root Directory**: `study_agents`
     - **Environment**: `Python 3`
     - **Python Version**: `3.11` (importante: especifica 3.11 en lugar de 3.13 para mejor compatibilidad)
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `cd api && uvicorn main:app --host 0.0.0.0 --port $PORT`
   
   **Nota sobre Python Version**: 
   - En la sección de configuración avanzada, busca "Python Version" o añade una variable de entorno `PYTHON_VERSION=3.11.9`
   - Esto evitará problemas de compatibilidad con librerías que aún no soportan Python 3.13

3. **Obtener la URL del backend**
   - Render te dará una URL como: `https://study-agents-backend.onrender.com`
   - **Copia esta URL**

---

## 🌐 Paso 2: Desplegar el Frontend (Next.js) en Vercel

1. **Conectar repositorio a Vercel**
   - Ve a https://vercel.com
   - Inicia sesión con GitHub
   - Click en "Add New Project"
   - Selecciona tu repositorio

2. **Configurar variables de entorno**
   
   **Pasos detallados:**
   
   a. Una vez que Vercel haya detectado tu proyecto, ve a la página del proyecto
   
   b. En el menú superior, haz clic en **"Settings"** (Configuración)
   
   c. En el menú lateral izquierdo, busca y haz clic en **"Environment Variables"** (Variables de Entorno)
   
   d. Verás un formulario con tres campos:
      - **Key** (Clave): Escribe `FASTAPI_URL`
      - **Value** (Valor): Pega la URL de tu backend (ej: `https://tu-backend.railway.app`)
      - **Environment** (Entorno): Selecciona los entornos donde quieres que esté disponible:
        - ✅ Production (Producción)
        - ✅ Preview (Previsualización)
        - ✅ Development (Desarrollo) - opcional
   
   e. Haz clic en **"Save"** (Guardar)
   
   f. **IMPORTANTE**: Después de añadir la variable, necesitas **redesplegar** el proyecto:
      - Ve a la pestaña **"Deployments"** (Despliegues)
      - Haz clic en los tres puntos (⋯) del último despliegue
      - Selecciona **"Redeploy"** (Redesplegar)
      - O simplemente haz un nuevo commit y push a tu repositorio
   
   **Nota**: Si aún no has desplegado el backend, primero despliega el backend en Railway/Render, obtén su URL, y luego añade esta variable en Vercel.

3. **Desplegar**
   - Vercel detectará automáticamente que es Next.js
   - Click en "Deploy"
   - Espera a que termine el build

4. **Verificar**
   - Una vez desplegado, Vercel te dará una URL como: `https://tu-proyecto.vercel.app`
   - Abre la URL y verifica que todo funcione

---

## ✅ Verificación

1. **Verificar backend**
   - Abre: `https://tu-backend.railway.app/health`
   - Deberías ver: `{"status":"ok"}`

2. **Verificar frontend**
   - Abre tu URL de Vercel
   - Ve a `/study-agents`
   - Intenta subir un PDF y verificar que se conecta al backend

---

## 🔒 Notas de Seguridad

- **No subas el `.env`** al repositorio (ya está en `.gitignore`)
- Los usuarios proporcionan su propia API key desde el frontend
- El backend no necesita variables de entorno (todo viene del frontend)

---

## 🐛 Troubleshooting

### Render no redespliega automáticamente

Si Render no detecta los cambios automáticamente:

1. **Forzar redespliegue manual:**
   - Ve a tu servicio en Render
   - En la pestaña "Events" o "Deploys"
   - Haz clic en "Manual Deploy" → "Deploy latest commit"
   - O haz clic en los tres puntos (⋯) del último deploy → "Redeploy"

2. **Verificar configuración de auto-deploy:**
   - Ve a "Settings" → "Build & Deploy"
   - Asegúrate de que "Auto-Deploy" esté activado
   - Verifica que el "Branch" sea correcto (main/master)

3. **Verificar que el commit esté en la rama correcta:**
   - Asegúrate de que hiciste push a la rama que Render está monitoreando

### Error: "No se pudo conectar al backend FastAPI"

1. Verifica que `FASTAPI_URL` esté configurada correctamente en Vercel
2. Verifica que el backend esté corriendo (visita `/health`)
3. Verifica que no haya problemas de CORS (ya configurado en `main.py`)

### Error: "Backend no disponible"

1. Verifica los logs del backend en Railway/Render
2. Asegúrate de que el puerto esté configurado correctamente
3. Verifica que todas las dependencias estén instaladas

---

## 📝 Archivos de Configuración

- `Procfile`: Para Render/Heroku
- `railway.json`: Para Railway
- `runtime.txt`: Versión de Python (opcional)

