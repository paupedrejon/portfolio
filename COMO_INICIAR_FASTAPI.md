# 🚀 Cómo Iniciar FastAPI - Solución al Error

## ✅ El problema

El error "El backend FastAPI no está disponible" significa que **FastAPI simplemente no está corriendo**. 

La solución es **iniciarlo en una terminal separada**.

---

## 🎯 Solución: 3 Pasos Simples

### Paso 1: Abre una NUEVA terminal

**IMPORTANTE:** Esta debe ser una terminal diferente a donde corre Next.js.

### Paso 2: Ve a la carpeta study_agents

```powershell
cd C:\Users\2005s\portfolio\study_agents
```

### Paso 3: Inicia FastAPI

```powershell
python api/main.py
```

---

## ✅ Deberías ver:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

**¡Cuando veas esto, FastAPI está corriendo!** 🎉

---

## 🎯 Ahora Intenta Subir el PDF

1. ✅ FastAPI corriendo (Terminal 1)
2. ✅ Next.js corriendo (Terminal 2 - ya lo tienes)
3. ✅ Abre `http://localhost:3000/study-agents` en el navegador
4. ✅ Intenta subir el PDF - ¡Ahora debería funcionar!

---

## 📝 Resumen

**Tienes que tener DOS terminales abiertas:**

- **Terminal 1**: FastAPI (`python api/main.py`)
- **Terminal 2**: Next.js (`npm run dev`)

**Ambas deben estar corriendo al mismo tiempo.**

---

## 🛑 Para Detener FastAPI

Cuando termines, en la terminal de FastAPI presiona:
```
Ctrl + C
```

---

**¡Solo necesitas iniciar FastAPI y listo!** 🚀

