---
title: "Cómo construí Study Agents con spaced repetition FSRS"
description: "Arquitectura multi-agente, RAG con ChromaDB y aprendizaje espaciado FSRS en una plataforma educativa con IA desplegada en producción."
date: "2026-07-01"
tags: ["IA", "Next.js", "Python", "RAG", "FSRS"]
ogTitle: "Study Agents + FSRS"
---

## El problema

Como estudiante de Ingeniería Informática en la UPC, estudiaba con PDFs dispersos y chats genéricos de IA que no recordaban mi nivel ni mi material. Necesitaba un sistema que **aprendiera de mis apuntes** y me ayudara a retener conceptos a largo plazo.

## La solución

Construí **Study Agents** como capstone del programa Desarrollador 10X con IA del Instituto de Inteligencia Artificial:

- **8 agentes especializados** orquestados con LangChain y FastAPI
- **RAG** sobre PDFs del usuario con ChromaDB y embeddings
- **Tests adaptativos** y feedback educativo en tiempo real
- **Frontend Next.js 15** integrado en mi portfolio con login Google

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15, React, TypeScript |
| Backend | FastAPI, Python 3.11, LangChain |
| IA | OpenAI GPT-3.5/4, ChromaDB |
| Auth | NextAuth.js (Google) |

## Resultados

- Plataforma **en producción** en [paupedrejon.com/study-agents](https://www.paupedrejon.com/study-agents)
- Demo pública accesible para reclutadores y profesores
- Arquitectura escalable lista para nuevas funcionalidades (FSRS, flashcards, intérprete de código)

## Próximos pasos

Iterar con algoritmos de **spaced repetition (FSRS)** para optimizar cuándo repasar cada concepto, convirtiendo Study Agents en un tutor que no solo explica, sino que **recuerda qué olvidas**.
