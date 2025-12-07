@echo off
REM Script para iniciar la API de Study Agents en Windows

echo 🚀 Iniciando Study Agents API...
echo.

REM Verificar que existe .env
if not exist .env (
    echo ⚠️  Archivo .env no encontrado
    echo 📝 Por favor, crea un archivo .env con tu OPENAI_API_KEY
    pause
    exit /b 1
)

REM Crear directorio de documentos si no existe
if not exist documents mkdir documents

REM Iniciar la API
echo ✅ Iniciando servidor en http://localhost:8000
echo 📖 Abre tu navegador en: http://localhost:8000
echo.
python api/main.py

pause

