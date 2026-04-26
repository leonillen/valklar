PARTIES = ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP']

def calculate_match(answers: dict, questions: list, parties_data: dict) -> dict:
    """
    answers: {question_id: user_answer (1-5)}
    questions: lista med frågeobjekt
    Returnerar matchningsresultat per parti (0-100%) + dimensionspoäng.
    """
    party_distances = {p: 0.0 for p in PARTIES}
    total_weight = 0.0

    answered_questions = [q for q in questions if q['id'] in answers]

    for q in answered_questions:
        user_val = answers[q['id']]
        weight = q.get('weight', 1.0)
        total_weight += weight
        for party in PARTIES:
            party_val = q['party_positions'].get(party, 3)
            distance = abs(user_val - party_val)
            party_distances[party] += distance * weight

    if total_weight == 0:
        return {}

    max_distance = 4.0 * total_weight
    matches = {}
    for party in PARTIES:
        raw_match = 1.0 - (party_distances[party] / max_distance)
        matches[party] = round(raw_match * 100, 1)

    user_dimensions = calculate_user_dimensions(answers, answered_questions)

    sorted_matches = sorted(matches.items(), key=lambda x: x[1], reverse=True)

    return {
        'matches': matches,
        'ranking': [{'party': p, 'score': s} for p, s in sorted_matches],
        'top_party': sorted_matches[0][0],
        'user_dimensions': user_dimensions
    }

def calculate_user_dimensions(answers: dict, questions: list) -> dict:
    """Beräkna användarens position på varje politisk dimension (1-10)."""
    dim_scores = {}
    dim_counts = {}

    for q in questions:
        if q['id'] not in answers:
            continue
        dim = q.get('dimension')
        if not dim:
            continue
        raw = answers[q['id']]
        normalized = (raw - 1) / 4 * 9 + 1
        dim_scores[dim] = dim_scores.get(dim, 0) + normalized
        dim_counts[dim] = dim_counts.get(dim, 0) + 1

    return {
        dim: round(dim_scores[dim] / dim_counts[dim], 1)
        for dim in dim_scores
    }
