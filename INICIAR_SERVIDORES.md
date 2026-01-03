# 🚀 Cómo Iniciar los Servidores en Local

Para que Study Agents funcione completamente, necesitas iniciar **dos servidores**:

1. **Next.js** (Frontend) - Puerto 3000
2. **FastAPI** (Backend de Study Agents) - Puerto 8000

---

## 📋 Paso 1: Iniciar FastAPI (Backend)

Abre una **primera terminal** y ejecuta:

```bash
cd study_agents
python api/main.py
```

O si prefieres usar uvicorn directamente:

```bash
cd study_agents
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

**Deberías ver:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

✅ **Deja esta terminal abierta** - El servidor FastAPI debe seguir corriendo.

---

## 📋 Paso 2: Iniciar Next.js (Frontend)

Abre una **segunda terminal** (nueva ventana) y ejecuta:

```bash
npm run dev
```

**Deberías ver:**
```
▲ Next.js 15.5.7
- Local:        http://localhost:3000
- Ready in Xs
```

✅ **Deja esta terminal también abierta**.

---

## ✅ Verificación

Una vez que ambos servidores estén corriendo:

1. **Verifica FastAPI:**
   - Abre: http://localhost:8000/health
   - Debe mostrar: `{"status": "ok", "message": "Study Agents API is running"}`

2. **Verifica Next.js:**
   - Abre: http://localhost:3000
   - Deberías ver tu portfolio

3. **Accede a Study Agents:**
   - Ve a: http://localhost:3000/study-agents
   - Serás redirigido al login de Google
   - Inicia sesión y podrás usar Study Agents

---

## 🔧 Si hay Problemas

### FastAPI no inicia

**Error: "ModuleNotFoundError"**
```bash
cd study_agents
pip install -r requirements.txt
```

**Error: "Puerto 8000 ocupado"**
- Cierra otros programas que usen el puerto 8000
- O cambia el puerto en `study_agents/api/main.py`

### Next.js no inicia

**Error: "Puerto 3000 ocupado"**
```bash
# Usa otro puerto
npm run dev -- -p 3001
```

**Error: "next-auth no encontrado"**
```bash
npm install
```

---

## 📝 Resumen Rápido

**Terminal 1 (FastAPI):**
```bash
cd study_agents
python api/main.py
```

**Terminal 2 (Next.js):**
```bash
npm run dev
```

**Luego abre:** http://localhost:3000/study-agents

---

## 🛑 Para Detener los Servidores

- En cada terminal, presiona `Ctrl+C`
- O simplemente cierra las ventanas de terminal

---

¡Listo! Con ambos servidores corriendo, ya puedes usar Study Agents completamente. 🎉

