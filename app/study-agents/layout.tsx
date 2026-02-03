"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function StudyAgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const prevPathnameRef = useRef(pathname);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const enterTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Interceptar clicks en Links para iniciar transición
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="/study-agents"]') as HTMLAnchorElement;
      
      if (link) {
        const href = link.getAttribute('href');
        if (href && href !== pathname && !href.startsWith('#')) {
          // Iniciar animación de salida inmediatamente
          setIsExiting(true);
        }
      }
    };

    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, [pathname]);

  // Manejar cambios de ruta
  useEffect(() => {
    // Limpiar timers anteriores
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);

    // Si es la primera carga
    if (prevPathnameRef.current === pathname) {
      setDisplayChildren(children);
      setIsExiting(false);
      setIsEntering(false);
      return;
    }

    // Si la ruta cambió
    if (prevPathnameRef.current !== pathname) {
      // Si ya estamos en modo exit (click interceptado), cambiar contenido y entrar
      if (isExiting) {
        enterTimerRef.current = setTimeout(() => {
          setDisplayChildren(children);
          setIsExiting(false);
          setIsEntering(true);
          prevPathnameRef.current = pathname;
          
          // Después de la animación de entrada
          enterTimerRef.current = setTimeout(() => {
            setIsEntering(false);
          }, 500);
        }, 100);
      } else {
        // Iniciar secuencia completa
        setIsExiting(true);
        
        exitTimerRef.current = setTimeout(() => {
          setDisplayChildren(children);
          setIsExiting(false);
          setIsEntering(true);
          prevPathnameRef.current = pathname;
          
          enterTimerRef.current = setTimeout(() => {
            setIsEntering(false);
          }, 500);
        }, 400);
      }
    }

    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    };
  }, [pathname, isExiting]);

  // Sincronizar children cuando cambian sin cambio de ruta
  useEffect(() => {
    if (prevPathnameRef.current === pathname && !isExiting && !isEntering) {
      setDisplayChildren(children);
    }
  }, [children, pathname, isExiting, isEntering]);

  return (
    <>
      <style jsx global>{`
        @keyframes slideOutLeft {
          from {
            transform: translateX(0) scale(1);
            opacity: 1;
            filter: blur(0px);
          }
          to {
            transform: translateX(-60px) scale(0.96);
            opacity: 0;
            filter: blur(6px);
          }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(60px) scale(0.96);
            opacity: 0;
            filter: blur(6px);
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
            filter: blur(0px);
          }
        }
        
        .study-agents-exit {
          animation: slideOutLeft 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
          pointer-events: none;
          will-change: transform, opacity, filter;
        }
        
        .study-agents-enter {
          animation: slideInRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
          will-change: transform, opacity, filter;
        }
      `}</style>
      <div
        className={
          isExiting 
            ? "study-agents-exit" 
            : isEntering 
            ? "study-agents-enter" 
            : ""
        }
        style={{
          width: "100%",
          minHeight: "100vh",
          position: "relative",
        }}
      >
        {displayChildren}
      </div>
    </>
  );
}
