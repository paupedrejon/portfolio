---
title: "Free AI travel planner: downloadable HTML guides ready to book"
description: "How I built a travel planner with Gemini, Tavily and Wikipedia: day-by-day itinerary, tickets, hotels and real destination photos."
date: "2026-11-25"
tags: ["AI", "Next.js", "Travel", "Gemini", "Portfolio"]
ogTitle: "AI travel planner"
---

## The problem

Trip planning usually means 15 tabs: Skyscanner, Booking, maps, generic blogs and a half-finished Google Doc. I wanted a **free** tool that returns a downloadable guide with concrete legs, one stay per city and activities with photos of the place — not a wall of invented text.

## What it does

The planner lives at [paupedrejon.com/en/viajes](https://www.paupedrejon.com/en/viajes):

- Search-style wizard (origin, destinations, dates, luxury level)
- HTML guide with typography and color adapted to the destination
- Transport with booking links per leg
- One lodging per city with total = nightly × nights
- Dense day-by-day itinerary + “See it for real” YouTube clips
- Per-activity photos via Wikipedia / Wikimedia (not a random pool)

## How it’s built

| Piece | Role |
|------|------|
| Next.js App Router | Dark Cherry UI + `/api/viajes/plan` |
| Gemini | Plan as JSON → deterministic HTML render |
| Tavily | Price context / YouTube videos |
| Wikipedia + Commons | Image per activity (batched pageimages) |

The model proposes the plan; the server validates density, recalculates money and builds the guide with a custom renderer.

## Try it

1. Open [/en/viajes](https://www.paupedrejon.com/en/viajes)
2. Pick origin and 1–3 destinations
3. Download the guide and use the booking links

Feedback or a weird destination to break it: [contact](https://www.paupedrejon.com/en/contact).
