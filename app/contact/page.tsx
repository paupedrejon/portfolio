import { Poppins, Roboto_Mono } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "800"] });
const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "700"] });
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { AiOutlineMail,AiFillPhone } from "react-icons/ai";

import SectionPage from "@/components/SectionPage";
import AdaptiveCardsRow from "@/components/AdaptiveCardsRow";
import SkillItem from "@/components/SkillItem";
import ScrollButton from "@/components/ScrollButton"; 
import CurriculumButton from "@/components/CurriculumButton"; 


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
            backgroundColor: "#093577",
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
            
            < div className="scroll-wrap">
                          <CurriculumButton href="/PauPedrejonCV.pdf" bgColor="#093577" textColor="#ffffffff" />

                        </div>
        < div className="scroll-wrap">
                            <ScrollButton targetId="contact" color="#0000" iconColor="#ffffffff" />
                          </div>
            
          </div>
        </div>
      </section>








      {/* SECCIONES */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 6px" }} id="contact"></section>
                  <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 6px" }}>
                    <h2
                      className={poppins.className}
                      style={{
                        fontSize: "clamp(40px, 8vw, 30px)",
                        fontWeight: 800,
                        letterSpacing: "0.15em",
                        color: "#676767",
                        lineHeight: 1,
                      }}
                    >
                    CONTACT
                    </h2>
                    <AdaptiveCardsRow>
                    <SkillItem 
                      icon={<FaGithub/>} 
                      title="GITHUB   ‎  " subtitle="/paupedrejon"  
                       href="https://www.github.com/paupedrejon"
                       external 
                    />
                    <SkillItem icon={<FaLinkedin/>}  title="LINKEDIN   ‎  "  subtitle="/paupedrejon" 
                    href="https://es.linkedin.com/in/pau-pedrejon-sobrino-0b5643380"
                       external  />
      
                    <SkillItem 
                      icon={<AiOutlineMail/>} 
                      title="MAIL   ‎  " subtitle="pau.pedrejon "    href="mailto:paupedrejon@gmail.com"
                    />
                    <SkillItem 
                      icon={<AiFillPhone/>} 
                      title="WHATSAPP/CALL   " subtitle="+34 689 063 590 "    href="tel:+34689063590"
                    />
                  </AdaptiveCardsRow>
            </section>


    </>
  );
}
