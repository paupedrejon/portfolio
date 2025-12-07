# ⚡ Instrucciones Rápidas - Solución al Error

## 🔴 Error: "API key requerida"

Este error significa que **FastAPI no está recibiendo la API key** correctamente.

---

## ✅ Solución Rápida

### 1. Verifica que tengas la API key configurada

En la página `/study-agents`:
- Si aparece un modal, introduce tu OpenAI API key
- La API key debe empezar con `sk-`

### 2. Reinicia FastAPI

**IMPORTANTE:** Si FastAPI ya está corriendo, debes reiniciarlo para que los cambios surtan efecto.

```powershell
# Detén FastAPI (Ctrl+C en la terminal donde corre)
# Luego reinicia:
cd study_agents
python api/main.py
```

### 3. Intenta subir el PDF de nuevo

---

## 📋 Checklist

- [ ] FastAPI está corriendo (puerto 8000)
- [ ] FastAPI se reinició después de los cambios
- [ ] API key configurada en el frontend
- [ ] API key empieza con `sk-`

---

## 🐛 Si el Error Persiste

1. **Abre la consola del navegador** (F12)
2. **Ve a la pestaña "Network"**
3. **Intenta subir el PDF**
4. **Busca la request a `/api/study-agents/upload`**
5. **Revisa qué datos se están enviando**

---

**¡Reinicia FastAPI e intenta de nuevo!** 🚀

