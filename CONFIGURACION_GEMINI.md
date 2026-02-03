# Configuración de Google Gemini API

## Configurar la API Key

Para usar la generación de resúmenes con Gemini, necesitas configurar tu API key de Google.

### Opción 1: Variable de entorno (Recomendado)

1. Crea o edita el archivo `.env.local` en la **raíz del proyecto** (mismo nivel que `package.json`)

2. Agrega la siguiente línea:

```env
GEMINI_API_KEY=tu-api-key-de-google-gemini-aqui
```

3. Obtén tu API key en: https://aistudio.google.com/app/apikey

### Opción 2: Enviar en el request

También puedes enviar la API key directamente en el request al crear el curso:

```json
{
  "generate_summaries": true,
  "gemini_api_key": "tu-api-key-aqui",
  "gemini_model": "gemini-3-pro",
  ...
}
```

**Nota**: Si proporcionas la API key en el request, tiene prioridad sobre la variable de entorno.

## Modelos Disponibles

- `gemini-3-pro`: Mejor calidad para apuntes detallados (recomendado)
- `gemini-3-flash`: Más rápido y económico
- `gemini-2.5-pro`: Versión anterior
- `gemini-2.5-flash`: Versión anterior más económica
- `gemini-2.5-flash-lite`: Versión más ligera

## Verificación

El sistema verificará automáticamente:
1. Si hay API key en el request
2. Si no, busca `GEMINI_API_KEY` en las variables de entorno
3. Si no encuentra ninguna, devuelve un error

## Estructura del archivo .env.local

```env
# API Keys
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=tu-api-key-de-google-gemini

# Otras variables opcionales
UNSPLASH_API_KEY=...
YOUTUBE_API_KEY=...
```

## Notas Importantes

- El archivo `.env.local` está en `.gitignore` y no se sube al repositorio
- La API key se usa solo para generar resúmenes cuando se crea un curso
- Los costos se deducen del wallet del creador del curso
- Los resúmenes se generan en background (asíncrono)

