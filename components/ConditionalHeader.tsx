"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import StaggeredMenu from "./StaggeredMenu";
import { HiHome } from "react-icons/hi2";
import { BsSun, BsMoon } from "react-icons/bs";
import { HiUserCircle } from "react-icons/hi2";
import { signOut, useSession } from "next-auth/react";

export default function ConditionalHeader() {
  const pathname = usePathname();
  const isStudyAgentsPage = pathname?.startsWith("/study-agents");
  const [colorTheme, setColorTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const t = useTranslations("nav");

  // Leer el tema del localStorage
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("study_agents_color_theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setColorTheme(savedTheme);
      }
    }
  }, []);

  // Guardar el tema en localStorage y aplicarlo al documento
  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      localStorage.setItem("study_agents_color_theme", colorTheme);
      // Aplicar el tema al documento
      document.documentElement.setAttribute("data-theme", colorTheme);
    }
  }, [colorTheme, mounted]);

  // Cerrar el menú cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  // No mostrar header en páginas de study-agents, pero mostrar iconos de navegación
  if (isStudyAgentsPage) {
    return (
      <>
        <style jsx>{`
          @keyframes slideAndExpand {
            0% {
              transform: translateY(-20px) scale(0);
              opacity: 0;
            }
            50% {
              transform: translateY(2px) scale(1.1);
              opacity: 0.8;
            }
            100% {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
          }
          .nav-button-1 {
            animation: slideAndExpand 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
          }
          .nav-button-2 {
            animation: slideAndExpand 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
          }
          .nav-button-3 {
            animation: slideAndExpand 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
          }
        `}</style>
        <div style={{
          position: "fixed",
          top: "1rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1.25rem",
          background: "var(--bg-overlay-05)",
          border: "1px solid var(--border-overlay-1)",
          borderRadius: "50px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}>
          {/* Botón de Modo Claro/Oscuro */}
          <button
            onClick={() => setColorTheme(colorTheme === "dark" ? "light" : "dark")}
            title={colorTheme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="nav-button-1"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "50%",
              color: "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              backdropFilter: "blur(10px)",
            }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(99, 102, 241, 0.15)";
            e.currentTarget.style.borderColor = "var(--border-accent)";
            e.currentTarget.style.color = "var(--accent-primary)";
            e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
            e.currentTarget.style.boxShadow = "0 8px 25px rgba(99, 102, 241, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.borderColor = "var(--border-subtle)";
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {colorTheme === "dark" ? <BsSun size={24} /> : <BsMoon size={24} />}
        </button>

        {/* Icono de Casa */}
        <Link
          href="/study-agents"
          className="nav-button-2"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "50%",
            color: "var(--text-secondary)",
            textDecoration: "none",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            backdropFilter: "blur(10px)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(99, 102, 241, 0.15)";
            e.currentTarget.style.borderColor = "var(--border-accent)";
            e.currentTarget.style.color = "var(--accent-primary)";
            e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
            e.currentTarget.style.boxShadow = "0 8px 25px rgba(99, 102, 241, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.borderColor = "var(--border-subtle)";
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <HiHome size={24} />
        </Link>

        {/* Icono de Perfil */}
        <div style={{ position: "relative" }} ref={menuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            title="Perfil"
            className="nav-button-3"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              background: showProfileMenu 
                ? "rgba(99, 102, 241, 0.15)" 
                : "rgba(255, 255, 255, 0.05)",
              border: showProfileMenu
                ? "1px solid var(--border-accent)"
                : "1px solid var(--border-subtle)",
              borderRadius: "50%",
              color: showProfileMenu 
                ? "var(--accent-primary)" 
                : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              backdropFilter: "blur(10px)",
            }}
            onMouseEnter={(e) => {
              if (!showProfileMenu) {
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.15)";
                e.currentTarget.style.borderColor = "var(--border-accent)";
                e.currentTarget.style.color = "var(--accent-primary)";
                e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(99, 102, 241, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!showProfileMenu) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            <HiUserCircle size={24} />
          </button>

          {/* Menú desplegable del perfil */}
          {showProfileMenu && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 1rem)",
                right: 0,
                minWidth: "280px",
                background: "var(--bg-overlay-05)",
                border: "1px solid var(--border-overlay-1)",
                borderRadius: "16px",
                padding: "1.5rem",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(20px)",
                zIndex: 1001,
              }}
            >
              {/* Información del usuario */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "1rem",
                  marginBottom: "1rem"
                }}>
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "Usuario"}
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        border: "2px solid var(--border-overlay-1)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "1.5rem",
                        fontWeight: "600",
                      }}
                    >
                      {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: "1.1rem", 
                      fontWeight: "600",
                      color: "var(--text-primary)",
                      marginBottom: "0.25rem"
                    }}>
                      {session?.user?.name || "Usuario"}
                    </div>
                    <div style={{ 
                      fontSize: "0.9rem", 
                      color: "var(--text-secondary)" 
                    }}>
                      {session?.user?.email || ""}
                    </div>
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div style={{
                height: "1px",
                background: "var(--border-overlay-1)",
                marginBottom: "1rem"
              }} />

              {/* Botón de cerrar sesión */}
              <button
                onClick={async () => {
                  await signOut({ 
                    callbackUrl: "/auth/signin",
                    redirect: true 
                  });
                }}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "10px",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                }}
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
      </>
    );
  }

  const menuItems = [
    { label: t("home"), ariaLabel: "Go to home page", link: "/" },
    { label: t("projects"), ariaLabel: "View my projects", link: "/proyectos" },
    { label: t("skills"), ariaLabel: "View my skills", link: "/skills" },
    { label: t("experience"), ariaLabel: "View my experience", link: "/experience" },
    { label: t("education"), ariaLabel: "View my education", link: "/education" },
    { label: t("about"), ariaLabel: "Learn about me", link: "/about-me" },
    { label: t("contact"), ariaLabel: "Get in touch", link: "/contact" },
    { label: t("cv"), ariaLabel: "Download CV", link: "/PauPedrejonCV.pdf", external: true },
  ];

  const socialItems = [
    { label: "GitHub", link: "https://github.com/paupedrejon" },
    { label: "LinkedIn", link: "https://es.linkedin.com/in/pau-pedrejon-sobrino-0b5643380" },
    { label: "Email", link: "mailto:paupedrejon@gmail.com" },
  ];

  return (
    <>
      <StaggeredMenu
      position="right"
      closeOnPathnameChange={pathname ?? ""}
      items={menuItems}
      socialItems={socialItems}
      displaySocials
      displayItemNumbering
      menuButtonColor="#ffffff"
      openMenuButtonColor="#000"
      changeMenuColorOnOpen
      colors={["#B19EEF", "#5227FF"]}
      logoUrl="/logo.svg"
      accentColor="#5227FF"
      isFixed
      closeOnClickAway
      headerExtra={
        <div style={{ color: "#ffffff" }}>
          <LanguageSwitcher />
        </div>
      }
    />
    </>
  );
}

