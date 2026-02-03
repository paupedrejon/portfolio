# Estimación de Costos - Generación de Resúmenes con Gemini

## Modelos Disponibles de Google Gemini (2025)

### Gemini 3 Pro ⭐ (Recomendado para apuntes de alta calidad)
- **Input (entrada)**: ~$2.50 por millón de tokens (estimado - VERIFICAR precio oficial)
- **Output (salida)**: ~$10.00 por millón de tokens (estimado - VERIFICAR precio oficial)
- **Uso**: Mejor calidad para generar apuntes detallados y completos

### Gemini 3 Flash
- **Input**: ~$0.10 por millón de tokens (estimado - VERIFICAR precio oficial)
- **Output**: ~$0.40 por millón de tokens (estimado - VERIFICAR precio oficial)
- **Uso**: Más rápido y económico, buena calidad

### Gemini 2.5 Pro
- **Input**: ~$1.25 por millón de tokens (estimado)
- **Output**: ~$5.00 por millón de tokens (estimado)
- **Uso**: Versión anterior, buena calidad

### Gemini 2.5 Flash
- **Input**: ~$0.075 por millón de tokens
- **Output**: ~$0.30 por millón de tokens
- **Uso**: Versión anterior, más económica

### Gemini 2.5 Flash-Lite
- **Input**: ~$0.0375 por millón de tokens
- **Output**: ~$0.15 por millón de tokens
- **Uso**: Versión más ligera y económica

**⚠️ NOTA IMPORTANTE**: Los precios mostrados son estimaciones. Los precios oficiales deben verificarse en [Google AI Studio](https://aistudio.google.com/) o la documentación oficial de Google Cloud.

**Conversión EUR**: ~1 USD = 0.92 EUR (aproximado)

## Estimación para un Curso Completo

### Ejemplo: Curso de una asignatura de la UPC

**Suposiciones:**
- 5 apartados principales
- 15 subapartados en total
- Promedio de 20 páginas por PDF
- ~750 tokens por página de PDF
- ~2000 tokens por resumen generado

**Cálculo:**

1. **Total de items a procesar**: 5 apartados + 15 subapartados = 20 items

2. **Tokens de entrada por item**:
   - PDF promedio: 20 páginas × 750 tokens = 15,000 tokens
   - Prompt base: ~500 tokens
   - **Total por item**: ~15,500 tokens

3. **Tokens de salida por item**: ~2,000 tokens

4. **Totales**:
   - Input total: 20 × 15,500 = 310,000 tokens
   - Output total: 20 × 2,000 = 40,000 tokens

5. **Costos (Gemini 3 Pro)** ⭐:
   - Input: (310,000 / 1,000,000) × $2.50 = **$0.78**
   - Output: (40,000 / 1,000,000) × $10.00 = **$0.40**
   - **Total USD**: $1.18
   - **Total EUR**: ~**1.09€**

   **Costos (Gemini 3 Flash)** (alternativa):
   - Input: (310,000 / 1,000,000) × $0.10 = **$0.03**
   - Output: (40,000 / 1,000,000) × $0.40 = **$0.02**
   - **Total USD**: $0.05
   - **Total EUR**: ~**0.05€**

### Ejemplo con más contenido (curso grande)

**Suposiciones:**
- 10 apartados principales
- 30 subapartados
- Promedio de 30 páginas por PDF

**Cálculo:**

1. **Total de items**: 40 items

2. **Tokens por item**:
   - Input: 30 × 750 + 500 = 23,000 tokens
   - Output: 2,000 tokens

3. **Totales**:
   - Input: 40 × 23,000 = 920,000 tokens
   - Output: 40 × 2,000 = 80,000 tokens

4. **Costos (Gemini 3 Pro)** ⭐:
   - Input: (920,000 / 1,000,000) × $2.50 = **$2.30**
   - Output: (80,000 / 1,000,000) × $10.00 = **$0.80**
   - **Total USD**: $3.10
   - **Total EUR**: ~**2.85€**

   **Costos (Gemini 3 Flash)** (alternativa):
   - Input: (920,000 / 1,000,000) × $0.10 = **$0.09**
   - Output: (80,000 / 1,000,000) × $0.40 = **$0.03**
   - **Total USD**: $0.12
   - **Total EUR**: ~**0.11€**

**Ahorro con Flash**: ~96% más económico, pero con calidad ligeramente inferior.

## Recomendaciones

1. **Para cursos pequeños (5-10 apartados)**: 
   - Costo estimado (Gemini 3 Pro): **1.00€ - 2.00€** ⭐
   - Costo estimado (Gemini 3 Flash): **0.05€ - 0.15€**
   - Recomendado: **Gemini 3 Pro** para máxima calidad de apuntes

2. **Para cursos medianos (10-20 apartados)**:
   - Costo estimado (Gemini 3 Pro): **2.00€ - 4.00€** ⭐
   - Costo estimado (Gemini 3 Flash): **0.15€ - 0.30€**
   - Recomendado: **Gemini 3 Pro** para apuntes completos y detallados

3. **Para cursos grandes (20+ apartados)**:
   - Costo estimado (Gemini 3 Pro): **4.00€ - 8.00€** ⭐
   - Costo estimado (Gemini 3 Flash): **0.30€ - 0.60€**
   - Opción económica: **Gemini 3 Flash** si el presupuesto es limitado

## Notas Importantes

- Los costos son **estimaciones** basadas en promedios
- El costo real puede variar según:
  - Tamaño real de los PDFs
  - Complejidad del contenido
  - Longitud de los resúmenes generados
- Los resúmenes se generan **una sola vez** al crear el curso
- Los resúmenes se guardan en el curso y se reutilizan para todos los estudiantes

## Implementación

El sistema:
1. Calcula automáticamente el costo estimado antes de generar
2. Verifica que el usuario tenga créditos suficientes
3. Deducir los créditos del wallet del creador
4. Genera los resúmenes en background
5. Guarda los resúmenes en el objeto del curso

Los resúmenes quedan disponibles para todos los estudiantes inscritos en el curso.

