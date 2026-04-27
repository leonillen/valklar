PARTIES = ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP']
PRIORITY_AREA_MULTIPLIER = 2.0

VOTE_SHARE_2022 = {
    'S': 30.33,
    'M': 19.10,
    'SD': 20.54,
    'C': 6.71,
    'V': 6.75,
    'KD': 5.34,
    'L': 4.61,
    'MP': 5.08
}

def get_question_weight(question: dict, priority_areas: set = None) -> float:
    weight = question.get('weight', 1.0)
    if priority_areas and question.get('area') in priority_areas:
        weight *= PRIORITY_AREA_MULTIPLIER
    return weight

def calculate_match(answers: dict, questions: list, parties_data: dict, priority_areas: list = None) -> dict:
    """
    answers: {question_id: user_answer (1-5)}
    questions: lista med frågeobjekt
    Returnerar matchningsresultat per parti (0-100%) + dimensionspoäng.
    """
    party_distances = {p: 0.0 for p in PARTIES}
    total_weight = 0.0
    priority_area_set = set(priority_areas or [])

    answered_questions = [q for q in questions if q['id'] in answers]

    for q in answered_questions:
        user_val = answers[q['id']]
        weight = get_question_weight(q, priority_area_set)
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

    user_dimensions = calculate_user_dimensions(answers, answered_questions, parties_data, priority_area_set)

    sorted_matches = sorted(matches.items(), key=lambda x: x[1], reverse=True)

    return {
        'matches': matches,
        'ranking': [{'party': p, 'score': s} for p, s in sorted_matches],
        'top_party': sorted_matches[0][0],
        'user_dimensions': user_dimensions
    }

def calculate_user_dimensions(answers: dict, questions: list, parties_data: dict, priority_areas: set = None) -> dict:
    """Beräkna användarens position på varje politisk dimension (1-10)."""
    dim_scores = {}
    dim_counts = {}

    for q in questions:
        if q['id'] not in answers:
            continue
        dim = q.get('dimension')
        if not dim:
            continue
        user_val = answers[q['id']]
        question_weight = get_question_weight(q, priority_areas)
        normalized = (user_val - 1) / 4 * 9 + 1
        direction = infer_question_direction(q, dim, parties_data)
        if direction < 0:
            normalized = 11 - normalized

        dim_scores[dim] = dim_scores.get(dim, 0) + normalized * question_weight
        dim_counts[dim] = dim_counts.get(dim, 0) + question_weight

    return {
        dim: round(dim_scores[dim] / dim_counts[dim], 1)
        for dim in dim_scores
        if dim_counts.get(dim, 0) > 0
    }

def calculate_average_voter_dimensions(parties_data: dict) -> dict:
    """Vikta partiernas dimensionspositioner med riksdagsvalet 2022."""
    weighted = {}
    totals = {}

    for party_id, vote_share in VOTE_SHARE_2022.items():
        dimensions = parties_data.get(party_id, {}).get('dimensions', {})
        for dim, value in dimensions.items():
            weighted[dim] = weighted.get(dim, 0.0) + value * vote_share
            totals[dim] = totals.get(dim, 0.0) + vote_share

    return {
        dim: round(weighted[dim] / totals[dim], 1)
        for dim in weighted
        if totals.get(dim, 0) > 0
    }

def infer_question_direction(question: dict, dimension: str, parties_data: dict) -> int:
    party_values = []
    dimension_values = []

    for party in PARTIES:
        party_dim = parties_data.get(party, {}).get('dimensions', {}).get(dimension)
        if party_dim is None:
            continue
        party_values.append(question['party_positions'].get(party, 3))
        dimension_values.append(party_dim)

    if len(party_values) < 2:
        return 1

    avg_party = sum(party_values) / len(party_values)
    avg_dimension = sum(dimension_values) / len(dimension_values)
    covariance = sum(
        (party_val - avg_party) * (dimension_val - avg_dimension)
        for party_val, dimension_val in zip(party_values, dimension_values)
    )

    return -1 if covariance < 0 else 1
