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
3. Pulsa **Descargar plantilla** (en cualquier nivel) → descomprime el zip.
   - **Nivel 1:** proyecto vacío (plantilla inicial).
   - **Nivel N (N>1):** código como si hubieras terminado el nivel **N−1** (p. ej. nivel 5 → estado tras el 4).
4. En esa carpeta:
   ```bash
   npm install
   npm run check
   ```
5. Programa el nivel en `src/App.jsx` y vuelve a ejecutar `npm run check` hasta ver los ✓.
6. En la web ve el mapa de niveles actualizarse (verde = superado).

**El alumno solo necesita:** Node.js, el zip y conexión a internet para sincronizar con tu web.

### Reiniciar progreso de todos los alumnos

En local (con `.env.local` y service role):

```bash
node scripts/reset-cursos-progress.mjs
```

O en Supabase → SQL Editor, ejecuta `supabase/migrations/002_reset_react_progress.sql`.

Borra `level_progress` y `diplomas` del curso React. **No** borra perfiles ni tokens.

### Snapshots del zip (mantenimiento)

Los estados tras cada nivel viven en `templates/react-milestones/level-01` … `level-29`.  
Para regenerar tras cambiar el curriculum:

```bash
node scripts/generate-react-milestones.mjs
node scripts/test-zip-milestones.mjs
```

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

### Errores frecuentes

| Mensaje | Causa | Solución |
|---------|--------|----------|
| *Supabase no configurado* (503) | Faltan variables en **Vercel** | Añade `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `COURSE_API_BASE_URL` en Vercel → Settings → Environment Variables → **Redeploy** |
| *Invalid path* / tablas raras | `SUPABASE_URL` mal copiada | Debe ser `https://xxx.supabase.co` **sin** `/rest/v1/` al final |

---

## Confusión habitual: ¿qué URL va en cada sitio?

Supabase te muestra **varias URLs distintas**. Solo una va en `SUPABASE_URL` del `.env`.

| Lo que ves | ¿Abrir en Chrome? | ¿Va en `SUPABASE_URL`? |
|------------|-------------------|-------------------------|
| `https://xxx.supabase.co` | Verás `{"error":"requested path is invalid"}` — **normal** | **Sí, esta** |
| `https://xxx.supabase.co/rest/v1/` | Verás `No API key found` — **normal** (falta la clave en la petición) | **No** — el SDK añade `/rest/v1` solo |
| `postgresql://postgres:...@db.xxx.supabase.co:5432/postgres` | No es una URL web | **No** — solo para `SUPABASE_DB_URL` o clientes SQL |

### Cómo encontrar la URL correcta

1. Supabase → **Project Settings** (engranaje) → **API** (o **API Keys**).
2. Arriba suele aparecer **Project URL** / **URL**: `https://aeguejuuknbnmblnbuuq.supabase.co`
3. Esa es la que copias en `.env.local` y Vercel como `SUPABASE_URL`.

El **Connection string** (`postgresql://...`) es la contraseña de la base de datos Postgres. Lo usas solo si ejecutas el SQL desde tu PC con:

```bash
# Opcional: añade SUPABASE_DB_URL con esa URI (sustituye [YOUR-PASSWORD])
node scripts/apply-cursos-migration.mjs
```

Para el curso en Next.js **no necesitas** el connection string si ya pegaste el SQL en **SQL Editor**.
| Descarga / progreso fallan en local pero la clave está en `.env.local` | **No ejecutaste el SQL** | SQL Editor → pegar `supabase/migrations/001_cursos.sql` → Run |
| Token inválido al hacer check | Normal con token de prueba; descarga plantilla nueva desde la web |

### Aplicar el SQL (obligatorio, una vez)

**Opción A — En el navegador (recomendado)**  
Supabase → **SQL Editor** → New query → copia todo `supabase/migrations/001_cursos.sql` → **Run**.

**Opción B — Desde tu PC** (si tienes la connection string de la BD)  
Añade `SUPABASE_DB_URL=postgresql://...` a `.env.local` y ejecuta:  
`node scripts/apply-cursos-migration.mjs`

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
