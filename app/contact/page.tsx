import { Poppins, Roboto_Mono } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "800"] });
const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "700"] });
import SectionPage from "@/components/SectionPage";


export default function AboutMePage() {
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
            backgroundColor: "rgba(217,119,6,.90)",
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
          <div style={{ textAlign: "center", color: "#ffffffff", padding: "0 1rem" }}>
            <h1
              className={poppins.className}
              style={{
                fontSize: "clamp(40px, 8vw, 96px)",
                fontWeight: 800,
                letterSpacing: "0.15em",
                lineHeight: 1,
              }}
            >
              CONTACT
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
                fontSize: "clamp(15px, 4vw, 28px)",
                fontWeight: 400,
                letterSpacing: "0.15em",
                lineHeight: 1,
              }}
            >
              On process...
            </h1>
            
            
          </div>
        </div>
      </section>


    </>
  );
}
