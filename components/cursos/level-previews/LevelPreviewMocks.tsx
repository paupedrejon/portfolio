/** Mockups visuales del resultado esperado por nivel (solo UI decorativa). */

function MockNav({
  themeToggle = false,
  loginLink = false,
  light = false,
}: {
  themeToggle?: boolean;
  loginLink?: boolean;
  light?: boolean;
}) {
  return (
    <div className={`cursos-mock__nav${light ? " cursos-mock__nav--light" : ""}`}>
      <span className="cursos-mock__nav-brand">Mi Portfolio</span>
      <span className="cursos-mock__nav-links">
        <span>Sobre mí</span>
        <span>Proyectos</span>
        <span>Contacto</span>
        {loginLink && <span>Login</span>}
        {themeToggle && <span className="cursos-mock__nav-theme">☀</span>}
      </span>
    </div>
  );
}

function MockHero({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`cursos-mock cursos-mock--dark${compact ? " cursos-mock--compact" : ""}`}>
      <h1 className={`cursos-mock__h1${compact ? " cursos-mock__h1--sm" : ""}`}>Hello World</h1>
      {!compact && (
        <>
          <p className="cursos-mock__sub">Desarrollador web en formación</p>
          <span className="cursos-mock__btn">Ver proyectos</span>
        </>
      )}
    </div>
  );
}

function MockProjectCard({
  title = "Portfolio React",
  tags,
  image,
}: {
  title?: string;
  tags?: string[];
  image?: boolean;
}) {
  return (
    <article className="cursos-mock__card">
      {image && <div className="cursos-mock__card-img" />}
      <h3 className="cursos-mock__card-title">{title}</h3>
      <p className="cursos-mock__card-desc">App con routing y tema claro/oscuro.</p>
      {tags && (
        <div className="cursos-mock__tags">
          {tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}
    </article>
  );
}

function MockForm({
  labels,
  error,
  success,
  file,
  preview,
}: {
  labels: string[];
  error?: string;
  success?: string;
  file?: boolean;
  preview?: boolean;
}) {
  return (
    <div className="cursos-mock__form">
      {labels.map((l) => (
        <div key={l} className="cursos-mock__field">
          <span className="cursos-mock__label">{l}</span>
          <span className="cursos-mock__input" />
        </div>
      ))}
      {file && (
        <div className="cursos-mock__field">
          <span className="cursos-mock__label">Imagen</span>
          <span className="cursos-mock__file">Elegir archivo…</span>
        </div>
      )}
      {preview && <div className="cursos-mock__img-preview" />}
      {error && <p className="cursos-mock__error">{error}</p>}
      {success && <p className="cursos-mock__success">{success}</p>}
      <span className="cursos-mock__btn cursos-mock__btn--sm">Enviar</span>
    </div>
  );
}

function MockBrowserBar({ path = "/" }: { path?: string }) {
  return (
    <div className="cursos-mock__browser">
      <span className="cursos-mock__browser-dots" />
      <span className="cursos-mock__browser-url">localhost:5173{path}</span>
    </div>
  );
}

export function LevelPreviewMock({ levelId }: { levelId: number }) {
  switch (levelId) {
    case 1:
      return (
        <div className="cursos-mock cursos-mock--dark">
          <h1 className="cursos-mock__h1">Hello World</h1>
        </div>
      );
    case 2:
      return (
        <div className="cursos-mock cursos-mock--dark">
          <h1 className="cursos-mock__h1">Hello World</h1>
          <p className="cursos-mock__sub">Desarrollador web en formación</p>
          <span className="cursos-mock__btn">Ver proyectos</span>
        </div>
      );
    case 3:
      return (
        <div className="cursos-mock cursos-mock--stack">
          <div className="cursos-mock cursos-mock--dark cursos-mock--hero-band">
            <h1 className="cursos-mock__h1">Hello World</h1>
            <p className="cursos-mock__sub">Desarrollador web en formación</p>
            <span className="cursos-mock__btn">Ver proyectos</span>
          </div>
          <div className="cursos-mock cursos-mock--light cursos-mock--about-band">
            <h2 className="cursos-mock__h2">Sobre mí</h2>
            <p className="cursos-mock__bio">
              Texto de presentación con varias frases sobre ti y tu camino en desarrollo web.
            </p>
          </div>
        </div>
      );
    case 4:
      return (
        <div className="cursos-mock cursos-mock--stack">
          <MockNav />
          <MockHero compact />
        </div>
      );
    case 5:
      return (
        <div className="cursos-mock__phone">
          <div className="cursos-mock cursos-mock--dark cursos-mock--compact">
            <MockNav />
            <h1 className="cursos-mock__h1 cursos-mock__h1--sm">Hello World</h1>
            <p className="cursos-mock__sub">375px — sin scroll horizontal</p>
          </div>
        </div>
      );
    case 6:
      return (
        <div className="cursos-mock cursos-mock--light cursos-mock__components">
          <span className="cursos-mock__chip">Navbar.jsx</span>
          <span className="cursos-mock__chip">Hero.jsx</span>
          <span className="cursos-mock__chip">About.jsx</span>
          <p className="cursos-mock__bio">Misma página, código en componentes</p>
        </div>
      );
    case 7:
      return (
        <div className="cursos-mock cursos-mock--light">
          <MockProjectCard />
        </div>
      );
    case 8:
      return (
        <div className="cursos-mock cursos-mock--light cursos-mock__grid">
          <MockProjectCard title="Tasks API" />
          <MockProjectCard title="Landing SaaS" />
        </div>
      );
    case 9:
      return (
        <div className="cursos-mock cursos-mock--light">
          <MockProjectCard tags={["React", "Tailwind"]} image />
        </div>
      );
    case 10:
      return (
        <div className="cursos-mock cursos-mock--light">
          <h2 className="cursos-mock__h2">Contacto</h2>
          <MockForm labels={["Nombre", "Email", "Mensaje"]} />
        </div>
      );
    case 11:
      return (
        <div className="cursos-mock cursos-mock--light">
          <MockForm labels={["Nombre", "Email", "Mensaje"]} error="El nombre es obligatorio" />
        </div>
      );
    case 12:
      return (
        <div className="cursos-mock cursos-mock--light">
          <h2 className="cursos-mock__h2">Proyectos</h2>
          <p className="cursos-mock__loading">Cargando…</p>
        </div>
      );
    case 13:
      return (
        <div className="cursos-mock cursos-mock--stack">
          <MockNav themeToggle />
          <div className="cursos-mock cursos-mock--dark cursos-mock--compact">
            <p className="cursos-mock__sub">Tema claro / oscuro con CSS variables</p>
          </div>
        </div>
      );
    case 14:
      return (
        <div className="cursos-mock cursos-mock--stack">
          <MockNav themeToggle light />
          <div className="cursos-mock cursos-mock--light cursos-mock--compact">
            <h2 className="cursos-mock__h2">Proyectos</h2>
            <MockProjectCard tags={["React"]} image />
          </div>
        </div>
      );
    case 15:
      return (
        <div className="cursos-mock cursos-mock--modal-scene">
          <div className="cursos-mock__modal">
            <h3 className="cursos-mock__card-title">Portfolio React</h3>
            <p className="cursos-mock__card-desc">Detalle del proyecto en modal</p>
            <span className="cursos-mock__btn cursos-mock__btn--sm">Cerrar</span>
          </div>
        </div>
      );
    case 16:
      return (
        <div className="cursos-mock cursos-mock--stack">
          <MockBrowserBar path="/proyectos" />
          <MockNav loginLink />
          <div className="cursos-mock cursos-mock--light cursos-mock--compact">
            <h2 className="cursos-mock__h2">Proyectos</h2>
            <div className="cursos-mock__grid">
              <MockProjectCard image tags={["React"]} />
              <MockProjectCard title="Tasks API" image tags={["Node"]} />
            </div>
          </div>
        </div>
      );
    case 17:
      return (
        <div className="cursos-mock cursos-mock--light">
          <h2 className="cursos-mock__h2">Proyectos</h2>
          <p className="cursos-mock__loading">Cargando…</p>
          <p className="cursos-mock__code-hint">useFetch(&quot;/projects.json&quot;)</p>
        </div>
      );
    case 18:
      return (
        <div className="cursos-mock cursos-mock--stack">
          <MockNav themeToggle />
          <div className="cursos-mock cursos-mock--dark cursos-mock--compact">
            <span className="cursos-mock__chip">ThemeContext</span>
            <p className="cursos-mock__sub">useTheme() — sin props en Navbar</p>
          </div>
        </div>
      );
    case 19:
      return (
        <div className="cursos-mock cursos-mock--light">
          <span className="cursos-mock__chip">&lt;main&gt;</span>
          <span className="cursos-mock__chip">lang=&quot;es&quot;</span>
          <span className="cursos-mock__chip">meta description</span>
          <span className="cursos-mock__chip">alt en imágenes</span>
        </div>
      );
    case 20:
      return (
        <div className="cursos-mock cursos-mock--light">
          <h2 className="cursos-mock__h2">Login</h2>
          <MockForm labels={["Email", "Contraseña"]} />
          <p className="cursos-mock__code-hint">POST /api/login → /admin</p>
        </div>
      );
    case 21:
      return (
        <div className="cursos-mock cursos-mock--light cursos-mock__env">
          <span className="cursos-mock__file-icon">.env.example</span>
          <p className="cursos-mock__code-hint">VITE_SUPABASE_URL=…</p>
          <p className="cursos-mock__code-hint">VITE_SUPABASE_ANON_KEY=…</p>
          <span className="cursos-mock__chip">lib/supabase.js</span>
        </div>
      );
    case 22:
      return (
        <div className="cursos-mock cursos-mock--light">
          <h2 className="cursos-mock__h2">Admin</h2>
          <MockForm labels={["Título", "Descripción"]} />
          <p className="cursos-mock__code-hint">addProject() → localStorage</p>
        </div>
      );
    case 23:
      return (
        <div className="cursos-mock cursos-mock--light">
          <h2 className="cursos-mock__h2">Admin</h2>
          <MockForm labels={["Título", "Descripción"]} file preview />
        </div>
      );
    case 24:
      return (
        <div className="cursos-mock cursos-mock--light">
          <MockForm labels={["Nombre", "Email", "Mensaje"]} success="Mensaje guardado (demo local)." />
        </div>
      );
    case 25:
      return (
        <div className="cursos-mock cursos-mock--light cursos-mock__env">
          <span className="cursos-mock__file-icon">.env.example</span>
          <p className="cursos-mock__code-hint">VITE_SITE_URL</p>
          <p className="cursos-mock__code-hint">VITE_ANALYTICS_ID</p>
          <p className="cursos-mock__sub">Secrets fuera del código</p>
        </div>
      );
    case 26:
      return (
        <div className="cursos-mock cursos-mock--dark cursos-mock__terminal">
          <p className="cursos-mock__term-line">$ npm test</p>
          <p className="cursos-mock__term-ok">✓ ProjectCard.test.jsx</p>
          <p className="cursos-mock__term-ok">Tests 1 passed</p>
        </div>
      );
    case 27:
      return (
        <div className="cursos-mock cursos-mock--stack">
          <MockBrowserBar path="/login" />
          <div className="cursos-mock cursos-mock--light cursos-mock--compact">
            <p className="cursos-mock__loading">Cargando…</p>
            <p className="cursos-mock__code-hint">React.lazy + Suspense</p>
          </div>
        </div>
      );
    case 28:
      return (
        <div className="cursos-mock cursos-mock--light cursos-mock__env">
          <span className="cursos-mock__file-icon">README.md</span>
          <p className="cursos-mock__code-hint">https://mi-portfolio.vercel.app</p>
          <span className="cursos-mock__chip">Analytics (comentado)</span>
        </div>
      );
    case 29:
      return (
        <div className="cursos-mock cursos-mock--dark cursos-mock__terminal">
          <p className="cursos-mock__term-line">GitHub Actions — CI</p>
          <p className="cursos-mock__term-ok">✓ npm ci</p>
          <p className="cursos-mock__term-ok">✓ npm test</p>
          <p className="cursos-mock__term-ok">✓ npm run build</p>
        </div>
      );
    case 30:
      return (
        <div className="cursos-mock cursos-mock--light cursos-mock--generic">
          <span className="cursos-mock__globe">🌐</span>
          <p className="cursos-mock__code-hint">https://mi-portfolio.vercel.app</p>
          <p className="cursos-mock__sub">Deploy en Vercel / Netlify</p>
        </div>
      );
    default:
      return (
        <div className="cursos-mock cursos-mock--light cursos-mock--generic">
          <span className="cursos-mock__badge">Nivel {levelId}</span>
          <p className="cursos-mock__bio">Vista previa del resultado esperado</p>
        </div>
      );
  }
}
