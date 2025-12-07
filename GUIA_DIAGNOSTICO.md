# 🔍 Guía de Diagnóstico - Error "API key requerida"

## 🔴 Error Actual

"API key requerida" - Esto significa que FastAPI no está recibiendo la API key.

---

## ✅ Pasos para Diagnosticar

### 1. Verifica que la API key esté guardada

**Abre la consola del navegador (F12)** y ejecuta:

```javascript
localStorage.getItem('study_agents_api_keys')
```

**Deberías ver** algo como:
```json
{"openai":"sk-proj-..."}
```

**Si NO ves nada o está vacío:**
- Abre `/study-agents`
- Aparecerá un modal para configurar la API key
- Introduce tu OpenAI API key (debe empezar con `sk-`)
- Guarda

---

### 2. Verifica los logs en las terminales

He añadido logging detallado. Cuando intentas subir un archivo:

**Terminal de Next.js:**
- Busca mensajes que empiecen con `[Upload]`
- Deberías ver: `[Upload] API Key recibida: sk-proj...`
- Deberías ver: `[Upload] Enviando a FastAPI con API key: sk-proj...`

**Terminal de FastAPI:**
- Busca errores relacionados con "API key"

---

### 3. Verifica en el navegador

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **"Network"**
3. Intenta subir un PDF
4. Busca la request a `/api/study-agents/upload`
5. Haz clic en ella
6. Ve a la pestaña **"Payload"** o **"Request"**
7. Verifica que tenga:
   - `files`: Los archivos PDF
   - `apiKey`: Tu API key (debe empezar con `sk-`)

---

## 🐛 Posibles Problemas

### Problema 1: API key no guardada
**Solución:** Configura la API key en el modal

### Problema 2: API key no se envía
**Solución:** Verifica que `apiKeys.openai` tenga valor antes de enviar

### Problema 3: FastAPI no la recibe
**Solución:** Reinicia FastAPI y verifica los logs

---

## 📝 Información Necesaria

Para ayudarte mejor, por favor comparte:

1. **¿Qué aparece en la terminal de Next.js?** (los mensajes `[Upload]`)
2. **¿Qué aparece en la terminal de FastAPI?** (errores o mensajes)
3. **¿La API key está guardada?** (verifica con el comando de arriba)
4. **¿Qué aparece en la pestaña Network del navegador?**

---

**¡Con esta información podremos identificar exactamente el problema!** 🔍

