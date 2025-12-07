# 🚀 Inicio Rápido - FastAPI Backend

## ✅ El mensaje de error significa:

El código está funcionando correctamente y detectó que **FastAPI no está corriendo**.

---

## 🎯 Solución: Inicia FastAPI

### Opción 1: Usando el script (Windows)

**Doble clic en:**
```
study_agents/iniciar_api.bat
```

**O desde PowerShell:**
```powershell
cd study_agents
.\iniciar_api.bat
```

---

### Opción 2: Manual (Windows PowerShell)

```powershell
cd study_agents
python api/main.py
```

---

### Opción 3: Usando uvicorn directamente

```powershell
cd study_agents
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

---

## ✅ Verificación

Una vez iniciado, deberías ver:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

**Abre en tu navegador:**
```
http://localhost:8000/health
```

**Debe mostrar:**
```json
{"status": "ok", "message": "Study Agents API is running"}
```

---

## 📝 Importante

**Mantén esta terminal abierta** mientras uses la aplicación. 

- ✅ FastAPI debe estar corriendo para subir archivos
- ✅ Puedes cerrar la terminal cuando termines (Ctrl+C)
- ✅ La terminal mostrará los logs de lo que está pasando

---

## 🎯 Flujo Completo

1. **Terminal 1**: Inicia FastAPI
   ```powershell
   cd study_agents
   python api/main.py
   ```

2. **Terminal 2**: Inicia Next.js (si no está corriendo)
   ```powershell
   npm run dev
   ```

3. **Navegador**: Abre `http://localhost:3000/study-agents`

4. **Ahora puedes subir PDFs** ✅

---

## 🐛 Si hay errores

### "ModuleNotFoundError: No module named 'fastapi'"
```powershell
cd study_agents
pip install -r requirements.txt
```

### "Puerto 8000 ya está en uso"
- Cierra otros programas que usen el puerto 8000
- O cambia el puerto en `api/main.py`

---

¡Una vez que veas "Uvicorn running", intenta subir el PDF de nuevo! 🎉
