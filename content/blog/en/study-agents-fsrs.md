---
title: "How I built Study Agents with FSRS spaced repetition"
description: "Multi-agent architecture, ChromaDB RAG, and FSRS spaced repetition in a production AI learning platform."
date: "2026-07-01"
tags: ["AI", "Next.js", "Python", "RAG", "FSRS"]
ogTitle: "Study Agents + FSRS"
---

## The problem

As a Software Engineering student at UPC (Universitat Politècnica de Catalunya), I studied with scattered PDFs and generic AI chats that didn't remember my level or my material. I needed a system that **learned from my notes** and helped me retain concepts long-term.

## The solution

I built **Study Agents** as the capstone of the 10X AI Developer program at the Artificial Intelligence Institute:

- **8 specialized agents** orchestrated with LangChain and FastAPI
- **RAG** on user PDFs with ChromaDB and embeddings
- **Adaptive tests** and real-time educational feedback
- **Next.js 15 frontend** integrated into my portfolio with Google login

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React, TypeScript |
| Backend | FastAPI, Python 3.11, LangChain |
| AI | OpenAI GPT-3.5/4, ChromaDB |
| Auth | NextAuth.js (Google) |

## Results

- Platform **in production** at [paupedrejon.com/study-agents](https://www.paupedrejon.com/study-agents)
- Public demo accessible for recruiters and professors
- Scalable architecture ready for new features (FSRS, flashcards, code interpreter)

## Next steps

Iterate with **spaced repetition (FSRS)** algorithms to optimize when to review each concept, turning Study Agents into a tutor that doesn't just explain, but **remembers what you forget**.
