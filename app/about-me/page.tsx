import { Poppins, Open_Sans, Roboto } from "next/font/google";

export const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700", "800"] });
export const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "600"] });
export const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"] });

import SectionPage from "@/components/SectionPage";
import AdaptiveCardsRow from "@/components/AdaptiveCardsRow";
import SkillItem from "@/components/SkillItem";
import ScrollButton from "@/components/ScrollButton";  

import ReactCountryFlag from "react-country-flag";
import CurriculumButton from "@/components/CurriculumButton"; 


import EducationItem from "@/components/EducationItem";
import { FaUniversity, FaGraduationCap, FaCertificate } from "react-icons/fa";



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
            backgroundColor: "#3146a3",
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
              ABOUT ME
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
                          <CurriculumButton bgColor="#3146a3" textColor="#ffffffff" />
                        </div>
        < div className="scroll-wrap">
                    <ScrollButton targetId="profile" color="#0000" iconColor="#ffffffff" />
                  </div>
            
          </div>
        </div>
      </section>

      

      {/* SECCIONES */}
            <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 6px" }} id="profile">
              <section style={{ maxWidth: 1200, height:50, margin: "0 auto", padding: "0 6px" }}></section>
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
              PROFILE
              </h2>
            

            <p
                className={`${roboto.className} tracking-widest text-sm mb-3 font-semibold`}
                          style={{ color: "#676767", fontSize: "clamp(1rem, 1.2vw, 1.2rem)" }}
              >
              Creative Computer Engineering student specialising in Software at UPC. Motivated to apply multidisciplinary expertise within collaborative teams to deliver impactful user experiences.
              

              </p>
              <p
                className={`${roboto.className} tracking-widest text-sm mb-3 font-semibold`}
                          style={{ color: "#676767", fontSize: "clamp(1rem, 1.2vw, 1.2rem)" }}
              >
              📍Castelldefels, Barcelona
              

              </p>




              </section>
              <div className="section-separator" />









      {/* SECCIONES */}
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
              LANGUAGES
              </h2>
              <AdaptiveCardsRow>
              <SkillItem 
                icon={<ReactCountryFlag countryCode="ES" svg style={{ width: "1.5em", height: "1.5em" }} />} 
                title="SPANISH   ‎  " subtitle="NATIVE" showScroll={true} percent={100}  
              />
              <SkillItem icon={<img src="/Flag_of_Catalonia.svg" alt="Catalonia" style={{ width: "1.5em", height: "1.1em" }} />} title="CATALAN   ‎  " showScroll={true} subtitle="NATIVE" percent={100} />

              <SkillItem 
                icon={<ReactCountryFlag countryCode="GB" svg style={{ width: "1.5em", height: "1.5em" }} />} 
                title="ENGLISH   ‎  " subtitle="B2 FIRST" showScroll={true} percent={70}  
              />
              <SkillItem 
                icon={<ReactCountryFlag countryCode="CN" svg style={{ width: "1.5em", height: "1.5em" }} />} 
                title="CHINESE   ‎  " subtitle="AT SCHOOL" showScroll={true} percent={5}  
              />
            </AdaptiveCardsRow>
      </section>
      <div className="section-separator" />


      <section className="edu-section" id="education" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 6px" }}>
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
              EDUCATION
              </h2>

      <div className="edu-list">
        <EducationItem
          icon={<FaGraduationCap size={22} />}
          title="Bachelor’s degree in Computer Engineering"
          school="Universitat Politècnica de Barcelona (UPC)"
          years="2023–2027*"
        />

        <EducationItem
          icon={<FaCertificate size={20} />}
          title="Unity Essential Course"
          school="Universitat Politècnica de Barcelona (UPC)"
          years="2024"
        />

        <EducationItem
          icon={<FaUniversity size={20} />}
          title="Technological High-School Diploma"
          school="Institut Tecnològic de Barcelona (ITB)"
          years="2021–2023"
        />
      </div>
    </section>

    <section style={{ maxWidth: 1200, height:100, margin: "0 auto", padding: "0 6px" }}></section>


    </>
  );
}
