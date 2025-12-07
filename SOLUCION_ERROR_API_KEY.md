# 🔧 Solución: Error "API key requerida"

## 🔍 Problema

El error "API key requerida" significa que FastAPI no está recibiendo la API key cuando intentas subir archivos.

---

## ✅ Solución Paso a Paso

### Paso 1: Verificar que la API key esté configurada

1. **Abre la página** `/study-agents`
2. **Si aparece un modal**, introduce tu OpenAI API key
3. **Asegúrate de que la API key empiece con `sk-`**
4. **Guarda la configuración**

### Paso 2: Verificar en localStorage

Abre la consola del navegador (F12) y ejecuta:

```javascript
JSON.parse(localStorage.getItem('study_agents_api_keys'))
```

Deberías ver tu API key guardada.

### Paso 3: Verificar que FastAPI esté corriendo

Abre en tu navegador:
```
http://localhost:8000/health
```

Debe mostrar: `{"status": "ok"}`

### Paso 4: Revisar los logs

Cuando intentas subir un archivo:

1. **Terminal de Next.js**: Busca mensajes que empiecen con `[Upload]`
2. **Terminal de FastAPI**: Busca errores o mensajes

---

## 🐛 Debugging

### Ver qué está pasando

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Network"
3. Intenta subir un PDF
4. Busca la request a `/api/study-agents/upload`
5. Ve a "Payload" o "Request" y verifica que tenga:
   - `files`: Los archivos
   - `apiKey`: Tu API key

---

## ✅ El código ya tiene logging mejorado

He añadido logs detallados que te dirán exactamente dónde está el problema:

- Si la API key no llega a Next.js
- Si la API key no se envía a FastAPI
- Si FastAPI no la recibe

**Revisa las terminales** para ver estos mensajes.

---

## 🔄 Si el Error Persiste

1. **Verifica que la API key esté configurada** en el frontend
2. **Reinicia FastAPI** (Ctrl+C y vuelve a iniciarlo)
3. **Reinicia Next.js** (Ctrl+C y `npm run dev`)
4. **Intenta de nuevo**

---

**¡Revisa los logs en las terminales para ver exactamente qué está pasando!** 🔍

