const API = 'http://localhost:5050/api';
const ANSWER_OPTIONS = [
  { label: 'H\u00e5ller inte alls med', tone: 'strong-disagree' },
  { label: 'H\u00e5ller delvis inte med', tone: 'disagree' },
  { label: 'Varken eller', tone: 'neutral' },
  { label: 'H\u00e5ller delvis med', tone: 'agree' },
  { label: 'H\u00e5ller helt med', tone: 'strong-agree' }
];
const MAX_PRIORITY_AREAS = 4;
const PRIORITY_AREAS = [
  { id: 'Ekonomi', label: 'Ekonomi', description: 'Skatter, jobb och statens roll.' },
  { id: 'Migration', label: 'Migration', description: 'Invandring, asyl och gr\u00e4nser.' },
  { id: 'Integration', label: 'Integration', description: 'Spr\u00e5k, arbete och samh\u00e4llsgemenskap.' },
  { id: 'Utbildning', label: 'Utbildning', description: 'Skola, universitet och kunskap.' },
  { id: 'V\u00e4lf\u00e4rd', label: 'V\u00e4lf\u00e4rd', description: 'V\u00e5rd, omsorg och trygghetssystem.' },
  { id: 'Milj\u00f6 & Klimat', label: 'Milj\u00f6 & klimat', description: 'Klimatpolitik, natur och tillv\u00e4xt.' },
  { id: 'Lag & Ordning', label: 'Lag & ordning', description: 'Brott, straff och polis.' },
  { id: 'Energi', label: 'Energi', description: 'El, k\u00e4rnkraft och energipriser.' }
];

let questions = [];
let answers = {};
let priorityAreas = [];
let currentIndex = 0;
let sessionSeed = 0;

async function init() {
  sessionSeed = Date.now() % 100000;
  try {
    const res = await fetch(`${API}/questions?n=30&seed=${sessionSeed}`);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.questions)) {
      throw new Error(data.error || 'Kunde inte ladda frågor.');
    }
    questions = data.questions;
    sessionSeed = data.session_seed || sessionSeed;
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('nav-area').style.display = 'block';
    renderAll();
    showPriorityIntro();
  } catch (e) {
    document.getElementById('loading-state').textContent = 'Kunde inte ladda frågor. Kontrollera att servern körs.';
  }
}

function renderAll() {
  const container = document.getElementById('questions-container');
  const priorityIntro = `
    <div class="question-area active" id="priority-step">
      <div class="question-card priority-card">
        <div class="question-meta">
          <span class="area-badge">Prioritering</span>
          <span class="question-number">Max ${MAX_PRIORITY_AREAS} omr\u00e5den</span>
        </div>
        <h2 class="question-text">Vilka fr\u00e5gor \u00e4r viktigast f\u00f6r dig?</h2>
        <p class="priority-copy">V\u00e4lj upp till ${MAX_PRIORITY_AREAS} omr\u00e5den. Fr\u00e5gor inom dessa omr\u00e5den v\u00e4ger tyngre n\u00e4r din partimatchning r\u00e4knas ut.</p>
        <div class="priority-grid">
          ${PRIORITY_AREAS.map((area, idx) => `
            <button class="priority-option" id="priority-area-${idx}" type="button" onclick="togglePriorityArea(${idx})">
              <span class="priority-option-title">${area.label}</span>
              <span class="priority-option-desc">${area.description}</span>
            </button>
          `).join('')}
        </div>
        <div class="priority-status" id="priority-status">0 av ${MAX_PRIORITY_AREAS} valda</div>
      </div>
    </div>
  `;

  container.innerHTML = priorityIntro + questions.map((q, i) => `
    <div class="question-area" id="q-${i}">
      <div class="question-card">
        <div class="question-meta">
          <span class="area-badge">${q.area}</span>
          <span class="question-number">Fråga ${i + 1} av ${questions.length}</span>
        </div>
        <h2 class="question-text">${q.text}</h2>
        <button class="info-toggle" onclick="toggleInfo(${i}, '${q.id}')">
          <span>ℹ</span> Fördjupning om frågan
        </button>
        <div class="question-info-box" id="info-${i}">
          <span class="info-loading">Laddar...</span>
        </div>
        <div class="answer-scale">
          ${ANSWER_OPTIONS.map((option, idx) => {
            const v = idx + 1;
            return `
            <div class="answer-option answer-option-${option.tone}" id="opt-${i}-${v}" onclick="selectAnswer(${i}, ${v})">
              <div class="option-symbol option-symbol-${option.tone}" aria-hidden="true"></div>
              <span class="option-label">${option.label}</span>
            </div>
          `;
          }).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

function showPriorityIntro() {
  document.querySelectorAll('.question-area').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('priority-step');
  if (el) el.classList.add('active');
  currentIndex = -1;
  updateProgress();
  updateNavButtons();
  updatePrioritySelection();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showQuestion(index) {
  document.querySelectorAll('.question-area').forEach(el => el.classList.remove('active'));
  const el = document.getElementById(`q-${index}`);
  if (el) el.classList.add('active');
  const skip = document.querySelector('.skip-link');
  if (skip) skip.style.display = '';
  currentIndex = index;
  updateProgress();
  updateNavButtons();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress() {
  if (currentIndex < 0) {
    document.getElementById('progress-fill').style.width = '0%';
    document.getElementById('progress-label').textContent = 'Prioritera fr\u00e5gor';
    document.getElementById('progress-pct').textContent = '0%';
    return;
  }

  const answered = Object.keys(answers).length;
  const pct = Math.round((answered / questions.length) * 100);
  document.getElementById('progress-fill').style.width = `${pct}%`;
  document.getElementById('progress-label').textContent = `Fråga ${currentIndex + 1} av ${questions.length}`;
  document.getElementById('progress-pct').textContent = `${pct}%`;
}

function updateNavButtons() {
  if (currentIndex < 0) {
    document.getElementById('btn-prev').style.display = 'none';
    document.getElementById('btn-next').textContent = 'Starta quiz \u2192';
    const skip = document.querySelector('.skip-link');
    if (skip) skip.style.display = 'none';
    return;
  }

  document.getElementById('btn-prev').style.display = currentIndex === 0 ? 'none' : '';
  const isLast = currentIndex === questions.length - 1;
  document.getElementById('btn-next').textContent = isLast ? 'Se resultat →' : 'Nästa →';
}

function togglePriorityArea(index) {
  const area = PRIORITY_AREAS[index]?.id;
  if (!area) return;

  const existingIndex = priorityAreas.indexOf(area);
  if (existingIndex >= 0) {
    priorityAreas.splice(existingIndex, 1);
  } else if (priorityAreas.length < MAX_PRIORITY_AREAS) {
    priorityAreas.push(area);
  }

  updatePrioritySelection();
}

function updatePrioritySelection() {
  const status = document.getElementById('priority-status');
  PRIORITY_AREAS.forEach((area, index) => {
    const el = document.getElementById(`priority-area-${index}`);
    if (!el) return;
    const isSelected = priorityAreas.includes(area.id);
    el.classList.toggle('selected', isSelected);
    el.classList.toggle('is-disabled', !isSelected && priorityAreas.length >= MAX_PRIORITY_AREAS);
    el.setAttribute('aria-pressed', String(isSelected));
    el.setAttribute('aria-disabled', String(!isSelected && priorityAreas.length >= MAX_PRIORITY_AREAS));
  });
  if (status) {
    status.textContent = `${priorityAreas.length} av ${MAX_PRIORITY_AREAS} valda`;
  }
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
  if (currentIndex < 0) {
    showQuestion(0);
    return;
  }

  if (currentIndex < questions.length - 1) {
    showQuestion(currentIndex + 1);
  } else {
    submitAnswers();
  }
}

function prevQuestion() {
  if (currentIndex === 0) {
    showPriorityIntro();
    return;
  }

  if (currentIndex > 0) showQuestion(currentIndex - 1);
}

function skipQuestion() {
  nextQuestion();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
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
      body: JSON.stringify({ answers, seed: sessionSeed, priority_areas: priorityAreas })
    });
    const result = await res.json();
    if (!res.ok || !Array.isArray(result.ranking) || result.ranking.length === 0) {
      throw new Error(result.error || 'Kunde inte beräkna resultatet.');
    }
    sessionStorage.setItem('quiz_result', JSON.stringify({ ...result, answers, seed: sessionSeed, priority_areas: priorityAreas }));
    window.location.href = 'results.html';
  } catch (e) {
    const message = e.message || 'Fel vid beräkning. Försök igen.';
    document.getElementById('nav-area').innerHTML = `
      <div style="text-align:center;color:red;margin-bottom:16px;">${escapeHtml(message)}</div>
      <div class="nav-buttons">
        <button class="btn btn-ghost" onclick="showQuestion(currentIndex)">Tillbaka</button>
        <button class="btn btn-primary" onclick="submitAnswers()">Försök igen</button>
      </div>
    `;
  }
}

init();
