# 🚀 Guía de Despliegue - Study Agents

## 📋 Estrategia Recomendada

**Frontend (Next.js) → Vercel** (Gratis, perfecto para Next.js)  
**Backend (FastAPI) → Railway** (Fácil, soporta Python, plan gratuito)

Esta es la opción más sencilla y con menos problemas. Railway es mucho más fácil de configurar que OVH Cloud y tiene un plan gratuito generoso.

---

## 🎯 Opción 1: Vercel + Railway (RECOMENDADA)

### ✅ Ventajas
- ✅ **Gratis** (ambos tienen planes gratuitos)
- ✅ **Fácil configuración** (menos de 30 minutos)
- ✅ **Despliegue automático** desde GitHub
- ✅ **Menos problemas** que OVH Cloud
- ✅ **Escalable** cuando crezcas

### 📦 Paso 1: Preparar el Repositorio

Asegúrate de tener todo en GitHub:

```bash
git add .
git commit -m "Preparar para despliegue"
git push origin main
```

### 🔧 Paso 2: Desplegar Backend en Railway

#### 2.1 Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Haz clic en **"Login"** → **"Login with GitHub"**
3. Autoriza Railway a acceder a tu GitHub

#### 2.2 Crear nuevo proyecto

1. En Railway, haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Selecciona tu repositorio `portfolio`
4. Railway detectará automáticamente que es un proyecto Python

#### 2.3 Configurar el servicio

1. Railway creará un servicio automáticamente
2. Haz clic en el servicio
3. Ve a la pestaña **"Settings"**
4. Configura lo siguiente:

**Root Directory:**
```
study_agents
```

**Start Command:**
```
cd api && uvicorn main:app --host 0.0.0.0 --port $PORT
```

#### 2.4 Configurar Variables de Entorno

En Railway, ve a **"Variables"** y añade:

```env
OPENAI_API_KEY=tu-api-key-de-openai
PORT=8000
```

#### 2.5 Obtener la URL del Backend

1. Ve a la pestaña **"Settings"** → **"Networking"**
2. Haz clic en **"Generate Domain"**
3. Copia la URL (ej: `https://tu-proyecto.up.railway.app`)
4. **¡Guarda esta URL!** La necesitarás para Vercel

#### 2.6 Verificar que funciona

Abre en el navegador: `https://tu-url-railway.app/health`

Deberías ver: `{"status": "ok"}`

---

### 🌐 Paso 3: Desplegar Frontend en Vercel

#### 3.1 Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **"Sign Up"** → **"Continue with GitHub"**
3. Autoriza Vercel a acceder a tu GitHub

#### 3.2 Importar proyecto

1. En Vercel, haz clic en **"Add New..."** → **"Project"**
2. Selecciona tu repositorio `portfolio`
3. Vercel detectará automáticamente que es Next.js

#### 3.3 Configurar Variables de Entorno

Antes de hacer deploy, configura estas variables:

**En Vercel → Settings → Environment Variables:**

```env
# URL del backend en Railway
FASTAPI_URL=https://tu-url-railway.app

# NextAuth (si usas autenticación)
NEXTAUTH_URL=https://tu-dominio-vercel.vercel.app
NEXTAUTH_SECRET=genera-un-secreto-aleatorio-aqui

# Google OAuth (si lo usas)
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
```

**Para generar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

#### 3.4 Configurar Build Settings

Vercel debería detectar automáticamente:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`

Si no, configúralo manualmente.

#### 3.5 Hacer Deploy

1. Haz clic en **"Deploy"**
2. Espera a que termine el build (2-5 minutos)
3. ¡Listo! Tu app estará en `https://tu-proyecto.vercel.app`

---

### 🔗 Paso 4: Conectar Frontend con Backend

#### 4.1 Actualizar Variables de Entorno en Vercel

Después del primer deploy, actualiza `FASTAPI_URL` con la URL real de Railway:

1. Ve a **Settings** → **Environment Variables**
2. Edita `FASTAPI_URL` con la URL de Railway
3. Haz clic en **"Redeploy"** para aplicar los cambios

#### 4.2 Verificar la Conexión

1. Abre tu app en Vercel
2. Ve a `/study-agents`
3. Intenta subir un documento o hacer una pregunta
4. Si funciona, ¡todo está conectado!

---

## 🎯 Opción 2: Vercel + OVH Cloud (Alternativa)

Si prefieres usar OVH Cloud en lugar de Railway:

### 📦 Paso 1: Configurar Servidor en OVH

#### 1.1 Crear instancia

1. Ve a [ovhcloud.com](https://www.ovhcloud.com)
2. Crea una instancia (ej: Ubuntu 22.04)
3. Configura SSH y firewall (puerto 8000 abierto)

#### 1.2 Conectar por SSH

```bash
ssh root@tu-ip-ovh
```

#### 1.3 Instalar dependencias

```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Python y pip
apt install python3 python3-pip python3-venv -y

# Instalar Node.js (para npm, si lo necesitas)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalar nginx (opcional, para reverse proxy)
apt install nginx -y
```

#### 1.4 Clonar repositorio

```bash
cd /var/www
git clone https://github.com/tu-usuario/portfolio.git
cd portfolio/study_agents
```

#### 1.5 Configurar entorno virtual

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 1.6 Configurar variables de entorno

```bash
nano .env
```

Añade:
```env
OPENAI_API_KEY=tu-api-key
PORT=8000
```

#### 1.7 Configurar como servicio systemd

```bash
sudo nano /etc/systemd/system/study-agents.service
```

Contenido:
```ini
[Unit]
Description=Study Agents FastAPI
After=network.target

[Service]
User=root
WorkingDirectory=/var/www/portfolio/study_agents
Environment="PATH=/var/www/portfolio/study_agents/venv/bin"
ExecStart=/var/www/portfolio/study_agents/venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Activar servicio:
```bash
sudo systemctl daemon-reload
sudo systemctl enable study-agents
sudo systemctl start study-agents
sudo systemctl status study-agents
```

#### 1.8 Configurar Nginx (Recomendado)

```bash
sudo nano /etc/nginx/sites-available/study-agents
```

Contenido:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activar:
```bash
sudo ln -s /etc/nginx/sites-available/study-agents /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 1.9 Configurar SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio.com
```

### 🔗 Paso 2: Conectar con Vercel

1. En Vercel, configura `FASTAPI_URL` con tu dominio OVH
2. Haz redeploy

---

## 🔧 Configuración Adicional

### Variables de Entorno Necesarias

#### Backend (Railway/OVH):
```env
OPENAI_API_KEY=sk-...
PORT=8000
```

#### Frontend (Vercel):
```env
FASTAPI_URL=https://tu-backend-url.com
NEXTAUTH_URL=https://tu-frontend-url.vercel.app
NEXTAUTH_SECRET=tu-secreto-generado
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
```

### Archivos Necesarios

Asegúrate de tener estos archivos en tu repositorio:

**Para Railway:**
- ✅ `study_agents/railway.json` (ya existe)
- ✅ `study_agents/Procfile` (ya existe)
- ✅ `study_agents/requirements.txt` (ya existe)

**Para Vercel:**
- ✅ `package.json` (ya existe)
- ✅ `next.config.ts` (ya existe)

### Archivo `.vercelignore` (Opcional)

Crea `.vercelignore` en la raíz:

```
study_agents/
node_modules/
.env
.env.local
```

---

## 🐛 Solución de Problemas

### Backend no responde

1. **Verifica que Railway está corriendo:**
   - Ve a Railway → Deployments
   - Verifica que el último deployment está activo

2. **Revisa los logs:**
   - Railway → Deployments → Click en el deployment → Logs
   - Busca errores

3. **Verifica variables de entorno:**
   - Railway → Variables
   - Asegúrate de que `OPENAI_API_KEY` está configurada

### Frontend no se conecta al backend

1. **Verifica `FASTAPI_URL` en Vercel:**
   - Settings → Environment Variables
   - Debe ser la URL completa de Railway (con https://)

2. **Verifica CORS en el backend:**
   - El backend ya tiene CORS configurado para aceptar requests de cualquier origen
   - Si hay problemas, revisa `study_agents/api/main.py`

3. **Revisa la consola del navegador:**
   - Abre DevTools → Console
   - Busca errores de conexión

### Error 500 en producción

1. **Revisa logs de Railway:**
   - Railway → Deployments → Logs
   - Busca el error específico

2. **Verifica que todas las dependencias están instaladas:**
   - Railway debería instalarlas automáticamente desde `requirements.txt`

3. **Verifica rutas de archivos:**
   - En producción, las rutas pueden ser diferentes
   - Asegúrate de usar rutas relativas

---

## 💰 Costos Estimados

### Opción 1: Vercel + Railway

- **Vercel:** Gratis (hasta 100GB bandwidth/mes)
- **Railway:** Gratis ($5 crédito/mes, suficiente para desarrollo)
- **Total:** $0/mes (desarrollo) o ~$5-20/mes (producción con tráfico)

### Opción 2: Vercel + OVH Cloud

- **Vercel:** Gratis
- **OVH Cloud:** ~$5-15/mes (depende del servidor)
- **Total:** ~$5-15/mes

---

## ✅ Checklist de Despliegue

### Backend (Railway)
- [ ] Cuenta creada en Railway
- [ ] Proyecto conectado a GitHub
- [ ] Root directory configurado (`study_agents`)
- [ ] Start command configurado
- [ ] Variables de entorno configuradas
- [ ] Dominio generado y URL copiada
- [ ] Health check funciona (`/health`)

### Frontend (Vercel)
- [ ] Cuenta creada en Vercel
- [ ] Proyecto importado desde GitHub
- [ ] Variables de entorno configuradas
- [ ] `FASTAPI_URL` apunta al backend de Railway
- [ ] Deploy completado exitosamente
- [ ] App funciona en producción

### Verificación Final
- [ ] Puedo acceder a la app en Vercel
- [ ] Puedo subir documentos
- [ ] Puedo hacer preguntas
- [ ] Puedo generar apuntes
- [ ] Puedo crear tests
- [ ] Todo funciona correctamente

---

## 🎉 ¡Listo!

Una vez completado el checklist, tu aplicación estará completamente desplegada y funcionando en producción.

**Recomendación final:** Empieza con **Vercel + Railway**. Es más fácil, más rápido y tiene menos problemas. Si después necesitas más control o recursos, puedes migrar a OVH Cloud.

---

## 📞 Soporte

Si tienes problemas durante el despliegue:
1. Revisa los logs en Railway y Vercel
2. Verifica las variables de entorno
3. Asegúrate de que el backend responde en `/health`
4. Revisa la consola del navegador para errores del frontend

¡Buena suerte con el despliegue! 🚀

