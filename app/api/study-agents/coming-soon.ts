import { NextResponse } from "next/server";

export function comingSoonResponse() {
  return NextResponse.json(
    {
      success: false,
      status: "coming_soon",
      error: "Función en desarrollo (Fase 1 del plan pedagógico).",
    },
    { status: 501 },
  );
}
