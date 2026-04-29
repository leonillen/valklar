# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Starta projektet

```bash
# Backend (port 5050)
cd backend && python server.py

# Frontend (port 3000)
cd frontend && python -m http.server 3000
```

Eller kör `start.bat` i projektroten för att starta båda på en gång.

Kräver `.env` med `GROQ_API_KEY` (kopiera från `.env.example`).

## Tech stack

- **Backend:** Python 3.10+, Flask, SQLite (via `database.py`), Groq API (`llama-3.3-70b-versatile`)
- **Frontend:** Vanilla JS (ES6+), HTML5, CSS3 – inga frameworks
- **Data:** JSON-filer i `data/` (frågorna och partidata)

## Arkitektur

Tre-sidig frontend (`index.html` → `quiz.html` → `results.html`) kommunicerar med Flask-backend via REST (`http://localhost:5050/api`). Ingen build-step – öppna HTML-filerna direkt eller via `http.server`.

**Backend-flöde:**
1. `GET /api/questions?n=30&seed=X` – `questions.py` väljer frågor round-robin per ämnesområde
2. `POST /api/submit` – `scoring.py` beräknar partimatch (0–100%) + 5 politiska dimensioner
3. `POST /api/explain` – `ai_explain.py` kallar Groq för AI-förklaring (valfritt)
4. `POST /api/question-info` – Groq-genererad fördjupning per fråga

**Matchningsalgoritm** (`scoring.py`): Viktat avståndsavstånd (1–5 skala) mot partipositioner. `priority_areas` ger 2× vikt. Dimensionspoäng (1–10) beräknas via kovariansbaserad riktningsinferens.

**Frontend state:**
- `quiz.js`: håller `questions`, `answers`, `priorityAreas`, `sessionSeed`
- `results.js`: läser `sessionData` från `localStorage` (satt av `quiz.js` efter submit)
- `landing.js`: hämtar `/api/stats` och visar antal genomförda tester

## Data-format

`data/questions.json` – varje fråga har `id`, `text`, `area`, `dimension`, `weight`, `info`, och `party_positions` (objekt med partiId → 1–5).

`data/parties.json` – varje parti har `id`, `name`, `color`, `tagline`, `description`, `dimensions` (5 nyckel → 1–10 värden).

## CSS-variabler (base.css)

Hela designsystemet styrs av `--accent`, `--bg`, `--surface`, `--text` m.fl. i `:root`. Ändra dessa för white-label-anpassning. Lägg aldrig inline-stilar som duplicerar dessa.

## API-URL

`API`-konstanten definieras i toppen av varje JS-fil och pekar på `http://localhost:5050/api`. Ändra på alla tre ställen vid driftsättning.
