const API = 'http://localhost:5050/api';

const result = JSON.parse(sessionStorage.getItem('quiz_result') || 'null');

if (!result) {
  window.location.href = 'quiz.html';
}

function init() {
  const top = result.ranking[0];
  renderTopMatch(top);
  renderAllParties(result.ranking);
  renderDimensions(result.user_dimensions, result.dimensions_meta);
  renderPartyDetails(result.ranking);
  loadAIExplanation();

  document.getElementById('results-title').textContent = `Du matchar med ${top.name}`;
  document.getElementById('results-subtitle').textContent = `${top.score}% matchning`;
}

function renderTopMatch(top) {
  const section = document.getElementById('top-match-section');
  section.innerHTML = `
    <div class="top-match-card" style="color: ${top.color}; border-color: ${top.color}; background: ${hexToRgba(top.color, 0.05)};">
      <div class="top-match-label">Bästa matchning</div>
      <div class="top-match-name" style="color:${top.color}">${top.name}</div>
      <div class="top-match-score" style="color:${top.color}">${top.score}%</div>
      <div class="top-match-tagline" style="color:var(--text-muted)">${top.tagline}</div>
    </div>
  `;
}

function renderAllParties(ranking) {
  const container = document.getElementById('all-parties-list');
  container.innerHTML = ranking.map((p, i) => `
    <div class="party-result-row">
      <span class="party-rank">${i + 1}</span>
      <div class="party-color-dot" style="background:${p.color}"></div>
      <span class="party-result-name">${p.name}</span>
      <div class="party-result-bar-wrap">
        <div class="party-result-bar">
          <div class="party-result-bar-fill" style="background:${p.color};width:0%" data-target="${p.score}"></div>
        </div>
      </div>
      <span class="party-result-score">${p.score}%</span>
    </div>
  `).join('');

  setTimeout(() => {
    document.querySelectorAll('.party-result-bar-fill').forEach(el => {
      el.style.width = el.dataset.target + '%';
    });
  }, 100);
}

function renderDimensions(userDims, dimsMeta) {
  if (!userDims || !dimsMeta) return;
  const container = document.getElementById('dimensions-container');
  container.innerHTML = Object.entries(userDims).map(([dim, score]) => {
    const meta = dimsMeta[dim];
    if (!meta) return '';
    const pct = ((score - 1) / 9) * 100;
    return `
      <div class="dimension-row">
        <div class="dimension-label-row">
          <span class="dimension-label">${meta.label}</span>
          <span style="font-size:0.8rem;color:var(--text-muted)">${score.toFixed(1)}/10</span>
        </div>
        <div class="dimension-track">
          <div class="dimension-marker" style="left:0%" data-target="${pct}%"></div>
        </div>
        <div class="dimension-ends">
          <span>${meta.left_label}</span>
          <span>${meta.right_label}</span>
        </div>
      </div>
    `;
  }).join('');

  setTimeout(() => {
    document.querySelectorAll('.dimension-marker').forEach(el => {
      el.style.left = el.dataset.target;
    });
  }, 200);
}

function renderPartyDetails(ranking) {
  const container = document.getElementById('party-details');
  container.innerHTML = ranking.map(p => `
    <div class="party-detail-card">
      <div class="party-detail-header">
        <div class="party-color-dot" style="background:${p.color};width:14px;height:14px;border-radius:50%;"></div>
        <span class="party-detail-name">${p.name}</span>
        <span class="party-detail-score" style="color:${p.color}">${p.score}%</span>
      </div>
      <p class="party-detail-desc">${p.description}</p>
    </div>
  `).join('');
}

async function loadAIExplanation() {
  const aiBox = document.getElementById('ai-explanation');
  try {
    const matchesMap = {};
    result.ranking.forEach(p => { matchesMap[p.id] = p.score; });

    const res = await fetch(`${API}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        top_party: result.top_party,
        matches: matchesMap,
        user_dimensions: result.user_dimensions,
        answers: result.answers,
        seed: result.seed
      })
    });
    const data = await res.json();
    aiBox.innerHTML = `<span style="font-size:0.75rem;color:var(--accent);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:8px;">AI-analys</span>${data.explanation}`;
  } catch (e) {
    aiBox.style.display = 'none';
  }
}

function shareTwitter() {
  const top = result.ranking[0];
  const text = encodeURIComponent(`Jag matchar med ${top.name} (${top.score}%) i Valkompass 2026! Ta reda på vilket parti du matchar med 👇`);
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.origin + '/quiz.html')}`);
}

function shareFacebook() {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/quiz.html')}`);
}

function copyLink() {
  navigator.clipboard.writeText(window.location.origin + '/quiz.html').then(() => {
    alert('Länk kopierad!');
  });
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

init();
