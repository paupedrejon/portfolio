# 🚀 Cómo Ejecutar FastAPI

## ✅ Solución al Problema

El problema era que `api/main.py` solo definía la aplicación pero no iniciaba el servidor. **Ya está corregido**.

---

## 🎯 Cómo Iniciar FastAPI

### Opción 1: Ejecutar directamente (Recomendado)

```powershell
cd study_agents
python api/main.py
```

Ahora deberías ver:
```
🚀 Iniciando Study Agents API...
📡 Servidor en: http://localhost:8000
📖 Documentación: http://localhost:8000/docs
💡 Health check: http://localhost:8000/health

⚠️  Presiona Ctrl+C para detener el servidor

INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

### Opción 2: Usar el script .bat

```powershell
cd study_agents
.\start_api.bat
```

O hacer doble clic en: `study_agents/start_api.bat`

### Opción 3: Usar uvicorn directamente

```powershell
cd study_agents
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

---

## ✅ Verificación

Una vez iniciado, abre en tu navegador:
```
http://localhost:8000/health
```

Debe mostrar:
```json
{"status": "ok", "message": "Study Agents API is running"}
```

---

## 🔧 Si Aún No Funciona

### 1. Verifica que uvicorn esté instalado

```powershell
pip install uvicorn
```

O instala todas las dependencias:
```powershell
cd study_agents
pip install -r requirements.txt
```

### 2. Verifica que estés en el directorio correcto

```powershell
cd C:\Users\2005s\portfolio\study_agents
python api/main.py
```

### 3. Revisa si hay errores

Si aparece algún error al iniciar, compártelo para poder ayudarte.

---

## 📝 Nota

**El servidor debe estar corriendo** mientras uses la aplicación. Déjalo abierto en la terminal.

Para detenerlo, presiona `Ctrl+C`.

---

**¡Ahora debería funcionar!** 🎉

