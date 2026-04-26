import os
from groq import Groq

client = None

def get_client():
    global client
    if client is None:
        api_key = os.environ.get('GROQ_API_KEY')
        if not api_key:
            raise ValueError("GROQ_API_KEY saknas i miljövariabler")
        client = Groq(api_key=api_key)
    return client

def generate_explanation(
    top_party: str,
    matches: dict,
    user_dimensions: dict,
    parties_data: dict,
    answered_questions: list,
    user_answers: dict
) -> str:
    party_name = parties_data[top_party]['name']
    top_score = matches[top_party]

    dim_labels = {
        'ekonomi': 'ekonomisk höger-vänster',
        'frihet_trygghet': 'frihet vs trygghet',
        'individ_kollektiv': 'individ vs kollektiv',
        'progressiv_konservativ': 'progressiv vs konservativ',
        'miljo_tillvaxt': 'miljö vs tillväxt'
    }

    dim_text = []
    for dim, score in user_dimensions.items():
        label = dim_labels.get(dim, dim)
        if score <= 3:
            direction = "mot det kollektiva/konservativa/trygghets-orienterade hållet"
        elif score >= 7:
            direction = "mot det individuella/progressiva/frihets-orienterade hållet"
        else:
            direction = "i mitten"
        dim_text.append(f"- {label}: {score}/10 ({direction})")

    top_questions = []
    for q in answered_questions[:5]:
        if q['id'] in user_answers:
            user_val = user_answers[q['id']]
            party_val = q['party_positions'].get(top_party, 3)
            if abs(user_val - party_val) <= 1:
                top_questions.append(f"'{q['text']}' (du: {user_val}, {party_name}: {party_val})")

    prompt = f"""Du är en opartisk politisk analysassistent för den svenska valkompassens tjänst.

Användaren matchade med {party_name} ({top_score}% matchning).

Användarens politiska dimensioner:
{chr(10).join(dim_text)}

Frågor där de stämde bra med {party_name}:
{chr(10).join(top_questions) if top_questions else 'Generell matchning över flera frågor'}

Skriv en personlig, analytisk förklaring (3-4 meningar) på svenska som:
1. Förklarar varför användaren matchar med {party_name}
2. Lyfter deras politiska profil på ett neutralt sätt
3. Är ärlig – nämn om det är en stark eller svag matchning
4. Undviker politisk jargong och är lätt att förstå

Var kortfattad, neutral och direkt. Inga listor."""

    response = get_client().chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=300,
        temperature=0.7
    )
    return response.choices[0].message.content.strip()

def generate_question_info(question_text: str, question_info: str) -> str:
    prompt = f"""Du är en neutral politisk pedagog. Fördjupa följande information om en politisk fråga på max 3 meningar. Var saklig och opartisk.

Fråga: {question_text}
Grundinfo: {question_info}

Skriv fördjupningsinformation på svenska:"""

    response = get_client().chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
        temperature=0.5
    )
    return response.choices[0].message.content.strip()
