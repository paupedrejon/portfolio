#!/bin/bash

echo "========================================"
echo "  INSTALANDO DEPENDENCIAS - STUDY AGENTS"
echo "========================================"
echo ""

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 no encontrado. Por favor instala Python 3.8 o superior."
    exit 1
fi

echo "Python encontrado:"
python3 --version
echo ""

# Actualizar pip
echo "Actualizando pip..."
python3 -m pip install --upgrade pip

echo ""
echo "Instalando dependencias..."
python3 -m pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Hubo problemas al instalar las dependencias."
    echo "Intenta ejecutar: pip3 install --user -r requirements.txt"
    exit 1
fi

echo ""
echo "========================================"
echo "  INSTALACION COMPLETADA"
echo "========================================"
echo ""
echo "Proximos pasos:"
echo "1. Configura tu API key en .env"
echo "2. Ejecuta: python3 main.py"
echo ""

