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
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `cd api && uvicorn main:app --host 0.0.0.0 --port $PORT`
   
   **⚠️ IMPORTANTE - Especificar Python 3.11:**
   - En la sección **"Environment Variables"**, añade:
     - **Key**: `PYTHON_VERSION`
     - **Value**: `3.11.9`
   - O si hay un campo "Python Version" en la configuración, selecciónalo ahí
   - Esto es CRÍTICO porque Python 3.13 tiene problemas de compatibilidad con algunas librerías antiguas

3. **Obtener la URL del backend**
   - Una vez que el deploy termine en Render, verás la URL de tu servicio
   - La URL será algo como: `https://study-agents-backend-xxxx.onrender.com`
   - **Copia esta URL completa** (con el `https://`)
   - ⚠️ **Nota**: En el plan gratuito de Render, el servicio puede tardar 30-60 segundos en "despertar" si ha estado inactivo
   - Puedes probar que funciona visitando: `https://tu-url.onrender.com/health`
   - Deberías ver: `{"status":"ok","message":"Study Agents API is running"}`

---

## 🌐 Paso 2: Desplegar el Frontend (Next.js) en Vercel

### 1. **Conectar repositorio a Vercel**
   - Ve a https://vercel.com
   - Inicia sesión con GitHub
   - Click en **"Add New Project"** o **"New Project"**
   - Selecciona tu repositorio `portfolio`
   - Vercel detectará automáticamente que es un proyecto Next.js

### 2. **Configurar variables de entorno (CRÍTICO)**
   
   **⚠️ ANTES de hacer deploy, configura la variable:**
   
   a. En la pantalla de configuración del proyecto, busca la sección **"Environment Variables"**
   
   b. Si no la ves, después del primer deploy:
      - Ve a tu proyecto en Vercel
      - Click en **"Settings"** (Configuración) en el menú superior
      - En el menú lateral, click en **"Environment Variables"**
   
   c. Añade la variable:
      - **Key** (Nombre): `FASTAPI_URL`
      - **Value** (Valor): Pega la URL completa de Render (ej: `https://study-agents-backend-xxxx.onrender.com`)
         - ⚠️ **IMPORTANTE**: Asegúrate de incluir `https://` pero NO incluyas `/` al final
      - **Environment** (Entornos): Selecciona:
        - ✅ **Production** (Producción)
        - ✅ **Preview** (Previsualización) 
        - ✅ **Development** (Desarrollo) - opcional
   
   d. Click en **"Save"** (Guardar)
   
   e. **MUY IMPORTANTE**: Después de añadir/modificar variables:
      - Si ya desplegaste antes, necesitas **redesplegar**:
        - Ve a la pestaña **"Deployments"**
        - Haz clic en los tres puntos (⋯) del último despliegue
        - Selecciona **"Redeploy"**
        - Marca la casilla "Use existing Build Cache" (opcional)
        - Click en **"Redeploy"**
      - O simplemente haz un nuevo commit y push a tu repositorio (Vercel redesplegará automáticamente)

3. **Desplegar**
   - Vercel detectará automáticamente que es Next.js
   - Click en "Deploy"
   - Espera a que termine el build

4. **Desplegar**
   - Si ya configuraste la variable `FASTAPI_URL`, click en **"Deploy"**
   - Espera a que termine el build (puede tardar 2-5 minutos)
   - Una vez desplegado, Vercel te dará una URL como: `https://tu-proyecto.vercel.app`

---

## ✅ Verificación Final

### 1. **Verificar backend en Render**
   - Abre: `https://tu-backend.onrender.com/health`
   - Deberías ver: `{"status":"ok","message":"Study Agents API is running"}`
   - ⚠️ Si tarda mucho, es normal en el plan gratuito (puede tardar 30-60 segundos en "despertar")

### 2. **Verificar frontend en Vercel**
   - Abre tu URL de Vercel (ej: `https://tu-proyecto.vercel.app`)
   - Ve a `/study-agents`
   - Intenta subir un PDF y verifica que se conecta al backend
   - Si ves errores de conexión, verifica que:
     - La variable `FASTAPI_URL` esté correctamente configurada en Vercel
     - Haya sido redesplegado después de añadir la variable
     - La URL del backend no termine en `/`

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

