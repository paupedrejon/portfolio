"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { KeyIcon, StarIcon } from "./Icons";
import APIKeyConfig from "./APIKeyConfig";
import ProfileView from "./ProfileView";

const links = [
  { href: "/", label: "Home" },
  { href: "/proyectos", label: "Projects" },
  { href: "/skills", label: "Skills" },
  { href: "/experience", label: "Experience" },
  { href: "/education", label: "Education" },
  { href: "/about-me", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const isStudyAgentsPage = pathname?.startsWith("/study-agents");
  const [showAPIKeyConfig, setShowAPIKeyConfig] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [apiKeys, setApiKeys] = useState<{ openai: string } | null>(null);
  const [totalLevel, setTotalLevel] = useState<number>(0);
  const [monthlyCost, setMonthlyCost] = useState<number>(0);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkWidth = () => {
      const width = window.innerWidth;
      setCompact(width < 900);
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // Cargar API keys desde localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && isStudyAgentsPage) {
      const saved = localStorage.getItem("study_agents_api_keys");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.openai && parsed.openai.startsWith("sk-")) {
            setApiKeys(parsed);
          }
        } catch (e) {
          console.error("Error loading API keys:", e);
        }
      }
    }
  }, [isStudyAgentsPage]);

  // Escuchar cambios en localStorage (cuando se actualizan desde otro componente)
  useEffect(() => {
    if (!isStudyAgentsPage) return;

    const handleStorageChange = () => {
      const saved = localStorage.getItem("study_agents_api_keys");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.openai && parsed.openai.startsWith("sk-")) {
            setApiKeys(parsed);
          } else {
            setApiKeys(null);
          }
        } catch (e) {
          console.error("Error loading API keys:", e);
        }
      } else {
        setApiKeys(null);
      }
    };

    // Escuchar evento personalizado cuando se actualizan las keys
    window.addEventListener("apiKeysUpdated", handleStorageChange);
    
    // También escuchar cambios directos en localStorage (aunque solo funciona entre pestañas)
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("apiKeysUpdated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [isStudyAgentsPage]);

  // Cargar nivel total del usuario y coste del mes
  useEffect(() => {
    if (isStudyAgentsPage && session?.user?.id) {
      const loadTotalLevel = async () => {
        try {
          if (!session.user) return;
          const response = await fetch("/api/study-agents/get-progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: session.user.id }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.progress) {
              const progressData = data.progress || {};
              const topics = Object.entries(progressData);
              interface TopicProgressData {
                level?: number;
                experience?: number;
                [key: string]: unknown;
              }
              const level = (topics as Array<[string, TopicProgressData]>).reduce((sum: number, [, topicData]) => {
                const topicLevel = (topicData && typeof topicData === 'object' && 'level' in topicData) ? (topicData.level || 0) : 0;
                return sum + topicLevel;
              }, 0);
              setTotalLevel(level);
            }
          }
        } catch (error) {
          console.error("Error loading total level:", error);
        }
      };
      
      const loadMonthlyCost = async () => {
        try {
          if (!session.user) return;
          const response = await fetch("/api/study-agents/get-user-stats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: session.user.id }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.stats) {
              // Asegurar que el coste sea un número
              const cost = typeof data.stats.total_cost === 'string' 
                ? parseFloat(data.stats.total_cost) 
                : (data.stats.total_cost || 0);
              setMonthlyCost(cost);
            }
          }
        } catch (error) {
          console.error("Error loading monthly cost:", error);
        }
      };
      
      loadTotalLevel();
      loadMonthlyCost();
      
      // Actualizar coste cada 5 segundos para reflejar cambios recientes
      const costInterval = setInterval(() => {
        loadMonthlyCost();
      }, 5000);
      
      return () => clearInterval(costInterval);
    }
  }, [isStudyAgentsPage, session?.user?.id]);

  const handleKeysConfigured = (keys: { openai: string }) => {
    setApiKeys(keys);
    setShowAPIKeyConfig(false);
    // Disparar evento personalizado para que StudyChat actualice su estado
    window.dispatchEvent(new CustomEvent("apiKeysUpdated"));
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: scrolled ? '0.75rem 0' : '1.25rem 0',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Background */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: scrolled ? 'rgba(10, 10, 15, 0.9)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(148, 163, 184, 0.1)' : 'none',
          transition: 'all 0.3s ease',
        }}
      />

      {/* Content */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: isMobile ? '0 1rem' : isTablet ? '0 1.5rem' : '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: isMobile ? '0.5rem' : '1rem',
        }}
      >
        {/* Logo */}
        <Link 
          href="/" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
          }}
        >
          <img 
            src="/LOGO_portfolio.png"
            alt="Logo"
            style={{ 
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              objectFit: 'cover',
            }}
          />
          
          <span 
            style={{ 
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '1rem',
              color: '#f8fafc',
              display: compact ? 'none' : 'block',
            }}
          >
            Pau Pedrejon
          </span>
        </Link>

        {/* Desktop Navigation */}
        {!compact && (
          <nav 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.375rem',
              borderRadius: '100px',
              background: 'rgba(26, 26, 36, 0.8)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    position: 'relative',
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    fontFamily: 'var(--font-body)',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    textDecoration: 'none',
                    borderRadius: '100px',
                    background: isActive ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                    boxShadow: isActive ? '0 4px 15px rgba(99, 102, 241, 0.4)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#f8fafc';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#94a3b8';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* API Config Button, Profile Button and Logout Button (Study Agents) */}
        {isStudyAgentsPage && session && (
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "0.5rem" : "0.75rem", flexWrap: "nowrap" }}>
            {/* Profile Button */}
            {!isMobile && (
              <button
                onClick={() => setShowProfile(true)}
                title="Ver mi progreso"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: isMobile ? "40px" : "48px",
                  height: isMobile ? "40px" : "48px",
                  background: "#ffffff",
                  border: "none",
                  borderRadius: "24px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                <StarIcon size={isMobile ? 16 : 18} color="#1a1a24" />
              </button>
            )}
            
            {/* API Config Button */}
            {!isMobile && (
              <button
                onClick={() => setShowAPIKeyConfig(true)}
                title={apiKeys?.openai ? "API Configurada" : "Configurar API"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: isMobile ? "40px" : "48px",
                  height: isMobile ? "40px" : "48px",
                  background: "#ffffff",
                  border: "none",
                  borderRadius: "24px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                <KeyIcon size={isMobile ? 16 : 18} color="#1a1a24" />
              </button>
            )}

            {/* Cajita con foto, nombre, nivel total y botón de cerrar sesión */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? "0.5rem" : "0.75rem",
                padding: isMobile ? "0.375rem 0.5rem 0.375rem 0.375rem" : "0.5rem 0.75rem 0.5rem 0.5rem",
                background: "#ffffff",
                borderRadius: "24px",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                maxWidth: isMobile ? "200px" : isTablet ? "280px" : "none",
                flexShrink: 1,
                minWidth: 0,
              }}
            >
              {/* Foto del usuario */}
              <div
                style={{
                  width: isMobile ? "28px" : "32px",
                  height: isMobile ? "28px" : "32px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid rgba(99, 102, 241, 0.3)",
                  flexShrink: 0,
                  background: session.user?.image ? "transparent" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "Usuario"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      // Si la imagen falla, mostrar iniciales
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div style="color: white; font-size: 12px; font-weight: 600;">${(session.user?.name || "U").charAt(0).toUpperCase()}</div>`;
                      }
                    }}
                  />
                ) : (
                  <div style={{ color: "white", fontSize: "12px", fontWeight: 600 }}>
                    {(session.user?.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Nombre y nivel */}
              <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "0.25rem" : "0.375rem", flex: 1, minWidth: 0 }}>
                {!isMobile && (
                  <div
                    style={{
                      fontSize: isTablet ? "0.8125rem" : "0.875rem",
                      fontWeight: 600,
                      color: "#1a1a24",
                      lineHeight: 1.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {session.user?.name || "Usuario"}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? "0.5rem" : "0.75rem",
                    fontSize: isMobile ? "0.6875rem" : "0.75rem",
                    color: "#64748b",
                    flexWrap: "nowrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "0.25rem" : "0.375rem" }}>
                    {!isMobile && <span>Nivel:</span>}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: isMobile ? "20px" : "24px",
                        padding: isMobile ? "0.125rem 0.375rem" : "0.125rem 0.5rem",
                        background: "rgba(99, 102, 241, 0.1)",
                        borderRadius: "6px",
                        border: "1px solid rgba(99, 102, 241, 0.3)",
                        fontWeight: 700,
                        color: "#6366f1",
                        fontSize: isMobile ? "0.6875rem" : "0.75rem",
                      }}
                    >
                      {totalLevel}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "0.25rem" : "0.375rem" }}>
                    {!isMobile && <span>Coste:</span>}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: isMobile ? "20px" : "24px",
                        padding: isMobile ? "0.125rem 0.375rem" : "0.125rem 0.5rem",
                        background: "rgba(239, 68, 68, 0.1)",
                        borderRadius: "6px",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        fontWeight: 700,
                        color: "#ef4444",
                        fontSize: isMobile ? "0.6875rem" : "0.75rem",
                      }}
                    >
                      {monthlyCost.toFixed(2).replace(".", ",")}€
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de cerrar sesión */}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Cerrar sesión"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: isMobile ? "28px" : "32px",
                  height: isMobile ? "28px" : "32px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "50%",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <svg width={isMobile ? "16" : "18"} height={isMobile ? "16" : "18"} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
            
          </div>
        )}

        {/* Mobile Menu Button */}
        {compact && (
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              background: menuOpen ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(26, 26, 36, 0.8)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ 
              position: 'relative', 
              width: '20px', 
              height: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <span 
                style={{
                  display: 'block',
                  height: '2px',
                  width: '100%',
                  background: menuOpen ? 'white' : '#f8fafc',
                  borderRadius: '2px',
                  transition: 'all 0.3s ease',
                  transform: menuOpen ? 'rotate(45deg) translateY(8.5px)' : 'none',
                }}
              />
              <span 
                style={{
                  display: 'block',
                  height: '2px',
                  width: '100%',
                  background: menuOpen ? 'white' : '#f8fafc',
                  borderRadius: '2px',
                  transition: 'all 0.3s ease',
                  opacity: menuOpen ? 0 : 1,
                }}
              />
              <span 
                style={{
                  display: 'block',
                  height: '2px',
                  width: '100%',
                  background: menuOpen ? 'white' : '#f8fafc',
                  borderRadius: '2px',
                  transition: 'all 0.3s ease',
                  transform: menuOpen ? 'rotate(-45deg) translateY(-8.5px)' : 'none',
                }}
              />
            </div>
          </button>
        )}
      </div>

      {/* Mobile Menu */}
      {compact && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: menuOpen ? '500px' : '0',
            overflow: 'hidden',
            background: 'rgba(10, 10, 15, 0.98)',
            backdropFilter: 'blur(20px)',
            borderBottom: menuOpen ? '1px solid rgba(148, 163, 184, 0.1)' : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ padding: '1.5rem 2rem' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {links.map((link, index) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontWeight: 500,
                      fontFamily: 'var(--font-body)',
                      color: isActive ? 'white' : '#94a3b8',
                      textDecoration: 'none',
                      background: isActive 
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
                        : 'rgba(26, 26, 36, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.1)',
                      transition: 'all 0.2s ease',
                      transitionDelay: menuOpen ? `${index * 50}ms` : '0ms',
                      opacity: menuOpen ? 1 : 0,
                      transform: menuOpen ? 'translateY(0)' : 'translateY(-10px)',
                    }}
                  >
                    <span 
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(99, 102, 241, 0.15)',
                        color: isActive ? 'white' : '#6366f1',
                      }}
                    >
                      {link.label[0]}
                    </span>
                    {link.label}
                    <svg 
                      style={{ marginLeft: 'auto', opacity: 0.5 }}
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                );
              })}
            </nav>
            
            {/* CV Button */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <a
                href="/PauPedrejonCV.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  color: 'white',
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download CV
              </a>
            </div>
          </div>
        </div>
      )}

      {/* API Key Configuration Modal */}
      {showAPIKeyConfig && isStudyAgentsPage && (
        <APIKeyConfig
          onKeysConfigured={handleKeysConfigured}
          onClose={() => {
            if (apiKeys?.openai) {
              setShowAPIKeyConfig(false);
            }
          }}
        />
      )}
      
      {/* Profile View Modal */}
      {showProfile && session && isStudyAgentsPage && (
        <ProfileView
          userId={session.user?.id || session.user?.email || ""}
          onClose={() => setShowProfile(false)}
        />
      )}
    </header>
  );
}
