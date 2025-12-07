"use client";

import { useEffect, useState } from "react";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { AiOutlineMail, AiFillPhone } from "react-icons/ai";

const contactMethods = [
  {
    icon: <FaGithub size={32} />,
    title: "GitHub",
    subtitle: "@paupedrejon",
    href: "https://www.github.com/paupedrejon",
    color: "linear-gradient(135deg, #333, #000)",
    glow: "#333",
  },
  {
    icon: <FaLinkedin size={32} />,
    title: "LinkedIn",
    subtitle: "Pau Pedrejon",
    href: "https://es.linkedin.com/in/pau-pedrejon-sobrino-0b5643380",
    color: "linear-gradient(135deg, #0077b5, #004182)",
    glow: "#0077b5",
  },
  {
    icon: <AiOutlineMail size={32} />,
    title: "Email",
    subtitle: "paupedrejon@gmail.com",
    href: "mailto:paupedrejon@gmail.com",
    color: "linear-gradient(135deg, #ea4335, #c5221f)",
    glow: "#ea4335",
  },
  {
    icon: <AiFillPhone size={32} />,
    title: "Phone",
    subtitle: "+34 689 063 590",
    href: "tel:+34689063590",
    color: "linear-gradient(135deg, #25d366, #128c7e)",
    glow: "#25d366",
  },
];

export default function ContactPage() {
  const [mounted, setMounted] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section" style={{ minHeight: '80vh', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-grid" />
        
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Orb 1 - Moving */}
          <div 
            className="absolute rounded-full blur-[100px] opacity-30"
            style={{
              width: '400px',
              height: '400px',
              background: 'linear-gradient(135deg, #ec4899, #db2777)',
              top: '20%',
              left: '10%',
              animation: 'floatOrb1 60s ease-in-out infinite',
            }}
          />
          {/* Orb 2 - Moving */}
          <div 
            className="absolute rounded-full blur-[120px] opacity-25"
            style={{
              width: '500px',
              height: '500px',
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              bottom: '15%',
              right: '15%',
              animation: 'floatOrb2 70s ease-in-out infinite',
            }}
          />
          {/* Orb 3 - Following Mouse */}
          <div 
            className="absolute rounded-full blur-[80px] opacity-20 transition-all duration-300"
            style={{
              width: '300px',
              height: '300px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              top: "50%",
              left: "50%",
              transform: 'translate(-50%, -50%)',
              animation: "floatOrb3 80s ease-in-out infinite",
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>

        <div 
          className={`relative z-10 flex flex-col items-center text-center px-6 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          style={{ transition: 'opacity 0.8s ease-out' }}
        >
          <div 
            className={`text-xs tracking-[0.3em] uppercase mb-6 px-4 py-2 rounded-full border ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ 
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-primary)',
              borderColor: 'var(--border-subtle)',
              background: 'var(--bg-card)',
              animationDelay: '0.1s',
              animationFillMode: 'both'
            }}
          >
            Let&apos;s Connect
          </div>

          <h1 
            className={`hero-title ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ 
              fontFamily: 'var(--font-display)',
              animationDelay: '0.2s',
              animationFillMode: 'both'
            }}
          >
            <span className="gradient-text">CONTACT</span>
          </h1>

          <p 
            className={`hero-tagline ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ 
              fontFamily: 'var(--font-body)',
              animationDelay: '0.3s',
              animationFillMode: 'both'
            }}
          >
            Have a project in mind? Let&apos;s discuss how we can work together.
          </p>

          <div 
            className={`flex flex-wrap gap-4 justify-center mt-8 ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
          >
            <CurriculumButton href="/PauPedrejonCV.pdf" />
          </div>

          <div 
            className={`scroll-wrap ${mounted ? 'animate-fade-in' : ''}`}
            style={{ animationDelay: '0.6s', animationFillMode: 'both', marginTop: '3rem' }}
          >
            <ScrollButton targetId="contact" color="transparent" iconColor="var(--text-secondary)" />
          </div>
        </div>

        <style jsx>{`
          @keyframes floatOrb1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(50px, -80px) scale(1.1); }
            50% { transform: translate(-30px, 60px) scale(0.9); }
            75% { transform: translate(80px, 40px) scale(1.05); }
          }
          @keyframes floatOrb2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-60px, -100px) scale(1.15); }
            66% { transform: translate(40px, 80px) scale(0.85); }
          }
        `}</style>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{ 
        background: 'var(--bg-secondary)',
        padding: '6rem 2rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Animated Background Pattern */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)
            `,
            animation: 'pulseBg 30s ease-in-out infinite',
          }}
        />

        {/* Rising Lines - Inverted Rain */}
        {[...Array(20)].map((_, i) => {
          const width = Math.random() * 2 + 1;
          const height = Math.random() * 250 + 120;
          const left = Math.random() * 100;
          const duration = Math.random() * 8 + 6;
          const delay = Math.random() * 5;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: `${width}px`,
                height: `${height}px`,
                background: `linear-gradient(to top, rgba(${Math.random() > 0.5 ? '236, 72, 153' : '6, 182, 212'}, 0), rgba(${Math.random() > 0.5 ? '236, 72, 153' : '6, 182, 212'}, ${Math.random() * 0.5 + 0.3}))`,
                left: `${left}%`,
                bottom: '-250px',
                borderRadius: '2px',
                animation: `riseLine ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
                boxShadow: `0 0 ${Math.random() * 15 + 8}px rgba(${Math.random() > 0.5 ? '236, 72, 153' : '6, 182, 212'}, 0.4)`,
              }}
            />
          );
        })}

        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Centered Header */}
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1.25rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(6, 182, 212, 0.9)',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                borderRadius: '50px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(6, 182, 212, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '0.75rem',
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>Get in Touch</span>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.1), transparent)',
                  animation: 'shimmer 3s ease-in-out infinite',
                }}
              />
            </div>
            <h2 
              style={{ 
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Contact Information
            </h2>
          </div>

          {/* Contact Cards Grid */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '4rem',
          }}>
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.href}
                target={method.href.startsWith('http') ? '_blank' : undefined}
                rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  position: 'relative',
                  padding: '2rem',
                  borderRadius: '24px',
                  background: 'var(--bg-card)',
                  border: `1px solid ${hoveredCard === index ? method.glow : 'var(--border-subtle)'}`,
                  backdropFilter: 'blur(20px)',
                  textDecoration: 'none',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: hoveredCard === index ? 'translateY(-10px) scale(1.03)' : 'translateY(0) scale(1)',
                  boxShadow: hoveredCard === index 
                    ? `0 30px 60px -15px rgba(0, 0, 0, 0.5), 0 0 40px ${method.glow}40` 
                    : '0 10px 30px -10px rgba(0, 0, 0, 0.2)',
                }}
              >
                {/* Animated Gradient Background */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: method.color,
                    opacity: hoveredCard === index ? 0.15 : 0,
                    transition: 'opacity 0.4s ease',
                  }}
                />

                {/* Glowing Border Effect */}
                <div
                  style={{
                    position: 'absolute',
                    inset: -2,
                    borderRadius: '24px',
                    background: method.color,
                    opacity: hoveredCard === index ? 0.6 : 0,
                    filter: 'blur(10px)',
                    transition: 'opacity 0.4s ease',
                    zIndex: -1,
                  }}
                />

                {/* Animated Icon Container */}
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: hoveredCard === index ? method.color : 'rgba(99, 102, 241, 0.15)',
                    color: hoveredCard === index ? 'white' : 'var(--accent-primary)',
                    margin: '0 auto 1.5rem',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: hoveredCard === index 
                      ? 'rotate(-10deg) scale(1.15) translateY(-5px)' 
                      : 'rotate(0) scale(1) translateY(0)',
                    boxShadow: hoveredCard === index 
                      ? `0 15px 35px ${method.glow}60, inset 0 0 20px rgba(255,255,255,0.2)` 
                      : 'none',
                    animation: hoveredCard === index ? 'iconPulse 3s ease-in-out infinite' : 'none',
                  }}
                >
                  {method.icon}
                </div>

                {/* Content */}
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem',
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {method.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '1rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '1rem',
                    }}
                  >
                    {method.subtitle}
                  </p>
                  
                  {/* Animated Arrow */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: hoveredCard === index ? method.glow : 'var(--text-muted)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      fontFamily: 'var(--font-mono)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <span>Get in touch</span>
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      style={{
                        transition: 'transform 0.3s ease',
                        transform: hoveredCard === index ? 'translateX(5px)' : 'translateX(0)',
                      }}
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Shine Effect */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    transition: 'left 0.6s ease',
                    ...(hoveredCard === index && { left: '100%' }),
                  }}
                />
              </a>
            ))}
          </div>

          {/* CTA Section */}
          <div 
            style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              borderRadius: '24px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              backdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Animated Background */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))',
                animation: 'gradientShift 25s ease infinite',
              }}
            />

            <h3 
              style={{ 
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '1rem',
                position: 'relative',
                zIndex: 1,
              }}
            >
              Ready to Start a Project?
            </h3>
            <p 
              style={{ 
                fontFamily: 'var(--font-body)',
                fontSize: '1.1rem',
                color: 'var(--text-secondary)',
                marginBottom: '2rem',
                maxWidth: '600px',
                margin: '0 auto 2rem',
                position: 'relative',
                zIndex: 1,
              }}
            >
              I&apos;m always open to discussing new projects, creative ideas, or opportunities to be part of your vision.
            </p>
            <a 
              href="mailto:paupedrejon@gmail.com"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 2.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                color: 'white',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                borderRadius: '100px',
                textDecoration: 'none',
                boxShadow: '0 10px 40px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.3s ease',
                position: 'relative',
                zIndex: 1,
                animation: 'buttonGlow 4s ease-in-out infinite',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 15px 50px rgba(99, 102, 241, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(99, 102, 241, 0.4)';
              }}
            >
              <AiOutlineMail size={20} />
              Send me an Email
            </a>
          </div>
        </div>

        <style jsx>{`
          @keyframes floatOrb3 {
            0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
            50% { transform: translate(-50%, -50%) scale(1.2) rotate(180deg); }
          }
          @keyframes riseLine {
            0% {
              transform: translateY(0);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(calc(-100vh - 250px));
              opacity: 0;
            }
          }
          @keyframes pulseBg {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes iconPulse {
            0%, 100% { transform: rotate(-10deg) scale(1.15) translateY(-5px); }
            50% { transform: rotate(-8deg) scale(1.2) translateY(-8px); }
          }
          @keyframes buttonGlow {
            0%, 100% { box-shadow: 0 10px 40px rgba(99, 102, 241, 0.4); }
            50% { box-shadow: 0 10px 50px rgba(99, 102, 241, 0.6), 0 0 30px rgba(99, 102, 241, 0.3); }
          }
        `}</style>
      </section>
    </>
  );
}
