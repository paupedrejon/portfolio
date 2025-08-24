import { Poppins, Roboto_Mono } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "800"] });
const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "700"] });
import SectionPage from "@/components/SectionPage";


export default function HomePage() {
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
            backgroundImage: "url(/portada.png)",
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
            backgroundColor: "rgba(0,0,0,0.5)",
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
              PORTFOLIO
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
            <div style={{ marginTop: "2rem" }}>
        <a
            href="https://linkedin.com"         
            className={`${poppins.className} cta-btn cta-btn--green`}
            // opcional:
            // target="_blank" rel="noopener noreferrer"
            // download
        >
            VIEW CURRICULUM
        </a>
        </div>
            
          </div>
        </div>
      </section>

<SectionPage
  id="Salmon Infinite"
  title={<>ONLINE REALISTIC VIDEOGAME</>}
  title2={<>PART 2</>}
  kicker="2025 - Personal Project"   // 👈 ahora sí funciona

  subtitle="Online Multiplayer character-based shooter."
  background= "/salmon2.png"
  darken={0.6}
  align="center"
  ctaText="View More"
  ctaHref="https://palgames.wixsite.com/salmoninfinite"
/>


<SectionPage
  id="FIB Lab"
  title={<>FIB LAB </>}
  title2={<>Unity 2024 Course Project</>}
  kicker="2024 - Universitat Politècnica de Barcelona"   // 👈 ahora sí funciona

  subtitle="A simple 2D game made during the Unity Essential Course."
  background= "/fiblab.png"
  darken={0.45}
  align="left"
  ctaText="PLAY"
  ctaHref="https://pa2005.itch.io/fib-lab"
/>

<SectionPage
  id="Game Jam 2024"
  title={<>CIRCUS VR </>}
  title2={<>Game Jam 2024</>}
  kicker="2024 - Universitat Politècnica de Barcelona"   // 👈 ahora sí funciona

  subtitle="Built a functional interactive system with circus props within 48h."
  background= "/circusvr.png"
  darken={0.6}
  align="right"
  ctaText="View More"
  ctaHref="#VirtualReality"
/>

<SectionPage
  id="TR"
  title={<>VR EXPERIENCE </>}
  title2={<>TREBALL DE RECERCA</>}
  kicker="2023 - Institut Tecnològic de Barcelona"   // 👈 ahora sí funciona

  subtitle="Made a Virtual Reality experience to show the capacities of the Metaverse."
  background= "/portada.png"
  darken={0.45}
  align="left"
  ctaText="View More"
  ctaHref="https://gamejolt.com/games/realyexperience/728307"
/>

<SectionPage
  id="DROVO"
  title={<>DROVO</>}
  title2={<>ONLINE MULTIPLAYER PROTOTYPE</>}
  kicker="2023 - Personal Project"   // 👈 ahora sí funciona

  subtitle="Built a fun project to play with friends."
  background= "/drovo.png"
  darken={0.6}
  align="right"
  ctaText="View More"
  ctaHref="https://gamejolt.com/games/drovo/726952"
/>

<SectionPage
  id="Salmon Infinite 1"
  title={<>ONLINE VIDEOGAME</>}
  title2={<>PART 1</>}
  kicker="2020 - Personal Project"   // 👈 ahora sí funciona

  subtitle="My first contact with programming."
  background= "/salmon1.png"
  darken={0.6}
  align="left"
  ctaText="View More"
  ctaHref="https://gamejolt.com/games/salmon_infinite_experimental/712867"
/>

<SectionPage
  id="Impresora3D"
  title={<>3D PRINTING</>}
  title2={<>MAKER PROJECT</>}
  kicker="2020 - Personal Project"   // 👈 ahora sí funciona

  subtitle="Adapted complex 3D big models."
  background= "/impresora3D.jpg"
  darken={0.6}
  align="right"
  ctaText=""
  ctaHref="https://gamejolt.com/games/drovo/726952"
/>

    </>
  );
}
