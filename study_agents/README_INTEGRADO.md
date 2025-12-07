# 🎓 Study Agents - Integrado en Next.js

## ✅ Lo que se ha creado

He integrado todo el sistema Study Agents directamente en tu portfolio Next.js en la ruta `/study-agents`. 

### Características implementadas:

1. **Interfaz de Chat Moderna** ✨
   - Diseño tipo ChatGPT integrado en tu portfolio
   - Mensajes con formato bonito
   - Indicadores de carga
   - Scroll automático

2. **Subida de Documentos** 📄
   - Drag & drop o selección de archivos
   - Soporte para múltiples PDFs
   - Feedback visual del progreso

3. **Generación de Apuntes** 📝
   - Comando: "genera apuntes" o "crea apuntes"
   - Formato markdown bonito
   - Estructura clara y organizada

4. **Sistema de Preguntas y Respuestas** ❓
   - Chat interactivo
   - Respuestas contextualizadas
   - Historial de conversación

5. **Tests Interactivos** 📋
   - Comando: "genera test"
   - Diferentes niveles de dificultad
   - Preguntas de opción múltiple, verdadero/falso
   - Interfaz bonita para responder

6. **Corrección Automática** ✏️
   - Feedback detallado
   - Puntuación y estadísticas
   - Recomendaciones personalizadas

---

## 🚀 Cómo usar

### Opción 1: Usar la interfaz web (Recomendado)

1. **Abre tu portfolio en desarrollo:**
   ```bash
   npm run dev
   ```

2. **Ve a la página:**
   ```
   http://localhost:3000/study-agents
   ```

3. **Empieza a usar:**
   - Sube documentos PDF
   - Di "genera apuntes" para crear apuntes
   - Haz preguntas sobre el contenido
   - Di "genera test" para crear un examen

### Opción 2: Conectar con los agentes de Python

Para conectar la interfaz Next.js con los agentes de Python que creamos, necesitas:

1. **Iniciar el servidor Python:**
   ```bash
   cd study_agents
   python api/main.py
   ```

2. **Modificar las funciones en `components/StudyChat.tsx`** para que llamen a:
   ```
   http://localhost:8000/api/...
   ```

---

## 📁 Estructura de Archivos

```
portfolio/
├── app/
│   ├── study-agents/
│   │   └── page.tsx          # Página principal
│   └── api/
│       └── study-agents/
│           └── upload/
│               └── route.ts  # API para subir archivos
├── components/
│   └── StudyChat.tsx         # Componente de chat principal
└── study_agents/             # Sistema Python (opcional)
    └── ...
```

---

## 🎨 Personalización

### Cambiar colores

Los colores están definidos en `components/StudyChat.tsx`. Puedes modificarlos para que coincidan con tu tema.

### Añadir más comandos

En `StudyChat.tsx`, en la función `handleSend()`, puedes añadir más comandos:

```typescript
if (lowerInput.includes("tu comando")) {
  await tuFuncion();
}
```

### Conectar con APIs reales

Reemplaza las funciones simuladas (`setTimeout`) con llamadas reales a tus APIs:

```typescript
const response = await fetch('/api/study-agents/ask', {
  method: 'POST',
  body: JSON.stringify({ question: userMessage })
});
```

---

## 🔌 Integración con Agentes Python

Para conectar completamente con los agentes de Python:

1. **Modifica `components/StudyChat.tsx`:**

```typescript
const askQuestion = async (question: string) => {
  const response = await fetch('http://localhost:8000/api/ask-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  
  const data = await response.json();
  addMessage({
    role: "assistant",
    content: data.answer,
    type: "message",
  });
};
```

2. **Haz lo mismo para:**
   - `generateNotes()` → `/api/generate-explanations`
   - `generateTest()` → `/api/generate-test`
   - `handleTestSubmit()` → `/api/grade-test`

---

## 📝 Próximos Pasos

1. ✅ **Interfaz creada** - Ya tienes la UI completa
2. 🔄 **Conectar APIs** - Enlazar con los agentes de Python
3. 🎨 **Mejorar diseño** - Ajustar colores y estilos
4. 📱 **Responsive** - Asegurar que funcione en móvil
5. 🔐 **Autenticación** - Añadir login si es necesario

---

## 💡 Comandos Disponibles

- **"genera apuntes"** o **"crea apuntes"** → Genera apuntes del contenido
- **"genera test"** → Crea un test
- **"genera test fácil"** → Test de nivel fácil
- **"genera test difícil"** → Test de nivel difícil
- Cualquier otra pregunta → Responde usando el contenido

---

## 🐛 Solución de Problemas

### Los archivos no se suben
- Verifica que la carpeta `uploads/study-agents/` existe
- Revisa los permisos de escritura

### Las respuestas no aparecen
- Verifica la consola del navegador (F12)
- Revisa que las funciones estén correctamente implementadas

### El diseño se ve mal
- Verifica que los estilos CSS estén cargados
- Asegúrate de que las fuentes estén importadas

---

¡Disfruta usando Study Agents integrado en tu portfolio! 🎓✨

