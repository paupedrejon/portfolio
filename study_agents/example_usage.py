"""
Ejemplo de uso del sistema Study Agents
"""

from main import StudyAgentsSystem
import os

def example_workflow():
    """
    Ejemplo completo del flujo de trabajo del sistema
    """
    print("=" * 70)
    print("🎓 EJEMPLO DE USO - STUDY AGENTS")
    print("=" * 70)
    
    # Inicializar sistema
    system = StudyAgentsSystem()
    
    # 1. SUBIR DOCUMENTOS
    print("\n" + "=" * 70)
    print("PASO 1: Subir documentos")
    print("=" * 70)
    
    # Nota: Asegúrate de tener documentos PDF en la carpeta documents/
    document_paths = [
        # "documents/temario1.pdf",
        # "documents/temario2.pdf",
    ]
    
    if document_paths and all(os.path.exists(path) for path in document_paths):
        result = system.upload_documents(document_paths)
        print(f"✅ {result['total_documents']} documentos procesados")
        print(f"📚 {result['total_chunks']} chunks creados")
    else:
        print("⚠️  No se encontraron documentos. Crea una carpeta 'documents/' y añade PDFs.")
        print("   Por ahora continuamos con el ejemplo sin documentos...")
    
    # 2. GENERAR EXPLICACIONES
    print("\n" + "=" * 70)
    print("PASO 2: Generar explicaciones")
    print("=" * 70)
    
    # explanations = system.generate_explanations()
    # for concept, explanation in explanations.items():
    #     print(f"\n📖 {concept}:")
    #     print(explanation[:200] + "...")
    
    print("💡 Las explicaciones se generan automáticamente al procesar documentos")
    
    # 3. HACER PREGUNTAS
    print("\n" + "=" * 70)
    print("PASO 3: Hacer preguntas al sistema")
    print("=" * 70)
    
    questions = [
        "¿Qué es la inteligencia artificial?",
        "¿Cuáles son los conceptos principales?",
        "Explícame el primer tema del temario"
    ]
    
    for question in questions:
        print(f"\n❓ Pregunta: {question}")
        # answer = system.ask_question(question)
        # print(f"💡 Respuesta: {answer[:200]}...")
        print("💡 (Respuesta simulada - descomenta para usar con documentos reales)")
    
    # 4. GENERAR TEST
    print("\n" + "=" * 70)
    print("PASO 4: Generar test")
    print("=" * 70)
    
    # test = system.generate_test(difficulty="medium", num_questions=5)
    # if "error" not in test:
    #     print(f"✅ Test generado: {test['test_id']}")
    #     print(f"📝 {len(test['questions'])} preguntas creadas")
    #     for q in test['questions'][:2]:  # Mostrar primeras 2
    #         print(f"\n  - {q.get('question', 'N/A')}")
    # else:
    #     print(f"❌ Error: {test.get('error')}")
    
    print("💡 (Test simulado - descomenta para usar con documentos reales)")
    
    # 5. CORREGIR TEST
    print("\n" + "=" * 70)
    print("PASO 5: Corregir test y obtener feedback")
    print("=" * 70)
    
    # Ejemplo de respuestas del estudiante
    # student_answers = {
    #     "q1": "A",
    #     "q2": "True",
    #     "q3": "La inteligencia artificial es..."
    # }
    # 
    # feedback = system.grade_test(test_id="test_001", answers=student_answers)
    # if "error" not in feedback:
    #     print(f"📊 Puntuación: {feedback['score']*100:.1f}%")
    #     print(f"✅ Correctas: {feedback['correct_answers']}/{feedback['total_questions']}")
    #     print(f"\n💬 Feedback general:")
    #     print(f"   {feedback['general_feedback']}")
    #     print(f"\n📋 Recomendaciones:")
    #     for rec in feedback['recommendations']:
    #         print(f"   - {rec}")
    # else:
    #     print(f"❌ Error: {feedback.get('error')}")
    
    print("💡 (Feedback simulado - descomenta para usar con documentos reales)")
    
    print("\n" + "=" * 70)
    print("✅ Ejemplo completado")
    print("=" * 70)
    print("\n📖 Para usar el sistema completo:")
    print("   1. Añade documentos PDF en la carpeta 'documents/'")
    print("   2. Configura tu OPENAI_API_KEY en .env")
    print("   3. Ejecuta: python main.py")
    print("   4. O usa este ejemplo: python example_usage.py")


if __name__ == "__main__":
    # Verificar que existe la API key
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  ADVERTENCIA: OPENAI_API_KEY no configurada")
        print("   Crea un archivo .env con tu API key de OpenAI")
        print("   O exporta la variable: export OPENAI_API_KEY=tu_key")
    
    example_workflow()

