import sys, os
sys.stdout.reconfigure(encoding='utf-8')
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import uuid
import re

load_dotenv(os.path.join('..', '.env'))

from questions import get_quiz_questions, load_parties
from calibration import get_priority_area, get_valid_priority_areas
from scoring import calculate_average_voter_dimensions, calculate_match
from database import init_db, record_completion, record_lead_signup, get_total_completions, get_party_distribution
from ai_explain import generate_explanation, generate_question_info

app = Flask(__name__)
CORS(app, origins=["http://localhost:5050", "http://127.0.0.1:5050", "http://localhost:3000", "http://127.0.0.1:3000", "null"])
init_db()

parties_data, dimensions_data = load_parties()

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
ALLOWED_LEAD_INTERESTS = {'valguiden', 'sakfragor', 'resultat'}

@app.route('/api/stats', methods=['GET'])
def get_stats():
    return jsonify({
        'total_completions': get_total_completions(),
        'party_distribution': get_party_distribution()
    })

@app.route('/api/questions', methods=['GET'])
def get_questions():
    seed = request.args.get('seed', type=int)
    n = request.args.get('n', default=30, type=int)
    if n is None or n < 1:
        return jsonify({'error': 'n måste vara minst 1'}), 400
    n = min(n, 50)
    if seed is None:
        seed = uuid.uuid4().int % 1000000000
    questions = get_quiz_questions(n=n, seed=seed)
    sanitized = [{
        'id': q['id'],
        'text': q['text'],
        'area': q['area'],
        'priority_area': get_priority_area(q),
        'info': q['info']
    } for q in questions]
    return jsonify({
        'questions': sanitized,
        'session_seed': seed
    })

@app.route('/api/submit', methods=['POST'])
def submit_answers():
    body = request.get_json(silent=True)
    if not body or 'answers' not in body:
        return jsonify({'error': 'answers saknas'}), 400

    raw_answers = body.get('answers', {})
    if not isinstance(raw_answers, dict):
        return jsonify({'error': 'answers måste vara ett objekt'}), 400
    answers = {
        k: v for k, v in raw_answers.items()
        if type(v) is int and 1 <= v <= 5
    }
    seed = body.get('seed', 0)
    if not isinstance(seed, int):
        seed = 0

    questions = get_quiz_questions(n=50, seed=seed)
    valid_areas = get_valid_priority_areas()
    raw_priority_areas = body.get('priority_areas', [])
    if not isinstance(raw_priority_areas, list):
        raw_priority_areas = []
    priority_areas = []
    for area in raw_priority_areas:
        if isinstance(area, str) and area in valid_areas and area not in priority_areas:
            priority_areas.append(area)
        if len(priority_areas) >= 4:
            break

    question_ids = {q['id'] for q in questions}
    filtered_answers = {k: v for k, v in answers.items() if k in question_ids}

    result = calculate_match(filtered_answers, questions, parties_data, priority_areas)
    if not result:
        return jsonify({'error': 'Inga svar att beräkna'}), 400

    session_id = str(uuid.uuid4())
    record_completion(session_id, filtered_answers, result['top_party'], result['matches'][result['top_party']])

    parties_enriched = []
    for item in result['ranking']:
        party_id = item['party']
        party = parties_data[party_id]
        parties_enriched.append({
            'id': party_id,
            'name': party['name'],
            'color': party['color'],
            'score': item['score'],
            'tagline': party['tagline'],
            'description': party['description']
        })

    return jsonify({
        'session_id': session_id,
        'ranking': parties_enriched,
        'top_party': result['top_party'],
        'user_dimensions': result['user_dimensions'],
        'average_dimensions': calculate_average_voter_dimensions(parties_data),
        'dimensions_meta': dimensions_data,
        'priority_areas': priority_areas
    })

@app.route('/api/leads', methods=['POST'])
def capture_lead():
    body = request.get_json(silent=True)
    if not body:
        return jsonify({'error': 'Saknar data'}), 400

    email = str(body.get('email', '')).strip().lower()
    if not EMAIL_RE.match(email) or len(email) > 254:
        return jsonify({'error': 'Ange en giltig e-postadress'}), 400

    if body.get('consent') is not True:
        return jsonify({'error': 'Samtycke krävs för nyhetsbrev'}), 400

    raw_interests = body.get('interests', [])
    if not isinstance(raw_interests, list):
        raw_interests = []
    interests = []
    for interest in raw_interests:
        if isinstance(interest, str) and interest in ALLOWED_LEAD_INTERESTS and interest not in interests:
            interests.append(interest)

    source = str(body.get('source', 'results')).strip()[:80] or 'results'
    top_party = body.get('top_party')
    if top_party not in parties_data:
        top_party = None

    match_score = body.get('match_score')
    if type(match_score) not in (int, float):
        match_score = None
    elif not 0 <= float(match_score) <= 100:
        match_score = None

    raw_priority_areas = body.get('priority_areas', [])
    if not isinstance(raw_priority_areas, list):
        raw_priority_areas = []
    valid_areas = get_valid_priority_areas()
    priority_areas = [
        area for area in raw_priority_areas
        if isinstance(area, str) and area in valid_areas
    ][:4]

    record_lead_signup(
        email=email,
        source=source,
        interests=interests,
        top_party=top_party,
        match_score=match_score,
        priority_areas=priority_areas,
        consent_version='newsletter-2026-v1'
    )
    return jsonify({'ok': True, 'message': 'Du är anmäld.'})

@app.route('/api/explain', methods=['POST'])
def explain():
    body = request.get_json(silent=True)
    required = ['top_party', 'matches', 'user_dimensions', 'answers', 'seed']
    if not body or not all(k in body for k in required):
        return jsonify({'error': 'Saknar fält'}), 400

    valid_parties = list(parties_data.keys())
    if body['top_party'] not in valid_parties:
        return jsonify({'error': f'Ogiltigt top_party: {body["top_party"]}'}), 400
    if not isinstance(body.get('matches'), dict) or body['top_party'] not in body['matches']:
        return jsonify({'error': 'matches saknar top_party'}), 400

    seed = body['seed']
    if not isinstance(seed, int):
        seed = 0
    questions = get_quiz_questions(n=50, seed=seed)
    answered = [q for q in questions if q['id'] in body['answers']]

    try:
        explanation = generate_explanation(
            top_party=body['top_party'],
            matches=body['matches'],
            user_dimensions=body['user_dimensions'],
            parties_data=parties_data,
            answered_questions=answered,
            user_answers=body['answers']
        )
        return jsonify({'explanation': explanation})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/question-info', methods=['POST'])
def question_info():
    body = request.get_json(silent=True)
    if not body or 'question_id' not in body:
        return jsonify({'error': 'question_id saknas'}), 400

    from questions import load_questions
    all_qs = {q['id']: q for q in load_questions()}
    q = all_qs.get(body['question_id'])
    if not q:
        return jsonify({'error': 'Fråga hittades inte'}), 404

    try:
        info = generate_question_info(q['text'], q['info'])
        return jsonify({'info': info, 'base_info': q['info']})
    except Exception as e:
        print(f"[question-info] Groq-fel för fråga {body['question_id']!r}: {e}", flush=True)
        return jsonify({'info': q['info'], 'base_info': q['info']})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(debug=debug_mode, port=port)
