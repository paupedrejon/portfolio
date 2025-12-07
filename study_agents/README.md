# Study Agents - Sistema Multi-Agente para Autoaprendizaje

## Descripción

Sistema de agentes de IA que trabajan en conjunto para acompañar a un estudiante en su proceso de autoaprendizaje de cualquier tema.

## Arquitectura

El sistema está compuesto por 5 agentes especializados:

1. **Content Processor Agent**: Procesa documentos usando RAG
2. **Explanation Agent**: Transforma información en explicaciones claras
3. **Q&A Assistant Agent**: Responde preguntas del estudiante
4. **Test Generator Agent**: Genera tests personalizados
5. **Feedback Agent**: Corrige y proporciona feedback detallado

## Instalación

```bash
pip install -r requirements.txt
```

## Uso

```bash
python main.py
```

## Flujo de Trabajo

1. El usuario sube documentos del temario
2. Content Processor procesa los documentos con RAG
3. Explanation Agent genera explicaciones claras
4. Usuario puede hacer preguntas → Q&A Assistant responde
5. Usuario solicita test → Test Generator crea evaluación
6. Feedback Agent corrige y proporciona retroalimentación

