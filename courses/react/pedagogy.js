/**
 * Contenido pedagógico del curso interactivo de React (30 niveles).
 * Explica conceptos de React y desarrollo web para principiantes que construyen un portfolio.
 */

/** @type {Record<number, string>} */
export const LEVEL_INSTRUCTIONS = {
  1: "En este nivel descubres cómo React renderiza una interfaz: un componente devuelve JSX (HTML dentro de JavaScript) y Vite lo muestra en el navegador. Aprenderás a editar App.jsx, usar className en lugar de class y aplicar estilos con Tailwind para crear un hero a pantalla completa con un título centrado.",
  2: "Amplías el hero con más elementos HTML dentro del mismo componente: un párrafo de presentación y un botón de llamada a la acción (CTA). Verás cómo el orden del JSX define la estructura visual y cómo Flexbox en columna alinea varios bloques de forma vertical y centrada.",
  3: "Construyes tu primera sección de contenido debajo del hero usando etiquetas semánticas como section y h2. Aprenderás a organizar una página en bloques independientes y a hacer que el texto sea legible en pantallas pequeñas con padding y ancho máximo.",
  4: "Añades navegación fija con header y nav, enlaces internos con anclas (#) y posicionamiento CSS fixed o sticky. Entenderás cómo una barra de navegación permanece visible al hacer scroll y cómo los href apuntan a secciones de la misma página.",
  5: "Aplicas diseño responsive mobile-first: primero maquetas para móvil y luego usas breakpoints md: de Tailwind para adaptar tamaños en desktop. Comprenderás por qué evitar scroll horizontal y cómo las clases condicionales mejoran la lectura en distintos dispositivos.",
  6: "Das el salto clave de React: separar la UI en componentes reutilizables (Hero, Navbar, About) en archivos propios e importarlos en App.jsx. Aprenderás export default, imports relativos y por qué dividir el código facilita el mantenimiento del portfolio.",
  7: "Creas un componente ProjectCard que recibe datos desde fuera mediante props (title, description). Es el patrón fundamental de React: componentes genéricos + datos variables = UI reutilizable sin duplicar código.",
  8: "Renderizas listas dinámicas con un array de proyectos y el método .map(), pasando cada elemento como props a ProjectCard. Aprenderás la prop key para identificar elementos en listas y cómo separar datos (projects.js) de la presentación.",
  9: "Introduces interactividad con useState: un estado que, al cambiar, hace que React vuelva a renderizar la interfaz. Implementarás un toggle de tema claro/oscuro y verás cómo los eventos onClick actualizan el estado y el aspecto de la página.",
  10: "Construyes un formulario de contacto con inputs controlados: el valor de cada campo vive en useState y onChange lo actualiza. Es el modelo mental de React para formularios — la UI es un reflejo del estado, no del DOM directamente.",
  11: "Añades validación en el cliente antes de enviar: comprobar campos vacíos y formato de email. Aprenderás a mostrar mensajes de error condicionalmente en JSX y a dar feedback inmediato sin recargar la página.",
  12: "Usas useEffect para efectos secundarios: cargar datos desde un archivo JSON con fetch cuando el componente se monta. Entenderás el ciclo de vida, el array de dependencias [] y cómo separar la carga de datos de la renderización.",
  13: "Gestionas estados asíncronos en la UI: loading mientras llegan los datos y error si la petición falla. Es un patrón esencial en aplicaciones reales — nunca asumir que los datos están disponibles al instante.",
  14: "Animas secciones al entrar en el viewport con CSS o IntersectionObserver. Verás cómo combinar JavaScript del navegador con React para mejorar la experiencia sin librerías pesadas.",
  15: "Implementas un modal controlado por estado: al hacer clic en una tarjeta se abre un panel superpuesto y un botón lo cierra. Aprenderás renderizado condicional ({open && <Modal />}) y a elevar el estado entre componentes padre e hijo.",
  16: "Transformas tu sitio en una SPA (Single Page Application) con react-router-dom: rutas como / y /proyectos sin recargar el navegador. Comprenderás BrowserRouter, Routes y Route como el mapa de páginas de tu portfolio.",
  17: "Refactorizas lógica repetida en un custom hook useFetch y centralizas datos extra en projectsStore.js. Es el paso hacia código profesional: hooks personalizados encapsulan comportamiento y los módulos lib/ gestionan persistencia.",
  18: "Eliminas el prop drilling del tema con React Context: ThemeProvider envuelve la app y useTheme() da acceso al estado global desde cualquier componente. Aprenderás cuándo Context es mejor que pasar props por muchos niveles.",
  19: "Mejoras accesibilidad y SEO básico: etiqueta main, lang=\"es\", meta description y atributos alt en imágenes. Un portfolio profesional debe ser usable con lectores de pantalla y comprensible para buscadores.",
  20: "Conectas el frontend con un backend real: servidor Node local, proxy de Vite y fetch POST para autenticación. Verás cómo el navegador habla con una API y cómo guardar un token en localStorage tras un login exitoso.",
  21: "Preparas la integración con Supabase usando variables de entorno (VITE_*) y un cliente en lib/supabase.js. Aprenderás a no hardcodear secretos y a documentar la configuración en .env.example para tu equipo o despliegue.",
  22: "Creas un panel de administración con CRUD local: formulario en /admin que añade proyectos a localStorage mediante projectsStore. Es persistencia en el cliente y preparación para un backend real más adelante.",
  23: "Añades subida de imágenes con input type=\"file\", accept y vista previa con URL.createObjectURL. Entenderás cómo manejar archivos en el navegador y mostrar una miniatura antes de guardar el proyecto.",
  24: "El formulario de contacto persiste mensajes en localStorage con contactStore.js y muestra confirmación al usuario. Completarás el flujo de envío: validar → guardar → feedback visual → limpiar campos.",
  25: "Consolidas la gestión de variables de entorno: documentar todas las VITE_ en .env.example y auditar que no queden claves en el código fuente. La seguridad en frontend empieza por no exponer secretos de servidor.",
  26: "Introduces tests automatizados con Vitest y Testing Library: renderizar ProjectCard y comprobar que el texto aparece. Aprenderás por qué los tests dan confianza al refactorizar y cómo ejecutarlos con npm test.",
  27: "Optimizas la carga con React.lazy y Suspense: Login y Admin se descargan solo al visitar esas rutas (code splitting). Reducirás el bundle inicial y mejorarás el tiempo de carga de la home.",
  28: "Documentas el proyecto en README.md: scripts, URL de deploy y placeholder de analytics. Un repositorio bien documentado facilita colaboración, despliegue y mantenimiento a largo plazo.",
  29: "Configuras CI con GitHub Actions: en cada push se ejecutan npm ci, test y build automáticamente. Entenderás integración continua como red de seguridad antes de desplegar a producción.",
  30: "Despliegas el portfolio en Vercel o Netlify: build de producción, variables de entorno en el hosting y verificación de la URL pública. Cerrarás el curso con un sitio real accesible en internet.",
};

/** @type {Record<string, string>} */
export const CHECKPOINT_CONCEPTS = {
  "page-renders":
    "React necesita que la aplicación arranque sin errores de JavaScript ni de compilación. Vite sirve tu código en desarrollo y cualquier error en consola (F12) indica que algo en JSX o imports está mal escrito. Un proyecto que carga correctamente es la base de todo lo demás.",

  "h1-exists":
    "En JSX escribes HTML como si fuera JavaScript: las etiquetas van dentro del return del componente. El <h1> es el encabezado principal de la página; en React usas className en lugar de class. Cada componente debe devolver un solo elemento raíz (o un Fragment).",

  "h1-text":
    "El contenido entre etiquetas JSX es texto estático o expresiones entre llaves { }. React inserta «Hello World» en el DOM cuando renderiza el componente. Si cambias el texto y guardas, React actualiza solo esa parte de la pantalla (re-render parcial).",

  "h1-centered":
    "className aplica clases de Tailwind CSS al elemento. text-center alinea el texto al centro con CSS text-align. En React no existe el atributo class — siempre es className porque class es palabra reservada en JavaScript.",

  "hero-no-placeholder":
    "Al empezar un proyecto conviene quitar el contenido de plantilla que no formará parte de tu portfolio. Mantener solo lo que tú controlas evita confusión y deja App.jsx listo para tu diseño real.",

  "hero-bg-dark":
    "El elemento <main> agrupa el contenido principal de la página (buena práctica de accesibilidad). Las clases de fondo como bg-[#0a0a0f] o bg-gray-950 definen el color de fondo del hero. El estilo vive en className, no en hojas CSS separadas cuando usas Tailwind.",

  "hero-min-h-screen":
    "min-h-screen hace que el contenedor tenga al menos la altura del viewport (100vh). Así el hero cubre toda la pantalla aunque haya poco contenido. Es un patrón habitual en landings y portfolios.",

  "hero-flex-center":
    "Flexbox (flex, items-center, justify-center) centra hijos en horizontal y vertical. flex-col apila en columna; sin flex-col los elementos irían en fila. Combinar min-h-screen con flex es la forma estándar de centrar un hero a pantalla completa.",

  "h1-text-large":
    "Tailwind usa clases utilitarias para tamaño de fuente: text-4xl, text-5xl, etc. El prefijo md: aplica el estilo solo desde el breakpoint mediano en adelante (diseño responsive). Así el título puede ser más grande en desktop que en móvil.",

  "h1-text-white":
    "text-white define el color del texto. En un fondo oscuro necesitas contraste suficiente para legibilidad. Más adelante usarás variables CSS (--text-primary) cuando el tema sea dinámico.",

  "h1-font-bold":
    "font-bold equivale a font-weight: 700 en CSS. Las clases de Tailwind se pueden encadenar en un solo className. El resultado final del h1 combina tipografía, color y alineación en una sola cadena de clases.",

  "h1-still-present":
    "En React cada nivel construye sobre el anterior: no borres componentes que ya funcionan. Mantener el h1 del nivel 1 demuestra que entiendes que el JSX es acumulativo — añades hermanos (p, button) sin destruir lo existente.",

  "hero-layout-column":
    "flex flex-col items-center en el contenedor padre alinea todos los hijos (h1, p, button) en columna centrada. Sin flex-col, Flexbox dispone los elementos en fila por defecto. El layout del hero depende del contenedor, no de cada hijo por separado.",

  "subtitle-p-exists":
    "El <p> es un párrafo de texto; en un hero suele ser el subtítulo o presentación breve. En JSX cada etiqueta debe cerrarse (<p></p> o <p /> si está vacía). El orden en el código JSX determina el orden visual en pantalla.",

  "subtitle-text-length":
    "El texto del subtítulo comunica quién eres en una o dos frases. React no impone longitud mínima — es requisito del curso para asegurar contenido real. El texto entre etiquetas se renderiza tal cual, sin HTML interno a menos que uses dangerouslySetInnerHTML (evítalo al principio).",

  "subtitle-below-h1":
    "El flujo del documento sigue el orden del DOM: primero h1, luego p. Con flex-col el párrafo aparece debajo del título. Si se ven lado a lado, falta flex-col o hay estilos que fuerzan display en fila.",

  "subtitle-styled":
    "Clases como text-gray-300, mt-4 y max-w-md dan jerarquía visual: el subtítulo es secundario respecto al h1. mt-4 añade margen superior; max-w-md limita el ancho del párrafo para líneas más legibles.",

  "cta-plain-exists":
    "El <button type=\"button\"> evita que el botón envíe un formulario por defecto. Los botones en React usan onClick para manejar clics (lo añadirás en niveles posteriores). Primero existe el elemento; después le das estilo e interacción.",

  "cta-below-subtitle":
    "La pila vertical h1 → p → button es un patrón de hero clásico. En JSX los elementos hermanos dentro del mismo padre se renderizan en orden. Comprobar en el navegador confirma que el layout coincide con tu intención.",

  "hero-vertical-stack-final":
    "Un hero bien maquetado no solapa textos ni botones. Revisa en distintos anchos de ventana: Flexbox con gap o márgenes (mt-6) separan bloques. Este checkpoint valida que la composición visual es coherente antes de pasar a nuevas secciones.",

  "cta-padding":
    "px-6 y py-3 añaden padding horizontal y vertical al botón, aumentando el área clicable. En UI accesible los objetivos táctiles deben ser lo bastante grandes; el padding ayuda sin cambiar solo el tamaño de fuente.",

  "cta-rounded":
    "rounded-full o rounded-lg redondean las esquinas con border-radius. Es presentación pura (CSS vía Tailwind) pero define la identidad visual del CTA de tu portfolio.",

  "cta-teal-style":
    "bg-[#2a8ca0] y text-white aplican color de marca al botón. font-semibold refuerza el peso del texto del CTA. Los colores de acento guían la atención del visitante hacia la acción principal (ver proyectos).",

  "hero-from-level2-intact":
    "Al añadir secciones nuevas, el hero anterior debe seguir renderizándose igual. React renderiza todo el árbol de App.jsx: si borras el hero por error, pierdes niveles anteriores. Piensa en la página como capas apiladas verticalmente.",

  "about-section-exists":
    "La etiqueta <section> agrupa contenido temático; id=\"about\" permite enlazar con href=\"#about\" desde la navbar. Los id deben ser únicos en la página. Es HTML semántico que mejora accesibilidad y navegación por anclas.",

  "about-heading":
    "Jerarquía de encabezados: un solo h1 en la página (el del hero) y h2 para títulos de sección. Los lectores de pantalla usan esta jerarquía para navegar. «Sobre mí» en h2 deja claro el propósito del bloque.",

  "about-paragraph":
    "Varios <p> o uno largo con tu biografía dan contenido real al portfolio. React renderiza el texto de los hijos de section igual que en HTML estático; la diferencia es que luego podrás mover esta sección a un componente About.jsx.",

  "about-mobile-readable":
    "Diseño mobile-first: px-4 evita que el texto roce los bordes en 375px; max-w-2xl mx-auto centra y limita el ancho en pantallas grandes. Probar con DevTools (modo dispositivo) detecta overflow horizontal antes de desplegar.",

  "nav-element-exists":
    "<nav> dentro de <header> identifica la barra de navegación para usuarios y buscadores. En React es JSX normal; más adelante extraerás Navbar.jsx. La navegación suele ir fuera de <main> porque se repite en todas las vistas.",

  "nav-position-fixed":
    "position: fixed (clase fixed top-0) saca el elemento del flujo y lo fija al viewport; z-50 lo coloca por encima del contenido. sticky es alternativa si solo quieres que se pegue al hacer scroll. Recuerda añadir padding-top al body o main para que el contenido no quede oculto bajo la barra.",

  "nav-brand-exists":
    "El enlace de marca (tu nombre o «Mi Portfolio») suele llevar a la home (# o /). Es identidad visual en la navbar. En JSX, href y className funcionan como en HTML.",

  "nav-link-count":
    "Enlaces internos (#about, #projects) permiten saltar a secciones sin recargar. Antes del router, toda la navegación es por anclas en una sola página. Cada enlace es un <a> con href que apunta al id de la sección destino.",

  "nav-anchor-links":
    "Los anclas (#id) usan el fragmento de la URL; el navegador hace scroll al elemento con ese id. Comprobar que cada href coincide con un id existente evita enlaces rotos. Más adelante algunos enlaces serán rutas (/proyectos) con React Router.",

  "responsive-mobile-padding":
    "En móvil el espacio horizontal es escaso: px-4 en secciones evita texto pegado al borde y reduce riesgo de overflow. Mobile-first significa diseñar primero para el ancho pequeño y ampliar después con md: y lg:.",

  "responsive-mobile-readable":
    "Tamaños de fuente y contenedores deben leerse sin zoom en 375px. Si «Hello World» se sale, revisa clases de ancho fijo o padding insuficiente. Tailwind responsive no requiere media queries manuales en CSS.",

  "responsive-md-breakpoint":
    "El prefijo md: en Tailwind aplica utilidades desde 768px. Ejemplo: text-4xl md:text-5xl crece el título en tablet/desktop. Es el patrón estándar para adaptar tipografía y grids sin escribir @media en archivos CSS.",

  "responsive-desktop-layout":
    "En 1280px los grids pueden mostrar más columnas (md:grid-cols-2) y márgenes mayores. Verificar en desktop asegura que el diseño no «rompe» al expandir — elementos que se estiran demasiado o grids vacíos son señales de revisar breakpoints.",

  "file-hero-component":
    "Componentizar es dividir la UI en archivos que exportan una función que devuelve JSX. Hero.jsx encapsula todo el bloque del hero; App.jsx solo importa y usa <Hero />. Un componente = una responsabilidad visual clara.",

  "app-imports-hero":
    "import Hero from \"./components/Hero\" carga el módulo; <Hero /> lo instancia en el árbol de React. La ruta relativa depende de dónde está App.jsx. export default en Hero.jsx permite importar con el nombre que elijas.",

  "file-navbar-component":
    "Navbar.jsx agrupa header, nav y enlaces. Separar navegación del resto facilita cambios globales (añadir un enlace) sin tocar Hero o About. Es la misma idea que funciones reutilizables en programación.",

  "app-imports-navbar":
    "Coloca <Navbar /> típicamente antes de <main> en App.jsx para que la barra quede arriba en el DOM. El orden de los componentes en JSX es el orden en pantalla (salvo position fixed).",

  "file-about-component":
    "About.jsx contiene la sección #about completa. Mover JSX a otro archivo no cambia el HTML resultante — solo organiza el código. Cada componente sigue siendo una función que return (...).",

  "app-imports-about":
    "App.jsx se convierte en composición: Navbar, Hero, About, etc. Es el patrón contenedor presentacional a pequeña escala. Si la página se ve en blanco tras refactorizar, suele faltar un import o un export default.",

  "page-still-renders-hero":
    "Tras componentizar, el resultado visual debe ser idéntico. React reconcilia el nuevo árbol de componentes con el DOM; si Hero exporta el mismo JSX que antes, «Hello World» sigue visible. Los errores de import rompen toda la app.",

  "file-project-card":
    "ProjectCard.jsx define la estructura de una tarjeta de proyecto (título, descripción). data-testid ayuda a tests y al curso a verificar el componente. Es un componente presentacional: recibe datos y los muestra.",

  "project-card-accepts-props":
    "Las props son argumentos del componente: function ProjectCard({ title, description }). Dentro del JSX usas {title} y {description} para insertar valores dinámicos. Las props fluyen de padre a hijo y son de solo lectura en el hijo.",

  "project-card-renders":
    "El padre (App o Projects) renderiza <ProjectCard title=\"...\" description=\"...\" />. Cada instancia es independiente con distintos valores de props. Así evitas copiar y pegar el mismo JSX para cada proyecto.",

  "projects-data-file":
    "Separar datos (src/data/projects.js) de componentes es buena arquitectura. export const projects = [...] puede importarse donde haga falta. Los objetos con id, title y description son el modelo de datos de tu portfolio.",

  "projects-grid-exists":
    "La sección id=\"projects\" agrupa el listado. Un div con grid y gap organiza tarjetas en columnas responsivas (md:grid-cols-2). CSS Grid en Tailwind se controla con clases, sin CSS modules obligatorios.",

  "projects-map-used":
    "array.map((p) => <ProjectCard key={p.id} ... />) transforma cada objeto en un elemento React. key={p.id} ayuda a React a identificar filas al actualizar la lista. Sin key única, verás warnings en consola y posibles bugs al reordenar.",

  "projects-min-count":
    "Dos o más proyectos demuestran que el map funciona con varios elementos, no solo uno hardcodeado. En un portfolio real el array crecerá con datos de JSON, API o admin.",

  "theme-usestate":
    "useState(true) crea estado local: const [dark, setDark] = useState(true). Al llamar setDark(false), React re-renderiza el componente con el nuevo valor. El estado es la memoria del componente entre renders.",

  "theme-toggle-button":
    "El botón llama a setDark o una función toggle en onClick. data-testid y aria-label mejoran tests y accesibilidad. type=\"button\" evita submits accidentales si el botón está dentro de un form.",

  "theme-changes-on-click":
    "Al cambiar el estado, aplicas clases o data-theme en document.documentElement y variables CSS (--page-bg, --text-primary). La UI reacciona al estado: ese es el ciclo evento → setState → re-render en React.",

  "contact-section-exists":
    "section id=\"contact\" alberga el formulario de contacto. Los formularios en React suelen vivir en un componente ContactForm.jsx con su propio estado. La sección es el ancla para navegación #contact.",

  "contact-input-name":
    "Inputs con name e id enlazan etiquetas y accesibilidad. En formularios controlados añadirás value y onChange conectados a useState. type por defecto es text; no hace falta para nombre.",

  "contact-input-email":
    "type=\"email\" activa validación básica del navegador y teclado adecuado en móvil. Igual que el nombre, será controlado con estado en el siguiente paso del formulario.",

  "contact-textarea-message":
    "textarea permite varias líneas; rows={4} define altura inicial. En JSX las props numéricas van entre llaves. El mensaje largo también se guardará en estado con useState.",

  "contact-controlled-inputs":
    "Input controlado: value={name} onChange={(e) => setName(e.target.value)}. React es la fuente de verdad — el DOM refleja el estado, no al revés. Esto permite validar, limpiar y enviar datos de forma predecible en cada render.",

  "contact-submit-button":
    "type=\"submit\" en un <form> dispara onSubmit del formulario. handleSubmit debe hacer e.preventDefault() para evitar recarga de página. El botón enviar es el disparador del flujo de validación y envío.",

  "validation-error-ui":
    "Renderizado condicional: {errors.name && <p className=\"text-red-500\">...</p>}. Muestras errores solo cuando existen. El estado de errores puede ser un objeto o strings por campo; actualízalo en validate() antes de enviar.",

  "validation-email-format":
    "Validar email en cliente (presencia de @, regex simple) da feedback inmediato. No sustituye validación en servidor, pero mejora UX. Comprueba el estado del campo email en handleSubmit, no solo campos vacíos.",

  "projects-json-exists":
    "public/projects.json se sirve en la raíz (/projects.json) sin importarlo en JS. Simula una API estática. El array JSON debe ser válido; fetch lo parsea con .json().",

  "useeffect-fetch":
    "useEffect(() => { fetch(...).then(...) }, []) ejecuta el fetch al montar el componente; [] significa «solo una vez». Los efectos son para sincronizar con sistemas externos (red, DOM, timers). setProjects actualiza estado y provoca re-render con los datos.",

  "loading-indicator":
    "Mientras loading es true, muestras «Cargando…» en lugar del grid vacío. El usuario entiende que la app trabaja. Patrón: loading → datos o error; nunca asumir data inmediata.",

  "error-state-ui":
    "Si fetch falla, guarda el mensaje en error y muestralo en rojo. try/catch o .catch en la promesa. Estados mutuamente excluyentes (no mostrar grid y error a la vez) clarifican la UI.",

  "scroll-reveal-class":
    "Animar al scroll mejora percepción de calidad. Puedes usar CSS @keyframes + clase .reveal o IntersectionObserver en useEffect para añadir clases cuando la sección entra en viewport. No bloquea el hilo principal si es CSS puro.",

  "scroll-section-animated":
    "Al menos una sección con transición de opacidad o transform confirma que el observer o CSS funciona. Prueba haciendo scroll lento; la animación debe dispararse una vez o con toggle según tu implementación.",

  "modal-component-exists":
    "ProjectModal.jsx es un componente que recibe props como project, open y onClose. Los modales suelen renderizarse con position fixed y fondo semitransparente. Mantener el modal en archivo propio facilita reutilizarlo.",

  "modal-opens-on-click":
    "Estado open en el padre (Projects o ProjectCard): onClick={() => setOpen(true)} y pasar project seleccionado. Elevar estado permite que el modal y la tarjeta compartan qué proyecto se muestra.",

  "modal-closes":
    "onClose pone open en false y opcionalmente limpia project. Botón Cerrar o clic en overlay. Renderizado condicional {open && <ProjectModal />} desmonta el modal al cerrar, liberando foco y listeners si los añadiste.",

  "router-package":
    "react-router-dom añade enrutado cliente a la SPA. npm install lo incluye en package.json. Sin router, cada «página» sería un scroll a anclas; con router, URLs distintas cargan componentes distintos.",

  "router-browser":
    "BrowserRouter usa la History API del navegador (URLs limpias sin #). Envuelve <App /> en main.jsx para que Routes y useNavigate funcionen en todo el árbol. Es el estándar en apps Vite + React.",

  "route-home":
    "Route path=\"/\" element={<HomePage />} mapea la raíz al componente home. Routes elige la primera Route que coincida. La home suele componer Hero + About sin listado completo de proyectos.",

  "route-projects-page":
    "Route path=\"/proyectos\" muestra ProjectsPage. Las URLs en español son válidas; el hosting SPA debe redirigir todas las rutas a index.html. Link de react-router-dom evita recarga completa al navegar.",

  "file-usefetch":
    "Custom hooks empiezan con use y encapsulan useState + useEffect. useFetch(url) devuelve { data, loading, error } reutilizable en cualquier componente. Extraer lógica reduce duplicación y facilita tests.",

  "usefetch-hook-states":
    "Dentro del hook gestionas tres piezas de estado y un efecto que hace fetch cuando url cambia. return { data, loading, error } es la API pública del hook. Los hooks siguen las reglas de React (solo en top level, no en condicionales).",

  "file-projects-store":
    "projectsStore.js es módulo de utilidades, no un componente. getExtraProjects lee localStorage — persistencia del lado cliente sin backend. Separar almacenamiento de UI mantiene Projects.jsx legible.",

  "usefetch-used":
    "const { data: base, loading, error } = useFetch(\"/projects.json\") sustituye useEffect manual. Renombrar data a base con alias de destructuring es idioma JavaScript válido. Elimina fetch duplicado del componente.",

  "projects-loading-ui":
    "Reutilizas el patrón loading/error del nivel 13 pero con datos del hook. El componente solo consume { loading, error, data } — no le importa cómo se obtienen. Separación de responsabilidades.",

  "projects-merge-extras":
    "const projects = base ? [...base, ...extras] : extras combina JSON remoto con proyectos del admin en localStorage. El spread [...] crea un nuevo array; React detecta cambio de referencia y re-renderiza la lista.",

  "file-theme-context":
    "createContext(null) crea un contenedor para valor global. ThemeContext.jsx exporta Provider, Consumer implícito vía useContext y el hook useTheme. Context evita pasar dark y toggle por cada nivel del árbol.",

  "theme-create-provider":
    "ThemeProvider es componente que usa useState para dark y expone value={{ dark, toggle }}. useEffect sincroniza data-theme en <html> para variables CSS. Los hijos cualquiera pueden leer el tema sin props intermedias.",

  "theme-hook-export":
    "useTheme() llama useContext(ThemeContext) y lanza error si falta Provider — falla rápido en desarrollo. Es API ergonómica: const { dark, toggle } = useTheme() en Navbar.",

  "theme-provider-wraps":
    "En main.jsx el orden importa: BrowserRouter → ThemeProvider → App. El Provider debe envolver a quien use useTheme. Anidar providers (tema, auth, etc.) es habitual en apps medianas.",

  "navbar-use-theme":
    "Navbar deja de recibir dark y onToggleTheme por props; lee del contexto. Menos acoplamiento entre App y Navbar. Si cambias la lógica del tema, solo editas ThemeContext.",

  "app-no-theme-props":
    "App.jsx simplificado: sin useState de tema ni props en Navbar. Estado global vive en el Provider. Demuestra migración de estado local a Context cuando muchos componentes lo necesitan.",

  "page-home-main":
    "Cada página debe tener un único <main> con el contenido principal (no la navbar). Mejora accesibilidad: lectores de pantalla saltan al main. HomePage compone Hero y About dentro de main.",

  "page-projects-main":
    "ProjectsPage envuelve PageHero y Projects en main. Consistencia entre rutas: misma estructura semántica en /, /proyectos y /contacto.",

  "page-contact-main":
    "ContactPage con main incluye hero de página y formulario. El landmarks pattern (header, main, footer) ayuda a navegación por teclado y SEO.",

  "meta-description":
    "meta name=\"description\" en index.html resume el sitio para Google y redes sociales. No es JSX — es HTML estático que Vite copia al build. 150-160 caracteres descriptivos funcionan bien.",

  "index-lang-es":
    "html lang=\"es\" indica idioma a buscadores y lectores de pantalla (pronunciación). Debe coincidir con el idioma real del contenido de tu portfolio.",

  "images-have-alt":
    "alt describe la imagen para quien no la ve; vacío solo si la imagen es decorativa. En ProjectCard usa alt={title} o imageAlt. Es requisito WCAG y buena práctica en cualquier img en JSX.",

  "login-page-exists":
    "LoginPage.jsx es ruta /login con formulario email y password. Campos controlados preparan el POST. Rutas protegidas (/admin) comprobarán token más adelante.",

  "file-auth-api":
    "server/auth-api.mjs es backend Node separado del bundle Vite. POST /api/login valida credenciales y devuelve JSON con token. En desarrollo corre en puerto 8787; en producción sería otro host.",

  "vite-proxy-auth":
    "proxy en vite.config.js redirige /api del dev server a localhost:8787. El navegador cree que habla con el mismo origen (5173), evitando CORS en desarrollo. fetch(\"/api/login\") funciona gracias al proxy.",

  "login-fetch-post":
    "fetch con method POST, Content-Type application/json y body JSON.stringify({ email, password }). await res.json() lee la respuesta. Si res.ok, guardas token en localStorage y navigate(\"/admin\") con useNavigate.",

  "login-api-works":
    "Integración end-to-end: npm run dev levanta Vite y API; credenciales demo validan el flujo real. localStorage persiste sesión entre recargas hasta logout. Es el patrón JWT simplificado para aprendizaje.",

  "env-example-exists":
    ".env.example documenta variables sin valores secretos reales. Copias a .env.local (ignorado por git). Vite carga .env.local en desarrollo; el ejemplo sirve de plantilla para el equipo y el deploy.",

  "env-supabase-url":
    "VITE_SUPABASE_URL es la URL del proyecto Supabase. Prefijo VITE_ expone la variable al código cliente en import.meta.env. La URL no es secreta; identifica tu instancia.",

  "env-supabase-key":
    "VITE_SUPABASE_ANON_KEY es la clave pública (anon) para el cliente. Nunca pongas service_role en el frontend. La anon key va con Row Level Security en Supabase para datos seguros.",

  "file-supabase-lib":
    "lib/supabase.js centraliza lectura de env y funciones fetchProjectsFromSupabase. isSupabaseConfigured() comprueba si hay URL y key antes de llamar a la API. Stub permite avanzar el curso sin cuenta Supabase real.",

  "supabase-uses-import-meta":
    "import.meta.env.VITE_* es la forma Vite de acceder a variables de entorno en código ESM. No uses process.env en cliente Vite sin configuración extra. Valores undefined si falta .env.local.",

  "no-hardcoded-secrets":
    "Claves JWT (eyJ...) en src/ se filtran al repositorio y al bundle público. Busca y elimina strings sospechosos; usa solo env. La service key de Supabase nunca debe estar en código frontend.",

  "file-admin-page":
    "AdminPage.jsx es panel en /admin con formulario para nuevos proyectos. Tras login, el usuario gestiona contenido. PageHero mantiene consistencia visual con otras páginas.",

  "admin-route-app":
    "Route path=\"/admin\" registra la página en el router. Import estático o lazy según nivel. Sin ruta, /admin devuelve 404 de la SPA.",

  "admin-form-title":
    "Campos controlados admin-name y admin-desc con useState. Mismo patrón que ContactForm. Validación mínima antes de addProject evita entradas vacías.",

  "admin-uses-add-project":
    "addProject en projectsStore persiste en localStorage y asigna id. Tras submit, /proyectos debe mostrar el nuevo item gracias al merge del nivel 17. Separación UI / almacenamiento.",

  "admin-submit-button":
    "button type=\"submit\" en el form admin dispara handleSubmit. Feedback visual (limpiar campos o mensaje) confirma éxito. Prueba el flujo completo en el navegador.",

  "admin-page-renders":
    "/admin debe cargar sin errores de consola. Errores de import o hooks fuera de Provider rompen la ruta. Verificación manual complementa los tests automáticos.",

  "admin-file-input":
    "input type=\"file\" permite elegir archivos del disco. En React es no controlado por defecto (ref o onChange leyendo files). accept=\"image/*\" filtra en el selector del sistema operativo.",

  "admin-file-accept":
    "accept restringe tipos MIME en el diálogo de archivos. No sustituye validación server-side pero evita errores del usuario al subir PDF por error.",

  "admin-file-handler":
    "handleFileChange lee event.target.files[0] y guarda en estado imageFile. Optional chaining (?.) evita error si no hay archivo. El File object es referencia al blob en memoria del navegador.",

  "admin-image-preview":
    "URL.createObjectURL(file) genera URL temporal para mostrar la imagen en <img src={preview}>. Revoca con URL.revokeObjectURL al cambiar archivo para liberar memoria en apps largas.",

  "admin-preview-alt":
    "Incluso vistas previas temporales llevan alt descriptivo para accesibilidad. «Vista previa del proyecto» comunica propósito a lectores de pantalla.",

  "file-contact-store":
    "contactStore.js exporta saveContactMessage. Módulo puro sin React — fácil de testear. Abstrae la clave de localStorage y el formato del array de mensajes.",

  "contact-store-localstorage":
    "localStorage guarda strings; JSON.stringify y parse serializan objetos. Añadir { ...msg, at: Date.now() } registra cuándo se envió. Límite ~5MB por origen; suficiente para demo.",

  "contact-form-save-import":
    "ContactForm importa saveContactMessage desde lib. El componente orquesta UI; el store persiste. Misma arquitectura que projectsStore.",

  "contact-form-on-submit":
    "Tras validate() exitoso, saveContactMessage({ name, email, message }), setSent(true) y reset de campos. preventDefault en submit evita recarga. Flujo completo de formulario real en cliente.",

  "contact-sent-feedback":
    "role=\"status\" en el mensaje de éxito anuncia el cambio a tecnologías asistivas. setSent(true) muestra texto verde; puedes ocultarlo tras unos segundos con otro useEffect opcional.",

  "env-site-url":
    "VITE_SITE_URL documenta la URL canónica del sitio (local o producción). Útil para Open Graph, sitemaps o enlaces absolutos en emails. En .env.example usa localhost en desarrollo.",

  "env-analytics-var":
    "VITE_ANALYTICS_ID placeholder para Plausible, GA4, etc. Vacío en ejemplo; en producción el ID real va en variables del hosting. No commitear IDs si son sensibles a tu organización.",

  "env-example-complete":
    "Un solo .env.example listando todas las VITE_ evita sorpresas al desplegar. Comentarios por variable ayudan a quien clone el repo. Debe reflejar lo que import.meta.env usa en el código.",

  "vitest-config-exists":
    "vitest.config.js configura entorno jsdom (DOM simulado) y globals si usas describe sin import. Vitest integra con Vite compartiendo resolución de alias y plugins.",

  "package-test-script":
    "npm test ejecuta vitest run en CI y local. @testing-library/react renderiza componentes como en navegador y busca por texto accesible. Tests dan regresión al cambiar ProjectCard.",

  "test-file-exists":
    "ProjectCard.test.jsx vive junto al componente (colocación habitual). Convención *.test.jsx permite que Vitest descubra archivos automáticamente.",

  "test-imports-vitest":
    "describe agrupa tests; it define casos; expect afirma resultados. screen.getByText busca nodos visibles. Imports explícitos si globals: false en config.",

  "test-render-projectcard":
    "render(<ProjectCard title=\"Demo\" description=\"...\" />) monta en jsdom. expect(...).toBeTruthy() comprueba presencia. Primer test del portfolio — base para ampliar cobertura.",

  "lazy-import-login":
    "React.lazy(() => import(\"./pages/LoginPage.jsx\")) carga el módulo solo al necesitarlo. import() dinámico devuelve promesa; Vite genera chunk separado. Reduce tamaño del bundle inicial.",

  "lazy-import-admin":
    "AdminPage lazy igual que Login — rutas poco visitadas no penalizan la primera carga. Quita imports estáticos duplicados de App.jsx para que el bundler haga split correcto.",

  "lazy-suspense":
    "Suspense envuelve rutas lazy y muestra fallback mientras carga el chunk. Sin Suspense, lazy lanza error al suspender. fallback puede ser spinner o texto «Cargando…».",

  "lazy-fallback-ui":
    "El fallback visible confirma que la suspensión funciona. En red lenta verás el mensaje antes de LoginPage. UX: el usuario sabe que algo ocurre, no pantalla en blanco.",

  "lazy-routes-load":
    "Navegar a /login y /admin debe cargar chunks sin «ChunkLoadError». Si falla, revisa rutas de import y build. Prueba tras npm run build preview para simular producción.",

  "readme-exists":
    "README.md es la carta de presentación del repo: qué es el proyecto, cómo instalarlo y ejecutarlo. Markdown en GitHub se renderiza en la página principal del repositorio.",

  "readme-npm-scripts":
    "Documentar npm install, dev, test y build permite a otros (y a ti en seis meses) arrancar sin adivinar. Bloques de código copiables reducen fricción.",

  "readme-deploy-url":
    "URL pública (Vercel, Netlify) demuestra que el portfolio está vivo. Actualízala tras cada deploy importante. Enlaces rotos en README restan profesionalidad.",

  "index-analytics-comment":
    "Comentario HTML placeholder para script de analytics evita cargar tracking en desarrollo. En producción descomentas e insertas ID real respetando privacidad (RGPD, consentimiento si aplica).",

  "readme-env-docs":
    "Sección «Variables de entorno» explica copiar .env.example a .env.local. Quien despliegue necesita las mismas claves VITE_ en el panel del hosting.",

  "ci-workflow-exists":
    "GitHub Actions en .github/workflows/ci.yml automatiza calidad en cada push. YAML define jobs, steps y comandos. CI detecta roturas antes de merge a main.",

  "ci-triggers-push":
    "on: push y pull_request a main ejecutan el workflow en PRs y merges. Protege la rama principal de código que no compila o falla tests.",

  "ci-node-20":
    "actions/setup-node con node-version 20 alinea CI con tu entorno local. Versiones distintas pueden causar «funciona en mi máquina».",

  "ci-runs-test":
    "npm ci instala desde package-lock exacto; npm test corre Vitest. Si un test falla, el job falla y GitHub muestra cruz roja en el commit.",

  "ci-runs-build":
    "npm run build verifica que Vite compila producción sin errores. Imports rotos o env mal referenciadas suelen aparecer aquí. Última línea de defensa antes del deploy.",

  "package-build-script":
    "vite build genera carpeta dist/ optimizada (minify, tree-shake). Script en package.json estandariza el comando para CI y hosting.",

  "build-passes-local":
    "Ejecutar build localmente reproduce lo que hará Vercel. Corrige errores antes de push. preview con vite preview sirve dist en local.",

  "deploy-env-vars":
    "Panel del hosting (Vercel → Environment Variables) inyecta VITE_* en build time. Sin ellas, Supabase o analytics quedan undefined en producción.",

  "deploy-preview-check":
    "Tras deploy, abre la URL y prueba /, /proyectos, /contacto. SPAs necesitan rewrite /* → index.html para rutas cliente. 404 en refresh indica falta de configuración en el host.",
};

/**
 * Devuelve el texto pedagógico de un checkpoint.
 * @param {number} levelId
 * @param {string} checkpointId
 * @param {string} [label]
 * @returns {string}
 */
export function getCheckpointConcept(levelId, checkpointId, label) {
  const concept = CHECKPOINT_CONCEPTS[checkpointId];
  if (concept) return concept;

  const levelNote = LEVEL_INSTRUCTIONS[levelId]
    ? ` En el nivel ${levelId} trabajas: ${LEVEL_INSTRUCTIONS[levelId].split(".")[0]}.`
    : "";

  if (label) {
    return `Este paso verifica: «${label}». En React, cada cambio en JSX o estado actualiza lo que el usuario ve en pantalla.${levelNote}`;
  }

  return `Concepto del checkpoint «${checkpointId}» en el nivel ${levelId}.${levelNote}`;
}

/**
 * Enriquece un nivel con instrucciones y conceptos pedagógicos en checkpoints.
 * @param {{ id: number; instructions?: string; checkpoints: Array<{ id: string; label: string; concept?: string; hintSteps?: Array<{ type: string; text: string }> }> }} level
 */
export function applyPedagogy(level) {
  if (!level.instructions && LEVEL_INSTRUCTIONS[level.id]) {
    level.instructions = LEVEL_INSTRUCTIONS[level.id];
  }

  for (const cp of level.checkpoints) {
    if (!cp.concept) {
      cp.concept = getCheckpointConcept(level.id, cp.id, cp.label);
    }

    const conceptText = cp.concept;
    const hasConceptStep = cp.hintSteps?.some((step) => step.type === "concept");

    if (!hasConceptStep && conceptText) {
      cp.hintSteps = [{ type: "concept", text: conceptText }, ...(cp.hintSteps ?? [])];
    }
  }
}
