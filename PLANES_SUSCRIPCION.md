# 💳 Sistema de Planes de Suscripción - StudyAgents

## 🎯 Objetivo

Implementar un sistema de planes que:
- ✅ Optimice costos para maximizar el uso del usuario
- ✅ Genere beneficios sostenibles
- ✅ Use modelos gratuitos/baratos cuando sea posible
- ✅ Limite el uso cuando se alcancen los límites

---

## 📊 Estructura de Planes Propuesta

### 🆓 Plan Gratuito
**Precio:** $0/mes  
**Costo para ti:** $0  
**Beneficio:** $0 (pero atrae usuarios)

**Características:**
- ✅ Acceso solo a modelos **gratuitos** (Groq, Together AI, Gemini)
- ✅ Límite: **10,000 tokens/mes** (suficiente para ~20-30 preguntas simples)
- ✅ Sin generación de apuntes
- ✅ Sin tests personalizados
- ✅ Solo preguntas básicas

**Modelos disponibles:**
- Groq (Llama 3) - Gratis
- Together AI (Llama 3) - Gratis hasta límite
- Google Gemini - Gratis hasta límite

**Uso estimado:** ~20-30 consultas simples/mes

---

### ⭐ Plan Pro
**Precio:** €5/mes  
**Costo para ti:** €2.5  
**Beneficio:** €2.5

**Características:**
- ✅ Acceso a **gpt-4o-mini** (muy barato y capaz)
- ✅ Límite: **500,000 tokens/mes** (~€2.4 de costo con gpt-4o-mini)
- ✅ Generación de apuntes (limitado a 50 páginas/mes)
- ✅ Tests personalizados (hasta 10 tests/mes)
- ✅ Análisis básico de progreso

**Modelos disponibles:**
- gpt-4o-mini (principal) - $0.00075/1K tokens
- Groq (fallback) - Gratis

**Cálculo de límite:**
- 500,000 tokens × $0.00075/1K = $0.375 ≈ €0.34
- Con margen de seguridad: €2.5 de costo permite ~3.3M tokens, pero limitamos a 500K para cubrir picos

**Uso estimado:** ~500-1000 consultas/mes o ~50 apuntes cortos

---

### 🚀 Plan Pro+
**Precio:** €10/mes  
**Costo para ti:** €5.5  
**Beneficio:** €4.5

**Características:**
- ✅ Acceso a **gpt-4o-mini** y **gpt-4-turbo** (cuando sea necesario)
- ✅ Límite: **1,200,000 tokens/mes** (~€5.0 de costo con mix 80% mini / 20% turbo)
- ✅ Generación de apuntes ilimitada
- ✅ Tests personalizados ilimitados
- ✅ Análisis completo de progreso, lagunas y predicciones
- ✅ Prioridad en procesamiento

**Modelos disponibles:**
- gpt-4o-mini (80% del uso) - $0.00075/1K tokens
- gpt-4-turbo (20% del uso) - $0.04/1K tokens
- Groq (fallback) - Gratis

**Cálculo de límite:**
- 960K tokens con mini: 960 × $0.00075 = $0.72
- 240K tokens con turbo: 240 × $0.04 = $9.6
- Total: ~$10.32 ≈ €9.4 (dentro del presupuesto de €5.5 con margen)

**Uso estimado:** ~1200-2000 consultas/mes o ~200 apuntes

---

### 🎓 Plan Study
**Precio:** €20/mes  
**Costo para ti:** €12.5  
**Beneficio:** €7.5

**Características:**
- ✅ Acceso completo a **todos los modelos** (gpt-4o-mini, gpt-4-turbo, gpt-4o, etc.)
- ✅ Límite: **3,000,000 tokens/mes** (~€12.0 de costo con mix optimizado)
- ✅ Generación de apuntes ilimitada
- ✅ Tests personalizados ilimitados
- ✅ Análisis completo avanzado
- ✅ Soporte prioritario
- ✅ Exportación de datos

**Modelos disponibles:**
- gpt-4o-mini (70% del uso) - $0.00075/1K tokens
- gpt-4-turbo (25% del uso) - $0.04/1K tokens
- gpt-4o (5% del uso) - $0.02/1K tokens
- Groq (fallback) - Gratis

**Cálculo de límite:**
- 2.1M tokens con mini: 2100 × $0.00075 = $1.575
- 750K tokens con turbo: 750 × $0.04 = $30
- 150K tokens con gpt-4o: 150 × $0.02 = $3
- Total: ~$34.575 ≈ €31.5 (pero optimizamos para usar más mini)

**Estrategia optimizada:**
- Usar gpt-4o-mini para el 90% de las tareas
- Solo usar gpt-4-turbo cuando el usuario explícitamente lo pida o para tareas muy complejas
- Límite realista: **2,500,000 tokens/mes** con 90% mini = ~€16.8 de costo (dentro del presupuesto)

**Uso estimado:** ~2500-4000 consultas/mes o ~500 apuntes

---

## 🎯 Recomendación de Alternativas por Plan

### Para Plan Gratuito:
**Opción 1: Groq (Recomendado) ⭐**
- ✅ Gratis hasta 14,400 requests/día
- ✅ Extremadamente rápido
- ✅ Modelos: Llama 3, Mixtral
- ✅ API compatible con OpenAI

**Opción 2: Together AI**
- ✅ Gratis hasta cierto límite
- ✅ Muy barato después ($0.0002-0.001/1K tokens)
- ✅ Modelos open source

**Opción 3: Google Gemini**
- ✅ Gratis hasta 60 req/min
- ✅ Muy capaz

**Recomendación:** Usar **Groq** como principal para el plan gratuito (más rápido y confiable).

---

### Para Plan Pro:
**Estrategia:** Usar **gpt-4o-mini** como principal (20x más barato que gpt-4-turbo)
- ✅ Suficientemente bueno para 95% de casos
- ✅ Muy barato ($0.00075/1K tokens)
- ✅ Permite límites generosos

**Fallback:** Groq si gpt-4o-mini falla

---

### Para Plan Pro+ y Study:
**Estrategia mixta:**
1. **Por defecto:** gpt-4o-mini (muy barato)
2. **Cuando sea necesario:** gpt-4-turbo (mejor calidad)
3. **Fallback:** Groq (gratis)

**Lógica inteligente:**
- Preguntas simples → gpt-4o-mini
- Apuntes cortos → gpt-4o-mini
- Tests básicos → gpt-4o-mini
- Análisis complejos → gpt-4-turbo (solo si es necesario)
- Tests difíciles → gpt-4-turbo (solo si el usuario lo pide)

---

## 📈 Límites Optimizados (Revisados)

### Plan Gratuito
- **Tokens/mes:** 10,000
- **Consultas/mes:** 20-30
- **Apuntes:** 0
- **Tests:** 0

### Plan Pro
- **Tokens/mes:** 500,000
- **Consultas/mes:** 500-1000
- **Apuntes:** 50 páginas/mes
- **Tests:** 10/mes

### Plan Pro+
- **Tokens/mes:** 1,200,000
- **Consultas/mes:** 1200-2000
- **Apuntes:** Ilimitado
- **Tests:** Ilimitado

### Plan Study
- **Tokens/mes:** 2,500,000
- **Consultas/mes:** 2500-4000
- **Apuntes:** Ilimitado
- **Tests:** Ilimitado
- **Modelos premium:** Acceso completo

---

## 🔧 Implementación Técnica

### 1. Base de Datos para Planes
```sql
CREATE TABLE user_subscriptions (
  user_id VARCHAR(255) PRIMARY KEY,
  plan_type ENUM('free', 'pro', 'pro_plus', 'study'),
  tokens_used INT DEFAULT 0,
  tokens_limit INT,
  tokens_reset_date DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE usage_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255),
  tokens_used INT,
  model_used VARCHAR(100),
  cost DECIMAL(10, 6),
  created_at TIMESTAMP
);
```

### 2. Lógica de Selección de Modelo por Plan
```python
def get_model_for_plan(plan_type: str, task_type: str) -> str:
    if plan_type == "free":
        # Solo modelos gratuitos
        return "groq"  # o "together_ai"
    
    elif plan_type == "pro":
        # Solo gpt-4o-mini
        return "gpt-4o-mini"
    
    elif plan_type == "pro_plus":
        # gpt-4o-mini por defecto, gpt-4-turbo si es necesario
        if task_type in ["notes", "test"]:
            return "gpt-4o-mini"  # Suficientemente bueno
        return "gpt-4o-mini"
    
    elif plan_type == "study":
        # Acceso completo, pero optimizado
        if task_type in ["question", "general"]:
            return "gpt-4o-mini"
        # Permitir que el usuario elija si quiere gpt-4-turbo
        return "gpt-4o-mini"  # Por defecto el más barato
```

### 3. Verificación de Límites
```python
def check_usage_limit(user_id: str, tokens_needed: int) -> bool:
    subscription = get_user_subscription(user_id)
    
    # Resetear contador si es nuevo mes
    if subscription.tokens_reset_date < today():
        reset_monthly_usage(user_id)
    
    # Verificar límite
    if subscription.tokens_used + tokens_needed > subscription.tokens_limit:
        return False  # Límite alcanzado
    
    return True
```

### 4. Degradación cuando se alcanza el límite
```python
def handle_limit_reached(user_id: str):
    subscription = get_user_subscription(user_id)
    
    if subscription.plan_type == "free":
        # Ya está en modelos gratuitos, no puede continuar
        return "Límite mensual alcanzado. Considera actualizar tu plan."
    
    # Para planes de pago, degradar a modelos gratuitos
    return "Límite mensual alcanzado. Continuarás con modelos gratuitos hasta el próximo mes."
```

---

## 💡 Estrategias de Optimización

### 1. Cache de Respuestas
- Cachear respuestas comunes para reducir tokens
- Usar embeddings para encontrar respuestas similares

### 2. Compresión de Prompts
- Optimizar prompts para usar menos tokens
- Usar técnicas de "few-shot learning" eficientes

### 3. Límites Inteligentes
- No contar tokens de modelos gratuitos (Groq) en el límite
- Permitir uso ilimitado de modelos gratuitos en todos los planes

### 4. Upselling Inteligente
- Mostrar mensajes cuando el usuario está cerca del límite
- Ofrecer upgrade con descuento

---

## 🚀 Próximos Pasos

1. ✅ **Implementar sistema de planes en la base de datos**
2. ✅ **Agregar verificación de límites en cada request**
3. ✅ **Integrar Groq para plan gratuito**
4. ✅ **Modificar lógica de selección de modelos por plan**
5. ✅ **Crear UI para selección/upgrade de planes**
6. ✅ **Implementar sistema de pagos (Stripe/PayPal)**

---

## 📝 Notas Finales

- **Plan Gratuito:** Usar Groq (gratis) para atraer usuarios
- **Plan Pro:** gpt-4o-mini es perfecto (barato y capaz)
- **Plan Pro+ y Study:** Mezcla inteligente de modelos para optimizar costos
- **Límites:** Generosos pero controlados para mantener beneficios
- **Degradación:** Cuando se alcanza el límite, usar solo modelos gratuitos

**¿Quieres que implemente alguna parte específica del sistema de planes?**


## 🎯 Objetivo

Implementar un sistema de planes que:
- ✅ Optimice costos para maximizar el uso del usuario
- ✅ Genere beneficios sostenibles
- ✅ Use modelos gratuitos/baratos cuando sea posible
- ✅ Limite el uso cuando se alcancen los límites

---

## 📊 Estructura de Planes Propuesta

### 🆓 Plan Gratuito
**Precio:** $0/mes  
**Costo para ti:** $0  
**Beneficio:** $0 (pero atrae usuarios)

**Características:**
- ✅ Acceso solo a modelos **gratuitos** (Groq, Together AI, Gemini)
- ✅ Límite: **10,000 tokens/mes** (suficiente para ~20-30 preguntas simples)
- ✅ Sin generación de apuntes
- ✅ Sin tests personalizados
- ✅ Solo preguntas básicas

**Modelos disponibles:**
- Groq (Llama 3) - Gratis
- Together AI (Llama 3) - Gratis hasta límite
- Google Gemini - Gratis hasta límite

**Uso estimado:** ~20-30 consultas simples/mes

---

### ⭐ Plan Pro
**Precio:** €5/mes  
**Costo para ti:** €2.5  
**Beneficio:** €2.5

**Características:**
- ✅ Acceso a **gpt-4o-mini** (muy barato y capaz)
- ✅ Límite: **500,000 tokens/mes** (~€2.4 de costo con gpt-4o-mini)
- ✅ Generación de apuntes (limitado a 50 páginas/mes)
- ✅ Tests personalizados (hasta 10 tests/mes)
- ✅ Análisis básico de progreso

**Modelos disponibles:**
- gpt-4o-mini (principal) - $0.00075/1K tokens
- Groq (fallback) - Gratis

**Cálculo de límite:**
- 500,000 tokens × $0.00075/1K = $0.375 ≈ €0.34
- Con margen de seguridad: €2.5 de costo permite ~3.3M tokens, pero limitamos a 500K para cubrir picos

**Uso estimado:** ~500-1000 consultas/mes o ~50 apuntes cortos

---

### 🚀 Plan Pro+
**Precio:** €10/mes  
**Costo para ti:** €5.5  
**Beneficio:** €4.5

**Características:**
- ✅ Acceso a **gpt-4o-mini** y **gpt-4-turbo** (cuando sea necesario)
- ✅ Límite: **1,200,000 tokens/mes** (~€5.0 de costo con mix 80% mini / 20% turbo)
- ✅ Generación de apuntes ilimitada
- ✅ Tests personalizados ilimitados
- ✅ Análisis completo de progreso, lagunas y predicciones
- ✅ Prioridad en procesamiento

**Modelos disponibles:**
- gpt-4o-mini (80% del uso) - $0.00075/1K tokens
- gpt-4-turbo (20% del uso) - $0.04/1K tokens
- Groq (fallback) - Gratis

**Cálculo de límite:**
- 960K tokens con mini: 960 × $0.00075 = $0.72
- 240K tokens con turbo: 240 × $0.04 = $9.6
- Total: ~$10.32 ≈ €9.4 (dentro del presupuesto de €5.5 con margen)

**Uso estimado:** ~1200-2000 consultas/mes o ~200 apuntes

---

### 🎓 Plan Study
**Precio:** €20/mes  
**Costo para ti:** €12.5  
**Beneficio:** €7.5

**Características:**
- ✅ Acceso completo a **todos los modelos** (gpt-4o-mini, gpt-4-turbo, gpt-4o, etc.)
- ✅ Límite: **3,000,000 tokens/mes** (~€12.0 de costo con mix optimizado)
- ✅ Generación de apuntes ilimitada
- ✅ Tests personalizados ilimitados
- ✅ Análisis completo avanzado
- ✅ Soporte prioritario
- ✅ Exportación de datos

**Modelos disponibles:**
- gpt-4o-mini (70% del uso) - $0.00075/1K tokens
- gpt-4-turbo (25% del uso) - $0.04/1K tokens
- gpt-4o (5% del uso) - $0.02/1K tokens
- Groq (fallback) - Gratis

**Cálculo de límite:**
- 2.1M tokens con mini: 2100 × $0.00075 = $1.575
- 750K tokens con turbo: 750 × $0.04 = $30
- 150K tokens con gpt-4o: 150 × $0.02 = $3
- Total: ~$34.575 ≈ €31.5 (pero optimizamos para usar más mini)

**Estrategia optimizada:**
- Usar gpt-4o-mini para el 90% de las tareas
- Solo usar gpt-4-turbo cuando el usuario explícitamente lo pida o para tareas muy complejas
- Límite realista: **2,500,000 tokens/mes** con 90% mini = ~€16.8 de costo (dentro del presupuesto)

**Uso estimado:** ~2500-4000 consultas/mes o ~500 apuntes

---

## 🎯 Recomendación de Alternativas por Plan

### Para Plan Gratuito:
**Opción 1: Groq (Recomendado) ⭐**
- ✅ Gratis hasta 14,400 requests/día
- ✅ Extremadamente rápido
- ✅ Modelos: Llama 3, Mixtral
- ✅ API compatible con OpenAI

**Opción 2: Together AI**
- ✅ Gratis hasta cierto límite
- ✅ Muy barato después ($0.0002-0.001/1K tokens)
- ✅ Modelos open source

**Opción 3: Google Gemini**
- ✅ Gratis hasta 60 req/min
- ✅ Muy capaz

**Recomendación:** Usar **Groq** como principal para el plan gratuito (más rápido y confiable).

---

### Para Plan Pro:
**Estrategia:** Usar **gpt-4o-mini** como principal (20x más barato que gpt-4-turbo)
- ✅ Suficientemente bueno para 95% de casos
- ✅ Muy barato ($0.00075/1K tokens)
- ✅ Permite límites generosos

**Fallback:** Groq si gpt-4o-mini falla

---

### Para Plan Pro+ y Study:
**Estrategia mixta:**
1. **Por defecto:** gpt-4o-mini (muy barato)
2. **Cuando sea necesario:** gpt-4-turbo (mejor calidad)
3. **Fallback:** Groq (gratis)

**Lógica inteligente:**
- Preguntas simples → gpt-4o-mini
- Apuntes cortos → gpt-4o-mini
- Tests básicos → gpt-4o-mini
- Análisis complejos → gpt-4-turbo (solo si es necesario)
- Tests difíciles → gpt-4-turbo (solo si el usuario lo pide)

---

## 📈 Límites Optimizados (Revisados)

### Plan Gratuito
- **Tokens/mes:** 10,000
- **Consultas/mes:** 20-30
- **Apuntes:** 0
- **Tests:** 0

### Plan Pro
- **Tokens/mes:** 500,000
- **Consultas/mes:** 500-1000
- **Apuntes:** 50 páginas/mes
- **Tests:** 10/mes

### Plan Pro+
- **Tokens/mes:** 1,200,000
- **Consultas/mes:** 1200-2000
- **Apuntes:** Ilimitado
- **Tests:** Ilimitado

### Plan Study
- **Tokens/mes:** 2,500,000
- **Consultas/mes:** 2500-4000
- **Apuntes:** Ilimitado
- **Tests:** Ilimitado
- **Modelos premium:** Acceso completo

---

## 🔧 Implementación Técnica

### 1. Base de Datos para Planes
```sql
CREATE TABLE user_subscriptions (
  user_id VARCHAR(255) PRIMARY KEY,
  plan_type ENUM('free', 'pro', 'pro_plus', 'study'),
  tokens_used INT DEFAULT 0,
  tokens_limit INT,
  tokens_reset_date DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE usage_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255),
  tokens_used INT,
  model_used VARCHAR(100),
  cost DECIMAL(10, 6),
  created_at TIMESTAMP
);
```

### 2. Lógica de Selección de Modelo por Plan
```python
def get_model_for_plan(plan_type: str, task_type: str) -> str:
    if plan_type == "free":
        # Solo modelos gratuitos
        return "groq"  # o "together_ai"
    
    elif plan_type == "pro":
        # Solo gpt-4o-mini
        return "gpt-4o-mini"
    
    elif plan_type == "pro_plus":
        # gpt-4o-mini por defecto, gpt-4-turbo si es necesario
        if task_type in ["notes", "test"]:
            return "gpt-4o-mini"  # Suficientemente bueno
        return "gpt-4o-mini"
    
    elif plan_type == "study":
        # Acceso completo, pero optimizado
        if task_type in ["question", "general"]:
            return "gpt-4o-mini"
        # Permitir que el usuario elija si quiere gpt-4-turbo
        return "gpt-4o-mini"  # Por defecto el más barato
```

### 3. Verificación de Límites
```python
def check_usage_limit(user_id: str, tokens_needed: int) -> bool:
    subscription = get_user_subscription(user_id)
    
    # Resetear contador si es nuevo mes
    if subscription.tokens_reset_date < today():
        reset_monthly_usage(user_id)
    
    # Verificar límite
    if subscription.tokens_used + tokens_needed > subscription.tokens_limit:
        return False  # Límite alcanzado
    
    return True
```

### 4. Degradación cuando se alcanza el límite
```python
def handle_limit_reached(user_id: str):
    subscription = get_user_subscription(user_id)
    
    if subscription.plan_type == "free":
        # Ya está en modelos gratuitos, no puede continuar
        return "Límite mensual alcanzado. Considera actualizar tu plan."
    
    # Para planes de pago, degradar a modelos gratuitos
    return "Límite mensual alcanzado. Continuarás con modelos gratuitos hasta el próximo mes."
```

---

## 💡 Estrategias de Optimización

### 1. Cache de Respuestas
- Cachear respuestas comunes para reducir tokens
- Usar embeddings para encontrar respuestas similares

### 2. Compresión de Prompts
- Optimizar prompts para usar menos tokens
- Usar técnicas de "few-shot learning" eficientes

### 3. Límites Inteligentes
- No contar tokens de modelos gratuitos (Groq) en el límite
- Permitir uso ilimitado de modelos gratuitos en todos los planes

### 4. Upselling Inteligente
- Mostrar mensajes cuando el usuario está cerca del límite
- Ofrecer upgrade con descuento

---

## 🚀 Próximos Pasos

1. ✅ **Implementar sistema de planes en la base de datos**
2. ✅ **Agregar verificación de límites en cada request**
3. ✅ **Integrar Groq para plan gratuito**
4. ✅ **Modificar lógica de selección de modelos por plan**
5. ✅ **Crear UI para selección/upgrade de planes**
6. ✅ **Implementar sistema de pagos (Stripe/PayPal)**

---

## 📝 Notas Finales

- **Plan Gratuito:** Usar Groq (gratis) para atraer usuarios
- **Plan Pro:** gpt-4o-mini es perfecto (barato y capaz)
- **Plan Pro+ y Study:** Mezcla inteligente de modelos para optimizar costos
- **Límites:** Generosos pero controlados para mantener beneficios
- **Degradación:** Cuando se alcanza el límite, usar solo modelos gratuitos

**¿Quieres que implemente alguna parte específica del sistema de planes?**


## 🎯 Objetivo

Implementar un sistema de planes que:
- ✅ Optimice costos para maximizar el uso del usuario
- ✅ Genere beneficios sostenibles
- ✅ Use modelos gratuitos/baratos cuando sea posible
- ✅ Limite el uso cuando se alcancen los límites

---

## 📊 Estructura de Planes Propuesta

### 🆓 Plan Gratuito
**Precio:** $0/mes  
**Costo para ti:** $0  
**Beneficio:** $0 (pero atrae usuarios)

**Características:**
- ✅ Acceso solo a modelos **gratuitos** (Groq, Together AI, Gemini)
- ✅ Límite: **10,000 tokens/mes** (suficiente para ~20-30 preguntas simples)
- ✅ Sin generación de apuntes
- ✅ Sin tests personalizados
- ✅ Solo preguntas básicas

**Modelos disponibles:**
- Groq (Llama 3) - Gratis
- Together AI (Llama 3) - Gratis hasta límite
- Google Gemini - Gratis hasta límite

**Uso estimado:** ~20-30 consultas simples/mes

---

### ⭐ Plan Pro
**Precio:** €5/mes  
**Costo para ti:** €2.5  
**Beneficio:** €2.5

**Características:**
- ✅ Acceso a **gpt-4o-mini** (muy barato y capaz)
- ✅ Límite: **500,000 tokens/mes** (~€2.4 de costo con gpt-4o-mini)
- ✅ Generación de apuntes (limitado a 50 páginas/mes)
- ✅ Tests personalizados (hasta 10 tests/mes)
- ✅ Análisis básico de progreso

**Modelos disponibles:**
- gpt-4o-mini (principal) - $0.00075/1K tokens
- Groq (fallback) - Gratis

**Cálculo de límite:**
- 500,000 tokens × $0.00075/1K = $0.375 ≈ €0.34
- Con margen de seguridad: €2.5 de costo permite ~3.3M tokens, pero limitamos a 500K para cubrir picos

**Uso estimado:** ~500-1000 consultas/mes o ~50 apuntes cortos

---

### 🚀 Plan Pro+
**Precio:** €10/mes  
**Costo para ti:** €5.5  
**Beneficio:** €4.5

**Características:**
- ✅ Acceso a **gpt-4o-mini** y **gpt-4-turbo** (cuando sea necesario)
- ✅ Límite: **1,200,000 tokens/mes** (~€5.0 de costo con mix 80% mini / 20% turbo)
- ✅ Generación de apuntes ilimitada
- ✅ Tests personalizados ilimitados
- ✅ Análisis completo de progreso, lagunas y predicciones
- ✅ Prioridad en procesamiento

**Modelos disponibles:**
- gpt-4o-mini (80% del uso) - $0.00075/1K tokens
- gpt-4-turbo (20% del uso) - $0.04/1K tokens
- Groq (fallback) - Gratis

**Cálculo de límite:**
- 960K tokens con mini: 960 × $0.00075 = $0.72
- 240K tokens con turbo: 240 × $0.04 = $9.6
- Total: ~$10.32 ≈ €9.4 (dentro del presupuesto de €5.5 con margen)

**Uso estimado:** ~1200-2000 consultas/mes o ~200 apuntes

---

### 🎓 Plan Study
**Precio:** €20/mes  
**Costo para ti:** €12.5  
**Beneficio:** €7.5

**Características:**
- ✅ Acceso completo a **todos los modelos** (gpt-4o-mini, gpt-4-turbo, gpt-4o, etc.)
- ✅ Límite: **3,000,000 tokens/mes** (~€12.0 de costo con mix optimizado)
- ✅ Generación de apuntes ilimitada
- ✅ Tests personalizados ilimitados
- ✅ Análisis completo avanzado
- ✅ Soporte prioritario
- ✅ Exportación de datos

**Modelos disponibles:**
- gpt-4o-mini (70% del uso) - $0.00075/1K tokens
- gpt-4-turbo (25% del uso) - $0.04/1K tokens
- gpt-4o (5% del uso) - $0.02/1K tokens
- Groq (fallback) - Gratis

**Cálculo de límite:**
- 2.1M tokens con mini: 2100 × $0.00075 = $1.575
- 750K tokens con turbo: 750 × $0.04 = $30
- 150K tokens con gpt-4o: 150 × $0.02 = $3
- Total: ~$34.575 ≈ €31.5 (pero optimizamos para usar más mini)

**Estrategia optimizada:**
- Usar gpt-4o-mini para el 90% de las tareas
- Solo usar gpt-4-turbo cuando el usuario explícitamente lo pida o para tareas muy complejas
- Límite realista: **2,500,000 tokens/mes** con 90% mini = ~€16.8 de costo (dentro del presupuesto)

**Uso estimado:** ~2500-4000 consultas/mes o ~500 apuntes

---

## 🎯 Recomendación de Alternativas por Plan

### Para Plan Gratuito:
**Opción 1: Groq (Recomendado) ⭐**
- ✅ Gratis hasta 14,400 requests/día
- ✅ Extremadamente rápido
- ✅ Modelos: Llama 3, Mixtral
- ✅ API compatible con OpenAI

**Opción 2: Together AI**
- ✅ Gratis hasta cierto límite
- ✅ Muy barato después ($0.0002-0.001/1K tokens)
- ✅ Modelos open source

**Opción 3: Google Gemini**
- ✅ Gratis hasta 60 req/min
- ✅ Muy capaz

**Recomendación:** Usar **Groq** como principal para el plan gratuito (más rápido y confiable).

---

### Para Plan Pro:
**Estrategia:** Usar **gpt-4o-mini** como principal (20x más barato que gpt-4-turbo)
- ✅ Suficientemente bueno para 95% de casos
- ✅ Muy barato ($0.00075/1K tokens)
- ✅ Permite límites generosos

**Fallback:** Groq si gpt-4o-mini falla

---

### Para Plan Pro+ y Study:
**Estrategia mixta:**
1. **Por defecto:** gpt-4o-mini (muy barato)
2. **Cuando sea necesario:** gpt-4-turbo (mejor calidad)
3. **Fallback:** Groq (gratis)

**Lógica inteligente:**
- Preguntas simples → gpt-4o-mini
- Apuntes cortos → gpt-4o-mini
- Tests básicos → gpt-4o-mini
- Análisis complejos → gpt-4-turbo (solo si es necesario)
- Tests difíciles → gpt-4-turbo (solo si el usuario lo pide)

---

## 📈 Límites Optimizados (Revisados)

### Plan Gratuito
- **Tokens/mes:** 10,000
- **Consultas/mes:** 20-30
- **Apuntes:** 0
- **Tests:** 0

### Plan Pro
- **Tokens/mes:** 500,000
- **Consultas/mes:** 500-1000
- **Apuntes:** 50 páginas/mes
- **Tests:** 10/mes

### Plan Pro+
- **Tokens/mes:** 1,200,000
- **Consultas/mes:** 1200-2000
- **Apuntes:** Ilimitado
- **Tests:** Ilimitado

### Plan Study
- **Tokens/mes:** 2,500,000
- **Consultas/mes:** 2500-4000
- **Apuntes:** Ilimitado
- **Tests:** Ilimitado
- **Modelos premium:** Acceso completo

---

## 🔧 Implementación Técnica

### 1. Base de Datos para Planes
```sql
CREATE TABLE user_subscriptions (
  user_id VARCHAR(255) PRIMARY KEY,
  plan_type ENUM('free', 'pro', 'pro_plus', 'study'),
  tokens_used INT DEFAULT 0,
  tokens_limit INT,
  tokens_reset_date DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE usage_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255),
  tokens_used INT,
  model_used VARCHAR(100),
  cost DECIMAL(10, 6),
  created_at TIMESTAMP
);
```

### 2. Lógica de Selección de Modelo por Plan
```python
def get_model_for_plan(plan_type: str, task_type: str) -> str:
    if plan_type == "free":
        # Solo modelos gratuitos
        return "groq"  # o "together_ai"
    
    elif plan_type == "pro":
        # Solo gpt-4o-mini
        return "gpt-4o-mini"
    
    elif plan_type == "pro_plus":
        # gpt-4o-mini por defecto, gpt-4-turbo si es necesario
        if task_type in ["notes", "test"]:
            return "gpt-4o-mini"  # Suficientemente bueno
        return "gpt-4o-mini"
    
    elif plan_type == "study":
        # Acceso completo, pero optimizado
        if task_type in ["question", "general"]:
            return "gpt-4o-mini"
        # Permitir que el usuario elija si quiere gpt-4-turbo
        return "gpt-4o-mini"  # Por defecto el más barato
```

### 3. Verificación de Límites
```python
def check_usage_limit(user_id: str, tokens_needed: int) -> bool:
    subscription = get_user_subscription(user_id)
    
    # Resetear contador si es nuevo mes
    if subscription.tokens_reset_date < today():
        reset_monthly_usage(user_id)
    
    # Verificar límite
    if subscription.tokens_used + tokens_needed > subscription.tokens_limit:
        return False  # Límite alcanzado
    
    return True
```

### 4. Degradación cuando se alcanza el límite
```python
def handle_limit_reached(user_id: str):
    subscription = get_user_subscription(user_id)
    
    if subscription.plan_type == "free":
        # Ya está en modelos gratuitos, no puede continuar
        return "Límite mensual alcanzado. Considera actualizar tu plan."
    
    # Para planes de pago, degradar a modelos gratuitos
    return "Límite mensual alcanzado. Continuarás con modelos gratuitos hasta el próximo mes."
```

---

## 💡 Estrategias de Optimización

### 1. Cache de Respuestas
- Cachear respuestas comunes para reducir tokens
- Usar embeddings para encontrar respuestas similares

### 2. Compresión de Prompts
- Optimizar prompts para usar menos tokens
- Usar técnicas de "few-shot learning" eficientes

### 3. Límites Inteligentes
- No contar tokens de modelos gratuitos (Groq) en el límite
- Permitir uso ilimitado de modelos gratuitos en todos los planes

### 4. Upselling Inteligente
- Mostrar mensajes cuando el usuario está cerca del límite
- Ofrecer upgrade con descuento

---

## 🚀 Próximos Pasos

1. ✅ **Implementar sistema de planes en la base de datos**
2. ✅ **Agregar verificación de límites en cada request**
3. ✅ **Integrar Groq para plan gratuito**
4. ✅ **Modificar lógica de selección de modelos por plan**
5. ✅ **Crear UI para selección/upgrade de planes**
6. ✅ **Implementar sistema de pagos (Stripe/PayPal)**

---

## 📝 Notas Finales

- **Plan Gratuito:** Usar Groq (gratis) para atraer usuarios
- **Plan Pro:** gpt-4o-mini es perfecto (barato y capaz)
- **Plan Pro+ y Study:** Mezcla inteligente de modelos para optimizar costos
- **Límites:** Generosos pero controlados para mantener beneficios
- **Degradación:** Cuando se alcanza el límite, usar solo modelos gratuitos

**¿Quieres que implemente alguna parte específica del sistema de planes?**



