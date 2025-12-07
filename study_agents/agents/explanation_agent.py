"""
Explanation Agent - Transforma información en explicaciones claras y resumidas
Genera apuntes estructurados del contenido procesado
"""

from typing import List, Dict, Optional
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from memory.memory_manager import MemoryManager
import os
import tiktoken

class ExplanationAgent:
    """
    Agente especializado en generar explicaciones claras y resumidas
    """
    
    def __init__(self, memory: MemoryManager, api_key: Optional[str] = None):
        """
        Inicializa el agente de explicaciones
        
        Args:
            memory: Gestor de memoria del sistema
            api_key: API key de OpenAI (opcional)
        """
        self.memory = memory
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.llm = None  # Se inicializará cuando se necesite
        
        if self.api_key:
            try:
                # Usar gpt-4-turbo que tiene 128k tokens de contexto (más reciente y estable)
                # Si no está disponible, usar gpt-4o que también tiene contexto amplio
                try:
                    self.llm = ChatOpenAI(
                        model="gpt-4-turbo",
                        temperature=0.7,
                        api_key=self.api_key,
                        max_tokens=None
                    )
                except:
                    # Fallback a gpt-4o si gpt-4-turbo no está disponible
                    self.llm = ChatOpenAI(
                        model="gpt-4o",
                        temperature=0.7,
                        api_key=self.api_key,
                        max_tokens=None
                    )
                print("🤖 Explanation Agent inicializado con API key")
            except Exception as e:
                print(f"⚠️ Warning: No se pudo inicializar el LLM: {e}")
        else:
            print("⚠️ Explanation Agent inicializado sin API key (se requerirá para usar)")
    
    def generate_explanations(self, max_concepts: int = 20) -> Dict[str, str]:
        """
        Genera explicaciones claras del contenido procesado
        
        Args:
            max_concepts: Número máximo de conceptos a explicar
            
        Returns:
            Diccionario con explicaciones por concepto o texto completo
        """
        # Verificar API key
        if not self.api_key:
            return {
                "error": "Se requiere configurar una API key de OpenAI para generar explicaciones.",
                "status": "error"
            }
        
        # Inicializar LLM si no está inicializado
        if not self.llm:
            try:
                # Usar gpt-4-turbo que tiene 128k tokens de contexto (más reciente y estable)
                # Si no está disponible, usar gpt-4o que también tiene contexto amplio
                try:
                    self.llm = ChatOpenAI(
                        model="gpt-4-turbo",
                        temperature=0.7,
                        api_key=self.api_key,
                        max_tokens=None
                    )
                except:
                    # Fallback a gpt-4o si gpt-4-turbo no está disponible
                    self.llm = ChatOpenAI(
                        model="gpt-4o",
                        temperature=0.7,
                        api_key=self.api_key,
                        max_tokens=None
                    )
            except Exception as e:
                return {
                    "error": f"Error al inicializar el modelo: {str(e)}",
                    "status": "error"
                }
        
        # Recuperar todo el contenido de la memoria
        all_content = self.memory.get_all_documents(limit=100)
        
        if not all_content:
            return {"error": "No hay contenido procesado. Sube documentos primero."}
        
        # Combinar contenido en chunks más grandes
        combined_content = "\n\n---\n\n".join(all_content[:max_concepts * 2])
        
        # Generar explicaciones estructuradas
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """Eres un profesor experto que explica conceptos de manera clara y sencilla.
            Tu tarea es transformar información compleja en explicaciones fáciles de entender.
            Mantén un tono educativo y amigable.
            Organiza la información de manera estructurada y lógica."""),
            ("user", """Transforma el siguiente contenido educativo en explicaciones claras y estructuradas.

CONTENIDO:
{content}

Genera un documento de apuntes que incluya:
1. **Resumen Ejecutivo**: Un resumen breve de los conceptos principales
2. **Conceptos Clave**: Explicación clara de cada concepto importante
3. **Ejemplos Prácticos**: Ejemplos que ayuden a entender los conceptos
4. **Relaciones entre Conceptos**: Cómo se relacionan los diferentes temas
5. **Puntos Importantes a Recordar**: Lista de los puntos más relevantes

Formato el resultado en Markdown con encabezados, listas y secciones bien organizadas.""")
        ])
        
        try:
            chain = prompt_template | self.llm
            explanation = chain.invoke({"content": combined_content})
            
            return {
                "explanations": explanation.content,
                "status": "success",
                "concepts_covered": len(all_content)
            }
        except Exception as e:
            return {
                "error": f"Error al generar explicaciones: {str(e)}",
                "status": "error"
            }
    
    def generate_notes(self, topics: Optional[List[str]] = None, model: Optional[str] = "gpt-4-turbo") -> str:
        """
        Genera apuntes completos en formato Markdown
        
        Args:
            topics: Lista de temas específicos a cubrir (opcional)
            model: Modelo de OpenAI a usar (opcional, por defecto gpt-4-turbo)
            
        Returns:
            Apuntes en formato Markdown
        """
        # Verificar API key
        if not self.api_key:
            return "# Error\n\n⚠️ Se requiere configurar una API key de OpenAI para generar apuntes. Por favor, configura tu API key."
        
        # Inicializar LLM con el modelo especificado
        try:
            self.llm = ChatOpenAI(
                model=model,
                temperature=0.7,
                api_key=self.api_key,
                max_tokens=None
            )
        except Exception as e:
            # Si el modelo especificado falla, intentar con gpt-4-turbo como fallback
            try:
                print(f"⚠️ Modelo {model} no disponible, usando gpt-4-turbo como fallback")
                self.llm = ChatOpenAI(
                    model="gpt-4-turbo",
                    temperature=0.7,
                    api_key=self.api_key,
                    max_tokens=None
                )
            except:
                # Último fallback a gpt-4o
                try:
                    print("⚠️ gpt-4-turbo no disponible, usando gpt-4o como fallback")
                    self.llm = ChatOpenAI(
                        model="gpt-4o",
                        temperature=0.7,
                        api_key=self.api_key,
                        max_tokens=None
                    )
                except Exception as e2:
                    return f"# Error\n\n⚠️ Error al inicializar el modelo: {str(e2)}"
        
        # Definir el prompt template que se usará en ambos casos
        # Usar raw string (r"""...""") para evitar problemas con secuencias de escape
        prompt_template = r"""Eres un profesor experto. Tu tarea es generar apuntes basándote ÚNICA Y EXCLUSIVAMENTE en el contenido que se te proporciona a continuación.

CONTENIDO DEL DOCUMENTO:
{content}

REGLAS ESTRICTAS:
1. SOLO puedes usar información que aparezca explícitamente en el contenido proporcionado arriba
2. NO inventes, NO asumas, NO uses conocimiento previo que no esté en el contenido
3. Si el contenido no menciona algo, NO lo incluyas en los apuntes
4. NO uses placeholders, templates o texto genérico como "Concepto 1", "Aquí va...", etc.
5. Extrae y explica SOLO los conceptos, términos, definiciones y explicaciones que aparecen en el contenido proporcionado
6. Si el contenido está vacío o no tiene información suficiente, di claramente: "El contenido proporcionado no contiene suficiente información para generar apuntes"

**⚠️⚠️⚠️ ADVERTENCIA CRÍTICA ANTES DE COMENZAR ⚠️⚠️⚠️**

**NO GENERES CÓDIGO MERMAID DE NINGÚN TIPO. ESTO ES ABSOLUTAMENTE PROHIBIDO.**

Si generas código que comience con:
- \`\`\`mermaid
- \`\`\`flowchart
- \`\`\`graph
- \`\`\`gantt
- \`\`\`sequenceDiagram
- \`\`\`classDiagram
- \`\`\`mindmap

Tu respuesta será INCORRECTA y NO se mostrará.

**SOLO puedes usar:**
- \`\`\`diagram-json (para diagramas conceptuales)
- Tablas Markdown (para calendarios/cronogramas)
- Texto estructurado

FORMATO DE SALIDA (Markdown ULTRA VISUAL y fácil de leer):
# Apuntes Generados

## Resumen Ejecutivo
[Resumen claro y conciso basado SOLO en el contenido proporcionado. Máximo 3-4 párrafos. Si no hay suficiente información, indícalo claramente]

## Conceptos Clave

Para CADA concepto importante del contenido, usa este formato visual:

### [Nombre del Concepto]

**Definición:** [Definición exacta y clara del contenido. Una o dos frases máximo]

**Explicación:** [Explicación detallada pero comprensible del contenido. Usa lenguaje simple y claro]

**Ejemplos:** [Si el contenido incluye ejemplos, inclúyelos aquí de forma clara]

**Aplicaciones:** [Si el contenido menciona aplicaciones prácticas, inclúyelas]

---

## Esquemas Conceptuales para Exámenes

**⚠️ CRÍTICO - LEE ESTO PRIMERO**: 
- **NO uses código Mermaid de NINGÚN TIPO** (NO flowchart, NO graph, NO gantt, NO sequenceDiagram, NO classDiagram, NO mindmap, NADA de Mermaid)
- **SOLO usa JSON estructurado** dentro de bloques \`\`\`diagram-json
- Si generas código Mermaid (incluso gantt), la respuesta será incorrecta y no se mostrará
- **Para calendarios, cronogramas o líneas de tiempo**: NO uses diagramas gantt. En su lugar, usa:
  * Tablas en formato Markdown
  * Listas estructuradas con fechas
  * Texto organizado por secciones con fechas

**OBLIGATORIO**: Crea esquemas conceptuales SIMPLES usando JSON estructurado para CADA apartado o grupo de conceptos del contenido.

### REGLAS IMPORTANTES:

1. **Crea UN esquema por cada apartado/sección** - El esquema debe estar DENTRO del apartado correspondiente, justo después de la explicación
2. **Máximo 5 nodos por esquema** - mantén los diagramas simples y claros
3. **Usa solo letras mayúsculas** para IDs de nodos (A, B, C, D, E)
4. **Estructura OBLIGATORIA**: Cada apartado debe tener su esquema dentro de él:

```
## [Nombre del Apartado]

[Explicación del apartado con conceptos clave]

### Esquema Conceptual: [Nombre del concepto del apartado]

\`\`\`diagram-json
{
  "nodes": [
    {"id": "A", "label": "Concepto Principal del Apartado", "color": "#6366f1"},
    {"id": "B", "label": "Característica 1", "color": "#10b981"},
    {"id": "C", "label": "Característica 2", "color": "#10b981"},
    {"id": "D", "label": "Característica 3", "color": "#10b981"}
  ],
  "edges": [
    {"from": "A", "to": "B"},
    {"from": "A", "to": "C"},
    {"from": "A", "to": "D"}
  ]
}
\`\`\`

[Continuación del contenido del apartado...]
```

**IMPORTANTE**: 
- Los esquemas DEBEN estar dentro de cada apartado (##), no al final de todo
- Un esquema por cada grupo de conceptos relacionados
- NO uses código Mermaid, SOLO JSON estructurado dentro de bloques \`\`\`diagram-json

**FORMATO PARA ESQUEMAS - USA SOLO JSON ESTRUCTURADO**:

En lugar de código Mermaid, genera datos estructurados en JSON dentro de bloques de código marcados como \`\`\`diagram-json

**FORMATO BÁSICO - COPIA EXACTAMENTE ESTO**:

\`\`\`diagram-json
{
  "nodes": [
    {"id": "A", "label": "Concepto Principal", "color": "#6366f1"},
    {"id": "B", "label": "Característica 1", "color": "#10b981"},
    {"id": "C", "label": "Característica 2", "color": "#10b981"},
    {"id": "D", "label": "Característica 3", "color": "#10b981"}
  ],
  "edges": [
    {"from": "A", "to": "B"},
    {"from": "A", "to": "C"},
    {"from": "A", "to": "D"}
  ]
}
\`\`\`

**REGLAS BÁSICAS**:

1. **FORMATO JSON**:
   - DEBE ser JSON válido
   - Usa comillas dobles para todas las propiedades
   - NO uses comillas simples
   - Cada nodo debe tener: "id", "label", "color"
   - Cada conexión debe tener: "from", "to"

2. **NODOS**:
   - IDs: A, B, C, D, E (una letra mayúscula)
   - Labels: Texto descriptivo del concepto (puede tener cualquier carácter)
   - Colors: Usa colores hexadecimales (#6366f1, #10b981, #8b5cf6, #06b6d4, #f59e0b)

3. **CONEXIONES**:
   - "from": ID del nodo origen
   - "to": ID del nodo destino
   - Sin etiquetas en las flechas por ahora

**EJEMPLO SIMPLE**:
Si el concepto es "Normalización", genera:
\`\`\`diagram-json
{
  "nodes": [
    {"id": "A", "label": "Normalización", "color": "#6366f1"},
    {"id": "B", "label": "Primera Forma Normal", "color": "#10b981"},
    {"id": "C", "label": "Segunda Forma Normal", "color": "#10b981"},
    {"id": "D", "label": "Tercera Forma Normal", "color": "#10b981"}
  ],
  "edges": [
    {"from": "A", "to": "B"},
    {"from": "A", "to": "C"},
    {"from": "A", "to": "D"}
  ]
}
\`\`\`

**IMPORTANTE**: 
- Mantén los esquemas SIMPLES. Máximo 5 nodos.
- El JSON DEBE ser válido y estar correctamente formateado.
- NO uses código Mermaid, solo JSON estructurado.

### Reglas SIMPLES para Esquemas:

- **Crea 1-2 esquemas** por cada tema principal (mantén simple)
- Cada esquema debe tener **máximo 5 nodos**
- Usa **conexiones simples** (sin etiquetas en flechas por ahora)
- Asegúrate de que el JSON sea válido y esté correctamente formateado

### EJEMPLO SIMPLE:

Para un contenido sobre "Fotosíntesis", crea algo así:

## Fotosíntesis

La fotosíntesis es el proceso por el cual las plantas convierten la luz solar en energía química.

### Esquema Conceptual: Proceso de Fotosíntesis

\`\`\`diagram-json
{
  "nodes": [
    {"id": "A", "label": "Fotosíntesis", "color": "#6366f1"},
    {"id": "B", "label": "Luz Solar", "color": "#10b981"},
    {"id": "C", "label": "Clorofila", "color": "#10b981"},
    {"id": "D", "label": "ATP y NADPH", "color": "#10b981"},
    {"id": "E", "label": "Glucosa", "color": "#10b981"}
  ],
  "edges": [
    {"from": "A", "to": "B"},
    {"from": "A", "to": "C"},
    {"from": "A", "to": "D"},
    {"from": "A", "to": "E"}
  ]
}
\`\`\`

---

### INSTRUCCIONES FINALES CRÍTICAS:

1. **NO GENERES APARTADOS VACÍOS**: Si un apartado no tiene conceptos clave o información suficiente para crear un esquema, NO lo incluyas en la respuesta. Solo crea apartados que tengan contenido real y esquemas válidos.

2. **JSON DE DIAGRAMA REAL**: NO uses placeholders. DEBES escribir el JSON completo y válido dentro de bloques \`\`\`diagram-json. El JSON DEBE estar completo - NO lo cortes a mitad de un campo, NO dejes campos incompletos, asegúrate de cerrar todas las llaves y corchetes.

3. **NO GENERES DIAGRAMAS GANTT**: Si el contenido incluye calendarios, cronogramas o líneas de tiempo, NO uses diagramas gantt de Mermaid. En su lugar, presenta la información en formato de tabla o lista estructurada.

4. **ESTRUCTURA OBLIGATORIA**: Cada apartado DEBE tener:
   - Título del apartado (##)
   - Explicación del apartado con conceptos clave
   - Al menos UN esquema conceptual con JSON de diagrama completo dentro del apartado
   
5. **NO INCLUYAS MENSAJES DE ERROR**: Si no hay información suficiente, NO escribas mensajes como "no es posible crear esquemas" o "ausencia de información". Simplemente omite ese apartado completamente.

6. **VERIFICACIÓN**: Antes de finalizar, cuenta cuántos apartados/temas/conceptos clave identificaste. Asegúrate de haber creado al menos un esquema por cada uno.

7. **PRIORIDAD**: Los esquemas son MÁS IMPORTANTES que el texto descriptivo. Si tienes que elegir entre más texto o más esquemas, elige más esquemas.

8. **ÚLTIMA VERIFICACIÓN CRÍTICA**: Antes de enviar la respuesta, revisa que NO haya ningún bloque de código que comience con \`\`\`mermaid, \`\`\`gantt, \`\`\`flowchart, \`\`\`graph, \`\`\`sequenceDiagram, \`\`\`classDiagram, \`\`\`mindmap, etc. Si encuentras alguno, elimínalo completamente y reemplázalo con JSON estructurado (para diagramas conceptuales) o texto/tablas (para calendarios y cronogramas).

**RECUERDA**: El objetivo es que un estudiante pueda repasar visualmente antes de un examen. Los esquemas son la herramienta principal para esto.

## Detalles Importantes

[Información específica del contenido proporcionado. Organiza en listas con viñetas para facilitar la lectura. NO añadas información externa]

## Ejemplos Prácticos

[Si el contenido incluye ejemplos, preséntalos de forma clara y visual. Usa el formato:
- **Ejemplo 1:** [descripción]
- **Ejemplo 2:** [descripción]
]

## Tablas Comparativas

[Si es útil, crea tablas comparativas usando markdown para organizar información del contenido. Las tablas hacen la información más fácil de comparar y entender]

| Concepto | Característica 1 | Característica 2 | Característica 3 |
|----------|------------------|------------------|------------------|
| [Del contenido] | [Del contenido] | [Del contenido] | [Del contenido] |

## Puntos Clave a Recordar

[Lista de 3-5 puntos más importantes del contenido. Usa formato de lista con viñetas]

## Relaciones y Conexiones

[Si el contenido describe relaciones entre conceptos, explícalas de forma clara y visual]

---

REGLAS DE FORMATO PARA MÁXIMA LEGIBILIDAD:
1. Usa **negritas** para términos importantes y conceptos clave
2. Usa listas con viñetas (•) para información que se puede escanear rápidamente
3. Usa tablas cuando compares conceptos o características
4. Separa secciones con líneas horizontales (---) para mejor organización visual
5. **FORMATO VISUAL**: Usa negritas, listas, tablas y diagramas para hacer el contenido más visual y fácil de escanear
6. Mantén párrafos cortos (máximo 3-4 líneas)
7. Usa el formato "**Definición:**", "**Ejemplo:**", "**Importante:**" para crear bloques visuales destacados

RECUERDA: 
- Si el contenido no menciona algo específico, NO lo inventes. Usa SOLO la información del contenido proporcionado.
- Prioriza la CLARIDAD y FACILIDAD DE LECTURA sobre la cantidad de información
- El objetivo es que cualquier persona pueda entender el contenido fácilmente
- Usa lenguaje simple y evita jerga técnica innecesaria (a menos que esté en el contenido original)
- **IMPORTANTE**: Prioriza la claridad y estructura visual sobre elementos decorativos."""

        if topics:
            # Buscar contenido relevante para cada tema
            relevant_content = []
            for topic in topics:
                content = self.memory.retrieve_relevant_content(topic, n_results=10)
                if content:
                    relevant_content.extend(content)
            combined_content = "\n\n---\n\n".join(relevant_content) if relevant_content else ""
        else:
            # Obtener contenido pero limitar usando conteo real de tokens
            all_content = self.memory.get_all_documents(limit=100)  # Aumentar límite para obtener más contenido
            
            # Verificar que hay contenido
            if not all_content or len(all_content) == 0:
                print("❌ No hay documentos en la memoria")
                return "# Apuntes\n\n⚠️ No hay documentos procesados. Por favor, sube documentos primero."
            
            # Filtrar documentos vacíos o muy cortos
            all_content = [doc for doc in all_content if doc and doc.strip() and len(doc.strip()) > 10]
            
            if not all_content or len(all_content) == 0:
                print("❌ Todos los documentos están vacíos o son muy cortos")
                return "# Apuntes\n\n⚠️ Los documentos procesados no contienen suficiente contenido. Por favor, sube documentos con más texto."
            
            print(f"📄 Encontrados {len(all_content)} documentos con contenido válido")
            print(f"📄 Primer documento (primeros 200 chars): {all_content[0][:200]}...")
            
            # Calcular tokens usando tiktoken para asegurar que no excedemos el límite
            try:
                encoding = tiktoken.encoding_for_model("gpt-4")
            except:
                encoding = tiktoken.get_encoding("cl100k_base")
            
            # Aumentar límite de tokens ya que estamos usando gpt-4-turbo o gpt-4o que tienen más contexto
            MAX_CONTENT_TOKENS = 8000  # Aumentado para modelos con más contexto
            combined_content = ""
            combined_tokens = 0
            
            # Calcular tokens del prompt base (sin contenido)
            prompt_base_tokens = len(encoding.encode(prompt_template.replace("{content}", "")))
            print(f"📊 Tokens del prompt base: {prompt_base_tokens}")
            print(f"📊 Límite de tokens para contenido: {MAX_CONTENT_TOKENS}")
            
            for i, doc in enumerate(all_content):
                doc_text = f"\n\n---\n\n{doc}" if combined_content else doc
                doc_tokens = len(encoding.encode(doc_text))
                
                # Verificar si añadir este documento excedería el límite
                if combined_tokens + doc_tokens + prompt_base_tokens > MAX_CONTENT_TOKENS:
                    print(f"📊 Límite alcanzado después de {i} documentos ({combined_tokens} tokens)")
                    # Añadir nota de que hay más contenido
                    combined_content += f"\n\n---\n\n[Nota: Hay más contenido disponible. Se han incluido {i} documentos de {len(all_content)} disponibles. Para ver todo, puedes hacer preguntas específicas sobre temas concretos.]"
                    break
                combined_content += doc_text
                combined_tokens += doc_tokens
                print(f"📄 Documento {i+1} añadido ({doc_tokens} tokens, total: {combined_tokens})")
            
            print(f"📊 Contenido final: {combined_tokens} tokens, {len(combined_content)} caracteres")
        
        if not combined_content or not combined_content.strip():
            return "# Apuntes\n\n⚠️ No hay contenido disponible. Por favor, sube documentos primero."
        
        # Verificar que el contenido no esté vacío después de limpiar
        if len(combined_content.strip()) < 50:
            return "# Apuntes\n\n⚠️ El contenido disponible es demasiado corto o está vacío. Por favor, sube documentos con más contenido."
        
        # Añadir validación: mostrar una muestra del contenido para debugging
        print(f"✅ Generando apuntes con {len(combined_content)} caracteres de contenido")
        print(f"📄 Primeros 500 caracteres: {combined_content[:500]}...")
        print(f"📄 Últimos 200 caracteres: {combined_content[-200:]}...")
        
        # Validar que el contenido tiene información real (no solo espacios o caracteres especiales)
        content_words = combined_content.split()
        if len(content_words) < 10:
            print(f"❌ Contenido tiene muy pocas palabras: {len(content_words)}")
            return "# Apuntes\n\n⚠️ El contenido disponible tiene muy pocas palabras. Por favor, sube documentos con más texto."
        
        print(f"✅ Contenido válido: {len(content_words)} palabras")
        
        # Usar replace directo en lugar de format para evitar problemas con llaves en el contenido
        # Esto es más seguro cuando el contenido puede contener llaves también
        prompt = prompt_template.replace("{content}", combined_content)

        try:
            print("🔄 Invocando LLM para generar apuntes...")
            response = self.llm.invoke(prompt)
            notes_content = response.content
            print(f"✅ Respuesta recibida: {len(notes_content)} caracteres")
            print(f"📄 Primeros 300 caracteres: {notes_content[:300]}")
            
            # POST-PROCESAMIENTO: Eliminar cualquier bloque Mermaid que el modelo pueda haber generado
            import re
            # Detectar y eliminar bloques de código Mermaid (multilínea)
            # Patrón mejorado que captura bloques completos con cualquier contenido entre los backticks
            mermaid_patterns = [
                r'```\s*mermaid\s*\n.*?```',
                r'```\s*flowchart\s*\n.*?```',
                r'```\s*graph\s*\n.*?```',
                r'```\s*gantt\s*\n.*?```',
                r'```\s*sequenceDiagram\s*\n.*?```',
                r'```\s*classDiagram\s*\n.*?```',
                r'```\s*mindmap\s*\n.*?```',
            ]
            
            for pattern in mermaid_patterns:
                notes_content = re.sub(pattern, '', notes_content, flags=re.DOTALL | re.IGNORECASE | re.MULTILINE)
            
            # También eliminar bloques que comiencen directamente con comandos Mermaid (sin backticks iniciales)
            mermaid_code_patterns = [
                r'graph\s+(TB|TD|LR|RL|BT).*?```',
                r'flowchart\s+(TB|TD|LR|RL|BT).*?```',
                r'gantt\s+.*?```',
            ]
            
            for pattern in mermaid_code_patterns:
                notes_content = re.sub(pattern, '', notes_content, flags=re.DOTALL | re.IGNORECASE | re.MULTILINE)
            
            # Limpiar líneas vacías múltiples que puedan quedar después de eliminar bloques
            notes_content = re.sub(r'\n{3,}', '\n\n', notes_content)
            
            # Validar que hay bloques diagram-json en la respuesta
            diagram_json_count = notes_content.count('```diagram-json') + notes_content.count('``` diagram-json')
            if diagram_json_count == 0:
                print("⚠️ Advertencia: No se encontraron bloques diagram-json en la respuesta")
                print(f"📄 Primeros 500 caracteres de la respuesta: {notes_content[:500]}")
            else:
                print(f"✅ Post-procesamiento: Bloques Mermaid eliminados, {diagram_json_count} diagrama(s) JSON encontrado(s)")
            
            # Validar que la respuesta no esté vacía
            if not notes_content or not notes_content.strip():
                return "# Error\n\n⚠️ La respuesta del modelo está vacía. Por favor, intenta de nuevo."
            
            # Validar que la respuesta contenga contenido válido
            if len(notes_content.strip()) < 50:
                return f"# Error\n\n⚠️ La respuesta del modelo es demasiado corta. Respuesta recibida: {notes_content[:200]}"
            
            return notes_content
        except KeyError as e:
            error_str = str(e)
            print(f"❌ KeyError al generar apuntes: {error_str}")
            import traceback
            traceback.print_exc()
            return f"# Error\n\n⚠️ Error al procesar la respuesta: {error_str}. Por favor, intenta de nuevo o verifica que hay contenido disponible."
        except Exception as e:
            error_str = str(e)
            print(f"❌ Error al generar apuntes: {error_str}")
            import traceback
            traceback.print_exc()
            # Si el error es por límite de tokens, sugerir usar menos contenido
            if "context_length" in error_str.lower() or "tokens" in error_str.lower():
                return f"# Error\n\nEl contenido es demasiado extenso. Por favor, intenta generar apuntes sobre temas específicos o divide el documento en partes más pequeñas.\n\nError: {error_str}"
            return f"# Error\n\nNo se pudieron generar los apuntes: {error_str}"
    
    def explain_concept(self, concept: str) -> str:
        """
        Explica un concepto específico
        
        Args:
            concept: Concepto a explicar
            
        Returns:
            Explicación del concepto
        """
        # Verificar API key
        if not self.api_key:
            return f"# Concepto: {concept}\n\n⚠️ Se requiere configurar una API key de OpenAI para explicar conceptos."
        
        # Inicializar LLM si no está inicializado
        if not self.llm:
            try:
                # Usar gpt-4-turbo que tiene 128k tokens de contexto (más reciente y estable)
                # Si no está disponible, usar gpt-4o que también tiene contexto amplio
                try:
                    self.llm = ChatOpenAI(
                        model="gpt-4-turbo",
                        temperature=0.7,
                        api_key=self.api_key,
                        max_tokens=None
                    )
                except:
                    # Fallback a gpt-4o si gpt-4-turbo no está disponible
                    self.llm = ChatOpenAI(
                        model="gpt-4o",
                        temperature=0.7,
                        api_key=self.api_key,
                        max_tokens=None
                    )
            except Exception as e:
                return f"# Error\n\n⚠️ Error al inicializar el modelo: {str(e)}"
        
        relevant_content = self.memory.retrieve_relevant_content(concept, n_results=5)
        
        if not relevant_content:
            return f"# Concepto: {concept}\n\nNo se encontró información sobre '{concept}' en los documentos procesados. Por favor, asegúrate de haber subido documentos que contengan este concepto."
        
        prompt = f"""Explica el concepto '{concept}' de manera clara y completa basándote en el siguiente contenido:

{chr(10).join(relevant_content)}

Proporciona:
1. Definición clara
2. Explicación detallada
3. Ejemplos prácticos
4. Relación con otros conceptos
5. Puntos importantes a recordar

Formato en Markdown."""

        try:
            response = self.llm.invoke(prompt)
            return response.content
        except Exception as e:
            return f"Error al explicar el concepto: {str(e)}"
