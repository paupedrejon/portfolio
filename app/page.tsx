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
        {/* Fondo  backgroundImage: "url(/portada.png)",*/}
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
            backgroundColor: "rgba(220, 227, 228, 1)",
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
          <div style={{ textAlign: "center", color: "#575757", padding: "0 1rem" }}>
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
        <div
              className={poppins.className}
              style={{
                marginTop: "0.5rem",
                fontSize: "clamp(20px, 6vw, 42px)",
                fontWeight: 300,
                letterSpacing: "0.08em",
              }}
            >
               <span><br></br>▼</span>
            </div>
            
          </div>
        </div>
      </section>








     <section
  style={{
    position: "relative",
    width: "100%",
    height: "20vh",
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
      backgroundColor: "rgba(236, 236, 236, 1)",
      zIndex: 1,
    }}
  />
{/* === Fila de 4 tarjetas === */}
<div
  style={{
    position: "relative",
    zIndex: 2,
    width: "100%",             // ancho completo
    pointerEvents: "auto",
  }}
>
  <div
    style={{
      maxWidth: "1200px",       // centra y acota
      margin: "0 auto",
      padding: "24px 16px",
    }}
  >
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))", // 4 columnas
        gap: "16px",
      }}
    >
      {/* Card 1 */}
      <a href="/proyectos" className="pill-card pill-card--indigo">
        <span className="pill-card__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </span>
        <div className="pill-card__text">
        {/* 👇 subtítulo en Open Sans */}
        <p className={`${robotoMono.className} pill-card__kicker`}>Section</p>
        {/* 👇 título en Poppins */}
        <p className={`${poppins.className} pill-card__title`}>PROJECTS</p>
        </div>
      </a>

      {/* Card 2 */}
      <a href="/conocimientos" className="pill-card pill-card--emerald">
        <span className="pill-card__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M8 16l-4-4 4-4M16 8l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <div className="pill-card__text">
        {/* 👇 subtítulo en Open Sans */}
        <p className={`${robotoMono.className} pill-card__kicker`}>Section</p>
        {/* 👇 título en Poppins */}
        <p className={`${poppins.className} pill-card__title`}>SKILLS</p>
        </div>
      </a>

      {/* Card 3 */}
      <a href="/about-me" className="pill-card pill-card--rose">
        <span className="pill-card__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" stroke="white" strokeWidth="2"/>
            <path d="M4 20a8 8 0 0116 0" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </span>
        <div className="pill-card__text">
        <div className="pill-card__text">
        {/* 👇 subtítulo en Open Sans */}
        <p className={`${robotoMono.className} pill-card__kicker`}>Section</p>
        {/* 👇 título en Poppins */}
        <p className={`${poppins.className} pill-card__title`}>ABOUT ME</p>
        </div>
        </div>
      </a>

      {/* Card 4 */}
      <a href="/contact" className="pill-card pill-card--amber">
        <span className="pill-card__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16v12H4z" stroke="white" strokeWidth="2" />
            <path d="M4 7l8 6 8-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <div className="pill-card__text">
        {/* 👇 subtítulo en Open Sans */}
        <p className={`${robotoMono.className} pill-card__kicker`}>Go To</p>
        {/* 👇 título en Poppins */}
        <p className={`${poppins.className} pill-card__title`}>CONTACT</p>
        </div>
      </a>
    </div>
  </div>
</div>



</section>


    </>
  );
}
