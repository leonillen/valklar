import sqlite3
import json
import os
from datetime import datetime

_DATA_DIR = os.environ.get('RAILWAY_VOLUME_MOUNT_PATH') or os.path.join(os.path.dirname(__file__), '..', 'data')
DB_PATH = os.path.join(_DATA_DIR, 'valkompass.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS completions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            answers_json TEXT NOT NULL,
            top_party TEXT NOT NULL,
            match_score REAL NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS stats (
            key TEXT PRIMARY KEY,
            value INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS lead_signups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            source TEXT NOT NULL DEFAULT 'results',
            interests_json TEXT NOT NULL DEFAULT '[]',
            top_party TEXT,
            match_score REAL,
            priority_areas_json TEXT NOT NULL DEFAULT '[]',
            consent_version TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_signups_email_source
            ON lead_signups (email, source);
        INSERT OR IGNORE INTO stats (key, value) VALUES ('total_completions', 0);
    """)
    conn.commit()
    conn.close()

def record_completion(session_id: str, answers: dict, top_party: str, match_score: float):
    conn = get_db()
    conn.execute(
        "INSERT INTO completions (session_id, answers_json, top_party, match_score, created_at) VALUES (?,?,?,?,?)",
        (session_id, json.dumps(answers), top_party, match_score, datetime.utcnow().isoformat())
    )
    conn.execute("UPDATE stats SET value = value + 1 WHERE key = 'total_completions'")
    conn.commit()
    conn.close()

def record_lead_signup(
    email: str,
    source: str,
    interests: list,
    top_party: str = None,
    match_score: float = None,
    priority_areas: list = None,
    consent_version: str = 'newsletter-2026-v1'
) -> bool:
    now = datetime.utcnow().isoformat()
    conn = get_db()
    existing = conn.execute(
        "SELECT id FROM lead_signups WHERE email=? AND source=?", (email, source)
    ).fetchone()
    conn.execute(
        """
        INSERT INTO lead_signups (
            email, source, interests_json, top_party, match_score,
            priority_areas_json, consent_version, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(email, source) DO UPDATE SET
            interests_json=excluded.interests_json,
            top_party=excluded.top_party,
            match_score=excluded.match_score,
            priority_areas_json=excluded.priority_areas_json,
            consent_version=excluded.consent_version,
            updated_at=excluded.updated_at
        """,
        (
            email,
            source,
            json.dumps(interests or []),
            top_party,
            match_score,
            json.dumps(priority_areas or []),
            consent_version,
            now,
            now
        )
    )
    conn.commit()
    conn.close()
    return existing is None

def get_total_completions() -> int:
    conn = get_db()
    row = conn.execute("SELECT value FROM stats WHERE key='total_completions'").fetchone()
    conn.close()
    return row['value'] if row else 0

def get_party_distribution() -> dict:
    conn = get_db()
    rows = conn.execute(
        "SELECT top_party, COUNT(*) as count FROM completions GROUP BY top_party"
    ).fetchall()
    conn.close()
    return {row['top_party']: row['count'] for row in rows}
