import json
import random
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

def load_questions() -> list:
    with open(os.path.join(DATA_DIR, 'questions.json'), encoding='utf-8') as f:
        return json.load(f)['questions']

def load_parties() -> tuple:
    with open(os.path.join(DATA_DIR, 'parties.json'), encoding='utf-8') as f:
        data = json.load(f)
    return {p['id']: p for p in data['parties']}, data['dimensions']

def get_quiz_questions(n: int = 30, seed: int = None) -> list:
    """Välj n frågor balanserat över alla ämnesområden."""
    all_questions = load_questions()
    if seed is not None:
        random.seed(seed)

    by_area = {}
    for q in all_questions:
        by_area.setdefault(q['area'], []).append(q)

    selected = []
    areas = list(by_area.keys())
    per_area = max(1, n // len(areas))

    for area in areas:
        pool = by_area[area]
        take = min(per_area, len(pool))
        selected.extend(random.sample(pool, take))

    random.shuffle(selected)
    return selected[:n]
