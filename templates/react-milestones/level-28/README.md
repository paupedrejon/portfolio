# Portfolio — Curso React (completado)

Portfolio multi-página con routing, tema claro/oscuro, proyectos con imágenes, panel admin demo, tests y CI.

## URL pública

https://mi-portfolio-demo.vercel.app

## Scripts

```bash
npm install
npm run dev      # http://localhost:5173
npm run check    # corrector del curso
npm test         # Vitest
npm run build    # build producción
```

## Variables de entorno

Copia `.env.example` a `.env.local`. Supabase es opcional.

## Rutas

- `/` — Home
- `/proyectos` — Grid con fetch + localStorage
- `/contacto` — Formulario persistente (demo)
- `/login` — Login con API local (`demo@curso.dev` / `curso123`)
- `/admin` — Añadir proyectos (demo)

## Login (desarrollo)

`npm run dev` arranca Vite y el servidor de auth en `http://localhost:8787`. Las peticiones a `/api/*` se redirigen por proxy.
