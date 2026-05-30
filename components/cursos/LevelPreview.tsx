type Props = {
  levelId: number;
  title: string;
  description: string;
};

export default function LevelPreview({ levelId, title, description }: Props) {
  return (
    <div className="cursos-preview">
      <h3 className="cursos-preview__title">{title}</h3>
      <p className="cursos-preview__desc">{description}</p>
      <div className="cursos-preview__frame" aria-hidden>
        {levelId === 1 && <PreviewLevel1 />}
        {levelId === 2 && <PreviewLevel2 />}
        {levelId === 3 && <PreviewLevel3 />}
        {levelId > 3 && <PreviewGeneric levelId={levelId} />}
      </div>
    </div>
  );
}

function PreviewLevel1() {
  return (
    <div className="cursos-mock cursos-mock--dark">
      <h1 className="cursos-mock__h1">Hello World</h1>
    </div>
  );
}

function PreviewLevel2() {
  return (
    <div className="cursos-mock cursos-mock--dark">
      <h1 className="cursos-mock__h1">Hello World</h1>
      <p className="cursos-mock__sub">Desarrollador web en formación</p>
      <span className="cursos-mock__btn">Ver proyectos</span>
    </div>
  );
}

function PreviewLevel3() {
  return (
    <div className="cursos-mock cursos-mock--stack">
      <div className="cursos-mock cursos-mock--dark cursos-mock--compact">
        <h1 className="cursos-mock__h1 cursos-mock__h1--sm">Hello World</h1>
      </div>
      <div className="cursos-mock cursos-mock--light">
        <h2 className="cursos-mock__h2">Sobre mí</h2>
        <p className="cursos-mock__bio">
          Texto de presentación con varias frases sobre ti y tu camino en
          desarrollo web.
        </p>
      </div>
    </div>
  );
}

function PreviewGeneric({ levelId }: { levelId: number }) {
  return (
    <div className="cursos-mock cursos-mock--light cursos-mock--generic">
      <span className="cursos-mock__badge">Nivel {levelId}</span>
      <p className="cursos-mock__bio">Vista previa del resultado esperado</p>
    </div>
  );
}
