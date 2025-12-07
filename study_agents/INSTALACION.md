# 📦 Guía de Instalación - Study Agents

## Requisitos Previos

- Python 3.8 o superior
- pip (gestor de paquetes de Python)
- API key de OpenAI

---

## 🚀 Instalación Rápida

### Paso 1: Verificar Python

```bash
python --version
# Debe mostrar Python 3.8 o superior
```

### Paso 2: Instalar Dependencias

```bash
cd study_agents
pip install -r requirements.txt
```

Si tienes problemas, prueba con:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Paso 3: Configurar API Key

Crea un archivo `.env` en la carpeta `study_agents`:

```env
OPENAI_API_KEY=sk-tu-api-key-aqui
```

**O** configura la variable de entorno:

**Windows (PowerShell)**:
```powershell
$env:OPENAI_API_KEY="sk-tu-api-key-aqui"
```

**Windows (CMD)**:
```cmd
set OPENAI_API_KEY=sk-tu-api-key-aqui
```

**Linux/Mac**:
```bash
export OPENAI_API_KEY="sk-tu-api-key-aqui"
```

---

## 🔧 Instalación Detallada

### Opción 1: Instalación Global

```bash
pip install langchain langchain-openai langchain-community chromadb pypdf python-dotenv openai tiktoken faiss-cpu fastapi uvicorn python-multipart aiofiles
```

### Opción 2: Entorno Virtual (Recomendado)

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

---

## 📋 Dependencias Principales

| Paquete | Versión | Descripción |
|---------|---------|-------------|
| langchain | 0.1.0 | Framework para agentes de IA |
| langchain-openai | 0.0.5 | Integración con OpenAI |
| chromadb | 0.4.22 | Base de datos vectorial para RAG |
| fastapi | 0.109.0 | Framework para API REST |
| uvicorn | 0.27.0 | Servidor ASGI |
| python-dotenv | 1.0.0 | Gestión de variables de entorno |

---

## ✅ Verificar Instalación

### Probar Importaciones

Crea un archivo `test_imports.py`:

```python
try:
    from dotenv import load_dotenv
    from fastapi import FastAPI
    from langchain_openai import ChatOpenAI
    from langchain_community.document_loaders import PyPDFLoader
    import chromadb
    print("✅ Todas las dependencias están instaladas correctamente")
except ImportError as e:
    print(f"❌ Error: {e}")
```

Ejecuta:
```bash
python test_imports.py
```

---

## 🐛 Solución de Problemas

### Error: "No module named 'dotenv'"

```bash
pip install python-dotenv
```

### Error: "No module named 'fastapi'"

```bash
pip install fastapi uvicorn
```

### Error: "No module named 'langchain'"

```bash
pip install langchain langchain-openai langchain-community
```

### Error: "No module named 'chromadb'"

```bash
pip install chromadb
```

### Error: "Microsoft Visual C++ 14.0 is required"

En Windows, necesitas instalar Visual C++ Build Tools:
- Descarga desde: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- O instala: `pip install --only-binary :all: chromadb`

### Error: Permisos Denegados

Usa `--user`:
```bash
pip install --user -r requirements.txt
```

O activa como administrador:
```bash
# Windows (PowerShell como administrador)
pip install -r requirements.txt
```

---

## 🎯 Próximos Pasos

1. **Instalar dependencias**: `pip install -r requirements.txt`
2. **Configurar API key**: Crear archivo `.env`
3. **Probar el sistema**: `python main.py`
4. **Iniciar API**: `python api/main.py`

---

## 📝 Notas Importantes

- Asegúrate de tener Python 3.8 o superior
- En Windows, puede ser necesario instalar Visual C++ Build Tools
- Algunas dependencias pueden tardar en instalar (especialmente ChromaDB)
- Usa un entorno virtual para evitar conflictos

---

¿Problemas? Revisa los errores específicos y usa las soluciones arriba.

