# 🔍 Diagnóstico: Error "API key requerida"

## ❓ Preguntas para Diagnosticar

### 1. ¿Tienes la API key configurada?

**Verifica:**
- Abre la consola del navegador (F12)
- Ve a "Application" → "Local Storage" → `http://localhost:3000`
- Busca `study_agents_api_keys`
- ¿Está tu API key guardada?

**Si NO:**
1. Abre `/study-agents`
2. Introduce tu API key en el modal
3. Guarda

### 2. ¿FastAPI está corriendo?

**Verifica:**
- Abre: `http://localhost:8000/health`
- Debe mostrar: `{"status": "ok"}`

**Si NO:**
```powershell
cd study_agents
python api/main.py
```

### 3. ¿Qué dice la terminal de Next.js?

Cuando intentas subir, busca en la terminal mensajes que empiecen con:
- `[Upload] API Key recibida:`
- `[Upload] ERROR:`

Esto te dirá si la API key está llegando a Next.js.

### 4. ¿Qué dice la terminal de FastAPI?

Cuando intentas subir, busca errores o mensajes en la terminal de FastAPI.

---

## 🔧 He Añadido Logging Detallado

El código ahora muestra mensajes detallados:

- ✅ Si la API key llega a Next.js
- ✅ Si se envía a FastAPI
- ✅ Si FastAPI la recibe

**Revisa las terminales** para ver estos mensajes y sabremos exactamente dónde está el problema.

---

## 💡 Solución Rápida

1. **Abre la consola del navegador** (F12)
2. **Ve a "Network"**
3. **Intenta subir el PDF**
4. **Busca la request a `/api/study-agents/upload`**
5. **Ve a "Payload"** y verifica que tenga `apiKey`

**O revisa las terminales** para ver los logs que he añadido.

---

¡Los logs te dirán exactamente qué está pasando! 🔍

