import { LevelPreviewMock } from "./level-previews/LevelPreviewMocks";

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
        <LevelPreviewMock levelId={levelId} />
      </div>
    </div>
  );
}
