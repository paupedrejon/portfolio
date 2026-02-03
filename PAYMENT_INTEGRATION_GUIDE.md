# Guía de Integración de Pagos - Study Agents

## 📋 Resumen de Distribución de Ingresos

| Precio | Para IA | Para Ti | Para Creador |
|--------|---------|----------|--------------|
| 0€     | 0€      | 0€       | 0€           |
| 2€     | 1€      | 0.5€     | 0.5€         |
| 5€     | 3€      | 1€       | 1€           |
| 10€    | 6€      | 2€       | 2€           |
| 20€    | 10€     | 6€       | 4€           |
| 50€    | 20€     | 20€      | 10€          |

## 💳 Opciones de Pago Recomendadas

### 1. **Stripe** (⭐ RECOMENDADO)

**Ventajas:**
- ✅ Fácil integración con Next.js
- ✅ División automática de pagos (Stripe Connect)
- ✅ Excelente documentación
- ✅ Dashboard completo
- ✅ Webhooks para confirmar pagos
- ✅ Manejo de reembolsos automático
- ✅ Cumple con PCI-DSS (seguridad de tarjetas)

**Comisiones:**
- Europa: 1.4% + 0.25€ por transacción
- Stripe Connect (división): +0.25€ adicional por transferencia

**Ejemplo con curso de 10€:**
- Cliente paga: 10€
- Stripe cobra: 0.14€ + 0.25€ = 0.39€
- Te queda: 9.61€
- Distribución: 6€ IA + 2€ tú + 2€ creador = 10€ (ajustar comisiones)

**Setup:**
1. Crear cuenta en https://stripe.com
2. Activar modo test (gratis)
3. Obtener API keys (pública y secreta)
4. Configurar Stripe Connect para creadores

**Código necesario:**
- Frontend: Botón de pago con Stripe Checkout
- Backend: Webhook para confirmar pagos
- Base de datos: Guardar transacciones

---

### 2. **PayPal**

**Ventajas:**
- ✅ Muy conocido por usuarios
- ✅ Fácil de usar
- ✅ Acepta tarjetas y PayPal

**Desventajas:**
- ❌ Comisiones más altas (3.4% + 0.35€)
- ❌ División de pagos más manual
- ❌ Menos flexible

**Comisiones:**
- 3.4% + 0.35€ por transacción

---

### 3. **Paddle**

**Ventajas:**
- ✅ Maneja IVA automáticamente
- ✅ División de pagos
- ✅ Menos trabajo administrativo

**Desventajas:**
- ❌ Comisiones altas (5% + 0.50€)
- ❌ Menos conocido

---

## 🚀 Implementación Recomendada: Stripe

### Paso 1: Instalar Stripe

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js stripe
```

### Paso 2: Configurar Variables de Entorno

```env
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Paso 3: Flujo de Pago

1. **Usuario hace clic en "Inscribirse" en curso de pago**
2. **Frontend crea sesión de pago con Stripe Checkout**
3. **Usuario completa pago en Stripe**
4. **Stripe envía webhook a tu backend**
5. **Backend confirma pago y crea inscripción**
6. **Backend distribuye fondos (Stripe Connect)**

---

## 📊 Declaración de Ingresos (España)

### Si facturas < 70.000€/año:

**Opción 1: Régimen Simplificado (Estimación Objetiva)**
- Ideal para estudiantes/hobby
- Declaración trimestral (modelo 130)
- Menos papeleo

**Opción 2: Régimen General Simplificado**
- Más control
- Declaración trimestral (modelo 131)
- Libro de ingresos/gastos

### Pasos:

1. **Darte de alta en Hacienda:**
   - Modelo 036/037 (alta como autónomo)
   - Epígrafe: 831.9 "Otros servicios informáticos" o 859.9 "Otros servicios educativos"

2. **Emitir facturas:**
   - Por cada ingreso, emitir factura
   - Guardar todas las facturas

3. **Declarar trimestralmente:**
   - Modelo 130 (si < 70k€/año)
   - Modelo 131 (si quieres más control)

4. **Declarar anualmente:**
   - Modelo 100 (IRPF)

### Consejos:

- **Guarda TODAS las facturas** (Stripe las genera automáticamente)
- **Lleva un Excel** con ingresos/gastos
- **Usa un contable** si facturas > 20k€/año (vale ~50€/mes)
- **Deduce gastos:** hosting, dominio, herramientas, etc.

---

## 🔧 Próximos Pasos de Implementación

1. ✅ Crear cuenta Stripe (modo test)
2. ✅ Instalar dependencias
3. ✅ Crear endpoint de creación de sesión de pago
4. ✅ Modificar flujo de inscripción para requerir pago
5. ✅ Implementar webhook de confirmación
6. ✅ Configurar Stripe Connect para creadores
7. ✅ Guardar transacciones en base de datos

---

## 📝 Notas Importantes

- **Modo Test:** Usa tarjetas de prueba de Stripe (4242 4242 4242 4242)
- **Webhooks:** Necesitas HTTPS (usar ngrok en desarrollo)
- **Seguridad:** NUNCA expongas la clave secreta en el frontend
- **Comisiones:** Considera añadir un pequeño margen para cubrir comisiones

---

## 🆘 Recursos

- [Stripe Docs](https://stripe.com/docs)
- [Stripe Connect](https://stripe.com/docs/connect)
- [Next.js + Stripe](https://stripe.com/docs/payments/checkout)
- [Agencia Tributaria - Autónomos](https://www.agenciatributaria.es/AEAT.internet/Inicio/Ayuda/Modelos_y_formularios/Modelos_y_formularios_por_impuestos/Impuesto_sobre_la_Renta_y_Patrimonio/Modelo_130.shtml)


