# 🔧 Instrucciones para Resolver Error "API key requerida"

## 🔍 Diagnóstico Rápido

El error "API key requerida" significa que FastAPI no está recibiendo tu API key. Vamos a diagnosticarlo paso a paso.

---

## ✅ Verificación 1: ¿Tienes la API key configurada?

### En el navegador:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Ejecuta este comando:

```javascript
JSON.parse(localStorage.getItem('study_agents_api_keys'))
```

**¿Qué deberías ver?**
```javascript
{openai: "sk-proj-..."}
```

**Si ves `null` o está vacío:**
- Ve a `/study-agents`
- Aparecerá un modal
- Introduce tu OpenAI API key
- Guarda

---

## ✅ Verificación 2: Revisa los Logs

Cuando intentas subir un archivo, revisa:

### Terminal de Next.js:
Busca mensajes que empiecen con `[Upload]`:
- `[Upload] API Key recibida: sk-proj...` ✅ (significa que llegó)
- `[Upload] ERROR: API key no recibida` ❌ (significa que no llegó)

### Terminal de FastAPI:
Busca errores o mensajes sobre la API key.

---

## 🔧 Solución Rápida

1. **Configura la API key** si no está guardada
2. **Reinicia FastAPI** (Ctrl+C y vuelve a iniciarlo)
3. **Intenta subir de nuevo**

---

## 📋 Información que Necesito

Para ayudarte mejor, comparte:

1. ¿Qué aparece cuando ejecutas el comando de localStorage?
2. ¿Qué mensajes ves en la terminal de Next.js?
3. ¿Qué mensajes ves en la terminal de FastAPI?

---

**¡Con esta información podremos solucionarlo!** 🔍

