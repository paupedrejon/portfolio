"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);

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
      setCompact(window.innerWidth < 900);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

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
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
    </header>
  );
}
