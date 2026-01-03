"""
Explanation Agent - Transforma información en explicaciones claras y resumidas
Genera apuntes estructurados del contenido procesado
"""

# Aplicar parche de proxies antes de importar ChatOpenAI
import sys
import os
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
try:
    import openai_proxy_patch  # noqa: F401
    openai_proxy_patch.patch_langchain_openai()
except:
    pass

from typing import List, Dict, Optional
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from memory.memory_manager import MemoryManager
import tiktoken
import sys

# Importar model_manager
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from model_manager import ModelManager
except ImportError:
    ModelManager = None
    print("⚠️ Warning: model_manager no disponible, usando OpenAI directamente")

class ExplanationAgent:
    """
    Agente especializado en generar explicaciones claras y resumidas
    """
    
    def __init__(self, memory: MemoryManager, api_key: Optional[str] = None, mode: str = "auto"):
        """
        Inicializa el agente de explicaciones
        
        Args:
            memory: Gestor de memoria del sistema
            api_key: API key de OpenAI (opcional)
            mode: Modo de selección de modelo ("auto" = optimizar costes, "manual" = usar modelo especificado)
        """
        self.memory = memory
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.mode = mode
        self.llm = None  # Se inicializará cuando se necesite
        self.model_manager = None
        self.current_model_config = None
        
        # Inicializar model_manager si está disponible
        if ModelManager:
            try:
                self.model_manager = ModelManager(api_key=self.api_key, mode=mode)
                print("🤖 Explanation Agent inicializado con ModelManager (modo automático)")
            except Exception as e:
                print(f"⚠️ Warning: No se pudo inicializar ModelManager: {e}")
                self.model_manager = None
        else:
            # Fallback a OpenAI directo
            if self.api_key:
                try:
                    self.llm = ChatOpenAI(
                        model="gpt-3.5-turbo",  # Usar modelo más barato por defecto
                        temperature=0.7,
                        api_key=self.api_key,
                        max_tokens=None
                    )
                    print("🤖 Explanation Agent inicializado (sin ModelManager, usando gpt-3.5-turbo)")
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
        # Usar model_manager si está disponible (modo automático)
        if self.model_manager:
            try:
                # Seleccionar modelo automáticamente (prioriza gratis > barato > caro)
                # Para generación de explicaciones, necesitamos contexto amplio
                self.current_model_config, self.llm = self.model_manager.select_model(
                    task_type="generation",
                    min_quality="medium",
                    context_length=8000  # Necesitamos contexto amplio
                )
                print(f"✅ Usando modelo: {self.current_model_config.name} (costo: ${self.current_model_config.cost_per_1k_input:.4f}/{self.current_model_config.cost_per_1k_output:.4f} por 1k tokens)")
            except Exception as e:
                error_msg = f"⚠️ Error al seleccionar modelo automáticamente: {str(e)}"
                print(error_msg)
                # Fallback: intentar con OpenAI si hay API key
                if self.api_key:
                    try:
                        self.llm = ChatOpenAI(
                            model="gpt-3.5-turbo",  # Modelo más barato
                            temperature=0.7,
                            api_key=self.api_key,
                            max_tokens=None
                        )
                        print("✅ Fallback a gpt-3.5-turbo")
                    except Exception as e2:
                        return {
                            "error": f"Error al inicializar el modelo: {str(e2)}",
                            "status": "error"
                        }
                else:
                    return {
                        "error": "Se requiere configurar una API key de OpenAI o tener Ollama instalado.",
                        "status": "error"
                    }
        else:
            # Fallback: usar OpenAI directamente
            if not self.api_key:
                return {
                    "error": "Se requiere configurar una API key de OpenAI para generar explicaciones.",
                    "status": "error"
                }
            
            # Inicializar LLM si no está inicializado
            if not self.llm:
                try:
                    # Usar gpt-3.5-turbo (más barato) en lugar de gpt-4-turbo
                    self.llm = ChatOpenAI(
                        model="gpt-3.5-turbo",
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
    
    def generate_notes(self, topics: Optional[List[str]] = None, model: Optional[str] = None) -> str:
        """
        Genera apuntes completos en formato Markdown
        
        Args:
            topics: Lista de temas específicos a cubrir (opcional)
            model: Modelo preferido (opcional, si no se especifica usa modo automático)
            
        Returns:
            Apuntes en formato Markdown
        """
        # Usar model_manager si está disponible (modo automático)
        if self.model_manager:
            try:
                # Seleccionar modelo automáticamente (prioriza gratis > barato > caro)
                # Para generación de apuntes, necesitamos contexto amplio y buena calidad
                self.current_model_config, self.llm = self.model_manager.select_model(
                    task_type="generation",
                    min_quality="medium",
                    preferred_model=model if model else None,
                    context_length=8000  # Necesitamos contexto amplio
                )
                print(f"✅ Usando modelo: {self.current_model_config.name} (costo: ${self.current_model_config.cost_per_1k_input:.4f}/{self.current_model_config.cost_per_1k_output:.4f} por 1k tokens)")
            except Exception as e:
                error_msg = f"⚠️ Error al seleccionar modelo automáticamente: {str(e)}"
                print(error_msg)
                # Fallback: intentar con OpenAI si hay API key
                if self.api_key:
                    try:
                        self.llm = ChatOpenAI(
                            model="gpt-3.5-turbo",  # Modelo más barato
                            temperature=0.7,
                            api_key=self.api_key,
                            max_tokens=None
                        )
                        print("✅ Fallback a gpt-3.5-turbo")
                    except Exception as e2:
                        return f"# Error\n\n⚠️ Error al inicializar el modelo: {str(e2)}"
                else:
                    return "# Error\n\n⚠️ Se requiere configurar una API key de OpenAI o tener Ollama instalado. Por favor, configura tu API key o instala Ollama."
        else:
            # Fallback: usar OpenAI directamente
            if not self.api_key:
                return "# Error\n\n⚠️ Se requiere configurar una API key de OpenAI para generar apuntes. Por favor, configura tu API key."
            
            # Usar modelo especificado o el más barato disponible
            model_to_use = model if model else "gpt-3.5-turbo"  # Por defecto usar el más barato
            
            try:
                self.llm = ChatOpenAI(
                    model=model_to_use,
                    temperature=0.7,
                    api_key=self.api_key,
                    max_tokens=None
                )
            except Exception as e:
                # Si el modelo especificado falla, intentar con gpt-3.5-turbo como fallback
                try:
                    print(f"⚠️ Modelo {model_to_use} no disponible, usando gpt-3.5-turbo como fallback")
                    self.llm = ChatOpenAI(
                        model="gpt-3.5-turbo",
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

**OBJETIVO DE LOS ESQUEMAS CONCEPTUALES**: Los esquemas conceptuales deben ayudar al estudiante a entender y memorizar los conceptos clave del tema. Deben mostrar:
- **Relaciones jerárquicas**: concepto principal → subconceptos → detalles
- **Categorías claras**: agrupa conceptos relacionados por categorías (usando colores diferentes)
- **Información educativa**: cada nodo debe contener información que realmente ayude a entender el tema
- **Estructura lógica**: los conceptos deben estar organizados de manera que tenga sentido pedagógico

**⚠️ NO GENERES ESQUEMAS GENÉRICOS O VACÍOS**:
- NO uses etiquetas genéricas como "Concepto 1", "Característica A", "Elemento X"
- NO crees esquemas con solo 2-3 nodos que no aporten información
- NO repitas la misma estructura para todos los temas
- SOLO crea esquemas cuando realmente ayuden a entender el tema

**OBLIGATORIO**: Crea esquemas conceptuales EDUCATIVOS usando JSON estructurado para CADA apartado o grupo de conceptos del contenido.

### REGLAS IMPORTANTES:

1. **Crea UN esquema por cada apartado/sección** - El esquema debe estar DENTRO del apartado correspondiente, justo después de la explicación
2. **Mínimo 4 nodos, máximo 8 nodos** - Los esquemas deben tener suficiente información para ser útiles, pero no demasiada para ser confusos
3. **Usa solo letras mayúsculas** para IDs de nodos (A, B, C, D, E, F, G, H)
4. **Estructura jerárquica clara**: 
   - Nodo A: Concepto principal del tema
   - Nodos B, C, D: Categorías principales o aspectos fundamentales
   - Nodos E, F, G, H: Subconceptos o detalles importantes de cada categoría
5. **Usa colores para categorizar**: 
   - Color morado (#6366f1): Concepto principal
   - Color verde (#10b981): Categorías o aspectos principales
   - Color azul (#06b6d4): Subconceptos o detalles
   - Color naranja (#f59e0b): Ejemplos o aplicaciones
   - Color rosa (#ec4899): Características especiales
6. **Estructura OBLIGATORIA**: Cada apartado debe tener su esquema dentro de él:

```
## [Nombre del Apartado]

[Explicación del apartado con conceptos clave]

### Esquema Conceptual: [Nombre del concepto del apartado]

\`\`\`diagram-json
{
  "title": "Concepto Principal del Apartado",
  "nodes": [
    {"id": "A", "label": "Concepto Principal del Apartado", "color": "#6366f1"},
    {"id": "B", "label": "Categoría 1 (nombre específico del contenido)", "color": "#a855f7", "description": "Descripción detallada de la categoría 1 con información específica del contenido", "letter": "H"},
    {"id": "C", "label": "Categoría 2 (nombre específico del contenido)", "color": "#f59e0b", "description": "Descripción detallada de la categoría 2 con información específica del contenido", "letter": "D"},
    {"id": "D", "label": "Categoría 3 (nombre específico del contenido)", "color": "#06b6d4", "description": "Descripción detallada de la categoría 3 con información específica del contenido", "letter": "T"},
    {"id": "E", "label": "Categoría 4 (nombre específico del contenido)", "color": "#ec4899", "description": "Descripción detallada de la categoría 4 con información específica del contenido", "letter": "C"}
  ],
  "edges": [
    {"from": "A", "to": "B"},
    {"from": "A", "to": "C"},
    {"from": "A", "to": "D"},
    {"from": "A", "to": "E"}
  ]
}
\`\`\`

[Continuación del contenido del apartado...]
```

**IMPORTANTE**: 
- Los esquemas DEBEN estar dentro de cada apartado (##), no al final de todo
- Un esquema por cada grupo de conceptos relacionados
- NO uses código Mermaid, SOLO JSON estructurado dentro de bloques \`\`\`diagram-json
- **Cada nodo debe tener información ESPECÍFICA del contenido**, no genérica

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
   - Colors: Usa colores hexadecimales (#a855f7 morado, #f59e0b naranja, #06b6d4 teal, #ec4899 rosa) para las categorías
   - Description: (OPCIONAL pero RECOMENDADO) Descripción detallada de cada categoría que ayude a entender el concepto
   - Letter: (OPCIONAL) Letra para el cuadrante (H, D, T, C, etc.). Si no se especifica, se generará automáticamente

3. **CONEXIONES**:
   - "from": ID del nodo origen
   - "to": ID del nodo destino
   - Sin etiquetas en las flechas por ahora

**EJEMPLOS DE ESQUEMAS CONCEPTUALES EDUCATIVOS**:

**Ejemplo 1 - Esquema Jerárquico con Categorías**:
Si el concepto es "Cocodrilos", genera un esquema que muestre las categorías principales:
\`\`\`diagram-json
{
  "title": "Cocodrilos",
  "nodes": [
    {"id": "A", "label": "Cocodrilos", "color": "#6366f1"},
    {"id": "B", "label": "Clasificación", "color": "#a855f7", "description": "Los cocodrilos pertenecen al orden Crocodylia y se clasifican en diferentes familias según sus características anatómicas y hábitat.", "letter": "C"},
    {"id": "C", "label": "Características Físicas", "color": "#f59e0b", "description": "Poseen un cuerpo alargado, cola poderosa, mandíbulas fuertes con dientes cónicos, y piel gruesa con escamas duras que les protege.", "letter": "F"},
    {"id": "D", "label": "Alimentación", "color": "#06b6d4", "description": "Son carnívoros que se alimentan principalmente de peces, aves, mamíferos y otros animales acuáticos y terrestres.", "letter": "A"},
    {"id": "E", "label": "Comportamiento", "color": "#ec4899", "description": "Son animales territoriales, excelentes nadadores, y pueden permanecer sumergidos durante largos períodos de tiempo.", "letter": "B"}
  ],
  "edges": [
    {"from": "A", "to": "B"},
    {"from": "A", "to": "C"},
    {"from": "A", "to": "D"},
    {"from": "A", "to": "E"}
  ]
}
\`\`\`

**Ejemplo 2 - Esquema de Comparación (VS) - PLANTILLA FIJA**:
Si el concepto es una comparación como "Rinocerontes vs Ardillas", usa esta PLANTILLA EXACTA y solo completa los textos:
\`\`\`diagram-json
{
  "title": "Rinocerontes vs Ardillas",
  "nodes": [
    {"id": "A", "label": "VS", "color": "#6366f1"},
    {"id": "B", "label": "Rinocerontes", "color": "#c084fc", "characteristic": "ALTURA", "description": "TAMAÑO: 3000 kg de masa corporal. ALTURA: Hasta 1.8 metros. ESTRATEGIA DE DEFENSA: Carga frontal con cuerno, uso del cuerno como arma, resistencia al daño físico. Cómo podría ganar: Su enorme masa y fuerza le permitirían aplastar o embestir al oponente. El cuerno puede causar heridas graves. Su piel gruesa le protege de ataques menores. Su velocidad de carga (hasta 50 km/h) le da ventaja en embestidas. Cómo podría perder: Su falta de agilidad le hace vulnerable a ataques rápidos desde los lados o por detrás. No puede trepar ni escapar fácilmente. Su gran tamaño lo hace un blanco fácil. Ventajas: Masa corporal superior, defensa natural con cuerno, resistencia al daño, fuerza física abrumadora. Desventajas: Falta de agilidad, incapacidad de trepar, movilidad limitada en espacios pequeños.", "letter": "H"},
    {"id": "C", "label": "Ardillas", "color": "#67e8f9", "characteristic": "ESTRATEGIA DE DEFENSA", "description": "TAMAÑO: 0.5-1 kg de peso. ALTURA: 20-30 cm. AGILIDAD: Movimiento extremadamente rápido y ágil. ESTRATEGIA DE DEFENSA: Huida rápida, capacidad de trepar árboles y estructuras verticales, esconderse en espacios pequeños. Cómo podría ganar: Su agilidad extrema le permitiría esquivar ataques y atacar desde ángulos inesperados. Puede trepar para escapar o atacar desde arriba. Sus dientes afilados pueden causar heridas en puntos vulnerables. Su pequeño tamaño le permite esconderse y atacar por sorpresa. Cómo podría perder: Su pequeño tamaño lo hace vulnerable a un solo golpe del oponente. No tiene defensa natural contra ataques directos. Su falta de fuerza física le impide causar daño significativo a oponentes grandes. Ventajas: Agilidad superior, capacidad de trepar, movilidad en espacios pequeños, velocidad de escape. Desventajas: Tamaño pequeño, falta de fuerza, vulnerabilidad a ataques directos, sin defensa natural.", "letter": "D"}
  ],
  "edges": [
    {"from": "A", "to": "B"},
    {"from": "A", "to": "C"}
  ]
}
\`\`\`

**PLANTILLA FIJA PARA COMPARACIONES - SOLO COMPLETA LOS TEXTOS**:
- **Estructura FIJA**: Siempre usa esta estructura exacta con 3 nodos (A=VS, B=primer elemento, C=segundo elemento)
- **Nodo A**: Siempre {"id": "A", "label": "VS", "color": "#6366f1"}
- **Nodo B (izquierda)**: 
  * "label": Nombre exacto del primer elemento (ej: "Rinocerontes", "Peces", "Ardillas", "Gojo Satoru", "Goku", "Sukuna")
  * "color": "#c084fc" (morado pastel)
  * "characteristic": Una característica clave en MAYÚSCULAS para la caja superior (ej: "ALTURA", "AGILIDAD", "TAMAÑO", "ESTRATEGIA DE DEFENSA", "LIMITLESS (TÉCNICA)", "TRANSFORMACIONES", "MANIPULACIÓN DE ENERGÍA MALDITA", "POWER-UPS")
  * "description": Descripción COMPLETA y DETALLADA con el siguiente formato EXACTO (mínimo 250-350 palabras):
    
    **FORMATO OBLIGATORIO PARA LA DESCRIPCIÓN**:
    
    [Breve introducción del elemento - 2-3 líneas]
    
    Ventajas:
    
    - [Nombre de la ventaja 1]: [Explicación DETALLADA (3-5 líneas) de por qué esta ventaja podría resultarle útil en el enfrentamiento, incluyendo ejemplos específicos y situaciones concretas]
    
    - [Nombre de la ventaja 2]: [Explicación DETALLADA (3-5 líneas) de por qué esta ventaja podría resultarle útil]
    
    - [Nombre de la ventaja 3]: [Explicación DETALLADA (3-5 líneas) de por qué esta ventaja podría resultarle útil]
    
    - [Nombre de la ventaja 4]: [Explicación DETALLADA (3-5 líneas) de por qué esta ventaja podría resultarle útil]
    
    - [Nombre de la ventaja 5]: [Explicación DETALLADA (3-5 líneas) de por qué esta ventaja podría resultarle útil]
    
    - [Nombre de la ventaja 6]: [Explicación DETALLADA (3-5 líneas) de por qué esta ventaja podría resultarle útil]
    
    - [Nombre de la ventaja 7]: [Explicación DETALLADA (3-5 líneas) de por qué esta ventaja podría resultarle útil]
    
    Desventajas:
    
    - [Nombre de la desventaja 1]: [Explicación DETALLADA (3-5 líneas) de por qué esta desventaja podría ser problemática, incluyendo ejemplos específicos]
    
    - [Nombre de la desventaja 2]: [Explicación DETALLADA (3-5 líneas) de por qué esta desventaja podría ser problemática]
    
    - [Nombre de la desventaja 3]: [Explicación DETALLADA (3-5 líneas) de por qué esta desventaja podría ser problemática]
    
    - [Nombre de la desventaja 4]: [Explicación DETALLADA (3-5 líneas) de por qué esta desventaja podría ser problemática]
    
    **EJEMPLO CONCRETO COMPLETO**:
    "Sukuna es un poderoso hechicero maldito con habilidades excepcionales que le convierten en uno de los oponentes más temibles.\n\nVentajas:\n\n- Manipulación de energía maldita: Esta habilidad le permite crear técnicas devastadoras que pueden destruir objetivos a gran escala, dándole una ventaja ofensiva abrumadora contra oponentes que no pueden defenderse de ataques de energía. Puede lanzar ondas de energía destructiva que atraviesan múltiples objetivos, y su dominio sobre la energía maldita le permite adaptar sus ataques a diferentes situaciones de combate. En enfrentamientos contra múltiples enemigos, esta capacidad le da una clara ventaja táctica.\n\n- Regeneración: Su capacidad de regeneración le permite recuperarse rápidamente de heridas graves, permitiéndole mantener la presión en combates prolongados donde otros se debilitarían. Incluso heridas que serían fatales para otros combatientes pueden ser curadas en cuestión de minutos, lo que le permite continuar luchando sin perder efectividad. Esta resistencia le convierte en un oponente extremadamente difícil de derrotar mediante daño acumulativo.\n\n- Experiencia de combate: Con siglos de experiencia, puede anticipar movimientos y adaptarse rápidamente a las tácticas del oponente, dándole una ventaja estratégica significativa. Ha enfrentado innumerables tipos de oponentes y técnicas, lo que le permite reconocer patrones de ataque y desarrollar contramedidas efectivas en tiempo real. Su conocimiento táctico es invaluable en combates complejos.\n\n- Fuerza física sobrehumana: Su cuerpo mejorado le permite ejercer una fuerza física que supera ampliamente a la mayoría de oponentes, permitiéndole romper defensas físicas y causar daño devastador con ataques cuerpo a cuerpo. Puede destruir estructuras sólidas con golpes simples y su resistencia física le permite soportar impactos que incapacitarían a otros combatientes.\n\n- Versatilidad táctica: Su amplio arsenal de técnicas le permite adaptarse a diferentes tipos de enfrentamientos, desde combates a distancia hasta peleas cuerpo a cuerpo. Puede cambiar de estrategia instantáneamente según las circunstancias, lo que le hace impredecible y difícil de contrarrestar. Esta flexibilidad le da una ventaja significativa sobre oponentes con estilos de combate más limitados.\n\n- Intimidación psicológica: Su reputación y presencia abrumadora pueden afectar psicológicamente a sus oponentes, reduciendo su efectividad en combate. Muchos combatientes se ven afectados por el miedo antes incluso de comenzar el enfrentamiento, lo que le da una ventaja inicial significativa. Esta presión psicológica puede llevar a errores tácticos por parte del oponente.\n\n- Resistencia a técnicas especiales: Su naturaleza única le otorga resistencia a muchas técnicas especiales que serían efectivas contra otros combatientes. Puede neutralizar o contrarrestar habilidades que dependen de manipulación espiritual o energética, lo que limita las opciones tácticas de sus oponentes.\n\nDesventajas:\n\n- Arrogancia: Su excesiva confianza puede llevarle a subestimar oponentes, dejándole vulnerable a ataques sorpresa o tácticas inesperadas. A menudo no toma en serio a oponentes que considera inferiores, lo que puede resultar en errores tácticos costosos. Esta arrogancia puede ser explotada por oponentes astutos que sepan cómo manipular su ego.\n\n- Dependencia de energía: Si se agota su reserva de energía maldita, pierde gran parte de su poder ofensivo, dejándole en desventaja. Aunque tiene reservas considerables, en combates extremadamente prolongados puede verse limitado. Esta dependencia le hace vulnerable a tácticas diseñadas para agotar sus recursos energéticos.\n\n- Limitaciones físicas: A pesar de su poder, su cuerpo físico tiene limitaciones que pueden ser explotadas. Ciertos tipos de ataques o técnicas pueden ser más efectivos contra él de lo que él mismo reconoce. Su confianza en sus habilidades regenerativas puede llevarle a ignorar daño que, aunque no sea inmediatamente fatal, puede acumularse y debilitarle.\n\n- Vulnerabilidad a técnicas específicas: Algunas técnicas o habilidades especiales pueden ser particularmente efectivas contra él, especialmente aquellas diseñadas específicamente para contrarrestar energía maldita. Oponentes con conocimiento especializado pueden tener ventajas tácticas significativas si conocen sus debilidades específicas."
    
  * "letter": "H" (siempre H para el primero)
- **Nodo C (derecha)**:
  * "label": Nombre exacto del segundo elemento
  * "color": "#67e8f9" (teal pastel)
  * "characteristic": Una característica clave diferente en MAYÚSCULAS (ej: "EVASIÓN", "VELOCIDAD", "ESTRATEGIA DE DEFENSA", "TRANSFORMACIONES", "KI", "POWER-UPS")
  * "description": Descripción COMPLETA y DETALLADA con el MISMO formato que el nodo B (mínimo 250-350 palabras, usando el formato de Ventajas/Desventajas)
  * "letter": "D" (siempre D para el segundo)
- **Edges**: Siempre [{"from": "A", "to": "B"}, {"from": "A", "to": "C"}]
- **CRÍTICO**: 
  * Las descripciones DEBEN seguir el formato EXACTO de Ventajas/Desventajas con explicaciones DETALLADAS
  * MÍNIMO 7 ventajas y 4 desventajas para cada elemento (más es mejor)
  * Cada ventaja/desventaja debe tener una explicación DETALLADA de 3-5 líneas (no corta) explicando por qué es útil o problemática, incluyendo ejemplos específicos y situaciones concretas
  * Usa saltos de línea (\n) para separar secciones y elementos de lista
  * El texto debe ser MUY EXPLICATIVO y DETALLADO (mínimo 500-700 palabras por elemento, más es mejor)
  * NO uses descripciones cortas o genéricas - cada punto debe ser específico y educativo
  * Incluye detalles concretos, ejemplos de situaciones, y explicaciones extensas sobre cómo cada ventaja/desventaja afecta el enfrentamiento

**Ejemplo 2 - Esquema con Descripciones**:
Para "Elefantes", muestra las categorías principales con descripciones:
\`\`\`diagram-json
{
  "title": "Elefantes",
  "nodes": [
    {"id": "A", "label": "Elefantes", "color": "#6366f1"},
    {"id": "B", "label": "Hábitats Diversos", "color": "#a855f7", "description": "Los elefantes viven en hábitats diversos como sabanas, bosques, desiertos y zonas montañosas, adaptándose a diferentes condiciones climáticas.", "letter": "H"},
    {"id": "C", "label": "Dieta Herbívora", "color": "#f59e0b", "description": "Se alimentan principalmente de hierba, hojas, frutas, cortezas y raíces, consumiendo grandes cantidades de vegetación diariamente.", "letter": "D"},
    {"id": "D", "label": "Tamaño Gigante", "color": "#06b6d4", "description": "Son gigantes, siendo el animal terrestre más grande del mundo, con pesos que pueden superar las 6 toneladas.", "letter": "T"},
    {"id": "E", "label": "Comportamiento Social", "color": "#ec4899", "description": "Viven en manadas matriarcales complejas, mostrando comportamientos sociales avanzados como el cuidado de crías y la comunicación.", "letter": "C"}
  ],
  "edges": [
    {"from": "A", "to": "B"},
    {"from": "A", "to": "C"},
    {"from": "A", "to": "D"},
    {"from": "A", "to": "E"}
  ]
}
\`\`\`

**REGLAS CRÍTICAS PARA ESQUEMAS ÚTILES**:

1. **Información específica**: Cada nodo debe contener información REAL y ESPECÍFICA del contenido, no genérica
2. **Relaciones claras**: Las conexiones deben mostrar relaciones lógicas (jerarquía, categorización, proceso, etc.)
3. **Mínimo 4 nodos**: Un esquema con menos de 4 nodos no aporta suficiente información
4. **Máximo 8 nodos**: Más de 8 nodos puede ser confuso
5. **Colores con significado**: Usa colores diferentes para diferentes categorías o tipos de conceptos
6. **Estructura pedagógica**: Organiza los conceptos de manera que tenga sentido educativo (de lo general a lo específico, o por categorías)
7. **NO esquemas genéricos**: Si no puedes crear un esquema con información específica y útil, NO lo incluyas

**IMPORTANTE**: 
- El JSON DEBE ser válido y estar correctamente formateado.
- NO uses código Mermaid, solo JSON estructurado.
- Cada esquema debe ayudar REALMENTE a entender el tema, no ser decorativo.

---

### INSTRUCCIONES FINALES CRÍTICAS:

1. **ESQUEMAS DEBEN SER EDUCATIVOS Y ÚTILES**: 
   - Cada esquema debe ayudar REALMENTE a entender el tema
   - NO generes esquemas genéricos o vacíos que no aporten información
   - Cada nodo debe contener información ESPECÍFICA del contenido, no etiquetas genéricas
   - Si no puedes crear un esquema útil con información específica, NO lo incluyas

2. **ESTRUCTURA JERÁRQUICA CLARA**: 
   - Organiza los conceptos de manera pedagógica (de lo general a lo específico)
   - Usa colores para diferenciar categorías o tipos de conceptos
   - Muestra relaciones lógicas entre conceptos (jerarquía, categorización, proceso, etc.)

3. **NO GENERES APARTADOS VACÍOS**: Si un apartado no tiene conceptos clave o información suficiente para crear un esquema útil, NO lo incluyas en la respuesta. Solo crea apartados que tengan contenido real y esquemas válidos.

4. **JSON DE DIAGRAMA REAL**: NO uses placeholders. DEBES escribir el JSON completo y válido dentro de bloques \`\`\`diagram-json. El JSON DEBE estar completo - NO lo cortes a mitad de un campo, NO dejes campos incompletos, asegúrate de cerrar todas las llaves y corchetes.

5. **NO GENERES DIAGRAMAS GANTT**: Si el contenido incluye calendarios, cronogramas o líneas de tiempo, NO uses diagramas gantt de Mermaid. En su lugar, presenta la información en formato de tabla o lista estructurada.

6. **ESTRUCTURA OBLIGATORIA**: Cada apartado DEBE tener:
   - Título del apartado (##)
   - Explicación del apartado con conceptos clave
   - Al menos UN esquema conceptual EDUCATIVO con JSON de diagrama completo dentro del apartado
   - El esquema debe tener mínimo 4 nodos y máximo 8 nodos
   
7. **NO INCLUYAS MENSAJES DE ERROR**: Si no hay información suficiente, NO escribas mensajes como "no es posible crear esquemas" o "ausencia de información". Simplemente omite ese apartado completamente.

8. **VERIFICACIÓN DE CALIDAD**: Antes de finalizar, verifica que:
   - Cada esquema tiene información específica del contenido (no genérica)
   - Los nodos muestran conceptos reales y útiles
   - Las relaciones entre nodos tienen sentido pedagógico
   - Los colores ayudan a categorizar los conceptos

9. **PRIORIDAD**: Los esquemas EDUCATIVOS son MÁS IMPORTANTES que el texto descriptivo. Si tienes que elegir entre más texto o más esquemas útiles, elige más esquemas útiles.

10. **ÚLTIMA VERIFICACIÓN CRÍTICA**: Antes de enviar la respuesta, revisa que:
    - NO haya ningún bloque de código que comience con \`\`\`mermaid, \`\`\`gantt, \`\`\`flowchart, \`\`\`graph, \`\`\`sequenceDiagram, \`\`\`classDiagram, \`\`\`mindmap, etc.
    - Todos los esquemas tienen información específica y útil
    - Los esquemas ayudan realmente a entender el tema

**RECUERDA**: El objetivo es que un estudiante pueda entender y memorizar los conceptos clave del tema. Los esquemas conceptuales deben mostrar relaciones jerárquicas, categorías claras y información educativa específica que realmente ayude al aprendizaje.

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
