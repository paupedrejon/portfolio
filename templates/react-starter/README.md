# Plantilla — Curso de React (paupedrejón)

Construye tu portfolio personal nivel a nivel. El corrector comprueba tu app en el navegador real.

**No necesitas Supabase ni ninguna cuenta extra.** Solo esta carpeta, Node.js y haber iniciado sesión en [paupedrejon.com/es/cursos/react](https://www.paupedrejon.com/es/cursos/react) para descargar este zip.

## Requisitos

- Node.js 18+
- Conexión a internet (para enviar el veredicto a la web del curso)

## Instalación

```bash
npm install
```

La primera vez instalará Chromium para Playwright automáticamente.

## Desarrollo (opcional)

```bash
npm run dev
```

Abre http://localhost:5173 para ver tu app mientras programas.

## Comprobar tu nivel

```bash
npm run check
```

El corrector **arranca la app automáticamente**, ejecuta las pruebas del nivel actual y envía los resultados a la web del curso.

Para forzar un nivel concreto:

```bash
npm run check -- --level 1
```

## Configuración

El archivo `course.config.json` se genera al descargar la plantilla desde la web. No lo compartas (contiene tu token personal).

## Ayuda

Si un punto falla, lee el mensaje en terminal (ej. `encontrado: left`) y revisa las instrucciones del nivel en la web del curso.
