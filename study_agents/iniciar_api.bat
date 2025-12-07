@echo off
echo ========================================
echo Iniciando Study Agents FastAPI Backend
echo ========================================
echo.

cd /d %~dp0

echo Verificando Python...
python --version
echo.

echo Verificando dependencias...
python -c "import fastapi; print('FastAPI: OK')" 2>nul || (
    echo FastAPI no encontrado. Instalando dependencias...
    pip install -r requirements.txt
)

echo.
echo ========================================
echo Iniciando servidor en http://localhost:8000
echo ========================================
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

python api/main.py

pause

