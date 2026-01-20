# ⚡ Despliegue Rápido - Study Agents

## 🎯 Opción Recomendada: Vercel + Railway

**Tiempo estimado:** 20-30 minutos  
**Costo:** $0/mes (plan gratuito)

---

## 📋 Pasos Rápidos

### 1️⃣ Backend en Railway (10 min)

1. Ve a [railway.app](https://railway.app) → Login con GitHub
2. **New Project** → Selecciona tu repo `portfolio`
3. En **Settings** del servicio:
   - **Root Directory:** `study_agents`
   - **Start Command:** `cd api && uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Variables** → Añade:
   ```
   OPENAI_API_KEY=tu-api-key
   ```
5. **Settings** → **Networking** → **Generate Domain**
6. **Copia la URL** (ej: `https://tu-proyecto.up.railway.app`)

### 2️⃣ Frontend en Vercel (10 min)

1. Ve a [vercel.com](https://vercel.com) → Login con GitHub
2. **Add New Project** → Selecciona tu repo `portfolio`
3. **Environment Variables** → Añade:
   ```
   FASTAPI_URL=https://tu-url-railway.app
   NEXTAUTH_URL=https://tu-proyecto.vercel.app
   NEXTAUTH_SECRET=genera-con: openssl rand -base64 32
   ```
4. **Deploy** → Espera 2-5 minutos
5. **¡Listo!** Tu app está en `https://tu-proyecto.vercel.app`

### 3️⃣ Verificar

1. Abre tu app en Vercel
2. Ve a `/study-agents`
3. Prueba subir un documento o hacer una pregunta
4. Si funciona → ✅ **¡Despliegue exitoso!**

---

## 🔧 Variables de Entorno Necesarias

### Railway (Backend)
```env
OPENAI_API_KEY=sk-...
```

### Vercel (Frontend)
```env
FASTAPI_URL=https://tu-backend-railway.app
NEXTAUTH_URL=https://tu-frontend-vercel.app
NEXTAUTH_SECRET=tu-secreto-generado
GOOGLE_CLIENT_ID=tu-client-id (si usas Google Auth)
GOOGLE_CLIENT_SECRET=tu-client-secret (si usas Google Auth)
```

---

## 🐛 Problemas Comunes

### Backend no responde
- Verifica que Railway está corriendo (Deployments → Logs)
- Verifica que `OPENAI_API_KEY` está configurada
- Prueba `/health` en tu URL de Railway

### Frontend no conecta
- Verifica `FASTAPI_URL` en Vercel (debe ser la URL completa de Railway)
- Haz redeploy después de cambiar variables
- Revisa la consola del navegador (F12)

### Error 500
- Revisa logs en Railway (Deployments → Logs)
- Verifica que todas las dependencias están en `requirements.txt`
- Asegúrate de que el backend responde en `/health`

---

## 📞 ¿Necesitas Ayuda?

1. Revisa `GUIA_DESPLIEGUE.md` para instrucciones detalladas
2. Revisa los logs en Railway y Vercel
3. Verifica todas las variables de entorno

---

**¡Buena suerte! 🚀**

