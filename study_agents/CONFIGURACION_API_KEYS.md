# 🔐 Configuración de API Keys - Study Agents

## 📋 Descripción

El sistema Study Agents requiere que cada usuario configure sus propias API keys para servicios que cobran por tokens. Esto permite:

- ✅ **Control de costos**: Cada usuario paga solo por lo que usa
- ✅ **Seguridad**: Las keys nunca se almacenan en el servidor
- ✅ **Flexibilidad**: Cada usuario puede usar su propio servicio
- ✅ **Privacidad**: Las keys se guardan solo en el navegador del usuario

---

## 🎯 Servicios que Requieren API Keys

### 1. OpenAI (Requerido)

**Servicio**: ChatGPT API (GPT-4, GPT-3.5-turbo)

**Uso en el sistema**:
- Respuestas a preguntas del usuario
- Generación de apuntes
- Creación de tests
- Corrección y feedback

**Costos aproximados**:
- **GPT-4**: 
  - Input: ~$0.03 por 1,000 tokens
  - Output: ~$0.06 por 1,000 tokens
- **GPT-3.5-turbo** (más barato):
  - Input: ~$0.0015 por 1,000 tokens
  - Output: ~$0.002 por 1,000 tokens

**Ejemplo de uso**:
- Una pregunta simple: 500-1,500 tokens (~$0.02-0.09 con GPT-4)
- Generar apuntes de un documento: 5,000-15,000 tokens (~$0.15-0.90 con GPT-4)
- Generar un test: 2,000-5,000 tokens (~$0.06-0.30 con GPT-4)

**Dónde obtener la key**:
1. Ve a: https://platform.openai.com/api-keys
2. Inicia sesión o crea una cuenta
3. Haz clic en "Create new secret key"
4. Cópiala (solo se muestra una vez)
5. Formato: `sk-proj-...` o `sk-...`

---

## 🚀 Cómo Configurar las API Keys

### Paso 1: Acceder a la Configuración

1. Abre la página `/study-agents`
2. En la parte inferior del chat, verás un botón que dice:
   - **"Configurar API"** (si no está configurada) - Botón amarillo
   - **"API Configurada"** (si ya está configurada) - Botón verde

3. Haz clic en el botón para abrir el modal de configuración

### Paso 2: Ingresar tu API Key de OpenAI

1. En el modal, verás un campo para "OpenAI API Key"
2. Pega tu API key (debe empezar con `sk-`)
3. Haz clic en el ícono del ojo para mostrar/ocultar la key

### Paso 3: Guardar

1. Haz clic en "Guardar y Continuar"
2. La key se guardará en el navegador (localStorage)
3. El modal se cerrará automáticamente
4. Ya puedes usar el sistema

---

## 🔒 Seguridad

### ¿Dónde se guardan las keys?

- **Ubicación**: Solo en el navegador del usuario (localStorage)
- **Servidor**: Las keys **NUNCA** se envían al servidor a menos que sea necesario para la API
- **Transmisión**: Se envían solo cuando haces una petición a la API de OpenAI

### ¿Son seguras?

✅ **Sí**, porque:
- Se almacenan solo en tu navegador
- No se comparten con otros usuarios
- Se pueden eliminar en cualquier momento
- No se almacenan en bases de datos externas

⚠️ **Importante**:
- No compartas tus API keys con nadie
- Si usas una computadora compartida, borra las keys al terminar
- Revisa regularmente tu uso en https://platform.openai.com/usage

---

## 💰 Control de Costos

### Recomendaciones

1. **Empieza con GPT-3.5-turbo**: Es mucho más barato y suficiente para la mayoría de casos
2. **Configura límites**: En OpenAI puedes configurar límites de gasto mensual
3. **Monitorea tu uso**: Revisa tu dashboard en OpenAI regularmente
4. **Usa el sistema responsablemente**: No generes tests o apuntes innecesariamente

### Configurar Límites en OpenAI

1. Ve a: https://platform.openai.com/account/billing/limits
2. Configura un límite mensual (ej: $10, $20, $50)
3. Recibirás notificaciones cuando te acerques al límite

---

## 🔄 Cambiar o Actualizar API Keys

### Para cambiar tu API key:

1. Haz clic en el botón "API Configurada" (o "Configurar API")
2. Cambia la key en el campo correspondiente
3. Haz clic en "Guardar y Continuar"

### Para eliminar las keys:

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña "Application" (o "Aplicación")
3. Busca "Local Storage" en el menú lateral
4. Encuentra la entrada `study_agents_api_keys`
5. Elimínala o bórrala

O simplemente reemplázala con una key vacía.

---

## ❓ Preguntas Frecuentes

### ¿Por qué necesito mi propia API key?

Para que el sistema funcione, necesita acceder a la API de OpenAI. Como esto tiene costos, cada usuario debe usar su propia key para tener control sobre sus gastos.

### ¿Puedo usar el sistema sin configurar una key?

No, la key de OpenAI es **requerida** para que el sistema funcione. Sin ella, no se pueden generar respuestas, apuntes ni tests.

### ¿Cuánto me va a costar?

Depende de tu uso:
- **Uso ligero** (pocas preguntas): ~$1-5 al mes
- **Uso moderado** (varios documentos): ~$10-30 al mes
- **Uso intensivo**: Puede llegar a $50+ al mes

**Consejo**: Empieza con GPT-3.5-turbo que es 20 veces más barato.

### ¿Qué pasa si mi key se queda sin crédito?

Recibirás un error al intentar usar el sistema. Solo necesitas:
1. Añadir crédito a tu cuenta de OpenAI
2. O configurar una nueva key con crédito

### ¿Puedo usar otras APIs además de OpenAI?

Actualmente solo se requiere OpenAI. En el futuro se podrían añadir:
- Anthropic (Claude)
- Google (Gemini)
- Otros servicios

---

## 🛠️ Solución de Problemas

### Error: "API key inválida"

- Verifica que la key empiece con `sk-`
- Asegúrate de que no tenga espacios antes o después
- Prueba generando una nueva key en OpenAI

### Error: "Insufficient quota"

- Tu cuenta de OpenAI no tiene crédito suficiente
- Ve a https://platform.openai.com/account/billing
- Añade crédito a tu cuenta

### El botón de configuración no aparece

- Recarga la página
- Limpia la caché del navegador
- Verifica que estés en `/study-agents`

### Las keys no se guardan

- Verifica que las cookies/localStorage estén habilitadas
- Prueba en otro navegador
- Verifica que no estés en modo incógnito (algunos navegadores bloquean localStorage)

---

## 📝 Notas Técnicas

### Almacenamiento

```javascript
// Las keys se guardan así:
localStorage.setItem("study_agents_api_keys", JSON.stringify({
  openai: "sk-tu-key-aqui"
}));
```

### Uso en las peticiones

Cuando haces una petición (pregunta, generar apuntes, etc.), la key se envía en el body de la petición:

```json
{
  "apiKey": "sk-tu-key-aqui",
  "question": "¿Qué es la IA?",
  ...
}
```

---

## ✅ Checklist de Configuración

- [ ] Tengo una cuenta en OpenAI
- [ ] He generado una API key
- [ ] He copiado la key (empieza con `sk-`)
- [ ] He abierto `/study-agents`
- [ ] He configurado la key en el modal
- [ ] El botón muestra "API Configurada"
- [ ] Puedo hacer preguntas sin errores

---

¡Listo! Ya puedes usar Study Agents con tus propias API keys. 🎉

