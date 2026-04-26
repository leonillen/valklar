const API = 'http://localhost:5050/api';
const ANSWER_LABELS = [
  'Håller inte alls med',
  'Håller delvis inte med',
  'Varken eller',
  'Håller delvis med',
  'Håller helt med'
];

let questions = [];
let answers = {};
let currentIndex = 0;
let sessionSeed = 0;

async function init() {
  sessionSeed = Date.now() % 100000;
  try {
    const res = await fetch(`${API}/questions?n=30&seed=${sessionSeed}`);
    const data = await res.json();
    questions = data.questions;
    sessionSeed = data.session_seed || sessionSeed;
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('nav-area').style.display = 'block';
    renderAll();
    showQuestion(0);
  } catch (e) {
    document.getElementById('loading-state').textContent = 'Kunde inte ladda frågor. Kontrollera att servern körs.';
  }
}

function renderAll() {
  const container = document.getElementById('questions-container');
  container.innerHTML = questions.map((q, i) => `
    <div class="question-area" id="q-${i}">
      <div class="question-meta">
        <span class="area-badge">${q.area}</span>
      </div>
      <h2 class="question-text">${q.text}</h2>
      <button class="info-toggle" onclick="toggleInfo(${i}, '${q.id}')">
        <span>ℹ</span> Fördjupning om frågan
      </button>
      <div class="question-info-box" id="info-${i}">
        <span class="info-loading">Laddar...</span>
      </div>
      <div class="answer-scale-labels">
        <span>Håller inte alls med</span>
        <span>Håller helt med</span>
      </div>
      <div class="answer-scale">
        ${[1,2,3,4,5].map(v => `
          <div class="answer-option" id="opt-${i}-${v}" onclick="selectAnswer(${i}, ${v})">
            <div class="option-value">${v}</div>
            <span class="option-label">${ANSWER_LABELS[v-1]}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function showQuestion(index) {
  document.querySelectorAll('.question-area').forEach(el => el.classList.remove('active'));
  const el = document.getElementById(`q-${index}`);
  if (el) el.classList.add('active');
  currentIndex = index;
  updateProgress();
  updateNavButtons();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress() {
  const answered = Object.keys(answers).length;
  const pct = Math.round((answered / questions.length) * 100);
  document.getElementById('progress-fill').style.width = `${pct}%`;
  document.getElementById('progress-label').textContent = `Fråga ${currentIndex + 1} av ${questions.length}`;
  document.getElementById('progress-pct').textContent = `${pct}%`;
}

function updateNavButtons() {
  document.getElementById('btn-prev').style.display = currentIndex === 0 ? 'none' : '';
  const isLast = currentIndex === questions.length - 1;
  document.getElementById('btn-next').textContent = isLast ? 'Se resultat →' : 'Nästa →';
}

function selectAnswer(index, value) {
  const qId = questions[index].id;
  answers[qId] = value;
  document.querySelectorAll(`[id^="opt-${index}-"]`).forEach(el => el.classList.remove('selected'));
  document.getElementById(`opt-${index}-${value}`).classList.add('selected');
  updateProgress();
  setTimeout(() => nextQuestion(), 350);
}

function nextQuestion() {
  if (currentIndex < questions.length - 1) {
    showQuestion(currentIndex + 1);
  } else {
    submitAnswers();
  }
}

function prevQuestion() {
  if (currentIndex > 0) showQuestion(currentIndex - 1);
}

function skipQuestion() {
  nextQuestion();
}

async function toggleInfo(index, questionId) {
  const box = document.getElementById(`info-${index}`);
  if (box.classList.contains('open')) {
    box.classList.remove('open');
    return;
  }
  box.classList.add('open');
  if (box.dataset.loaded) return;
  box.dataset.loaded = 'true';
  try {
    const res = await fetch(`${API}/question-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId })
    });
    const data = await res.json();
    box.textContent = data.info || data.base_info;
  } catch (e) {
    const q = questions.find(q => q.id === questionId);
    box.textContent = q?.info || 'Information ej tillgänglig.';
  }
}

async function submitAnswers() {
  const answeredCount = Object.keys(answers).length;
  if (answeredCount < Math.floor(questions.length * 0.5)) {
    alert(`Du har besvarat ${answeredCount} av ${questions.length} frågor. Svara på fler för ett bättre resultat.`);
    return;
  }

  document.getElementById('nav-area').innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--text-muted);">Beräknar din matchning...</div>';

  try {
    const res = await fetch(`${API}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, seed: sessionSeed })
    });
    const result = await res.json();
    sessionStorage.setItem('quiz_result', JSON.stringify({ ...result, answers, seed: sessionSeed }));
    window.location.href = 'results.html';
  } catch (e) {
    document.getElementById('nav-area').innerHTML = '<div style="text-align:center;color:red;">Fel vid beräkning. Försök igen.</div>';
  }
}

init();
