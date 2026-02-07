"""
Sistema para resumir historiales de conversación largos
Mantiene información clave mientras reduce el tamaño del contexto
"""

import json
from typing import List, Dict, Optional
from datetime import datetime


def summarize_conversation_history(
    history: List[Dict],
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    max_messages: int = 15,
    use_llm: bool = True
) -> Dict[str, any]:
    """
    Resume un historial de conversación largo manteniendo información clave
    
    Args:
        history: Lista de mensajes del historial
        api_key: API key para usar LLM (opcional)
        model: Modelo a usar (opcional, si no se especifica usa modo automático)
        max_messages: Número máximo de mensajes a mantener sin resumir
        use_llm: Si True, usa LLM para generar resumen inteligente. Si False, usa método heurístico
        
    Returns:
        Dict con:
            - summary: Resumen del historial
            - recent_messages: Últimos N mensajes (sin resumir)
            - key_topics: Temas principales discutidos
            - student_progress: Progreso del estudiante identificado
            - difficulties: Dificultades identificadas
    """
    if not history or len(history) == 0:
        return {
            "summary": "",
            "recent_messages": [],
            "key_topics": [],
            "student_progress": {},
            "difficulties": []
        }
    
    # Si el historial es corto, no necesita resumen
    if len(history) <= max_messages:
        return {
            "summary": "",
            "recent_messages": history,
            "key_topics": _extract_topics_heuristic(history),
            "student_progress": {},
            "difficulties": []
        }
    
    # Separar mensajes recientes (sin resumir) y antiguos (a resumir)
    recent_messages = history[-max_messages:]
    old_messages = history[:-max_messages]
    
    if use_llm and api_key:
        # Usar LLM para generar resumen inteligente
        return _summarize_with_llm(old_messages, recent_messages, api_key, model)
    else:
        # Usar método heurístico (más rápido, menos preciso)
        return _summarize_heuristic(old_messages, recent_messages)


def _summarize_with_llm(
    old_messages: List[Dict],
    recent_messages: List[Dict],
    api_key: str,
    model: Optional[str] = None
) -> Dict[str, any]:
    """Resume usando LLM para mejor calidad"""
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import HumanMessage, SystemMessage
        
        # Construir texto del historial antiguo
        old_text = ""
        for msg in old_messages:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            if role == "user":
                old_text += f"ESTUDIANTE: {content}\n\n"
            elif role == "assistant":
                old_text += f"ASISTENTE: {content}\n\n"
        
        # Prompt para resumir
        system_prompt = """Eres un asistente que resume conversaciones educativas. 
Tu tarea es extraer información clave de una conversación entre un estudiante y un tutor.

Extrae y estructura:
1. **Temas principales discutidos** (lista)
2. **Progreso del estudiante** (qué ha aprendido, qué conceptos domina)
3. **Dificultades identificadas** (qué le cuesta al estudiante)
4. **Preguntas clave** (preguntas importantes que hizo el estudiante)
5. **Explicaciones importantes** (conceptos clave que se explicaron)

Formato de salida (JSON):
{
    "summary": "Resumen narrativo breve de la conversación",
    "key_topics": ["tema1", "tema2", ...],
    "student_progress": {
        "concepts_understood": ["concepto1", "concepto2"],
        "skills_acquired": ["habilidad1", "habilidad2"]
    },
    "difficulties": ["dificultad1", "dificultad2"],
    "key_questions": ["pregunta1", "pregunta2"],
    "key_explanations": ["explicación1", "explicación2"]
}"""

        user_prompt = f"""Resume la siguiente conversación educativa:

{old_text}

Extrae la información clave en formato JSON."""

        # Usar modelo más barato para resumir
        llm = ChatOpenAI(
            model=model or "gpt-3.5-turbo",
            temperature=0.3,  # Baja temperatura para resúmenes más precisos
            api_key=api_key
        )
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = llm.invoke(messages)
        response_text = response.content
        
        # Intentar parsear JSON
        try:
            # Limpiar respuesta si tiene markdown
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            summary_data = json.loads(response_text)
        except json.JSONDecodeError:
            # Si no es JSON válido, usar el texto como resumen
            summary_data = {
                "summary": response_text,
                "key_topics": _extract_topics_heuristic(old_messages),
                "student_progress": {},
                "difficulties": [],
                "key_questions": [],
                "key_explanations": []
            }
        
        return {
            "summary": summary_data.get("summary", ""),
            "recent_messages": recent_messages,
            "key_topics": summary_data.get("key_topics", []),
            "student_progress": summary_data.get("student_progress", {}),
            "difficulties": summary_data.get("difficulties", []),
            "key_questions": summary_data.get("key_questions", []),
            "key_explanations": summary_data.get("key_explanations", [])
        }
        
    except Exception as e:
        print(f"⚠️ Error resumiendo con LLM: {e}")
        # Fallback a método heurístico
        return _summarize_heuristic(old_messages, recent_messages)


def _summarize_heuristic(
    old_messages: List[Dict],
    recent_messages: List[Dict]
) -> Dict[str, any]:
    """Resume usando método heurístico (sin LLM)"""
    # Extraer información clave de forma heurística
    key_topics = _extract_topics_heuristic(old_messages)
    difficulties = _extract_difficulties_heuristic(old_messages)
    key_questions = _extract_key_questions_heuristic(old_messages)
    
    # Crear resumen narrativo simple
    summary_parts = []
    if key_topics:
        summary_parts.append(f"Temas discutidos: {', '.join(key_topics[:5])}")
    if difficulties:
        summary_parts.append(f"Dificultades: {', '.join(difficulties[:3])}")
    if key_questions:
        summary_parts.append(f"Preguntas clave: {len(key_questions)} preguntas importantes")
    
    summary = ". ".join(summary_parts) if summary_parts else "Conversación previa sobre el tema."
    
    return {
        "summary": summary,
        "recent_messages": recent_messages,
        "key_topics": key_topics,
        "student_progress": {},
        "difficulties": difficulties,
        "key_questions": key_questions,
        "key_explanations": []
    }


def _extract_topics_heuristic(messages: List[Dict]) -> List[str]:
    """Extrae temas principales de forma heurística"""
    topics = set()
    keywords = ["tema", "concepto", "sobre", "acerca de", "explicar", "entender"]
    
    for msg in messages:
        content = msg.get("content", "").lower()
        # Buscar frases que indiquen temas
        if any(keyword in content for keyword in keywords):
            # Intentar extraer el tema (simple heurística)
            words = content.split()
            for i, word in enumerate(words):
                if word in keywords and i + 1 < len(words):
                    # Tomar siguientes 2-3 palabras como posible tema
                    topic = " ".join(words[i+1:i+4])
                    if len(topic) > 5 and len(topic) < 50:
                        topics.add(topic.capitalize())
    
    return list(topics)[:10]  # Limitar a 10 temas


def _extract_difficulties_heuristic(messages: List[Dict]) -> List[str]:
    """Extrae dificultades mencionadas"""
    difficulties = set()
    difficulty_keywords = [
        "no entiendo", "no comprendo", "dificultad", "problema", 
        "confuso", "complicado", "no sé", "ayuda con"
    ]
    
    for msg in messages:
        if msg.get("role") == "user":
            content = msg.get("content", "").lower()
            if any(keyword in content for keyword in difficulty_keywords):
                # Extraer frase completa como dificultad
                for keyword in difficulty_keywords:
                    if keyword in content:
                        idx = content.find(keyword)
                        difficulty = content[idx:idx+100].strip()
                        if len(difficulty) > 10:
                            difficulties.add(difficulty.capitalize())
    
    return list(difficulties)[:5]


def _extract_key_questions_heuristic(messages: List[Dict]) -> List[str]:
    """Extrae preguntas importantes del estudiante"""
    questions = []
    
    for msg in messages:
        if msg.get("role") == "user":
            content = msg.get("content", "")
            # Detectar preguntas (terminan con ? o empiezan con palabras interrogativas)
            if "?" in content or any(word in content.lower()[:20] for word in ["qué", "cómo", "por qué", "cuándo", "dónde", "cuál"]):
                # Limpiar y acortar
                question = content.strip()
                if len(question) > 10 and len(question) < 200:
                    questions.append(question)
    
    return questions[:10]  # Limitar a 10 preguntas


def format_summarized_history(summary_data: Dict) -> str:
    """
    Formatea el resumen del historial para incluir en el contexto
    
    Args:
        summary_data: Datos del resumen generado por summarize_conversation_history
        
    Returns:
        String formateado para usar como contexto
    """
    parts = []
    
    if summary_data.get("summary"):
        parts.append(f"📋 RESUMEN DE CONVERSACIÓN PREVIA:\n{summary_data['summary']}")
    
    if summary_data.get("key_topics"):
        topics_str = ", ".join(summary_data["key_topics"][:5])
        parts.append(f"\n📚 Temas principales discutidos: {topics_str}")
    
    if summary_data.get("student_progress", {}).get("concepts_understood"):
        concepts = summary_data["student_progress"]["concepts_understood"]
        parts.append(f"\n✅ Conceptos que el estudiante ya entiende: {', '.join(concepts[:5])}")
    
    if summary_data.get("difficulties"):
        difficulties_str = ", ".join(summary_data["difficulties"][:3])
        parts.append(f"\n⚠️ Dificultades identificadas: {difficulties_str}")
    
    if summary_data.get("key_questions"):
        parts.append(f"\n❓ Preguntas importantes previas: {len(summary_data['key_questions'])} preguntas")
    
    return "\n".join(parts) if parts else ""

