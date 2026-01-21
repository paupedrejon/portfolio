"""
Correction Agent - Revisa y mejora las respuestas del chat
Analiza si las respuestas tienen sentido en el contexto de la conversación
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

from typing import Optional, List, Dict
from langchain_openai import ChatOpenAI
from memory.memory_manager import MemoryManager
import sys
import json
import re

# Importar model_manager
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from model_manager import ModelManager
except ImportError:
    ModelManager = None
    print("⚠️ Warning: model_manager no disponible, usando OpenAI directamente")


class CorrectionAgent:
    """
    Agente especializado en revisar y corregir respuestas del chat
    Analiza si las respuestas tienen sentido en el contexto de la conversación
    """
    
    def __init__(self, memory: MemoryManager, api_key: Optional[str] = None, mode: str = "auto"):
        """
        Inicializa el agente corrector
        
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
                print("🔍 Correction Agent inicializado con ModelManager (modo automático)")
            except Exception as e:
                print(f"⚠️ Warning: No se pudo inicializar ModelManager: {e}")
                self.model_manager = None
        else:
            # Fallback a OpenAI directo
            if self.api_key:
                try:
                    self.llm = ChatOpenAI(
                        model="gpt-3.5-turbo",  # Usar modelo más barato por defecto
                        temperature=0.3,  # Baja temperatura para análisis preciso
                        api_key=self.api_key,
                        max_tokens=None
                    )
                    print("🔍 Correction Agent inicializado (sin ModelManager, usando gpt-3.5-turbo)")
                except Exception as e:
                    print(f"⚠️ Warning: No se pudo inicializar el LLM: {e}")
            else:
                print("⚠️ Correction Agent inicializado sin API key (se requerirá para usar)")
    
    def review_and_correct(
        self, 
        response: str, 
        question: str, 
        conversation_history: Optional[List[Dict]] = None,
        topic: Optional[str] = None,
        context: Optional[str] = None,
        model: Optional[str] = None,
        user_level: Optional[int] = None,
        is_notes: bool = False,
        previous_notes: Optional[str] = None,
        user_id: Optional[str] = None,
        chat_id: Optional[str] = None
    ) -> tuple[str, bool, Dict, Optional[int]]:
        """
        Revisa una respuesta y la corrige si es necesario
        
        Args:
            response: Respuesta generada que se debe revisar
            question: Pregunta original del usuario
            conversation_history: Historial de conversación (opcional)
            topic: Tema del chat (opcional)
            context: Contexto adicional del temario (opcional)
            model: Modelo preferido (opcional)
            
        Returns:
            Tupla con (respuesta corregida, necesita_correccion: bool, análisis: dict)
        """
        # Inicializar LLM si es necesario
        if not self.llm:
            if self.model_manager:
                try:
                    # Usar modelo más barato para revisión (no necesita ser tan potente)
                    self.current_model_config, self.llm = self.model_manager.select_model(
                        task_type="analysis",
                        min_quality="low",
                        preferred_model=model if model else None,
                        context_length=4000
                    )
                    # Ajustar temperatura para análisis preciso
                    if hasattr(self.llm, 'temperature'):
                        self.llm.temperature = 0.3
                    print(f"✅ Usando modelo para corrección: {self.current_model_config.name}")
                except Exception as e:
                    print(f"⚠️ Error al seleccionar modelo: {e}")
                    if self.api_key:
                        try:
                            self.llm = ChatOpenAI(
                                model="gpt-3.5-turbo",
                                temperature=0.3,
                                api_key=self.api_key,
                                max_tokens=None
                            )
                        except Exception as e2:
                            return response, False, {"error": str(e2)}
            else:
                if not self.api_key:
                    return response, False, {"error": "No API key available"}
                try:
                    model_to_use = model if model else "gpt-3.5-turbo"
                    self.llm = ChatOpenAI(
                        model=model_to_use,
                        temperature=0.3,
                        api_key=self.api_key,
                        max_tokens=None
                    )
                except Exception as e:
                    return response, False, {"error": str(e)}
        
        # Preparar historial de conversación
        history_str = ""
        if conversation_history:
            history_str = "\n".join([
                f"[{msg.get('role', 'unknown')}]: {msg.get('content', '')}"
                for msg in conversation_history[-10:]  # Últimos 10 mensajes
            ])
        
        # Preparar contexto del tema
        topic_context = ""
        if topic:
            topic_context = f"\nTema de la conversación: {topic}"
        
        # Preparar contexto del temario
        context_str = ""
        if context:
            context_str = f"\nContexto del temario disponible:\n{context[:2000]}"  # Limitar tamaño
        
        # Prompt para revisar y corregir
        # Definir variables para evitar backslashes en f-string
        newline_escape = "\\n"
        quote_escape = '\\"'
        review_prompt = f"""Eres un revisor experto de respuestas educativas. Tu tarea es analizar si una respuesta tiene sentido en el contexto de la conversación y corregirla si es necesario.

PREGUNTA DEL USUARIO:
{question}

{topic_context}

{context_str}

HISTORIAL DE CONVERSACIÓN:
{history_str if history_str else "No hay historial previo."}

RESPUESTA GENERADA A REVISAR:
{response}

{f"APUNTES ANTERIORES (para comparar variación):\n{previous_notes[:1500] if previous_notes else 'No hay apuntes anteriores para comparar.'}" if is_notes else ""}

---

### 🔍 REVISIÓN CRÍTICA OBLIGATORIA (Responde a TODAS estas preguntas):

**1. ¿ES COHERENTE LO QUE HA RESPONDIDO?**
   - ¿La respuesta tiene sentido lógico?
   - ¿Las ideas están conectadas de manera coherente?
   - ¿Hay contradicciones internas?
   - ¿La información fluye de manera lógica?

**2. ¿SE ESTÁ RESPONDIENDO A LO QUE EL USUARIO PIDE?**
   - ¿Responde DIRECTAMENTE a la pregunta específica?
   - ¿Se desvía del tema o pregunta cosas no relacionadas?
   - ¿Aborda todos los aspectos de la pregunta?
   - ¿Es relevante para lo que el usuario necesita saber?

**3. ¿SE ESTÁ RESPONDIENDO ADECUADAMENTE SEGÚN EL CONTEXTO?**
   - ¿Usa el contexto del temario si está disponible?
   - ¿Es coherente con el historial de conversación?
   - ¿Está relacionada con el tema del chat si hay uno?
   - ¿Ignora información relevante del contexto?

**4. ¿SE ESTÁ EXPLICANDO BIEN Y FÁCIL DE ENTENDER PARA EL NIVEL DEL ESTUDIANTE?**
   - ¿El lenguaje es apropiado para el nivel del estudiante?
   - ¿Las explicaciones son claras y comprensibles?
   - ¿Usa ejemplos apropiados para el nivel?
   - ¿Es demasiado compleja o demasiado simple para el nivel?
   - ¿Estructura la información de manera pedagógica?

**5. ¿APORTA ALGO NUEVO O ÚTIL PARA EL USUARIO?**
   - ¿Aporta información nueva o útil?
   - ¿Es solo información genérica que no ayuda?
   - ¿Ayuda al estudiante a entender mejor el concepto?
   - ¿Proporciona ejemplos, casos de uso o información práctica?
   - ¿Es información que el estudiante puede aplicar o repasar?
   {f"- **CRÍTICO PARA APUNTES**: ¿Es diferente a apuntes generados anteriormente?" if is_notes else ""}
   {f"- ¿Incluye contenido, ejemplos o vocabulario diferente a generaciones previas?" if is_notes else ""}
   {f"- ¿Los ejemplos, palabras o frases son los mismos que en apuntes anteriores?" if is_notes else ""}
   {f"- Si los apuntes anteriores están disponibles arriba, COMPÁRALOS y verifica que haya VARIACIÓN significativa" if is_notes else ""}

### 🎯 INSTRUCCIONES CRÍTICAS:

**SE MUY ESTRICTO Y CRÍTICO:**
- Si la respuesta NO responde directamente a la pregunta → CORRIGE
- Si la respuesta es demasiado genérica o vaga → CORRIGE
- Si la respuesta ignora el contexto disponible → CORRIGE
- Si la respuesta no es apropiada para el nivel del estudiante → CORRIGE
- Si la respuesta no aporta nada útil o nuevo → CORRIGE
- Si la respuesta tiene contradicciones o incoherencias → CORRIGE
{f"- **CRÍTICO PARA APUNTES**: Si los apuntes son muy similares o idénticos a apuntes anteriores → CORRIGE y genera contenido DIFERENTE" if is_notes else ""}
{f"- Si los ejemplos, vocabulario o estructura son los mismos que antes → CORRIGE" if is_notes else ""}
{f"- Si más del 50% del contenido es idéntico o muy similar a apuntes anteriores → CORRIGE" if is_notes else ""}

**AL CORREGIR:**
- Genera una respuesta COMPLETAMENTE NUEVA Y MEJORADA que:
  * Responda DIRECTAMENTE a la pregunta
  * Use el contexto del temario si está disponible
  * Sea apropiada para el nivel del estudiante
  * Sea clara, bien estructurada y fácil de entender
  * Aporte información útil, ejemplos o casos prácticos DIFERENTES
  * Mantenga el formato Markdown de la original
  * Sea coherente con el historial de conversación
  {f"* **CRÍTICO**: Si corriges apuntes, genera contenido COMPLETAMENTE DIFERENTE - diferentes ejemplos, vocabulario, estructura y organización" if is_notes else ""}
  {f"* NO repitas las mismas secciones, ejemplos o vocabulario de apuntes anteriores" if is_notes else ""}
  {f"* Varía el orden de las secciones y el contenido dentro de cada sección" if is_notes else ""}

### FORMATO DE RESPUESTA:

Responde SOLO con un JSON válido en este formato exacto:

```json
{{
  "necesita_correccion": true/false,
  "problemas_detectados": [
    "Problema específico 1",
    "Problema específico 2"
  ],
  "respuesta_corregida": "Respuesta mejorada aquí (si necesita_correccion es true, genera una versión MEJORADA. Si es false, repite la original)",
  "analisis": "Explicación detallada de por qué se necesita o no corrección, respondiendo a las 6 preguntas críticas",
  "nivel_recomendado": null o número entre 0-10
}}
```

**SOBRE nivel_recomendado:**
- Si el nivel actual es apropiado, establece `null`
- Si el contenido es demasiado complejo para el usuario, BAJA el nivel (ej: si es nivel 5 y parece difícil, recomienda 3-4)
- Si el contenido es demasiado simple y el usuario maneja bien conceptos avanzados, SUBE el nivel (ej: si es nivel 3 y maneja bien, recomienda 4-5)
- Solo ajusta si hay evidencia clara de que el nivel no es apropiado

**IMPORTANTE:**
- Sé MUY CRÍTICO: si hay CUALQUIER problema, establece `necesita_correccion: true`
- La respuesta corregida debe ser SIGNIFICATIVAMENTE MEJOR y DIFERENTE que la original
- Si corriges, genera una respuesta COMPLETAMENTE NUEVA, no solo pequeños ajustes
- {f"**CRÍTICO PARA APUNTES**: Si detectas similitud con apuntes anteriores, genera contenido TOTALMENTE DIFERENTE - diferentes secciones, ejemplos, vocabulario y estructura" if is_notes else ""}
- Mantén el formato Markdown (títulos, listas, negritas, etc.)
- Si hay contexto del temario, ÚSALO en la corrección
- Adapta el lenguaje y complejidad al nivel del estudiante
- **CRÍTICO**: El JSON debe ser válido. Escapa correctamente las comillas y caracteres especiales en el campo "respuesta_corregida"
- Si "respuesta_corregida" contiene comillas, saltos de línea o caracteres especiales, escápalos correctamente ({newline_escape} para saltos de línea, {quote_escape} para comillas)"""

        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            messages = [
                SystemMessage(content="Eres un revisor experto de respuestas educativas. Analizas y corriges respuestas para que sean claras, precisas y contextualizadas."),
                HumanMessage(content=review_prompt)
            ]
            
            review_response = self.llm.invoke(messages)
            review_content = review_response.content
            
            # Extraer JSON de la respuesta
            # Buscar el bloque JSON
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', review_content, re.DOTALL)
            if not json_match:
                # Intentar sin el bloque de código
                json_match = re.search(r'(\{.*?\})', review_content, re.DOTALL)
            
            if json_match:
                json_str = json_match.group(1) if json_match.lastindex else json_match.group(0)
                
                # Intentar parsear el JSON con manejo robusto de errores
                try:
                    review_data = json.loads(json_str)
                except json.JSONDecodeError as parse_error:
                    print(f"⚠️ Error al parsear JSON, intentando limpiar: {parse_error}")
                    # Intentar extraer campos manualmente con regex más robusto
                    try:
                        necesita_match = re.search(r'"necesita_correccion"\s*:\s*(true|false)', json_str, re.IGNORECASE)
                        problemas_match = re.search(r'"problemas_detectados"\s*:\s*\[(.*?)\]', json_str, re.DOTALL)
                        # Para respuesta_corregida, buscar hasta el siguiente campo o fin
                        respuesta_match = re.search(r'"respuesta_corregida"\s*:\s*"((?:[^"\\]|\\.|\\n)*)"', json_str, re.DOTALL)
                        if not respuesta_match:
                            # Intentar sin escapar
                            respuesta_match = re.search(r'"respuesta_corregida"\s*:\s*"([^"]*(?:\\.[^"]*)*)"', json_str, re.DOTALL)
                        analisis_match = re.search(r'"analisis"\s*:\s*"((?:[^"\\]|\\.|\\n)*)"', json_str, re.DOTALL)
                        if not analisis_match:
                            analisis_match = re.search(r'"analisis"\s*:\s*"([^"]*(?:\\.[^"]*)*)"', json_str, re.DOTALL)
                        
                        necesita_correccion = necesita_match.group(1).lower() == 'true' if necesita_match else False
                        respuesta_corregida = respuesta_match.group(1) if respuesta_match else response
                        # Decodificar escapes básicos
                        if respuesta_corregida != response:
                            respuesta_corregida = respuesta_corregida.replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')
                        problemas = []
                        if problemas_match:
                            problemas_str = problemas_match.group(1)
                            problemas = [p.strip().strip('"').replace('\\"', '"') for p in re.findall(r'"([^"]*(?:\\.[^"]*)*)"', problemas_str)]
                        analisis = analisis_match.group(1) if analisis_match else ""
                        if analisis:
                            analisis = analisis.replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')
                        
                        # Intentar extraer nivel_recomendado también
                        nivel_match = re.search(r'"nivel_recomendado"\s*:\s*(null|\d+)', json_str, re.IGNORECASE)
                        nivel_recomendado = None
                        if nivel_match:
                            nivel_str = nivel_match.group(1)
                            if nivel_str.lower() != "null":
                                try:
                                    nivel_recomendado = int(nivel_str)
                                except ValueError:
                                    pass
                        
                        review_data = {
                            "necesita_correccion": necesita_correccion,
                            "respuesta_corregida": respuesta_corregida,
                            "problemas_detectados": problemas,
                            "analisis": analisis,
                            "nivel_recomendado": nivel_recomendado
                        }
                    except Exception as e2:
                        print(f"⚠️ Error al limpiar JSON manualmente: {e2}")
                        # Si todo falla pero detectamos que necesita corrección en el texto
                        if "necesita_correccion" in review_content.lower() and "true" in review_content.lower():
                            print("⚠️ Detectado que necesita corrección pero JSON inválido, forzando corrección")
                            return response, True, {"error": f"JSON inválido pero se detectó necesidad de corrección: {str(parse_error)}"}, None
                        return response, False, {"error": f"Error de parsing: {str(parse_error)}"}, None
                
                necesita_correccion = review_data.get("necesita_correccion", False)
                respuesta_corregida = review_data.get("respuesta_corregida", response)
                problemas = review_data.get("problemas_detectados", [])
                analisis = review_data.get("analisis", "")
                nivel_recomendado = review_data.get("nivel_recomendado", None)
                
                # Validar y ajustar nivel recomendado
                nivel_ajustado = None
                if nivel_recomendado is not None:
                    try:
                        nivel_recomendado = int(nivel_recomendado)
                        if 0 <= nivel_recomendado <= 10:
                            if user_level is None or nivel_recomendado != user_level:
                                nivel_ajustado = nivel_recomendado
                                print(f"📊 Agente corrector recomienda ajustar nivel: {user_level or 'N/A'} → {nivel_ajustado}/10")
                    except (ValueError, TypeError):
                        nivel_recomendado = None
                
                # Si necesita corrección pero la respuesta corregida es muy similar, forzar regeneración
                if necesita_correccion and is_notes:
                    similarity = self._calculate_similarity(response, respuesta_corregida)
                    if similarity > 0.7:  # Más del 70% similar
                        print(f"⚠️ Respuesta corregida es {similarity*100:.1f}% similar a la original, forzando regeneración")
                        return response, True, {
                            "problemas": problemas + ["Respuesta corregida demasiado similar a la original"],
                            "analisis": analisis + " La respuesta corregida necesita ser completamente diferente.",
                            "original_length": len(response),
                            "corregida_length": len(respuesta_corregida),
                            "similarity": similarity,
                            "force_regeneration": True
                        }, nivel_ajustado
                
                return respuesta_corregida, necesita_correccion, {
                    "problemas": problemas,
                    "analisis": analisis,
                    "original_length": len(response),
                    "corregida_length": len(respuesta_corregida)
                }, nivel_ajustado
            else:
                # Si no se puede parsear, devolver la original
                print("⚠️ No se pudo parsear la respuesta del revisor, usando respuesta original")
                return response, False, {"error": "No se pudo parsear la revisión"}, None
                
        except json.JSONDecodeError as e:
            print(f"⚠️ Error al parsear JSON de revisión: {e}")
            return response, False, {"error": f"Error de parsing: {str(e)}"}, None
        except Exception as e:
            print(f"⚠️ Error en revisión: {e}")
            import traceback
            traceback.print_exc()
            return response, False, {"error": str(e)}, None
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calcula la similitud entre dos textos (0.0 = completamente diferentes, 1.0 = idénticos)"""
        # Método simple: contar palabras comunes
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        common_words = words1.intersection(words2)
        total_words = words1.union(words2)
        
        return len(common_words) / len(total_words) if total_words else 0.0
