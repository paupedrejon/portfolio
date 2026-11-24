"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "portfolio:project-favorites";

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function writeFavorites(slugs: string[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // sessionStorage puede fallar en modo privado estricto
  }
}

/** Favoritos de proyectos — persisten en sessionStorage (sesión de pestaña). */
export function useProjectFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFavorites(readFavorites());
    setReady(true);
  }, []);

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites],
  );

  const toggleFavorite = useCallback((slug: string) => {
    setFavorites((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((item) => item !== slug)
        : [...prev, slug];
      writeFavorites(next);
      return next;
    });
  }, []);

  return { favorites, ready, isFavorite, toggleFavorite, count: favorites.length };
}
