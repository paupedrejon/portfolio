---
title: "Pianificatore di viaggi con IA (gratis): guide HTML pronte da prenotare"
description: "Come ho costruito un pianificatore di viaggi con Gemini, Tavily e Wikipedia: itinerario giorno per giorno, biglietti, hotel e foto reali."
date: "2026-11-25"
tags: ["IA", "Next.js", "Viaggi", "Gemini", "Portfolio"]
ogTitle: "Viaggi con IA"
---

## Il problema

Pianificare un viaggio finisce spesso in 15 schede: Skyscanner, Booking, mappe, blog generici e un Google Doc a metà. Volevo uno strumento **gratis** che restituisse una guida scaricabile con tratte concrete, un alloggio per città e attività con foto del posto — non un muro di testo inventato.

## Cosa fa

Il pianificatore è su [paupedrejon.com/it/viajes](https://www.paupedrejon.com/it/viajes):

- Wizard stile motore di ricerca (origine, destinazioni, date, livello di comfort)
- Guida HTML con tipografia e colore adattati alla destinazione
- Trasporti con link di prenotazione per tratta
- Un alloggio per città con totale = notte × notti
- Itinerario denso giorno per giorno + video «Come si vede davvero»
- Foto per attività via Wikipedia / Wikimedia (non un pool a caso)

## Come è fatto

| Pezzo | Ruolo |
|------|------|
| Next.js App Router | UI Dark Cherry + API `/api/viajes/plan` |
| Gemini | Piano in JSON → render HTML deterministico |
| Tavily | Contesto prezzi / video YouTube |
| Wikipedia + Commons | Immagine per attività (pageimages in batch) |

Il modello propone il piano; il server valida densità, ricalcola i costi e monta la guida con un renderer proprio.

## Provalo

1. Apri [/it/viajes](https://www.paupedrejon.com/it/viajes)
2. Scegli origine e 1–3 destinazioni
3. Scarica la guida e usa i link di prenotazione

Feedback o una destinazione strana per romperlo: [contatto](https://www.paupedrejon.com/it/contact).
