# 🔍 Verificar y Configurar FASTAPI_URL en Vercel

## Problema Actual

El frontend está mostrando respuestas simuladas porque no puede conectarse al backend FastAPI en Railway.

## Pasos para Verificar y Corregir

### 1. Obtener la URL Pública de Railway

1. Ve a [Railway Dashboard](https://railway.app)
2. Selecciona tu servicio de backend (FastAPI)
3. Ve a la pestaña **"Settings"** → **"Networking"**
4. Busca la sección **"Public Domain"** o **"Custom Domain"**
5. Copia la URL pública (debe ser algo como: `https://tu-servicio-production.up.railway.app`)

**⚠️ IMPORTANTE:** NO uses la URL interna (`portfolio.railway.internal`), usa la URL pública.

### 2. Configurar FASTAPI_URL en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com)
2. Selecciona tu proyecto
3. Ve a **"Settings"** → **"Environment Variables"**
4. Busca la variable `FASTAPI_URL`
5. **Verifica que:**
   - El valor sea la URL pública de Railway (sin barra final)
   - Ejemplo correcto: `https://tu-servicio-production.up.railway.app`
   - Ejemplo incorrecto: `https://tu-servicio-production.up.railway.app/` (con barra final)
   - Ejemplo incorrecto: `portfolio.railway.internal` (URL interna)

6. Si no existe o está mal configurada:
   - Haz clic en **"Add New"** o edita la existente
   - Key: `FASTAPI_URL`
   - Value: La URL pública de Railway (sin barra final)
   - Environment: Selecciona **"Production"**, **"Preview"**, y **"Development"** (o al menos Production)

7. Guarda los cambios

### 3. Redesplegar en Vercel

Después de cambiar las variables de entorno:

1. Ve a la pestaña **"Deployments"** en Vercel
2. Haz clic en los tres puntos (⋯) del último deployment
3. Selecciona **"Redeploy"**
4. O simplemente haz un nuevo commit y push (Vercel redeployará automáticamente)

### 4. Verificar que Funciona

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **"Network"**
3. Intenta hacer una pregunta en Study Agents
4. Busca la petición a `/api/study-agents/ask`
5. Verifica:
   - **Status:** Debe ser `200 OK` (no `404` ni `503`)
   - **Response:** Debe contener `"success": true` y `"answer": "..."`

### 5. Verificar los Logs

**En Vercel:**
1. Ve a **"Deployments"** → Selecciona el último deployment
2. Ve a **"Functions"** → Busca `/api/study-agents/ask`
3. Revisa los logs para ver si hay errores de conexión

**En Railway:**
1. Ve a tu servicio de backend
2. Ve a la pestaña **"Deploy Logs"** o **"Logs"**
3. Verifica que las peticiones estén llegando:
   - Deberías ver: `INFO: ... "POST /api/ask-question HTTP/1.1" 200 OK`

## Ejemplo de Configuración Correcta

```
FASTAPI_URL=https://study-agents-backend-production.up.railway.app
```

**NO:**
```
FASTAPI_URL=https://study-agents-backend-production.up.railway.app/
FASTAPI_URL=portfolio.railway.internal
FASTAPI_URL=http://localhost:8000
```

## Solución de Problemas

### Si sigue mostrando respuestas simuladas:

1. **Verifica que Railway esté corriendo:**
   - Los logs deben mostrar: `INFO: Uvicorn running on http://0.0.0.0:8080`

2. **Verifica que la URL sea accesible:**
   - Abre en el navegador: `https://tu-url-railway.app/health`
   - Debe devolver: `{"status": "ok", "message": "Study Agents API is running"}`

3. **Verifica CORS:**
   - El backend FastAPI ya tiene CORS configurado para permitir todos los orígenes
   - Si hay problemas, revisa los logs de Railway

4. **Verifica que el código esté actualizado:**
   - Asegúrate de que el último commit con el fix de URLs esté desplegado
   - Verifica en Vercel que el deployment esté usando el código más reciente

## Nota sobre la Barra Final

El código ahora maneja correctamente las URLs con o sin barra final gracias a la función `getFastAPIUrl()`, pero es mejor práctica no incluir la barra final para evitar confusiones.

