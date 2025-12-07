# 📋 Instrucciones Rápidas - Study Agents

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
cd study_agents
pip install -r requirements.txt
```

### 2. Configurar API Key

Crea un archivo `.env` en la carpeta `study_agents`:

```env
OPENAI_API_KEY=tu_api_key_aqui
```

**¿Dónde conseguir la API key?**
- Ve a https://platform.openai.com/api-keys
- Crea una cuenta o inicia sesión
- Genera una nueva API key
- Cópiala al archivo `.env`

### 3. Iniciar la API

**Windows:**
```bash
start_api.bat
```

**Linux/Mac:**
```bash
chmod +x start_api.sh
./start_api.sh
```

**O manualmente:**
```bash
python api/main.py
```

### 4. Abrir en el Navegador

Abre tu navegador y ve a:
```
http://localhost:8000
```

---

## 📖 Cómo Usar la Interfaz Web

### Paso 1: Subir Documentos
1. Arrastra archivos PDF a la zona de carga
2. O haz clic para seleccionar archivos
3. Haz clic en "Procesar Documentos"
4. Espera a que se procesen (puede tardar unos segundos)

### Paso 2: Generar Explicaciones
1. Haz clic en "Generar Explicaciones"
2. El sistema creará explicaciones claras del contenido

### Paso 3: Hacer Preguntas
1. Escribe tu pregunta en el cuadro de texto
2. Haz clic en "Enviar Pregunta"
3. Recibirás una respuesta basada en los documentos

### Paso 4: Generar Test
1. Selecciona la dificultad (Fácil/Medio/Difícil)
2. Elige el número de preguntas
3. Haz clic en "Generar Test"
4. Responde las preguntas
5. Haz clic en "Enviar Test"

### Paso 5: Ver Resultados
- Verás tu puntuación
- Feedback por cada pregunta
- Recomendaciones para mejorar

---

## 🐍 Usar desde Python

```python
from main import StudyAgentsSystem

# Inicializar
system = StudyAgentsSystem()

# Subir documentos
system.upload_documents(["documents/temario.pdf"])

# Hacer pregunta
answer = system.ask_question("¿Qué es la IA?")
print(answer)

# Generar test
test = system.generate_test(difficulty="medium", num_questions=5)

# Corregir test
feedback = system.grade_test(
    test_id=test["test_id"],
    answers={"q1": "A", "q2": "True"}
)
```

---

## ❓ Solución de Problemas

### Error: "OPENAI_API_KEY not found"
- Verifica que el archivo `.env` existe
- Verifica que tiene la línea: `OPENAI_API_KEY=tu_key`

### Error: "No module named 'fastapi'"
- Ejecuta: `pip install -r requirements.txt`

### Error: "Port 8000 already in use"
- Cierra otras aplicaciones usando el puerto 8000
- O cambia el puerto en `api/main.py`

### Los documentos no se procesan
- Verifica que son archivos PDF válidos
- Verifica que tienes espacio en disco
- Revisa la consola para ver errores

---

## 📚 Más Información

- **Guía Completa:** Lee `GUIA_AGENTES.md` para entender cómo funcionan los agentes
- **Documentación API:** La API está en `api/main.py`
- **Código de Agentes:** En la carpeta `agents/`

---

## 🎯 Próximos Pasos

1. ✅ Sube tus primeros documentos
2. ✅ Prueba hacer preguntas
3. ✅ Genera un test
4. ✅ Lee `GUIA_AGENTES.md` para entender mejor
5. ✅ Experimenta modificando el código

¡Disfruta aprendiendo con Study Agents! 🎓

