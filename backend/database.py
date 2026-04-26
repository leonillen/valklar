import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'valkompass.db')

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
