# Valkompass 2026

Avancerad valkompass för svenska riksdagsval med AI-förklaringar, djupa politiska personlighetsdimensioner och delbara resultat.

## Snabbstart

### 1. Installera beroenden
```bash
pip install -r requirements.txt
```

### 2. Konfigurera miljövariabler
```bash
cp .env.example .env
# Redigera .env och fyll i GROQ_API_KEY
```

### 3. Starta backend
```bash
cd backend
python server.py
```

### 4. Öppna frontend
Öppna `frontend/index.html` i webbläsaren, eller servera med:
```bash
cd frontend
python -m http.server 3000
```
Gå till `http://localhost:3000`

---

## Projektstruktur

```
valkompass/
├── backend/
│   ├── server.py         # Flask REST API (port 5050)
│   ├── questions.py      # Frågeurval och rotation
│   ├── scoring.py        # Matchningsalgoritm
│   ├── ai_explain.py     # Groq AI-integration
│   └── database.py       # SQLite för statistik
├── data/
│   ├── parties.json      # 8 riksdagspartier med positioner
│   └── questions.json    # Frågebank (utökas till 250+)
├── frontend/
│   ├── index.html        # Landing page
│   ├── quiz.html         # Quizsidan
│   ├── results.html      # Resultatsidan
│   ├── css/              # Designsystem (4 filer)
│   └── js/               # JavaScript (3 filer)
└── requirements.txt
```

---

## API

| Endpoint | Metod | Beskrivning |
|----------|-------|-------------|
| `/api/stats` | GET | Totalt antal genomförda tester och partifördelning |
| `/api/questions` | GET | Hämta frågor (`?n=30&seed=42`) |
| `/api/submit` | POST | Skicka svar, få matchningsresultat |
| `/api/explain` | POST | AI-förklaring av matchning (kräver GROQ_API_KEY) |
| `/api/question-info` | POST | Fördjupningsinformation om en fråga |

### Exempel – submit
```json
POST /api/submit
{
  "answers": {"q001": 4, "q002": 2, "q003": 5},
  "seed": 42
}
```

---

## Politiska dimensioner

Varje användare placeras på 5 dimensioner (1–10):

| Dimension | Vänster (1) | Höger (10) |
|-----------|-------------|------------|
| Ekonomi | Stark välfärd | Fri marknad |
| Frihet vs Trygghet | Mer trygghet | Mer frihet |
| Individ vs Kollektiv | Kollektiv | Individ |
| Progressiv vs Konservativ | Traditionell | Progressiv |
| Miljö vs Tillväxt | Ekonomisk tillväxt | Miljöhänsyn |

---

## White-label / Medieintegration

För att anpassa till ett medieföretag:

1. **Byt API-URL** i `js/landing.js`, `js/quiz.js`, `js/results.js`:
   ```javascript
   const API = 'https://ditt-domännamn.se/api';
   ```

2. **Anpassa färger och typsnitt** via CSS-variabler i `css/base.css`:
   ```css
   :root {
     --accent: #din-färg;
     --bg: #din-bakgrund;
   }
   ```

3. **Lägg till logotyp** i index.html hero-sektionen.

---

## Miljövariabler

| Variabel | Beskrivning | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | API-nyckel för Groq (AI-förklaringar) | – |
| `PORT` | Port för Flask-servern | 5050 |
| `SECRET_KEY` | Flask secret key | – |

---

## Krav

- Python 3.10+
- Modern webbläsare (ES6+)
- Groq API-nyckel (för AI-förklaringar, valfritt)
