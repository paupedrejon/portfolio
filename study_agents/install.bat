@echo off
echo ========================================
echo   INSTALANDO DEPENDENCIAS - STUDY AGENTS
echo ========================================
echo.

REM Verificar Python
python --version
if errorlevel 1 (
    echo ERROR: Python no encontrado. Por favor instala Python 3.8 o superior.
    pause
    exit /b 1
)

echo.
echo Actualizando pip...
python -m pip install --upgrade pip

echo.
echo Instalando dependencias...
pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERROR: Hubo problemas al instalar las dependencias.
    echo Intenta ejecutar: pip install --user -r requirements.txt
    pause
    exit /b 1
)

echo.
echo ========================================
echo   INSTALACION COMPLETADA
echo ========================================
echo.
echo Proximos pasos:
echo 1. Configura tu API key en .env
echo 2. Ejecuta: python main.py
echo.
pause

