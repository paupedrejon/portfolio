"""
Ejemplo Simple: Primer Agente Funcional
Ideal para entender los conceptos básicos
"""

from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

# ============================================================================
# AGENTE 1: Asistente de Preguntas y Respuestas
# ============================================================================

class SimpleQAAgent:
    """Agente simple que responde preguntas"""
    
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.memory = []  # Memoria simple (en producción usar ChromaDB)
    
    def learn(self, text: str):
        """El agente 'aprende' nueva información"""
        self.memory.append(text)
        print(f"✅ Aprendido: {text[:50]}...")
    
    def ask(self, question: str) -> str:
        """Hace una pregunta al agente"""
        
        # Construir contexto con la memoria
        context = "\n".join(self.memory) if self.memory else "No hay información todavía."
        
        # Crear el prompt
        prompt = f"""
        Eres un asistente educativo experto.
        
        Información que conoces:
        {context}
        
        Pregunta del estudiante: {question}
        
        Responde de manera clara y educativa basándote en la información que conoces.
        Si no sabes algo, dilo claramente.
        """
        
        try:
            # Llamar a la API de OpenAI
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "Eres un profesor paciente y claro. Explicas conceptos de manera sencilla."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7
            )
            
            answer = response.choices[0].message.content
            return answer
            
        except Exception as e:
            return f"❌ Error: {str(e)}"


# ============================================================================
# AGENTE 2: Generador de Tests
# ============================================================================

class SimpleTestAgent:
    """Agente que genera tests"""
    
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.memory = []
    
    def learn(self, text: str):
        """El agente 'aprende' nueva información"""
        self.memory.append(text)
    
    def generate_test(self, num_questions: int = 5) -> dict:
        """Genera un test basado en lo que sabe"""
        
        context = "\n".join(self.memory) if self.memory else "No hay información."
        
        prompt = f"""
        Eres un experto en evaluación educativa.
        
        Contenido del temario:
        {context}
        
        Genera {num_questions} preguntas de opción múltiple en formato JSON:
        {{
            "questions": [
                {{
                    "id": "q1",
                    "question": "Pregunta aquí",
                    "options": ["A) Opción 1", "B) Opción 2", "C) Opción 3", "D) Opción 4"],
                    "correct": "A"
                }}
            ]
        }}
        
        Solo devuelve el JSON, sin texto adicional.
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Eres un experto en evaluación educativa."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8
            )
            
            # Parsear JSON de la respuesta
            import json
            answer = response.choices[0].message.content
            
            # Limpiar respuesta (a veces incluye markdown)
            if "```json" in answer:
                answer = answer.split("```json")[1].split("```")[0]
            elif "```" in answer:
                answer = answer.split("```")[1].split("```")[0]
            
            test_data = json.loads(answer.strip())
            return test_data
            
        except Exception as e:
            return {"error": f"Error generando test: {str(e)}"}


# ============================================================================
# SISTEMA COORDINADOR: Conecta los Agentes
# ============================================================================

class SimpleStudySystem:
    """Sistema simple que coordina los agentes"""
    
    def __init__(self):
        # Crear agentes
        self.qa_agent = SimpleQAAgent()
        self.test_agent = SimpleTestAgent()
        
        # Memoria compartida (simple)
        self.shared_memory = []
    
    def add_knowledge(self, text: str):
        """Añade conocimiento que ambos agentes pueden usar"""
        self.shared_memory.append(text)
        # Ambos agentes aprenden lo mismo
        self.qa_agent.learn(text)
        self.test_agent.learn(text)
        print(f"📚 Conocimiento añadido a la memoria compartida")
    
    def ask(self, question: str) -> str:
        """Hace una pregunta"""
        return self.qa_agent.ask(question)
    
    def create_test(self, num_questions: int = 5) -> dict:
        """Genera un test"""
        return self.test_agent.generate_test(num_questions)


# ============================================================================
# EJEMPLO DE USO
# ============================================================================

def main():
    print("=" * 60)
    print("🎓 SISTEMA DE ESTUDIO SIMPLE")
    print("=" * 60)
    
    # Crear sistema
    system = SimpleStudySystem()
    
    # 1. Añadir conocimiento
    print("\n📖 Añadiendo conocimiento...")
    system.add_knowledge("""
    La Inteligencia Artificial (IA) es una rama de la informática que se dedica 
    a crear sistemas capaces de realizar tareas que normalmente requieren inteligencia humana.
    
    Machine Learning es un subconjunto de la IA que permite a las máquinas aprender 
    de datos sin ser programadas explícitamente.
    
    Deep Learning es un tipo de Machine Learning que usa redes neuronales con múltiples capas.
    """)
    
    # 2. Hacer una pregunta
    print("\n❓ Haciendo pregunta...")
    question = "¿Qué es la inteligencia artificial y cómo se relaciona con Machine Learning?"
    answer = system.ask(question)
    
    print(f"\nPregunta: {question}")
    print(f"\nRespuesta:\n{answer}\n")
    
    # 3. Generar test
    print("\n📝 Generando test...")
    test = system.create_test(num_questions=3)
    
    if "error" not in test:
        print(f"\n✅ Test generado con {len(test.get('questions', []))} preguntas:")
        for q in test.get('questions', [])[:2]:  # Mostrar primeras 2
            print(f"\n  {q.get('question', 'N/A')}")
            for opt in q.get('options', []):
                print(f"    {opt}")
            print(f"  ✓ Correcta: {q.get('correct', 'N/A')}")
    else:
        print(f"\n❌ {test.get('error')}")
    
    print("\n" + "=" * 60)
    print("✅ Ejemplo completado")
    print("=" * 60)


if __name__ == "__main__":
    # Verificar que existe la API key
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  ERROR: OPENAI_API_KEY no configurada")
        print("   Crea un archivo .env con: OPENAI_API_KEY=tu_key_aqui")
        exit(1)
    
    main()

