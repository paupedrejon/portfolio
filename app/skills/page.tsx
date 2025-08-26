import { Poppins, Roboto_Mono } from "next/font/google";
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "800"] });
const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "700"] });

import AdaptiveCardsRow from "@/components/AdaptiveCardsRow";
import SkillItem from "@/components/SkillItem";
import ScrollButton from "@/components/ScrollButton";   
import CurriculumButton from "@/components/CurriculumButton"; 



import {
  SiCplusplus, SiPython, SiMysql, SiR,
  SiHtml5, SiReact, SiTailwindcss, SiGit, SiJira,
  SiLinux, SiNodedotjs, SiFreebsd,
  SiUnrealengine, SiUnity, SiBlender, SiAdobephotoshop, SiAdobeaftereffects,SiAdobe ,SiPrintables
} from "react-icons/si";

import {
  FaJava, FaMicrochip, FaDatabase, FaBook, FaCogs, FaBug
} from "react-icons/fa";

export default function SkillsPage() {
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
            backgroundColor: "#215aaa",
            zIndex: 1,
          }}
        />
        {/* Texto */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
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
              SKILLS
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
                          <CurriculumButton href="/curriculum.pdf" bgColor="#215aaa" textColor="#ffffffff" />

                        </div>
            < div className="scroll-wrap">
            <ScrollButton targetId="skills" color="#0000" iconColor="#ffffffff" />
          </div>
          </div>
        </div>
      </section>

      {/* SECCIONES */}
      <section id="skills" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 6px" }} >
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
          PROGRAMMING LANGUAGES
        </h2>
        <AdaptiveCardsRow>
          <SkillItem icon={<SiCplusplus />} title="C / C++" percent={80}  />
          <SkillItem icon={<FaJava />} title="Java" percent={60}  />
          <SkillItem icon={<SiPython />} title="Python" percent={50}  />
          <SkillItem icon={<SiMysql />} title="SQL" percent={70}  />
          <SkillItem icon={<SiR />} title="R" percent={33}  />
        </AdaptiveCardsRow>
<div className="section-separator" />

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
          FRONT-END
        </h2>
        <AdaptiveCardsRow>
          <SkillItem icon={<SiHtml5 />} title="HTML / CSS" percent={50}  />
          <SkillItem icon={<SiReact />} title="React / Next.js" percent={50}  />
          <SkillItem icon={<SiTailwindcss />} title="TailwindCSS" percent={50}  />
        </AdaptiveCardsRow>
<div className="section-separator" />

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
          BACK-END
        </h2>
        <AdaptiveCardsRow>
          <SkillItem icon={<SiNodedotjs />} title="Node.js" percent={50} />
          <SkillItem icon={<FaDatabase />} title="PostgreSQL" percent={60}  />
        </AdaptiveCardsRow>
<div className="section-separator" />

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
          DEVELOPMENT
        </h2>
        <AdaptiveCardsRow>
          <SkillItem icon={<SiUnrealengine />} title="Unreal Engine" percent={85}  />
          <SkillItem icon={<SiUnity/>} title="Unity   ‎  " percent={25}  />
          <SkillItem icon={<SiBlender />} title="Blender" percent={33}  />
          <SkillItem icon={<SiAdobephotoshop />} title="Photoshop" percent={65}  />
          <SkillItem icon={<SiAdobe  />} title="Substance" percent={55}  />
          <SkillItem icon={<SiAdobeaftereffects />} title="After Effects" percent={25}  />
          
        </AdaptiveCardsRow>
<div className="section-separator" />

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
          VERSION CONTROL & PROJECT TOOLS
        </h2>
        <AdaptiveCardsRow>
          <SkillItem icon={<SiGit />} title="Git" percent={40}  />
          <SkillItem icon={<SiJira />} title="Jira" percent={35}  />
        </AdaptiveCardsRow>

<div className="section-separator" />
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
          HARDWARE & 3D PRINTING
        </h2>
        
        <AdaptiveCardsRow>
          <SkillItem icon={<SiPrintables />} title="3D Printing" percent={70}  />
          <SkillItem icon={<FaMicrochip />} title="Proteus" percent={30}  />
          <SkillItem icon={<SiFreebsd />} title="Computer Systems" percent={50}  />
        </AdaptiveCardsRow>
      </section>

          <section style={{ maxWidth: 1200, height:50, margin: "0 auto", padding: "0 6px" }}></section>

    </>
  );
}
