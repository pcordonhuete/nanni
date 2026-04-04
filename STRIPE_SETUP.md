# Guía de configuración de Stripe (modo test)

## Paso 1: Crear cuenta Stripe

1. Ve a [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Crea tu cuenta (no necesitas verificar negocio para modo test)
3. Asegúrate de que estás en **modo test** (toggle arriba a la derecha)

## Paso 2: Obtener las API Keys

1. Ve a [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. Copia las dos claves:
   - **Publishable key** → empieza por `pk_test_...`
   - **Secret key** → empieza por `sk_test_...`

## Paso 3: Crear los productos y precios

### Producto 1: Básico

1. Ve a [https://dashboard.stripe.com/test/products/create](https://dashboard.stripe.com/test/products/create)
2. Rellena:
   - **Nombre**: `Nanni Básico`
   - **Descripción**: `Plan básico para asesoras de sueño. Hasta 10 familias.`
3. Añade un precio:
   - **Modelo de precios**: Recurrente
   - **Importe**: `49.00 EUR` / mes
4. Guarda y copia el **Price ID** (empieza por `price_...`)

### Producto 2: Premium

1. Crea otro producto:
   - **Nombre**: `Nanni Premium`
   - **Descripción**: `Plan premium para asesoras de sueño. Familias ilimitadas + IA + white-label.`
2. Añade un precio:
   - **Modelo de precios**: Recurrente
   - **Importe**: `79.00 EUR` / mes
3. Guarda y copia el **Price ID**

## Paso 4: Crear el cupón del 50% (opcional)

1. Ve a [https://dashboard.stripe.com/test/coupons/create](https://dashboard.stripe.com/test/coupons/create)
2. Rellena:
   - **Tipo**: Porcentaje
   - **Porcentaje**: `50`
   - **Duración**: `Repetir` → `3 meses`
   - **Nombre**: `50% OFF 3 primeros meses`
3. Guarda y copia el **Coupon ID** (empieza por algo como `promo_...` o un ID corto)

## Paso 5: Configurar el Webhook

### Para desarrollo local (con Stripe CLI):

1. Instala Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Reenvía eventos a tu app local:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copia el **webhook signing secret** que aparece (empieza por `whsec_...`)

### Para producción (Vercel):

1. Ve a [https://dashboard.stripe.com/test/webhooks/create](https://dashboard.stripe.com/test/webhooks/create)
2. Configura:
   - **Endpoint URL**: `https://nanniapp.com/api/stripe/webhook`
   - **Eventos a escuchar** (selecciona estos):
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
     - `invoice.payment_succeeded`
3. Guarda y copia el **Signing secret** (empieza por `whsec_...`)

## Paso 6: Configurar Customer Portal

1. Ve a [https://dashboard.stripe.com/test/settings/billing/portal](https://dashboard.stripe.com/test/settings/billing/portal)
2. Activa las opciones que quieras permitir:
   - **Actualizar método de pago**: Sí
   - **Cancelar suscripción**: Sí
   - **Cambiar plan**: Sí (añade los dos precios)
   - **Ver historial de facturas**: Sí
3. Guarda la configuración

## Paso 7: Añadir las variables de entorno

### En local (`.env.local`):

```env
STRIPE_SECRET_KEY=sk_test_XXXXX
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXX
STRIPE_BASICO_MONTHLY_PRICE_ID=price_XXXXX
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_XXXXX
STRIPE_50_OFF_3_MONTHS_COUPON_ID=        # dejar vacío si no creaste cupón
```

### En Vercel (producción):

1. Ve a [Vercel Dashboard → Settings → Environment Variables](https://vercel.com/pcordonhuetes-projects/nanni/settings/environment-variables)
2. Añade **cada variable** de arriba como variable de entorno
3. Redespliega: `vercel deploy --prod`

## Paso 8: Probar el flujo completo

### Tarjetas de prueba de Stripe:

| Escenario | Número | CVC | Fecha |
|-----------|--------|-----|-------|
| Pago exitoso | `4242 4242 4242 4242` | Cualquier 3 dígitos | Cualquier fecha futura |
| Pago rechazado | `4000 0000 0000 0002` | Cualquier | Cualquier futura |
| Requiere autenticación (3DS) | `4000 0025 0000 3155` | Cualquier | Cualquier futura |
| Fondos insuficientes | `4000 0000 0000 9995` | Cualquier | Cualquier futura |

### Flujo de prueba:

1. Regístrate en la app como asesora
2. Ve a `/plan`
3. Haz clic en "Empezar con Premium"
4. Usa la tarjeta `4242 4242 4242 4242`
5. Completa el checkout
6. Verifica que te redirige al dashboard con el toast de éxito
7. Ve a Ajustes → "Gestionar suscripción" para probar el portal
8. En el portal, prueba cancelar y verificar que el estado cambia

## Arquitectura del flujo

```
Usuario → /plan (clic "Empezar") 
  → POST /api/stripe/checkout
  → Crea/Reutiliza Customer en Stripe
  → Crea Checkout Session
  → Redirect a Stripe Checkout (hosted)
  → Usuario paga con tarjeta test
  → Stripe envía webhook checkout.session.completed
  → POST /api/stripe/webhook
  → Actualiza subscriptions en Supabase (plan, status, stripe IDs)
  → Crea notificación para el asesor
  → Redirect a /dashboard?upgraded=true
  → Toast de éxito

Gestión posterior:
  Ajustes → "Gestionar suscripción"
  → POST /api/stripe/portal
  → Redirect a Stripe Customer Portal (hosted)
  → Usuario puede: cambiar plan, actualizar pago, cancelar, ver facturas
  → Stripe envía webhooks de cambios
  → Webhook actualiza Supabase automáticamente
```

## Notas importantes

- **Modo test vs producción**: Todas las URLs de arriba son para modo test. Para producción, simplemente cambia las API keys por las de producción (sin `_test_`) y crea productos/precios reales.
- **Supabase Service Role Key**: Necesaria para que el webhook pueda actualizar la base de datos sin autenticación de usuario. Añádela como `SUPABASE_SERVICE_ROLE_KEY` en Vercel.
- **Los datos de test se pueden borrar**: En Stripe Dashboard → Developers → "Delete all test data" para empezar de cero.
