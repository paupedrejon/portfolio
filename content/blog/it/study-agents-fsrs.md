---
title: "Come ho costruito Study Agents con spaced repetition FSRS"
description: "Architettura multi-agente, RAG con ChromaDB e spaced repetition FSRS in una piattaforma educativa IA in produzione."
date: "2026-07-01"
tags: ["IA", "Next.js", "Python", "RAG", "FSRS"]
ogTitle: "Study Agents + FSRS"
---

## Il problema

Come studente di Ingegneria Informatica alla UPC di Barcellona, studiavo con PDF sparsi e chat IA generiche che non ricordavano il mio livello né il mio materiale. Avevo bisogno di un sistema che **imparasse dai miei appunti** e mi aiutasse a trattenere i concetti a lungo termine.

## La soluzione

Ho costruito **Study Agents** come capstone del programma Sviluppatore 10X con IA dell'Istituto di Intelligenza Artificiale:

- **8 agenti specializzati** orchestrati con LangChain e FastAPI
- **RAG** sui PDF dell'utente con ChromaDB e embeddings
- **Test adattivi** e feedback educativo in tempo reale
- **Frontend Next.js 15** integrato nel mio portfolio con login Google

## Stack tecnico

| Layer | Tecnologia |
|-------|-----------|
| Frontend | Next.js 15, React, TypeScript |
| Backend | FastAPI, Python 3.11, LangChain |
| IA | OpenAI GPT-3.5/4, ChromaDB |
| Auth | NextAuth.js (Google) |

## Risultati

- Piattaforma **in produzione** su [paupedrejon.com/study-agents](https://www.paupedrejon.com/study-agents)
- Demo pubblica accessibile per recruiter e professori
- Architettura scalabile pronta per nuove funzionalità (FSRS, flashcards, interprete di codice)

## Prossimi passi

Iterare con algoritmi di **spaced repetition (FSRS)** per ottimizzare quando ripassare ogni concetto, trasformando Study Agents in un tutor che non solo spiega, ma **ricorda cosa dimentichi**.
