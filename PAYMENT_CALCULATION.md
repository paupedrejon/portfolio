# Cálculo de Ingresos con Sistema de Wallet

## 💰 Sistema Propuesto

1. **Usuario mete dinero en wallet** (ej: 10€, 20€, 50€)
2. **Usuario usa wallet para comprar cursos**
3. **Distribución automática:**
   - Parte para IA (uso de créditos)
   - Parte para plataforma (tú)
   - Parte para creador del curso
4. **Creador solo puede retirar si tiene >5€ acumulado**

---

## 📊 Cálculo por Precio de Curso

### **Curso de 2€**

**Cliente paga:** 2€

**Comisión Stripe (1.4% + 0.25€):**
- 2€ × 1.4% = 0.028€
- + 0.25€ = **0.278€** (redondeado: 0.28€)

**Dinero disponible después de comisión:**
- 2€ - 0.28€ = **1.72€**

**Distribución original:**
- IA: 1.00€
- Plataforma (tú): 0.50€
- Creador: 0.50€
- **Total: 2.00€** ❌ (no cubre comisión)

**Distribución ajustada (después de comisión):**
- IA: 1.00€ (58.1%)
- Plataforma (tú): 0.36€ (20.9%)
- Creador: 0.36€ (20.9%)
- **Total: 1.72€** ✅

**Resultado:**
- **Creador cobra:** 0.36€ por venta
- **Tú cobras:** 0.36€ por venta
- **Para IA:** 1.00€ (se descuenta del wallet del usuario)

**Problema:** Creador necesita **14 ventas** para llegar a 5€ (14 × 0.36€ = 5.04€)

---

### **Curso de 5€**

**Cliente paga:** 5€

**Comisión Stripe:**
- 5€ × 1.4% = 0.07€
- + 0.25€ = **0.32€**

**Dinero disponible:**
- 5€ - 0.32€ = **4.68€**

**Distribución original:**
- IA: 3.00€
- Plataforma: 1.00€
- Creador: 1.00€
- **Total: 5.00€** ❌

**Distribución ajustada:**
- IA: 3.00€ (64.1%)
- Plataforma: 0.84€ (17.9%)
- Creador: 0.84€ (17.9%)
- **Total: 4.68€** ✅

**Resultado:**
- **Creador cobra:** 0.84€ por venta
- **Tú cobras:** 0.84€ por venta
- **Para IA:** 3.00€

**Problema:** Creador necesita **6 ventas** para llegar a 5€ (6 × 0.84€ = 5.04€)

---

### **Curso de 10€**

**Cliente paga:** 10€

**Comisión Stripe:**
- 10€ × 1.4% = 0.14€
- + 0.25€ = **0.39€**

**Dinero disponible:**
- 10€ - 0.39€ = **9.61€**

**Distribución original:**
- IA: 6.00€
- Plataforma: 2.00€
- Creador: 2.00€
- **Total: 10.00€** ❌

**Distribución ajustada:**
- IA: 6.00€ (62.4%)
- Plataforma: 1.81€ (18.8%)
- Creador: 1.80€ (18.7%)
- **Total: 9.61€** ✅

**Resultado:**
- **Creador cobra:** 1.80€ por venta
- **Tú cobras:** 1.81€ por venta
- **Para IA:** 6.00€

**Problema:** Creador necesita **3 ventas** para llegar a 5€ (3 × 1.80€ = 5.40€)

---

### **Curso de 20€**

**Cliente paga:** 20€

**Comisión Stripe:**
- 20€ × 1.4% = 0.28€
- + 0.25€ = **0.53€**

**Dinero disponible:**
- 20€ - 0.53€ = **19.47€**

**Distribución original:**
- IA: 10.00€
- Plataforma: 6.00€
- Creador: 4.00€
- **Total: 20.00€** ❌

**Distribución ajustada:**
- IA: 10.00€ (51.4%)
- Plataforma: 5.84€ (30.0%)
- Creador: 3.63€ (18.6%)
- **Total: 19.47€** ✅

**Resultado:**
- **Creador cobra:** 3.63€ por venta
- **Tú cobras:** 5.84€ por venta
- **Para IA:** 10.00€

**Ventaja:** Creador necesita **2 ventas** para llegar a 5€ (2 × 3.63€ = 7.26€)

---

### **Curso de 50€**

**Cliente paga:** 50€

**Comisión Stripe:**
- 50€ × 1.4% = 0.70€
- + 0.25€ = **0.95€**

**Dinero disponible:**
- 50€ - 0.95€ = **49.05€**

**Distribución original:**
- IA: 20.00€
- Plataforma: 20.00€
- Creador: 10.00€
- **Total: 50.00€** ❌

**Distribución ajustada:**
- IA: 20.00€ (40.8%)
- Plataforma: 19.62€ (40.0%)
- Creador: 9.43€ (19.2%)
- **Total: 49.05€** ✅

**Resultado:**
- **Creador cobra:** 9.43€ por venta
- **Tú cobras:** 19.62€ por venta
- **Para IA:** 20.00€

**Ventaja:** Creador puede retirar **inmediatamente** (9.43€ > 5€)

---

## 📋 Resumen por Curso

| Precio | Comisión | Disponible | Creador | Tú | IA | Ventas para 5€ |
|--------|----------|------------|---------|-----|-----|----------------|
| **2€** | 0.28€ | 1.72€ | 0.36€ | 0.36€ | 1.00€ | **14 ventas** |
| **5€** | 0.32€ | 4.68€ | 0.84€ | 0.84€ | 3.00€ | **6 ventas** |
| **10€** | 0.39€ | 9.61€ | 1.80€ | 1.81€ | 6.00€ | **3 ventas** |
| **20€** | 0.53€ | 19.47€ | 3.63€ | 5.84€ | 10.00€ | **2 ventas** |
| **50€** | 0.95€ | 49.05€ | 9.43€ | 19.62€ | 20.00€ | **1 venta** ✅ |

---

## ⚠️ Problemas Identificados

### 1. **Cursos de 2€ y 5€: Muy difícil llegar a 5€**
- 2€: Necesita 14 ventas
- 5€: Necesita 6 ventas

### 2. **Comisiones afectan mucho a precios bajos**
- La comisión fija (0.25€) es el 12.5% de un curso de 2€
- La comisión fija es solo el 0.5% de un curso de 50€

---

## 💡 Soluciones Propuestas

### **Opción 1: Ajustar distribución para cubrir comisiones**

**Estrategia:** La comisión se divide proporcionalmente entre plataforma y creador.

**Ejemplo curso 2€:**
- Comisión: 0.28€
- Plataforma paga: 0.14€ (50%)
- Creador paga: 0.14€ (50%)
- Distribución neta:
  - IA: 1.00€
  - Plataforma: 0.50€ - 0.14€ = **0.36€**
  - Creador: 0.50€ - 0.14€ = **0.36€**

**Resultado:** Igual que antes, pero más justo.

---

### **Opción 2: Mínimo de retiro más bajo para cursos pequeños**

**Estrategia:** 
- Cursos 2€-5€: Mínimo retiro 3€ (en lugar de 5€)
- Cursos 10€+: Mínimo retiro 5€

**Ventajas:**
- Creadores de cursos baratos pueden retirar antes
- Más incentivo para crear cursos pequeños

---

### **Opción 3: Acumular comisiones de múltiples cursos**

**Estrategia:** Si un creador tiene varios cursos, suma todas las comisiones.

**Ejemplo:**
- Creador tiene 3 cursos de 2€
- Cada uno da 0.36€
- Total acumulado: 1.08€
- Si vende 5 de cada curso: 5 × 1.08€ = 5.40€ ✅

---

### **Opción 4: Comisión fija más baja para wallet (solo al recargar)**

**Estrategia:** 
- Usuario recarga wallet: Paga comisión (una vez)
- Usuario compra curso: NO paga comisión (ya está en wallet)

**Ejemplo:**
- Usuario recarga 20€: Paga 0.53€ de comisión
- Usuario compra 10 cursos de 2€: Sin comisiones adicionales
- **Ahorro:** 10 × 0.28€ = 2.80€ en comisiones

**Ventajas:**
- Una sola comisión por recarga
- Más dinero disponible para distribución
- Mejor para transacciones pequeñas

---

## 🎯 Recomendación Final

### **Sistema Híbrido Optimizado:**

1. **Usuario recarga wallet** (10€, 20€, 50€)
   - Paga comisión UNA VEZ al recargar
   - Comisión: 1.4% + 0.25€

2. **Usuario compra cursos con wallet**
   - NO hay comisión adicional
   - Distribución completa según tabla original

3. **Distribución sin comisiones:**
   - **2€:** IA 1€ | Plataforma 0.5€ | Creador 0.5€
   - **5€:** IA 3€ | Plataforma 1€ | Creador 1€
   - **10€:** IA 6€ | Plataforma 2€ | Creador 2€
   - **20€:** IA 10€ | Plataforma 6€ | Creador 4€
   - **50€:** IA 20€ | Plataforma 20€ | Creador 10€

4. **Mínimo de retiro:**
   - Cursos 2€-5€: **3€ mínimo**
   - Cursos 10€+: **5€ mínimo**

**Resultado:**
- ✅ Sin comisiones en cada compra
- ✅ Distribución justa
- ✅ Creadores pueden retirar más fácilmente
- ✅ Más rentable para todos

---

## 📊 Cálculo Final con Sistema Optimizado

### **Ejemplo: Usuario recarga 20€**

**Comisión al recargar:**
- 20€ × 1.4% = 0.28€
- + 0.25€ = **0.53€**
- Wallet del usuario: **19.47€**

**Usuario compra curso de 2€:**
- Wallet: 19.47€ - 2€ = 17.47€
- **Distribución:**
  - IA: 1.00€ (se descuenta del wallet)
  - Plataforma: 0.50€ (se guarda en cuenta del creador)
  - Creador: 0.50€ (se guarda en cuenta del creador)

**Usuario compra curso de 10€:**
- Wallet: 17.47€ - 10€ = 7.47€
- **Distribución:**
  - IA: 6.00€
  - Plataforma: 2.00€
  - Creador: 2.00€

**Total creador acumulado:** 0.50€ + 2.00€ = 2.50€ (necesita 0.50€ más para retirar si mínimo es 3€)

---

## ✅ Tabla Final de Ingresos (Sistema Optimizado)

| Precio | IA | Plataforma (Tú) | Creador | Mínimo Retiro |
|--------|-----|-----------------|---------|---------------|
| **2€** | 1.00€ | 0.50€ | 0.50€ | 3€ (6 ventas) |
| **5€** | 3.00€ | 1.00€ | 1.00€ | 3€ (3 ventas) |
| **10€** | 6.00€ | 2.00€ | 2.00€ | 5€ (3 ventas) |
| **20€** | 10.00€ | 6.00€ | 4.00€ | 5€ (2 ventas) |
| **50€** | 20.00€ | 20.00€ | 10.00€ | 5€ (1 venta) ✅ |

**Nota:** La comisión solo se paga UNA VEZ al recargar el wallet, no en cada compra.


