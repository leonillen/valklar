# Repository Guidelines

## Project Structure & Module Organization

This repository contains a Python Flask API and a static vanilla JS frontend for a Swedish election compass.

- `backend/` holds the API server and domain logic: `server.py` routes, `questions.py` question selection, `scoring.py` matching, `ai_explain.py` Groq integration, and `database.py` SQLite stats.
- `frontend/` contains the browser app: page files (`index.html`, `quiz.html`, `results.html`), CSS in `frontend/css/`, JavaScript in `frontend/js/`, customer branding in `customer.config.json`, and party logos in `frontend/assets/party-logos/`.
- `data/` stores source JSON for questions and party positions.
- `docs/` contains planning notes. `test-results/` is generated output and should not be treated as source.

## Build, Test, and Development Commands

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend API on port `5050`:

```bash
cd backend
python server.py
```

Serve the frontend locally on port `3000`:

```bash
cd frontend
python -m http.server 3000
```

From the repo root, `start.bat` launches both services on Windows.

## Coding Style & Naming Conventions

Use Python 3.10+ with 4-space indentation and small, explicit functions. Keep Flask route handling in `server.py`; place reusable scoring, data loading, and AI behavior in the existing backend modules. Frontend code is plain ES6 JavaScript, HTML, and CSS without a framework. Prefer descriptive camelCase names in JS (`sessionSeed`, `priorityAreas`) and snake_case in Python (`priority_areas`). Reuse CSS variables from `frontend/css/base.css` instead of adding inline styles.

## Testing Guidelines

No automated test suite is currently checked in. For backend changes, run the Flask server and verify relevant endpoints such as `GET /api/questions?n=30&seed=42`, `POST /api/submit`, and `GET /api/stats`. For frontend changes, serve `frontend/` locally and complete the flow from landing page to quiz to results. Add focused tests if introducing a test framework; place them under a clear `tests/` directory and name Python tests `test_*.py`.

## Commit & Pull Request Guidelines

Recent commits use short conventional prefixes such as `chore:`, `fix:`, and `docs:`. Follow that style, for example `fix: validate quiz seed input` or `docs: update API quickstart`. Pull requests should include a concise summary, affected areas (`backend`, `frontend`, `data`), manual test steps, linked issues when applicable, and screenshots for visible UI changes.

## Security & Configuration Tips

Copy `.env.example` to `.env` for local settings. Do not commit real `GROQ_API_KEY`, `SECRET_KEY`, database files, or generated test artifacts. Keep allowed origins and debug behavior restrictive outside local development.
