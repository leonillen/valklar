import sys, os
sys.stdout.reconfigure(encoding='utf-8')
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import uuid

load_dotenv(os.path.join('..', '.env'))

from questions import get_quiz_questions, load_parties
from scoring import calculate_match
from database import init_db, record_completion, get_total_completions, get_party_distribution
from ai_explain import generate_explanation, generate_question_info

app = Flask(__name__)
CORS(app, origins=["http://localhost:5050", "http://127.0.0.1:5050", "http://localhost:3000", "http://127.0.0.1:3000", "null"])
init_db()

parties_data, dimensions_data = load_parties()

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
    n = min(n, 50)
    questions = get_quiz_questions(n=n, seed=seed)
    sanitized = [{
        'id': q['id'],
        'text': q['text'],
        'area': q['area'],
        'info': q['info']
    } for q in questions]
    return jsonify({
        'questions': sanitized,
        'session_seed': seed if seed is not None else 0
    })

@app.route('/api/submit', methods=['POST'])
def submit_answers():
    body = request.get_json()
    if not body or 'answers' not in body:
        return jsonify({'error': 'answers saknas'}), 400

    raw_answers = body.get('answers', {})
    if not isinstance(raw_answers, dict):
        return jsonify({'error': 'answers måste vara ett objekt'}), 400
    answers = {
        k: v for k, v in raw_answers.items()
        if isinstance(v, int) and 1 <= v <= 5
    }
    seed = body.get('seed', 0)
    if not isinstance(seed, int):
        seed = 0

    questions = get_quiz_questions(n=50, seed=seed)
    question_ids = {q['id'] for q in questions}
    filtered_answers = {k: v for k, v in answers.items() if k in question_ids}

    result = calculate_match(filtered_answers, questions, parties_data)
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
        'dimensions_meta': dimensions_data
    })

@app.route('/api/explain', methods=['POST'])
def explain():
    body = request.get_json()
    required = ['top_party', 'matches', 'user_dimensions', 'answers', 'seed']
    if not body or not all(k in body for k in required):
        return jsonify({'error': 'Saknar fält'}), 400

    valid_parties = list(parties_data.keys())
    if body['top_party'] not in valid_parties:
        return jsonify({'error': f'Ogiltigt top_party: {body["top_party"]}'}), 400

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
    body = request.get_json()
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
        return jsonify({'info': q['info'], 'base_info': q['info']})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))
    debug_mode = os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'
    app.run(debug=debug_mode, port=port)
