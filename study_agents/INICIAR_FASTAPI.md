# 🚀 Cómo Iniciar FastAPI

## ⚡ Inicio Rápido

### Opción 1: Usando el script directo (Recomendado)

```bash
cd study_agents
python api/main.py
```

### Opción 2: Usando uvicorn directamente

```bash
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

Verifica que funciona:

```bash
curl http://localhost:8000/health
```

O abre en tu navegador:
```
http://localhost:8000/health
```

Debe mostrar:
```json
{"status": "ok", "message": "Study Agents API is running"}
```

---

## 🔧 Si hay errores

### Error: "ModuleNotFoundError"
```bash
cd study_agents
pip install -r requirements.txt
```

### Error: "No se puede conectar"
- Verifica que el puerto 8000 no esté ocupado
- Cierra otros programas que puedan estar usando el puerto

### Error: "ImportError"
Asegúrate de estar en el directorio correcto:
```bash
cd study_agents
python api/main.py
```

---

## 📝 Notas

- **Deja esta terminal abierta** mientras uses la aplicación
- Para detener el servidor: presiona `Ctrl+C`
- El flag `--reload` hace que se reinicie automáticamente al cambiar código

---

¡Una vez que veas "Uvicorn running", ya puedes subir archivos! 🎉

