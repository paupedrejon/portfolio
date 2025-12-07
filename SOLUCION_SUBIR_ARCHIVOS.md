# 🔧 Solución: Error "fetch failed" al Subir Archivos

## 🔍 Problema

El error **"fetch failed"** al intentar subir PDFs generalmente significa que:

1. **El backend FastAPI NO está corriendo** (causa más común)
2. Hay un problema de conexión entre Next.js y FastAPI

---

## ✅ Solución Paso a Paso

### Paso 1: Verificar que FastAPI esté corriendo

**Abre una terminal nueva** y ejecuta:

```bash
cd study_agents
python api/main.py
```

**O usando uvicorn directamente:**

```bash
cd study_agents
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

**Debes ver algo como:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

### Paso 2: Verificar la conexión

**En otra terminal**, prueba:

```bash
curl http://localhost:8000/health
```

**O abre en tu navegador:**
```
http://localhost:8000/health
```

**Debe retornar:**
```json
{"status": "ok", "message": "Study Agents API is running"}
```

### Paso 3: Verificar Next.js

**Asegúrate de que Next.js esté corriendo:**

```bash
npm run dev
```

**Debe estar en:**
```
http://localhost:3000
```

---

## 🎯 Orden Correcto de Inicio

### Terminal 1: FastAPI Backend
```bash
cd study_agents
python api/main.py
```
**Espera a ver:** `Uvicorn running on http://0.0.0.0:8000`

### Terminal 2: Next.js Frontend
```bash
npm run dev
```
**Espera a ver:** `Ready on http://localhost:3000`

### Navegador
Abre: `http://localhost:3000/study-agents`

---

## 🔧 Mejoras Implementadas

He mejorado el código para:

1. ✅ **Verificar que FastAPI esté corriendo** antes de intentar subir
2. ✅ **Mensajes de error más claros** que te dicen exactamente qué hacer
3. ✅ **Mejor manejo de errores** para identificar el problema

Ahora, si FastAPI no está corriendo, verás un mensaje como:

```
❌ Error: El backend FastAPI no está disponible. Por favor, inicia el servidor primero.

💡 Ejecuta en otra terminal: cd study_agents && python api/main.py
```

---

## 🐛 Troubleshooting

### Error: "fetch failed"

**Solución:**
1. Verifica que FastAPI esté corriendo
2. Verifica que esté en el puerto 8000
3. Prueba `curl http://localhost:8000/health`

### Error: "No se pudo conectar"

**Solución:**
1. Revisa que no haya un firewall bloqueando
2. Verifica la URL en `.env.local` (por defecto: `http://localhost:8000`)
3. Intenta reiniciar FastAPI

### Error: "API key requerida"

**Solución:**
1. Configura tu API key en el modal que aparece al cargar la página
2. Asegúrate de que empiece con `sk-`

---

## ✅ Verificación Rápida

```bash
# 1. Verificar FastAPI
curl http://localhost:8000/health

# 2. Debe retornar: {"status": "ok"}

# 3. Si no funciona, inicia FastAPI:
cd study_agents
python api/main.py
```

---

## 📝 Nota Importante

**Ambos servidores deben estar corriendo simultáneamente:**
- ✅ FastAPI en `http://localhost:8000`
- ✅ Next.js en `http://localhost:3000`

¡El código ahora te dirá exactamente qué hacer si falta algo! 🚀

