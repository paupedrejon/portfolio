"use client";

import { createContext, useContext } from "react";

export const ExpertiseSnapScrollerContext = createContext<HTMLElement | null>(null);

export function useExpertiseSnapScroller() {
  return useContext(ExpertiseSnapScrollerContext);
}
