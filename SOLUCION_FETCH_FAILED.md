# 🔧 Solución: Error "fetch failed" al subir archivos

## 🔍 Problema

El error "fetch failed" generalmente ocurre porque:

1. **El backend FastAPI no está corriendo** (más común)
2. **Problema de conexión** entre Next.js y FastAPI
3. **FormData no se maneja correctamente** al reenviar archivos

---

## ✅ Soluciones

### 1. Verificar que FastAPI esté corriendo

**En una terminal**, ejecuta:

```bash
cd study_agents
python api/main.py
```

O:

```bash
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

**Verifica que veas**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### 2. Verificar la conexión

Abre en tu navegador o usa curl:

```bash
curl http://localhost:8000/health
```

Debería retornar:
```json
{"status": "ok", "message": "Study Agents API is running"}
```

### 3. Verificar la URL en las rutas API

Las rutas API de Next.js buscan FastAPI en `http://localhost:8000` por defecto.

Si FastAPI está en otro puerto, puedes configurarlo en `.env.local`:

```env
FASTAPI_URL=http://localhost:8000
```

### 4. Revisar los logs

- **Terminal de Next.js**: Busca errores en la consola
- **Terminal de FastAPI**: Busca errores cuando intentas subir

---

## 🐛 Debugging

### En el Frontend (StudyChat.tsx)

Ya deberías ver mensajes de error más descriptivos. Si aún ves "fetch failed", verifica:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Network"
3. Intenta subir un archivo
4. Busca la request a `/api/study-agents/upload`
5. Revisa el error específico

### En la Ruta API (Next.js)

Los errores ahora se registran mejor. Revisa:
- Terminal donde corre Next.js
- Busca mensajes que empiecen con "Error uploading files:"

---

## 🔧 Cambios Realizados

He mejorado la ruta de upload para:

1. ✅ Mejor manejo de errores
2. ✅ Conversión correcta de archivos a Blob
3. ✅ Mensajes de error más descriptivos
4. ✅ Mejor logging para debugging

---

## ✅ Verificación Paso a Paso

1. **Backend corriendo**:
   ```bash
   curl http://localhost:8000/health
   ```

2. **Frontend corriendo**:
   - Abre http://localhost:3000/study-agents

3. **Configurar API key**:
   - Introduce tu OpenAI API key en el modal

4. **Intentar subir**:
   - Selecciona un PDF
   - Click en "Subir PDF"
   - Revisa los mensajes de error (ahora más descriptivos)

---

## 📝 Si el problema persiste

1. **Revisa los logs** de ambas terminales (Next.js y FastAPI)
2. **Verifica la consola del navegador** (F12 → Console)
3. **Verifica la pestaña Network** para ver el request completo
4. **Asegúrate de que FastAPI esté escuchando en el puerto correcto**

---

¡El código ahora debería dar errores más claros para identificar el problema exacto! 🔍

