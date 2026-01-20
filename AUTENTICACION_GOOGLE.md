# 🔐 Autenticación con Google OAuth

## 📋 Descripción

Se ha implementado autenticación con Google OAuth usando NextAuth.js. Los usuarios ahora deben iniciar sesión con su cuenta de Google para acceder a Study Agents.

## ✅ Implementación

### 1. **NextAuth.js Configurado**
- ✅ Proveedor de Google OAuth configurado
- ✅ Rutas de autenticación creadas (`/api/auth/[...nextauth]`)
- ✅ Página de inicio de sesión personalizada (`/auth/signin`)

### 2. **Protección de Rutas**
- ✅ Middleware configurado para proteger `/study-agents`
- ✅ Redirección automática a login si no está autenticado
- ✅ Verificación de sesión en la página de Study Agents

### 3. **UI/UX**
- ✅ Página de login moderna y consistente con el diseño
- ✅ Botón de logout en el Header cuando estás en Study Agents
- ✅ Indicador de carga mientras se verifica la sesión

## 🔧 Configuración Requerida

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```env
# Google OAuth
GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=genera-un-secreto-aleatorio-aqui
```

### Obtener Google Client Secret

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** > **Credentials**
4. Encuentra tu OAuth 2.0 Client ID
5. Copia el **Client Secret**

### Generar NEXTAUTH_SECRET

Puedes generar un secreto aleatorio con:

```bash
openssl rand -base64 32
```

O usa cualquier generador de strings aleatorios.

## 🚀 Cómo Funciona

1. **Usuario intenta acceder a `/study-agents`**
   - El middleware verifica si hay sesión activa
   - Si no hay sesión → Redirige a `/auth/signin`

2. **Usuario hace clic en "Continuar con Google"**
   - Se redirige a Google para autenticación
   - Google verifica las credenciales
   - Se crea una sesión en NextAuth

3. **Usuario autenticado**
   - Puede acceder a Study Agents
   - Su sesión se mantiene mientras navega
   - Puede cerrar sesión desde el botón en el Header

## 📝 Archivos Creados/Modificados

### Nuevos Archivos:
- `app/api/auth/[...nextauth]/route.ts` - Configuración de NextAuth
- `app/auth/signin/page.tsx` - Página de inicio de sesión
- `middleware.ts` - Protección de rutas
- `.env.example` - Ejemplo de variables de entorno

### Archivos Modificados:
- `app/layout.tsx` - Añadido SessionProvider
- `app/study-agents/page.tsx` - Verificación de sesión
- `components/Header.tsx` - Botón de logout
- `package.json` - Añadido next-auth

## ⚠️ Importante

1. **Client Secret**: Necesitas obtener el Client Secret de Google Cloud Console
2. **NEXTAUTH_SECRET**: Debe ser un string aleatorio y seguro
3. **NEXTAUTH_URL**: En producción, cambia a tu dominio real
4. **URLs de redirección**: Asegúrate de configurar las URLs de redirección en Google Cloud Console:
   - `http://localhost:3000/api/auth/callback/google` (desarrollo)
   - `https://tudominio.com/api/auth/callback/google` (producción)

## 🔒 Seguridad

- Las sesiones se almacenan en cookies HTTP-only
- NextAuth maneja automáticamente la seguridad de las sesiones
- Los tokens de Google no se almacenan en el cliente
- La autenticación se verifica en cada request protegido

