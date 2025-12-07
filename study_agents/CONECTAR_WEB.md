# 🌐 Cómo Conectar Study Agents a la Web

## ✅ Estado Actual

Todas las rutas API de Next.js están creadas y listas para conectar con el backend FastAPI.

---

## 🚀 Pasos para Hacer Funcionar en la Web

### 1. Iniciar el Backend FastAPI

En una terminal, desde la carpeta `study_agents`:

```bash
cd study_agents
python api/main.py
```

O usando uvicorn directamente:

```bash
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

Deberías ver:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Iniciar Next.js (en otra terminal)

Desde la raíz del proyecto:

```bash
npm run dev
```

O:

```bash
yarn dev
```

Deberías ver:
```
✓ Ready in [time]
○ Local:        http://localhost:3000
```

### 3. Acceder a Study Agents

Abre tu navegador en:
```
http://localhost:3000/study-agents
```

---

## 📋 Rutas API Creadas

### Frontend (Next.js) → Backend (FastAPI)

| Ruta Next.js | Endpoint FastAPI | Función |
|--------------|------------------|---------|
| `/api/study-agents/upload` | `/api/upload-documents` | Subir y procesar PDFs |
| `/api/study-agents/generate-notes` | `/api/generate-notes` | Generar apuntes |
| `/api/study-agents/generate-test` | `/api/generate-test` | Generar tests |
| `/api/study-agents/ask` | `/api/ask-question` | Hacer preguntas |
| `/api/study-agents/grade-test` | `/api/grade-test` | Corregir tests |

---

## ⚙️ Configuración

### Variable de Entorno (Opcional)

Si FastAPI está en un puerto diferente o URL diferente, puedes configurarlo en `.env.local`:

```env
FASTAPI_URL=http://localhost:8000
```

Por defecto, las rutas API buscan FastAPI en `http://localhost:8000`.

---

## 🔧 Estructura

```
portfolio/
├── app/
│   ├── api/
│   │   └── study-agents/
│   │       ├── upload/route.ts          ✅ Proxy a FastAPI
│   │       ├── generate-notes/route.ts  ✅ Proxy a FastAPI
│   │       ├── generate-test/route.ts   ✅ Proxy a FastAPI
│   │       ├── ask/route.ts             ✅ Proxy a FastAPI
│   │       └── grade-test/route.ts      ✅ Proxy a FastAPI
│   └── study-agents/
│       └── page.tsx                     ✅ Página principal
├── components/
│   ├── StudyChat.tsx                    ✅ Componente chat
│   └── APIKeyConfig.tsx                 ✅ Configuración API keys
└── study_agents/
    └── api/
        └── main.py                      ✅ Backend FastAPI
```

---

## 🎯 Flujo de Trabajo

1. **Usuario sube PDF** → Next.js API route → FastAPI → Python procesa
2. **Usuario genera apuntes** → Next.js API route → FastAPI → ExplanationAgent
3. **Usuario hace pregunta** → Next.js API route → FastAPI → QAAssistantAgent
4. **Usuario genera test** → Next.js API route → FastAPI → TestGeneratorAgent
5. **Usuario corrige test** → Next.js API route → FastAPI → FeedbackAgent

---

## ✅ Verificación

1. **Backend funcionando**: http://localhost:8000/health
   - Debería retornar: `{"status": "ok", "message": "Study Agents API is running"}`

2. **Frontend funcionando**: http://localhost:3000/study-agents
   - Debería mostrar la interfaz de chat

3. **Configurar API key**: 
   - Al cargar la página, se mostrará un modal para configurar la API key de OpenAI
   - Introduce tu API key que empiece con `sk-`

---

## 🐛 Troubleshooting

### Error: "Cannot connect to FastAPI"

**Solución**: Asegúrate de que FastAPI esté corriendo en el puerto 8000:
```bash
python api/main.py
```

### Error: "API key requerida"

**Solución**: Configura tu API key en el modal que aparece al cargar la página.

### Error: CORS

**Solución**: FastAPI ya tiene CORS configurado para permitir requests desde cualquier origen. Si hay problemas, verifica que el backend esté corriendo.

---

## 🎉 ¡Listo!

Una vez que ambos servidores estén corriendo:
- ✅ Backend FastAPI en `http://localhost:8000`
- ✅ Frontend Next.js en `http://localhost:3000`

¡El sistema debería funcionar completamente desde la web! 🚀

