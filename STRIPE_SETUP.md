# Configuración de Stripe para Wallet

## 📋 Pasos para Configurar Stripe

### 1. Crear Cuenta en Stripe

1. Ve a https://stripe.com
2. Crea una cuenta (gratis)
3. Completa la verificación (puedes usar modo test al principio)

### 2. Obtener API Keys

1. En el Dashboard de Stripe, ve a **Developers** → **API keys**
2. Encuentra:
   - **Publishable key** (empieza con `pk_test_...` o `pk_live_...`)
   - **Secret key** (empieza con `sk_test_...` o `sk_live_...`)

### 3. Configurar Webhook

1. En Stripe Dashboard, ve a **Developers** → **Webhooks**
2. Click en **Add endpoint**
3. URL del endpoint: `https://tu-dominio.com/api/study-agents/stripe-webhook`
   - Para desarrollo local, usa ngrok: `https://tu-ngrok-url.ngrok.io/api/study-agents/stripe-webhook`
4. Selecciona eventos: `checkout.session.completed`
5. Copia el **Signing secret** (empieza con `whsec_...`)

### 4. Configurar Variables de Entorno

Añade estas variables a tu `.env.local` (frontend) y `.env` (backend):

```env
# Stripe Keys
# IMPORTANTE: Reemplaza estas claves con las tuyas desde https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_...  # Backend - Obtén desde Stripe Dashboard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Frontend (opcional, no se usa actualmente)
STRIPE_WEBHOOK_SECRET=whsec_...  # Backend - Obtén desde Stripe Dashboard → Webhooks

# URL de tu aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Desarrollo
# NEXT_PUBLIC_APP_URL=https://tu-dominio.com  # Producción
```

**Nota:** El código incluye claves de prueba por defecto para desarrollo, pero **debes reemplazarlas con tus propias claves** desde tu cuenta de Stripe para que funcione correctamente.

### 5. Instalar Dependencias

**Backend (Python):**
```bash
pip install stripe
```

**Frontend (ya está instalado, pero verifica):**
```bash
npm install  # No se necesita nada adicional
```

### 6. Probar en Modo Test

Stripe proporciona tarjetas de prueba:

- **Tarjeta exitosa:** `4242 4242 4242 4242`
- **CVV:** Cualquier 3 dígitos (ej: 123)
- **Fecha:** Cualquier fecha futura (ej: 12/25)
- **Código postal:** Cualquier código (ej: 12345)

### 7. Verificar que Funciona

1. Inicia el backend: `python -m uvicorn study_agents.api.main:app --reload`
2. Inicia el frontend: `npm run dev`
3. Ve a la página de cursos
4. Click en el saldo del wallet
5. Recarga 10€
6. Usa la tarjeta de prueba: `4242 4242 4242 4242`
7. Verifica que el saldo se actualiza

---

## 🔒 Seguridad

- **NUNCA** expongas `STRIPE_SECRET_KEY` en el frontend
- **SIEMPRE** usa variables de entorno
- **VERIFICA** las firmas de webhook en producción
- **USA** HTTPS en producción (Stripe lo requiere)

---

## 📝 Notas

- En desarrollo, usa `pk_test_` y `sk_test_`
- En producción, usa `pk_live_` y `sk_live_`
- Los webhooks requieren HTTPS (usa ngrok en desarrollo)
- Las comisiones de Stripe se aplican automáticamente

---

## 🆘 Troubleshooting

**Error: "Stripe no configurado"**
- Verifica que `STRIPE_SECRET_KEY` esté en `.env` del backend

**Error: "Invalid signature" en webhook**
- Verifica que `STRIPE_WEBHOOK_SECRET` sea correcto
- Asegúrate de usar la URL correcta en Stripe

**El saldo no se actualiza después del pago**
- Verifica que el webhook esté configurado correctamente
- Revisa los logs del backend para ver errores
- Verifica que el evento `checkout.session.completed` esté seleccionado

---

## 🚀 Pasar a Producción

1. Cambia a claves `live` en Stripe
2. Actualiza variables de entorno con claves `live`
3. Configura webhook con URL de producción
4. Verifica que HTTPS esté habilitado
5. Prueba con una recarga pequeña primero


