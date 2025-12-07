# 🚀 Inicio Rápido - Study Agents en la Web

## ⚡ Inicio en 3 Pasos

### 1. Iniciar Backend FastAPI

```bash
cd study_agents
python api/main.py
```

**Espera a ver**: `Uvicorn running on http://0.0.0.0:8000`

---

### 2. Iniciar Frontend Next.js (nueva terminal)

```bash
npm run dev
```

**Espera a ver**: `Ready on http://localhost:3000`

---

### 3. Abrir en el Navegador

```
http://localhost:3000/study-agents
```

---

## ✅ Verificación Rápida

1. **Backend OK**: http://localhost:8000/health
   - Debe mostrar: `{"status": "ok"}`

2. **Frontend OK**: http://localhost:3000/study-agents
   - Debe mostrar la interfaz de chat

3. **Configurar API Key**:
   - El modal aparecerá automáticamente
   - Introduce tu OpenAI API key (empieza con `sk-`)

---

## 🎯 Primeros Pasos

1. **Subir un PDF** → Click en "Subir PDF"
2. **Generar apuntes** → Click en "Generar apuntes"
3. **Hacer pregunta** → Escribe en el chat y envía
4. **Generar test** → Click en "Generar test"

---

## 📝 Notas

- ✅ Todas las rutas API están creadas
- ✅ El frontend está conectado
- ✅ Solo necesitas iniciar ambos servidores
- ✅ La API key se guarda en localStorage

---

¡Ya está todo listo para usar! 🎉

