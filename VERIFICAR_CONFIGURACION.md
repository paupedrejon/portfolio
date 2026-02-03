

## 📋 Checklist de Configuración

### 1. ✅ Archivo .env.local creado
- ✅ NEXTAUTH_URL configurado
- ✅ NEXTAUTH_SECRET generado
- ✅ GOOGLE_CLIENT_ID configurado
- ✅ GOOGLE_CLIENT_SECRET configurado
- ✅ FASTAPI_URL configurado

### 2. ⚠️ Verificar Google Cloud Console

Asegúrate de que en Google Cloud Console tengas configuradas estas URLs:

#### Authorized JavaScript origins:
```
http://localhost:3000
```

#### Authorized redirect URIs:
```
http://localhost:3000/api/auth/callback/google
```

**Si vas a desplegar en producción**, también agrega:
```
https://tu-dominio.vercel.app
https://tu-dominio.vercel.app/api/auth/callback/google
```

### 3. 🚀 Probar la Autenticación

1. **Reinicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

2. **Abre** `http://localhost:3000/study-agents`

3. **Deberías ser redirigido** a `/auth/signin`

4. **Haz click** en "Continuar con Google"

5. **Autoriza** la aplicación en Google

6. **Deberías ser redirigido** de vuelta a `/study-agents` con tu sesión iniciada

### 4. 🔍 Verificar que Funciona

- ✅ Deberías ver tu foto y nombre en la parte superior izquierda
- ✅ Deberías poder usar StudyChat normalmente
- ✅ Todos los datos se guardarán con tu `user_id` único

## 🐛 Solución de Problemas

### Error: "redirect_uri_mismatch"
- **Causa**: La URL de redirect no está configurada en Google Cloud Console
- **Solución**: Agrega `http://localhost:3000/api/auth/callback/google` en Google Cloud Console

### Error: "invalid_client"
- **Causa**: Client ID o Client Secret incorrectos
- **Solución**: Verifica que las credenciales en `.env.local` sean correctas

### Error: "NEXTAUTH_SECRET is missing"
- **Causa**: El archivo `.env.local` no se está leyendo
- **Solución**: Reinicia el servidor de desarrollo (`npm run dev`)

### La página se queda en loading
- **Causa**: El backend no está corriendo o hay un error
- **Solución**: Verifica que `python api/main.py` esté ejecutándose en `study_agents`

## 📝 Notas Importantes

- **El archivo `.env.local` NO se sube a Git** (está en `.gitignore`)
- **Para producción**, agrega las mismas variables en Vercel (Settings > Environment Variables)
- **Cambia `NEXTAUTH_URL`** en producción a tu dominio real


## 📋 Checklist de Configuración

### 1. ✅ Archivo .env.local creado
- ✅ NEXTAUTH_URL configurado
- ✅ NEXTAUTH_SECRET generado
- ✅ GOOGLE_CLIENT_ID configurado
- ✅ GOOGLE_CLIENT_SECRET configurado
- ✅ FASTAPI_URL configurado

### 2. ⚠️ Verificar Google Cloud Console

Asegúrate de que en Google Cloud Console tengas configuradas estas URLs:

#### Authorized JavaScript origins:
```
http://localhost:3000
```

#### Authorized redirect URIs:
```
http://localhost:3000/api/auth/callback/google
```

**Si vas a desplegar en producción**, también agrega:
```
https://tu-dominio.vercel.app
https://tu-dominio.vercel.app/api/auth/callback/google
```

### 3. 🚀 Probar la Autenticación

1. **Reinicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

2. **Abre** `http://localhost:3000/study-agents`

3. **Deberías ser redirigido** a `/auth/signin`

4. **Haz click** en "Continuar con Google"

5. **Autoriza** la aplicación en Google

6. **Deberías ser redirigido** de vuelta a `/study-agents` con tu sesión iniciada

### 4. 🔍 Verificar que Funciona

- ✅ Deberías ver tu foto y nombre en la parte superior izquierda
- ✅ Deberías poder usar StudyChat normalmente
- ✅ Todos los datos se guardarán con tu `user_id` único

## 🐛 Solución de Problemas

### Error: "redirect_uri_mismatch"
- **Causa**: La URL de redirect no está configurada en Google Cloud Console
- **Solución**: Agrega `http://localhost:3000/api/auth/callback/google` en Google Cloud Console

### Error: "invalid_client"
- **Causa**: Client ID o Client Secret incorrectos
- **Solución**: Verifica que las credenciales en `.env.local` sean correctas

### Error: "NEXTAUTH_SECRET is missing"
- **Causa**: El archivo `.env.local` no se está leyendo
- **Solución**: Reinicia el servidor de desarrollo (`npm run dev`)

### La página se queda en loading
- **Causa**: El backend no está corriendo o hay un error
- **Solución**: Verifica que `python api/main.py` esté ejecutándose en `study_agents`

## 📝 Notas Importantes

- **El archivo `.env.local` NO se sube a Git** (está en `.gitignore`)
- **Para producción**, agrega las mismas variables en Vercel (Settings > Environment Variables)
- **Cambia `NEXTAUTH_URL`** en producción a tu dominio real


## 📋 Checklist de Configuración

### 1. ✅ Archivo .env.local creado
- ✅ NEXTAUTH_URL configurado
- ✅ NEXTAUTH_SECRET generado
- ✅ GOOGLE_CLIENT_ID configurado
- ✅ GOOGLE_CLIENT_SECRET configurado
- ✅ FASTAPI_URL configurado

### 2. ⚠️ Verificar Google Cloud Console

Asegúrate de que en Google Cloud Console tengas configuradas estas URLs:

#### Authorized JavaScript origins:
```
http://localhost:3000
```

#### Authorized redirect URIs:
```
http://localhost:3000/api/auth/callback/google
```

**Si vas a desplegar en producción**, también agrega:
```
https://tu-dominio.vercel.app
https://tu-dominio.vercel.app/api/auth/callback/google
```

### 3. 🚀 Probar la Autenticación

1. **Reinicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

2. **Abre** `http://localhost:3000/study-agents`

3. **Deberías ser redirigido** a `/auth/signin`

4. **Haz click** en "Continuar con Google"

5. **Autoriza** la aplicación en Google

6. **Deberías ser redirigido** de vuelta a `/study-agents` con tu sesión iniciada

### 4. 🔍 Verificar que Funciona

- ✅ Deberías ver tu foto y nombre en la parte superior izquierda
- ✅ Deberías poder usar StudyChat normalmente
- ✅ Todos los datos se guardarán con tu `user_id` único

## 🐛 Solución de Problemas

### Error: "redirect_uri_mismatch"
- **Causa**: La URL de redirect no está configurada en Google Cloud Console
- **Solución**: Agrega `http://localhost:3000/api/auth/callback/google` en Google Cloud Console

### Error: "invalid_client"
- **Causa**: Client ID o Client Secret incorrectos
- **Solución**: Verifica que las credenciales en `.env.local` sean correctas

### Error: "NEXTAUTH_SECRET is missing"
- **Causa**: El archivo `.env.local` no se está leyendo
- **Solución**: Reinicia el servidor de desarrollo (`npm run dev`)

### La página se queda en loading
- **Causa**: El backend no está corriendo o hay un error
- **Solución**: Verifica que `python api/main.py` esté ejecutándose en `study_agents`

## 📝 Notas Importantes

- **El archivo `.env.local` NO se sube a Git** (está en `.gitignore`)
- **Para producción**, agrega las mismas variables en Vercel (Settings > Environment Variables)
- **Cambia `NEXTAUTH_URL`** en producción a tu dominio real



