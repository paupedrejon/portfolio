"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Iniciar animación de salida
    setIsAnimating(true);
    
    // Después de la animación de salida, cambiar el contenido y animar entrada
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsAnimating(false);
    }, 300); // Duración de la animación de salida

    return () => clearTimeout(timer);
  }, [pathname, children]);

  return (
    <>
      <style jsx>{`
        @keyframes slideOutLeft {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(-30px);
            opacity: 0;
          }
        }
        
        @keyframes slideInRight {
          0% {
            transform: translateX(30px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        
        .page-transition-exit {
          animation: slideOutLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .page-transition-enter {
          animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
      <div
        className={isAnimating ? "page-transition-exit" : "page-transition-enter"}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        {displayChildren}
      </div>
    </>
  );
}

