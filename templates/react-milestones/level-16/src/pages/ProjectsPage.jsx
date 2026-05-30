import PageHero from "../components/PageHero.jsx";
import Projects from "../components/Projects.jsx";

export default function ProjectsPage({ onOpenProject }) {
  return (
    <>
      <PageHero
        title="Proyectos"
        subtitle="Apps y experimentos que he ido construyendo mientras aprendo."
        videoSrc="https://cdn.coverr.co/videos/coverr-a-man-typing-on-a-computer-5256/1080p.mp4"
      />
      <Projects onOpenProject={onOpenProject} />
    </>
  );
}
