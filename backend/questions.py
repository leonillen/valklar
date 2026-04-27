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
    rng = random.Random(seed)

    by_area = {}
    for q in all_questions:
        by_area.setdefault(q['area'], []).append(q)

    # Shuffle each area's pool
    areas = list(by_area.keys())
    for area in areas:
        rng.shuffle(by_area[area])

    # Round-robin over areas until we have n questions or exhaust all
    selected = []
    area_indices = {area: 0 for area in areas}
    n_capped = min(n, len(all_questions))

    while len(selected) < n_capped:
        added_any = False
        for area in areas:
            if len(selected) >= n_capped:
                break
            idx = area_indices[area]
            if idx < len(by_area[area]):
                selected.append(by_area[area][idx])
                area_indices[area] += 1
                added_any = True
        if not added_any:
            break

    rng.shuffle(selected)
    return selected
