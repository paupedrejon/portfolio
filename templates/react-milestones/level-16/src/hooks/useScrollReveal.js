import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Igual que useScrollReveal pero se reinicia al cambiar de ruta (React Router) */
export function useScrollReveal() {
  const { pathname } = useLocation();

  useEffect(() => {
    let observer;

    const timer = setTimeout(() => {
      const nodes = document.querySelectorAll(".reveal:not(.reveal--visible)");
      if (!nodes.length) return;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("reveal--visible");
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
      );

      nodes.forEach((node) => observer.observe(node));
    }, 100);

    return () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [pathname]);
}
