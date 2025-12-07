#!/bin/bash
# Script para iniciar la API de Study Agents

echo "🚀 Iniciando Study Agents API..."
echo ""

# Verificar que existe .env
if [ ! -f .env ]; then
    echo "⚠️  Archivo .env no encontrado"
    echo "📝 Creando .env.example..."
    echo "Por favor, crea un archivo .env con tu OPENAI_API_KEY"
    exit 1
fi

# Verificar que existe la API key
if ! grep -q "OPENAI_API_KEY" .env; then
    echo "⚠️  OPENAI_API_KEY no encontrada en .env"
    echo "Por favor, añade: OPENAI_API_KEY=tu_key_aqui"
    exit 1
fi

# Crear directorio de documentos si no existe
mkdir -p documents

# Iniciar la API
echo "✅ Iniciando servidor en http://localhost:8000"
echo "📖 Abre tu navegador en: http://localhost:8000"
echo ""
python api/main.py

