import { Poppins, Roboto_Mono } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "800"] });
const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "700"] });
import SectionPage from "@/components/SectionPage";
import ScrollButton from "@/components/ScrollButton";   
import CurriculumButton from "@/components/CurriculumButton"; 




export default function ProjectsPage() {
  return (
    <>


      {/* HERO con CSS inline: se verá aunque Tailwind falle */}
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Fondo */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            
            backgroundSize: "cover",
            backgroundPosition: "50% 30%",
            backgroundRepeat: "no-repeat",
            zIndex: 0,
          }}
        />
        {/* Oscurecedor */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: " rgba(65, 90, 201, 0.9)",
            zIndex: 1,
          }}
        />
        {/* Texto */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column", // 👈 añadimos columna

            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <div style={{ textAlign: "center", color: "#fff", padding: "0 1rem" }}>
            <h1
              className={poppins.className}
              style={{
                fontSize: "clamp(40px, 8vw, 96px)",
                fontWeight: 800,
                letterSpacing: "0.15em",
                lineHeight: 1,
              }}
            >
              PROJECTS
            </h1>
            <div
              className={poppins.className}
              style={{
                marginTop: "0.5rem",
                fontSize: "clamp(20px, 6vw, 42px)",
                fontWeight: 300,
                letterSpacing: "0.08em",
              }}
            >
              PAU <span>PEDREJON</span>
            </div>
            < div className="scroll-wrap">
            <CurriculumButton href="/curriculum.pdf" bgColor="#rgba(65, 90, 201, 0.9)" textColor="#ffffffff" />

                        </div>
        </div>
            < div className="scroll-wrap">
            <ScrollButton targetId="projects" />   {/* 👈 usar aquí */}
        </div>
            
        </div>
      </section>




<SectionPage 
  id="projects"
  title="PERSONAL PORTFOLIO"
  title2="WEB APP"
  kicker="2025 - Personal Project"
  subtitle="Interactive portfolio designed with Next.js and React to show my projects, skills and experience as a software engineer."
  imageCard="/react.png"
  imageSide="right"
  align="left"
  // tamaño de imagen (opcional)
  imageMaxW="clamp(300px, 38vw, 820px)"
  imageAspect="16/9"
  ctaText=""
  ctaHref="https://gamejolt.com/games/salmon_infinite/681208"

  midText="USED: REACT, Next.js, TypeScript, Git, Vercel "  // 👈 nuevo
  midTextColor="#5c57a1ff"                            // (opcional)
/>




<SectionPage 
  title="ONLINE REALISTIC VIDEOGAME"
  title2="PART 2"
  kicker="2025 - Personal Project"
  subtitle="Online Multiplayer character-based shooter."
  imageCard="/salmon2.png"
  imageSide="right"
  align="left"
  // tamaño de imagen (opcional)
  imageMaxW="clamp(300px, 38vw, 820px)"
  imageAspect="16/9"
  ctaText="RESULTS"
  ctaHref="https://gamejolt.com/games/salmon_infinite/681208"

  midText="USED: Unreal Engine, Blender, Substance Painter, Photoshop, Networking (listen server), C++, Mixamo "  // 👈 nuevo
  midTextColor="#5c57a1ff"                            // (opcional)
/>

<SectionPage 
  title="TIRE INFLATOR SIMULATOR"
  title2="MICROCONTROLLER PROJECT"
  kicker="2024 - Universitat Politècnica de Barcelona"
  subtitle="Simulation of a tire inflation system built in Proteus, using C for microcontroller programming."
  imageCard="/proteus.png"
  imageSide="right"
  align="left"
  // tamaño de imagen (opcional)
  imageMaxW="clamp(300px, 38vw, 820px)"
  imageAspect="16/9"
  ctaText=""
  ctaHref="https://gamejolt.com/games/salmon_infinite/681208"

  midText="USED: Proteus, C, Microcontroller Simulation, Embedded System "  // 👈 nuevo
  midTextColor="#5c57a1ff"                            // (opcional)
/>

<SectionPage
  title={<>FIB LAB </>}
  title2={<>Unity 2024 Course Project</>}
  kicker="2024 - Universitat Politècnica de Barcelona"
  subtitle="A simple 2D game made during the Unity Essential Course."
  imageCard="/fiblab.png"
  imageSide="right"
  align="left"
  // tamaño de imagen (opcional)
  imageMaxW="clamp(300px, 38vw, 820px)"
  imageAspect="16/9"
  ctaText="PLAY"
  ctaHref="https://pa2005.itch.io/fib-lab"

  midText="USED: Unity, Photoshop "  // 👈 nuevo
  midTextColor="#5c57a1ff"                            // (opcional)
/>


<SectionPage
  id="Game Jam 2024"
  title={<>CIRCUS VR </>}
  title2={<>Game Jam 2024</>}
  kicker="2024 - Universitat Politècnica de Barcelona"   // 👈 ahora sí funciona

  subtitle="Built a functional interactive system with circus props within 48h."
  imageCard= "/circusvr.png"
  imageSide="right"
  align="left"
  imageMaxW="clamp(300px, 38vw, 820px)"
  imageAspect="16/9"

  midText="USED: Unreal Engine (for VR), Blender, Photoshop, Git "  // 👈 nuevo
  midTextColor="#5c57a1ff"                            // (opcional)



  ctaText="About Game Jam"
  ctaHref="#VirtualReality"
/>

<SectionPage
  id="TR"
  title={<>VR EXPERIENCE </>}
  title2={<>TREBALL DE RECERCA</>}
  kicker="2022 - Institut Tecnològic de Barcelona"   // 👈 ahora sí funciona

  subtitle="Made a Virtual Reality experience to show the capacities of the Metaverse."
  imageCard= "/portada.png"
  imageSide="right"
  align="left"
  imageMaxW="clamp(300px, 38vw, 820px)"
  imageAspect="16/9"

  midText="USED: Unreal Engine (for VR), Blender, Photoshop, MetaHumans "  // 👈 nuevo
  midTextColor="#5c57a1ff"                            // (opcional)
  ctaText="RESULTS"
  ctaHref="https://gamejolt.com/games/realyexperience/728307"
/>

<SectionPage
  id="DROVO"
  title={<>DROVO</>}
  title2={<>ONLINE MULTIPLAYER PROTOTYPE</>}
  kicker="2023 - Personal Project"   // 👈 ahora sí funciona

  subtitle="Built a fun project to play with friends."
  imageCard= "/drovo.png"
  imageSide="right"
  align="left"
  imageMaxW="clamp(300px, 38vw, 820px)"
  imageAspect="16/9"

  midText="USED: Unreal Engine, Blender, Photoshop, Mixamo "  // 👈 nuevo
  midTextColor="#5c57a1ff"                            // (opcional)
  ctaText="VIEW PROTOTYPE"
  ctaHref="https://gamejolt.com/games/drovo/726952"
/>

<SectionPage
  id="Salmon Infinite 1"
  title={<>ONLINE VIDEOGAME</>}
  title2={<>PART 1</>}
  kicker="2020 - Personal Project"   // 👈 ahora sí funciona

  subtitle="My first contact with programming."
  imageCard= "/salmon1.png"
  imageSide="right"
  align="left"
  imageMaxW="clamp(300px, 38vw, 820px)"
  imageAspect="16/9"

  midText="USED: Unreal Engine, Blender, Substance Painter, Photoshop, Networking (listen server), C++, Mixamo "  // 👈 nuevo
  midTextColor="#5c57a1ff"                            // (opcional)
  ctaText="RESULTS"
  ctaHref="https://gamejolt.com/games/salmon_infinite_experimental/712867"
/>

<SectionPage
  id="Impresora3D"
  title={<>3D PRINTING</>}
  title2={<>MAKER PROJECT</>}
  kicker="2020 - Personal Project"   // 👈 ahora sí funciona

  subtitle="Adapted complex 3D big models."
  imageCard= "/impresora3D.jpg"
  imageSide="right"
  align="left"
  imageMaxW="clamp(300px, 38vw, 820px)"
  imageAspect="16/9"

  midText="USED: FreeCad, Blender, UltiMaker Cura, Photoshop, FDM Printers "  // 👈 nuevo
  midTextColor="#5c57a1ff"                            // (opcional)


  ctaText=""
  ctaHref="https://gamejolt.com/games/drovo/726952"
/>

    </>
  );
}
