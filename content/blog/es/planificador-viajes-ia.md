---
title: "Planificador de viajes con IA (gratis): guías HTML listas para reservar"
description: "Cómo construí un planificador de viajes con Gemini, Tavily y Wikipedia: itinerario día a día, billetes, hoteles y fotos reales del destino."
date: "2026-11-25"
tags: ["IA", "Next.js", "Viajes", "Gemini", "Portfolio"]
ogTitle: "Viajes con IA"
---

## El problema

Planificar un viaje suele acabar en 15 pestañas: Skyscanner, Booking, mapas, blogs genéricos y un Google Doc a medias. Quería una herramienta **gratis** que devolviera una guía descargable con tramos concretos, alojamiento por ciudad y actividades con fotos del lugar — no un muro de texto inventado.

## Qué hace

El planificador vive en [paupedrejon.com/es/viajes](https://www.paupedrejon.com/es/viajes):

- Wizard tipo buscador (origen, destinos, fechas, nivel de lujo)
- Guía HTML con tipografía y color adaptados al destino
- Transporte con enlaces de reserva por tramo
- Un alojamiento por ciudad con total = noche × noches
- Itinerario denso día a día + vídeos «Así se ve de verdad»
- Fotos por actividad vía Wikipedia / Wikimedia (no un pool aleatorio)

## Cómo está montado

| Pieza | Rol |
|------|-----|
| Next.js App Router | UI Dark Cherry + API `/api/viajes/plan` |
| Gemini | Plan en JSON → render determinista a HTML |
| Tavily | Contexto de precios / vídeos YouTube |
| Wikipedia + Commons | Imagen por actividad (pageimages por lotes) |

El HTML no lo improvisa el modelo a ciegas: el modelo propone el plan; el servidor valida densidad, recalcula dinero y monta la guía con un renderer propio.

## Pruébalo

1. Entra en [/es/viajes](https://www.paupedrejon.com/es/viajes)
2. Elige origen y 1–3 destinos
3. Descarga la guía y abre los enlaces de reserva

Si te sirve o quieres proponer un destino raro para romperlo: [contacto](https://www.paupedrejon.com/es/contact).
