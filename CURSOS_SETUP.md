# Curso de React — Guía simple

## ¿Qué es Supabase? (en 30 segundos)

**Supabase es una base de datos en la nube** (como un Excel gigante en internet) donde tu web guarda:

- qué niveles ha completado cada alumno,
- su nombre para el diploma,
- el token que va dentro del zip al descargar la plantilla.

**El alumno no usa Supabase.** No se registra ahí, no instala nada de Supabase, no pone claves. Solo entra en tu web con Google, descarga el zip y ejecuta `npm run check`.

**Tú (Pau) configuras Supabase una sola vez** (cuenta gratis, ~15 min). Después la web lo usa sola.

```
Alumno (su PC)                    Tu web (paupedrejon.com)              Supabase
─────────────────                 ────────────────────────              ──────────
npm run check  ──envía resultado──▶  API /verify  ──guarda progreso──▶  tablas
     ▲                                    │
     └── lee nivel actual ────────────────┘
```

---

## Parte A — Lo que hace el ALUMNO (cero Supabase)

1. Entra en **https://www.paupedrejon.com/es/cursos/react**
2. Inicia sesión con **Google** (igual que en Study Agents).
3. Pulsa **Descargar plantilla** → descomprime el zip.
4. En esa carpeta:
   ```bash
   npm install
   npm run check
   ```
5. Programa el nivel en `src/App.jsx` y vuelve a ejecutar `npm run check` hasta ver los ✓.
6. En la web ve el mapa de niveles actualizarse (verde = superado).

**El alumno solo necesita:** Node.js, el zip y conexión a internet para sincronizar con tu web.

---

## Parte B — Lo que haces TÚ (una vez)

### Checklist rápido

- [ ] 1. Crear cuenta gratis en [supabase.com](https://supabase.com)
- [ ] 2. Crear un proyecto (nombre libre, región EU si puedes)
- [ ] 3. Pegar el SQL del curso (crea las tablas)
- [ ] 4. Copiar 2 valores a `.env.local` y a Vercel
- [ ] 5. Desplegar / reiniciar `npm run dev` y probar descarga + `npm run check`

---

### Paso 1 — Cuenta y proyecto

1. Ve a [supabase.com](https://supabase.com) → **Start your project** → login con GitHub o email.
2. **New project** → elige organización → nombre ej. `paupedrejon-cursos` → contraseña de BD (guárdala, casi no la usarás) → **Create**.

Espera 1–2 minutos hasta que el proyecto esté en verde.

---

### Paso 2 — Crear las tablas del curso

1. En el menú izquierdo: **SQL Editor** → **New query**.
2. Abre en tu repo el archivo: `supabase/migrations/001_cursos.sql`
3. Copia **todo** el contenido, pégalo en Supabase y pulsa **Run**.
4. Debe decir que se ejecutó correctamente (sin error en rojo).

Con eso ya existen las “hojas”: perfiles, progreso por nivel, diplomas, tokens del zip.

---

### Paso 3 — Copiar las 2 claves a tu web

1. En Supabase: **Project Settings** (engranaje) → **API Keys** (o tarjeta **API Keys** en el Overview).
2. Verás dos bloques (nombres nuevos de Supabase):

| Lo que ves en Supabase | ¿La uso? | Variable en `.env.local` |
|------------------------|----------|---------------------------|
| **Project URL** (arriba, tipo `https://xxx.supabase.co`) | ✅ Sí | `SUPABASE_URL=...` |
| **Publishable key** (`sb_publishable_...`) | ❌ No para el curso | (solo frontend; no la necesitas ahora) |
| **Secret keys** → **Create** o **Reveal** (`sb_secret_...`) | ✅ **Esta** | `SUPABASE_SERVICE_ROLE_KEY=sb_secret_...` |

La **Secret key** es el sustituto del antiguo `service_role`. Pégala en `SUPABASE_SERVICE_ROLE_KEY` aunque el nombre de la variable diga “service_role”.

Si tienes pestaña **Legacy API Keys**, también vale copiar la clave **`service_role`** (empieza por `eyJ...`) en el mismo sitio.

⚠️ Nunca subas la Secret key a GitHub ni la compartas en chats.

---

### Paso 4 — URL del curso (`COURSE_API_BASE_URL`)

Es la dirección de **tu portfolio** donde vive el curso. El zip del alumno la lleva dentro para que `npm run check` sepa dónde enviar el progreso.

| Dónde trabajas | Valor |
|----------------|--------|
| En tu PC (`npm run dev`) | `http://localhost:3000` o `http://localhost:3001` (el **mismo puerto** que `NEXTAUTH_URL`) |
| En producción (Vercel) | `https://www.paupedrejon.com` (sin `/` al final) |

---

### Paso 5 — Pegar en `.env.local`

**No borres** lo que ya tienes (Google, NextAuth, FastAPI…). **Añade al final:**

```env
# Curso de React — base de datos en la nube (solo tú configuras esto)
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...tu_clave_service_role...

# Mismo puerto que NEXTAUTH_URL en local
COURSE_API_BASE_URL=http://localhost:3001
```

Reinicia el servidor: `Ctrl+C` y otra vez `npm run dev`.

---

### Paso 6 — Pegar en Vercel (producción)

Vercel → tu proyecto portfolio → **Settings** → **Environment Variables** → añade:

| Nombre | Valor |
|--------|--------|
| `SUPABASE_URL` | La misma URL del paso 3 |
| `SUPABASE_SERVICE_ROLE_KEY` | La misma `service_role` del paso 3 |
| `NEXTAUTH_URL` | `https://www.paupedrejon.com` |
| `COURSE_API_BASE_URL` | `https://www.paupedrejon.com` |

Guarda y haz **Redeploy** para que cojan las variables.

---

## Probar que todo funciona

1. Abre `/es/cursos/react` (local o producción).
2. Login con Google → **Descargar plantilla**.
3. Descomprime, `npm install`, `npm run check`.
4. En la web, el nivel 1 debería poder marcarse en verde cuando pasen todos los puntos.

Si ves *“Supabase no configurado”*: faltan las variables o no reiniciaste el servidor / Vercel.

---

## Preguntas frecuentes

**¿Tengo que pagar Supabase?**  
El plan gratis suele bastar para empezar (miles de alumnos ligeros). Más adelante puedes mirar precios si crece mucho.

**¿Por qué no guardamos el progreso en archivos JSON como Study Agents?**  
El curso necesita datos fiables desde la API cuando el alumno ejecuta `npm run check` en **su** ordenador. Una BD en la nube es la forma estándar y segura.

**¿El alumno necesita cuenta en Supabase?**  
No. Nunca.

**¿Qué es `service_role`?**  
Es la “llave maestra” para que **solo tu servidor Next.js** pueda escribir progreso. El navegador del alumno no la ve.

**¿Puedo usar solo producción sin local?**  
Sí: configura solo en Vercel, despliega, y prueba todo en https://www.paupedrejon.com/es/cursos/react.

---

## Archivos técnicos (por si los buscas)

| Qué | Dónde |
|-----|--------|
| Definición de los 30 niveles | `courses/react/levels.js` |
| Plantilla que descarga el alumno | `templates/react-starter/` |
| SQL de las tablas | `supabase/migrations/001_cursos.sql` |
| Variables de entorno de ejemplo | `.env.example` |
