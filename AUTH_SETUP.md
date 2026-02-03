

## ✅ Lo que se ha implementado

1. **NextAuth.js** configurado con Google OAuth
2. **Página de login** en `/auth/signin`
3. **Protección de rutas** - `/study-agents` requiere autenticación
4. **Componente de perfil** - Muestra usuario y botón de logout
5. **Integración con StudyChat** - Usa `user_id` de la sesión

## 📋 Pasos para configurar Google OAuth

### 1. Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google+ API**

### 2. Crear credenciales OAuth 2.0

1. Ve a **APIs & Services** > **Credentials**
2. Click en **Create Credentials** > **OAuth client ID**
3. Si es la primera vez, configura la **OAuth consent screen**:
   - Tipo: **External** (o Internal si tienes Google Workspace)
   - App name: **StudyAgents**
   - User support email: Tu email
   - Developer contact: Tu email
   - Guarda y continúa
4. Crea el **OAuth client ID**:
   - Application type: **Web application**
   - Name: **StudyAgents Web Client**
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (desarrollo)
     - `https://tu-dominio.vercel.app` (producción)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (desarrollo)
     - `https://tu-dominio.vercel.app/api/auth/callback/google` (producción)
5. Copia el **Client ID** y **Client Secret**

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-key-aqui

# Google OAuth
GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# FastAPI Backend
FASTAPI_URL=http://localhost:8000
```

### 4. Generar NEXTAUTH_SECRET

Ejecuta este comando para generar un secret seguro:

```bash
openssl rand -base64 32
```

O usa este generador online: https://generate-secret.vercel.app/32

### 5. Para producción (Vercel)

1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega todas las variables:
   - `NEXTAUTH_URL` = `https://tu-dominio.vercel.app`
   - `NEXTAUTH_SECRET` = (el secret que generaste)
   - `GOOGLE_CLIENT_ID` = (tu Client ID)
   - `GOOGLE_CLIENT_SECRET` = (tu Client Secret)
   - `FASTAPI_URL` = (URL de tu backend)

## 🚀 Cómo funciona

1. **Usuario visita** `/study-agents`
2. **Si no está autenticado** → Redirige a `/auth/signin`
3. **Usuario hace click** en "Continuar con Google"
4. **Google OAuth** → Usuario autoriza la app
5. **NextAuth crea sesión** → Redirige a `/study-agents`
6. **StudyChat usa** `session.user.id` o `session.user.email` como `user_id`
7. **Todos los datos** se guardan asociados a ese `user_id`

## 📝 Notas importantes

- **No necesitas servidor propio** - NextAuth.js maneja todo
- **Las sesiones se guardan** en cookies seguras
- **Cada usuario tiene su propio** `user_id` para tracking de progreso
- **Los datos se separan** por usuario automáticamente

## 🔒 Seguridad

- Las sesiones son **HTTP-only cookies** (seguras)
- **NEXTAUTH_SECRET** debe ser único y secreto
- **Google OAuth** maneja la autenticación de forma segura
- No se almacenan contraseñas (Google las maneja)

## 💰 Costos

**¡La autenticación es GRATIS para tu caso de uso!**

- **NextAuth.js**: Gratis (open source)
- **Google OAuth**: Gratis para autenticación básica (solo email/nombre)
- **Sin límites** para login básico
- **No requiere verificación** de Google (solo si solicitas permisos avanzados)

Ver `COSTOS_AUTENTICACION.md` para detalles completos de costos.


## ✅ Lo que se ha implementado

1. **NextAuth.js** configurado con Google OAuth
2. **Página de login** en `/auth/signin`
3. **Protección de rutas** - `/study-agents` requiere autenticación
4. **Componente de perfil** - Muestra usuario y botón de logout
5. **Integración con StudyChat** - Usa `user_id` de la sesión

## 📋 Pasos para configurar Google OAuth

### 1. Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google+ API**

### 2. Crear credenciales OAuth 2.0

1. Ve a **APIs & Services** > **Credentials**
2. Click en **Create Credentials** > **OAuth client ID**
3. Si es la primera vez, configura la **OAuth consent screen**:
   - Tipo: **External** (o Internal si tienes Google Workspace)
   - App name: **StudyAgents**
   - User support email: Tu email
   - Developer contact: Tu email
   - Guarda y continúa
4. Crea el **OAuth client ID**:
   - Application type: **Web application**
   - Name: **StudyAgents Web Client**
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (desarrollo)
     - `https://tu-dominio.vercel.app` (producción)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (desarrollo)
     - `https://tu-dominio.vercel.app/api/auth/callback/google` (producción)
5. Copia el **Client ID** y **Client Secret**

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-key-aqui

# Google OAuth
GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# FastAPI Backend
FASTAPI_URL=http://localhost:8000
```

### 4. Generar NEXTAUTH_SECRET

Ejecuta este comando para generar un secret seguro:

```bash
openssl rand -base64 32
```

O usa este generador online: https://generate-secret.vercel.app/32

### 5. Para producción (Vercel)

1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega todas las variables:
   - `NEXTAUTH_URL` = `https://tu-dominio.vercel.app`
   - `NEXTAUTH_SECRET` = (el secret que generaste)
   - `GOOGLE_CLIENT_ID` = (tu Client ID)
   - `GOOGLE_CLIENT_SECRET` = (tu Client Secret)
   - `FASTAPI_URL` = (URL de tu backend)

## 🚀 Cómo funciona

1. **Usuario visita** `/study-agents`
2. **Si no está autenticado** → Redirige a `/auth/signin`
3. **Usuario hace click** en "Continuar con Google"
4. **Google OAuth** → Usuario autoriza la app
5. **NextAuth crea sesión** → Redirige a `/study-agents`
6. **StudyChat usa** `session.user.id` o `session.user.email` como `user_id`
7. **Todos los datos** se guardan asociados a ese `user_id`

## 📝 Notas importantes

- **No necesitas servidor propio** - NextAuth.js maneja todo
- **Las sesiones se guardan** en cookies seguras
- **Cada usuario tiene su propio** `user_id` para tracking de progreso
- **Los datos se separan** por usuario automáticamente

## 🔒 Seguridad

- Las sesiones son **HTTP-only cookies** (seguras)
- **NEXTAUTH_SECRET** debe ser único y secreto
- **Google OAuth** maneja la autenticación de forma segura
- No se almacenan contraseñas (Google las maneja)

## 💰 Costos

**¡La autenticación es GRATIS para tu caso de uso!**

- **NextAuth.js**: Gratis (open source)
- **Google OAuth**: Gratis para autenticación básica (solo email/nombre)
- **Sin límites** para login básico
- **No requiere verificación** de Google (solo si solicitas permisos avanzados)

Ver `COSTOS_AUTENTICACION.md` para detalles completos de costos.


## ✅ Lo que se ha implementado

1. **NextAuth.js** configurado con Google OAuth
2. **Página de login** en `/auth/signin`
3. **Protección de rutas** - `/study-agents` requiere autenticación
4. **Componente de perfil** - Muestra usuario y botón de logout
5. **Integración con StudyChat** - Usa `user_id` de la sesión

## 📋 Pasos para configurar Google OAuth

### 1. Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google+ API**

### 2. Crear credenciales OAuth 2.0

1. Ve a **APIs & Services** > **Credentials**
2. Click en **Create Credentials** > **OAuth client ID**
3. Si es la primera vez, configura la **OAuth consent screen**:
   - Tipo: **External** (o Internal si tienes Google Workspace)
   - App name: **StudyAgents**
   - User support email: Tu email
   - Developer contact: Tu email
   - Guarda y continúa
4. Crea el **OAuth client ID**:
   - Application type: **Web application**
   - Name: **StudyAgents Web Client**
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (desarrollo)
     - `https://tu-dominio.vercel.app` (producción)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (desarrollo)
     - `https://tu-dominio.vercel.app/api/auth/callback/google` (producción)
5. Copia el **Client ID** y **Client Secret**

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-key-aqui

# Google OAuth
GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# FastAPI Backend
FASTAPI_URL=http://localhost:8000
```

### 4. Generar NEXTAUTH_SECRET

Ejecuta este comando para generar un secret seguro:

```bash
openssl rand -base64 32
```

O usa este generador online: https://generate-secret.vercel.app/32

### 5. Para producción (Vercel)

1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega todas las variables:
   - `NEXTAUTH_URL` = `https://tu-dominio.vercel.app`
   - `NEXTAUTH_SECRET` = (el secret que generaste)
   - `GOOGLE_CLIENT_ID` = (tu Client ID)
   - `GOOGLE_CLIENT_SECRET` = (tu Client Secret)
   - `FASTAPI_URL` = (URL de tu backend)

## 🚀 Cómo funciona

1. **Usuario visita** `/study-agents`
2. **Si no está autenticado** → Redirige a `/auth/signin`
3. **Usuario hace click** en "Continuar con Google"
4. **Google OAuth** → Usuario autoriza la app
5. **NextAuth crea sesión** → Redirige a `/study-agents`
6. **StudyChat usa** `session.user.id` o `session.user.email` como `user_id`
7. **Todos los datos** se guardan asociados a ese `user_id`

## 📝 Notas importantes

- **No necesitas servidor propio** - NextAuth.js maneja todo
- **Las sesiones se guardan** en cookies seguras
- **Cada usuario tiene su propio** `user_id` para tracking de progreso
- **Los datos se separan** por usuario automáticamente

## 🔒 Seguridad

- Las sesiones son **HTTP-only cookies** (seguras)
- **NEXTAUTH_SECRET** debe ser único y secreto
- **Google OAuth** maneja la autenticación de forma segura
- No se almacenan contraseñas (Google las maneja)

## 💰 Costos

**¡La autenticación es GRATIS para tu caso de uso!**

- **NextAuth.js**: Gratis (open source)
- **Google OAuth**: Gratis para autenticación básica (solo email/nombre)
- **Sin límites** para login básico
- **No requiere verificación** de Google (solo si solicitas permisos avanzados)

Ver `COSTOS_AUTENTICACION.md` para detalles completos de costos.

