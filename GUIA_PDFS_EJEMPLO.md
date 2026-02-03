# Guía: PDFs de Ejemplo para Apuntes

## ¿Qué son los PDFs de ejemplo?

Los PDFs de ejemplo son documentos que muestran el formato, estilo y estructura que deseas que tengan los apuntes generados. La IA los usará como referencia para mantener la consistencia.

## ¿Cómo funcionan?

1. **Subes PDFs de ejemplo** cuando creas el curso
2. La IA **extrae el texto** de estos PDFs
3. Los usa como **referencia de formato** al generar los apuntes
4. Los apuntes generados seguirán el **mismo estilo y estructura**

## ¿Qué PDFs usar como ejemplo?

### ✅ Buenos ejemplos:
- Apuntes de clase que te gusten
- Apuntes de otros cursos con formato similar
- Documentos académicos bien estructurados
- Cualquier PDF que muestre el formato deseado

### ❌ Evitar:
- PDFs con mucho contenido irrelevante
- PDFs muy largos (se limitan a ~50k caracteres por ejemplo)
- PDFs escaneados de baja calidad (pueden tener problemas de OCR)

## Cómo proporcionar los PDFs

### Opción 1: En el request al crear el curso

```json
{
  "generate_summaries": true,
  "example_notes_pdfs": [
    "http://localhost:8000/api/files/ejemplo-apuntes-1.pdf",
    "http://localhost:8000/api/files/ejemplo-apuntes-2.pdf"
  ],
  ...
}
```

### Opción 2: Subir primero y usar las URLs

1. Sube los PDFs de ejemplo usando el endpoint de upload
2. Obtén las URLs de los archivos subidos
3. Inclúyelas en `example_notes_pdfs` al crear el curso

## Ejemplo completo

```json
{
  "creator_id": "tu-user-id",
  "title": "Base de Datos",
  "description": "Curso de bases de datos",
  "price": 10.0,
  "topics": [
    {
      "name": "SQL",
      "pdfs": ["http://localhost:8000/api/files/sql-tema.pdf"]
    }
  ],
  "generate_summaries": true,
  "gemini_model": "gemini-3-pro",
  "example_notes_pdfs": [
    "http://localhost:8000/api/files/ejemplo-formato-1.pdf",
    "http://localhost:8000/api/files/ejemplo-formato-2.pdf"
  ],
  "additional_comments": "Enfócate en los conceptos clave para el examen"
}
```

## Ventajas de usar PDFs de ejemplo

1. **Consistencia**: Todos los apuntes seguirán el mismo formato
2. **Calidad**: La IA entiende mejor el estilo deseado
3. **Personalización**: Puedes usar el formato de tu academia/universidad
4. **Eficiencia**: No necesitas describir el formato en texto

## Limitaciones

- Cada PDF de ejemplo se limita a ~50,000 caracteres
- Se recomienda usar 1-3 PDFs de ejemplo (más puede ser excesivo)
- Los PDFs deben tener texto extraíble (no solo imágenes escaneadas)

## Consejos

1. **Selecciona PDFs representativos**: Que muestren bien el formato deseado
2. **Variedad moderada**: 1-2 ejemplos suelen ser suficientes
3. **Calidad**: Mejor pocos PDFs de buena calidad que muchos de baja calidad
4. **Relevancia**: Los ejemplos deben ser del mismo tipo de contenido (académico, técnico, etc.)

## Notas técnicas

- Los PDFs de ejemplo se procesan una sola vez al crear el curso
- Se extrae el texto y se incluye en el prompt para cada apartado/subapartado
- No afectan significativamente el costo (solo añaden tokens de entrada)
- Se pueden combinar con `additional_comments` para mayor control

