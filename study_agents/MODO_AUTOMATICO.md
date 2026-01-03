# 🔧 Modo Automático - Optimización de Costes

## 📋 Descripción

El sistema Study Agents ahora incluye un **modo automático** que optimiza los costes seleccionando automáticamente el modelo más barato disponible. El sistema prioriza modelos **gratis** sobre modelos **baratos**, y solo usa modelos **caros** cuando es necesario.

## 🎯 Prioridad de Modelos

El sistema intenta usar modelos en este orden:

### 1. **Modelos GRATIS (Ollama - Local)**
- ✅ **llama3.1** - Alta calidad, 128k tokens de contexto
- ✅ **llama3.2** - Buena calidad, 8k tokens de contexto
- ✅ **mistral** - Buena calidad, 8k tokens de contexto
- ✅ **phi3** - Calidad básica, 4k tokens de contexto

**Costo:** $0.00 (completamente gratis)

### 2. **Modelos BARATOS (OpenAI)**
- ✅ **gpt-4o-mini** - $0.00015/$0.0006 por 1k tokens (input/output)
- ✅ **gpt-3.5-turbo** - $0.0005/$0.0015 por 1k tokens (input/output)

### 3. **Modelos CAROS (OpenAI) - Solo cuando es necesario**
- ⚠️ **gpt-4-turbo** - $0.01/$0.03 por 1k tokens
- ⚠️ **gpt-4o** - $0.005/$0.015 por 1k tokens
- ⚠️ **gpt-4** - $0.03/$0.06 por 1k tokens

## 🚀 Cómo Funciona

### Modo Automático (Por Defecto)

El sistema **automáticamente**:
1. Verifica si Ollama está instalado y disponible
2. Si Ollama está disponible → Usa modelos gratis (llama3.1, llama3.2, etc.)
3. Si Ollama NO está disponible → Usa el modelo más barato de OpenAI (gpt-3.5-turbo o gpt-4o-mini)
4. Solo usa modelos caros si el usuario los especifica explícitamente

### Ejemplo de Ahorro

**Antes (sin modo automático):**
- Cada pregunta: ~$0.02-0.09 (usando GPT-4)
- Generar apuntes: ~$0.15-0.90 (usando GPT-4)
- Generar test: ~$0.06-0.30 (usando GPT-4)

**Ahora (con modo automático):**
- Cada pregunta: **$0.00** (usando Ollama) o **$0.0001-0.0003** (usando gpt-3.5-turbo)
- Generar apuntes: **$0.00** (usando Ollama) o **$0.002-0.005** (usando gpt-3.5-turbo)
- Generar test: **$0.00** (usando Ollama) o **$0.001-0.003** (usando gpt-3.5-turbo)

**Ahorro estimado: 95-99% en costes** 🎉

## 📦 Instalación de Ollama (Gratis)

Para usar modelos completamente gratis, instala Ollama:

### Windows
1. Descarga desde: https://ollama.com/download
2. Instala el ejecutable
3. Abre una terminal y ejecuta:
   ```bash
   ollama pull llama3.1
   ```
   O para un modelo más pequeño:
   ```bash
   ollama pull llama3.2
   ```

### macOS
```bash
brew install ollama
ollama pull llama3.1
```

### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1
```

### Verificar Instalación

Después de instalar, verifica que Ollama esté corriendo:
```bash
ollama list
```

Deberías ver los modelos instalados. El sistema Study Agents detectará automáticamente Ollama y lo usará.

## ⚙️ Configuración

### Modo Automático (Recomendado)

El modo automático está **activado por defecto**. No necesitas hacer nada especial. El sistema:
- Detecta automáticamente Ollama si está instalado
- Usa modelos gratis cuando están disponibles
- Usa modelos baratos cuando Ollama no está disponible
- Optimiza costes en cada operación

### Especificar un Modelo Específico

Si quieres usar un modelo específico (por ejemplo, GPT-4 para tareas complejas), puedes especificarlo en las llamadas a la API:

```python
# Usar GPT-4 específicamente
answer, usage = system.ask_question("¿Qué es X?", model="gpt-4")
```

Pero recuerda: esto aumentará los costes significativamente.

## 📊 Comparación de Costes

| Operación | Sin Modo Automático (GPT-4) | Con Modo Automático (Ollama) | Con Modo Automático (GPT-3.5) |
|-----------|------------------------------|-------------------------------|-------------------------------|
| Pregunta simple | ~$0.02-0.09 | **$0.00** | ~$0.0001-0.0003 |
| Generar apuntes | ~$0.15-0.90 | **$0.00** | ~$0.002-0.005 |
| Generar test | ~$0.06-0.30 | **$0.00** | ~$0.001-0.003 |
| Corregir test | ~$0.04-0.15 | **$0.00** | ~$0.0005-0.002 |

## 🔍 Verificación

El sistema mostrará en los logs qué modelo está usando:

```
✅ Usando modelo: llama3.1 (costo: $0.0000/$0.0000 por 1k tokens)
```

O si usa OpenAI:
```
✅ Usando modelo: gpt-3.5-turbo (costo: $0.0005/$0.0015 por 1k tokens)
```

## 💡 Recomendaciones

1. **Instala Ollama** para usar modelos completamente gratis
2. **Deja el modo automático activado** para optimizar costes
3. **Solo especifica modelos caros** cuando realmente necesites la máxima calidad
4. **Monitorea los logs** para ver qué modelo se está usando

## 🐛 Solución de Problemas

### Ollama no se detecta

1. Verifica que Ollama esté corriendo:
   ```bash
   ollama list
   ```

2. Verifica que el puerto 11434 esté disponible:
   ```bash
   curl http://localhost:11434/api/tags
   ```

3. Reinicia Ollama si es necesario:
   ```bash
   # Windows: Reinicia el servicio Ollama
   # macOS/Linux:
   ollama serve
   ```

### El sistema usa OpenAI en lugar de Ollama

- Verifica que Ollama esté instalado y corriendo
- Verifica que tengas al menos un modelo descargado (`ollama list`)
- El sistema usará OpenAI como fallback si Ollama no está disponible

## 📝 Notas

- El modo automático está activado por defecto
- Los modelos de Ollama son locales y no requieren API key
- Los modelos de OpenAI requieren API key pero son más baratos que antes
- El sistema siempre intenta usar el modelo más barato disponible

