# Guía de Despliegue del Backend (Study Agents)

Esta guía te ayudará a desplegar el backend de Python (FastAPI) en producción.

## Opciones de Hosting

Tienes dos opciones principales:
1. **Railway** (Recomendado - más fácil y rápido)
2. **Render** (Alternativa gratuita)

---

## Opción 1: Railway (Recomendado)

### Paso 1: Crear cuenta en Railway
1. Ve a https://railway.app
2. Inicia sesión con tu cuenta de GitHub
3. Railway es gratuito con $5 de crédito mensual (suficiente para proyectos pequeños)

### Paso 2: Crear nuevo proyecto
1. En el dashboard, haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Conecta tu repositorio `portfolio`
4. Railway detectará automáticamente que es Python

### Paso 3: Configurar el servicio
1. Railway creará un servicio automáticamente
2. Necesitas configurar el **Root Directory**:
   - Ve a **Settings** → **Service Settings**
   - En **Root Directory**, escribe: `study_agents`
   - Esto le dice a Railway dónde está el código del backend

### Paso 4: Configurar variables de entorno (si es necesario)
- El backend no necesita variables de entorno obligatorias
- Los usuarios proporcionan su API key desde el frontend
- Si necesitas alguna variable, puedes añadirla en **Variables**

### Paso 5: Obtener la URL del backend
1. Una vez desplegado, Railway te dará una URL automáticamente
2. La URL será algo como: `https://tu-proyecto-production.up.railway.app`
3. **Copia esta URL completa** - la necesitarás para configurar el frontend
4. Puedes verificar que funciona visitando: `https://tu-url/health`
5. Deberías ver: `{"status":"ok","message":"Study Agents API is running"}`

### Paso 6: Configurar el frontend en Vercel
1. Ve a tu proyecto en Vercel
2. Ve a **Settings** → **Environment Variables**
3. Añade la variable:
   - **Key**: `FASTAPI_URL`
   - **Value**: La URL de Railway (ej: `https://tu-proyecto-production.up.railway.app`)
   - **IMPORTANTE**: Incluye `https://` pero NO incluyas `/` al final
   - Selecciona todos los entornos: Production, Preview, Development
4. Guarda y redespliega el frontend

---

## 🎨 Opción 2: Render (Alternativa Gratuita)

### Paso 1: Crear cuenta en Render
1. Ve a https://render.com
2. Inicia sesión con tu cuenta de GitHub
3. Render tiene un plan gratuito (pero el servicio puede tardar en "despertar" si está inactivo)

### Paso 2: Crear nuevo Web Service
1. En el dashboard, haz clic en **"New"** → **"Web Service"**
2. Conecta tu repositorio `portfolio`
3. Configura el servicio:
   - **Name**: `study-agents-backend` (o el nombre que prefieras)
   - **Root Directory**: `study_agents`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `cd api && uvicorn main:app --host 0.0.0.0 --port $PORT`

### Paso 3: Configurar Python 3.11
1. En **Environment Variables**, añade:
   - **Key**: `PYTHON_VERSION`
   - **Value**: `3.11.9`
2. O si hay un campo "Python Version" en la configuración, selecciónalo ahí
3. Esto es importante porque Python 3.13 puede tener problemas de compatibilidad

### Paso 4: Desplegar
1. Haz clic en **"Create Web Service"**
2. Render comenzará a construir y desplegar tu aplicación
3. Esto puede tardar 5-10 minutos la primera vez

### Paso 5: Obtener la URL del backend
1. Una vez desplegado, Render te dará una URL
2. La URL será algo como: `https://study-agents-backend-xxxx.onrender.com`
3. **Copia esta URL completa**
4. Verifica que funciona: `https://tu-url.onrender.com/health`
5. ⚠️ **Nota**: En el plan gratuito, puede tardar 30-60 segundos en "despertar" si ha estado inactivo

### Paso 6: Configurar el frontend en Vercel
1. Ve a tu proyecto en Vercel
2. Ve a **Settings** → **Environment Variables**
3. Añade la variable:
   - **Key**: `FASTAPI_URL`
   - **Value**: La URL de Render (ej: `https://study-agents-backend-xxxx.onrender.com`)
   - **IMPORTANTE**: Incluye `https://` pero NO incluyas `/` al final
   - Selecciona todos los entornos
4. Guarda y redespliega el frontend

---

## ✅ Verificación

### Verificar backend
1. Visita: `https://tu-backend-url/health`
2. Deberías ver: `{"status":"ok","message":"Study Agents API is running"}`
3. Si no funciona, revisa los logs en Railway/Render

### Verificar frontend
1. Ve a tu sitio en Vercel
2. Navega a `/study-agents`
3. Intenta subir un PDF o hacer una pregunta
4. Si ves errores de conexión, verifica:
   - Que `FASTAPI_URL` esté configurada correctamente
   - Que hayas redesplegado después de añadir la variable
   - Que la URL no termine en `/`

---

## 🔧 Troubleshooting

### El backend no inicia
- Revisa los logs en Railway/Render
- Verifica que `requirements.txt` tenga todas las dependencias
- Asegúrate de que el comando de inicio sea correcto

### Error de conexión desde el frontend
- Verifica que `FASTAPI_URL` esté configurada en Vercel
- Asegúrate de que la URL no termine en `/`
- Verifica que el backend esté corriendo (visita `/health`)
- En Render, espera 30-60 segundos si el servicio estaba inactivo

### CORS errors
- El backend ya tiene CORS configurado en `main.py`
- Si ves errores de CORS, verifica que la URL del frontend esté en la lista de orígenes permitidos

---

## 📝 Archivos de Configuración

Tu proyecto ya tiene los archivos necesarios:
- ✅ `Procfile` - Para Render/Heroku
- ✅ `railway.json` - Para Railway
- ✅ `runtime.txt` - Especifica Python 3.11.9
- ✅ `requirements.txt` - Todas las dependencias

---

## 💡 Recomendación

**Usa Railway** si:
- Quieres un despliegue más rápido
- No te importa usar los créditos gratuitos ($5/mes)
- Quieres mejor rendimiento

**Usa Render** si:
- Quieres una opción completamente gratuita
- No te importa esperar 30-60 segundos cuando el servicio está inactivo
- Tu tráfico es bajo

---

## 🎯 Siguiente Paso

Una vez que tengas el backend desplegado:
1. Copia la URL del backend
2. Configura `FASTAPI_URL` en Vercel
3. Redespliega el frontend
4. ¡Listo! Tu aplicación debería funcionar completamente

