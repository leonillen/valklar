const API = 'http://localhost:5050/api';

const result = JSON.parse(sessionStorage.getItem('quiz_result') || 'null');

const DEFAULT_AVERAGE_DIMENSIONS = {
  ekonomi: 5.0,
  frihet_trygghet: 4.6,
  individ_kollektiv: 5.0,
  progressiv_konservativ: 5.0,
  miljo_tillvaxt: 5.6
};

function isValidResult(value) {
  return value && Array.isArray(value.ranking) && value.ranking.length > 0;
}

if (!isValidResult(result)) {
  window.location.href = 'quiz.html';
}

function init() {
  const top = result.ranking[0];
  renderTopMatch(top);
  renderAllParties(result.ranking);
  renderOutlierComparison(result.user_dimensions, result.average_dimensions || DEFAULT_AVERAGE_DIMENSIONS, result.dimensions_meta);
  loadAIExplanation();

  document.getElementById('results-title').textContent = `Du matchar med ${top.name}`;
  document.getElementById('results-subtitle').textContent = `${top.score}% matchning`;
}

function getPartyTextColor(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
  return luminance > 0.55 ? '#1A1A00' : '#ffffff';
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

function renderTopMatch(top) {
  const textColor = getPartyTextColor(top.color);
  const section = document.getElementById('top-match-section');
  section.innerHTML = `
    <div class="top-match-card" style="border-color:${top.color};">
      <div class="top-match-badge-wrap">
        <div class="party-badge party-badge-lg" style="background:${top.color};color:${textColor};">${top.id}</div>
      </div>
      <div class="top-match-content">
        <div class="top-match-label">Bästa matchning</div>
        <div class="top-match-name">${top.name}</div>
        <div class="top-match-score" style="color:${top.color}">${top.score}%</div>
        <div class="top-match-tagline">${top.tagline}</div>
      </div>
    </div>
  `;
}

function renderAllParties(ranking) {
  const container = document.getElementById('all-parties-list');
  container.innerHTML = ranking.map((p, i) => {
    const txtColor = getPartyTextColor(p.color);
    const partyId = escapeHtml(p.id);
    return `
    <div class="party-result-item" id="party-item-${partyId}" style="--party-color:${p.color};--party-soft:${hexToRgba(p.color, 0.1)};">
      <button class="party-result-row" id="party-button-${partyId}" type="button" aria-expanded="false" aria-controls="party-panel-${partyId}" onclick="togglePartyDetails('${partyId}')">
        <span class="party-rank">${i + 1}</span>
        <span class="party-badge party-badge-sm" style="background:${p.color};color:${txtColor};">${partyId}</span>
        <span class="party-result-name">${escapeHtml(p.name)}</span>
        <span class="party-result-bar-wrap">
          <span class="party-result-bar">
            <span class="party-result-bar-fill" style="background:${p.color};width:0%" data-target="${p.score}"></span>
          </span>
        </span>
        <span class="party-result-score">${p.score}%</span>
        <span class="party-result-caret" aria-hidden="true"></span>
      </button>
      <div class="party-result-panel" id="party-panel-${partyId}" role="region" aria-labelledby="party-button-${partyId}">
        <div class="party-result-panel-inner">
          <p class="party-result-tagline">${escapeHtml(p.tagline)}</p>
          <p class="party-result-desc">${escapeHtml(p.description)}</p>
        </div>
      </div>
    </div>
  `}).join('');

  setTimeout(() => {
    document.querySelectorAll('.party-result-bar-fill').forEach(el => {
      el.style.width = el.dataset.target + '%';
    });
  }, 100);
}

function togglePartyDetails(partyId) {
  const item = document.getElementById(`party-item-${partyId}`);
  const button = document.getElementById(`party-button-${partyId}`);
  if (!item || !button) return;

  const isOpen = item.classList.toggle('is-open');
  button.setAttribute('aria-expanded', String(isOpen));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function dimensionPct(score) {
  return clamp(((score - 1) / 9) * 100, 0, 100);
}

function getDifferenceText(diff, meta) {
  const abs = Math.abs(diff);
  if (abs < 0.4) return 'Nära snittet';

  const direction = diff > 0 ? meta.right_label : meta.left_label;
  return `${abs.toFixed(1)} steg mot ${direction.toLowerCase()}`;
}

function renderOutlierComparison(userDims, averageDims, dimsMeta) {
  const section = document.getElementById('outlier-section');
  const container = document.getElementById('outlier-container');
  if (!userDims || !averageDims || !dimsMeta || !container) {
    if (section) section.style.display = 'none';
    return;
  }

  const rows = Object.entries(userDims)
    .map(([dim, score]) => {
      const average = averageDims[dim];
      const meta = dimsMeta[dim];
      if (typeof average !== 'number' || !meta) return null;
      return {
        dim,
        score,
        average,
        meta,
        diff: score - average,
        absDiff: Math.abs(score - average)
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.absDiff - a.absDiff);

  if (!rows.length) {
    if (section) section.style.display = 'none';
    return;
  }

  const biggest = rows[0];
  const highlight = biggest.absDiff >= 0.4
    ? `Mest ovanlig: ${biggest.meta.label.toLowerCase()} (${getDifferenceText(biggest.diff, biggest.meta)}).`
    : 'Du ligger nära snittväljaren på alla fem dimensioner.';

  container.innerHTML = `
    <div class="outlier-summary">
      <span>${highlight}</span>
      <small>Snittet är viktat efter riksdagsvalet 2022.</small>
    </div>
    <div class="outlier-rows">
      ${rows.map(({ score, average, meta, diff, absDiff }) => {
        const diffClass = absDiff >= 1.5 ? 'is-high' : absDiff >= 0.8 ? 'is-medium' : '';
        return `
          <div class="outlier-row ${diffClass}">
            <div class="outlier-row-head">
              <span class="outlier-label">${meta.label}</span>
              <span class="outlier-diff">${getDifferenceText(diff, meta)}</span>
            </div>
            <div class="comparison-track" aria-label="${meta.label}: du ${score.toFixed(1)}, snitt ${average.toFixed(1)}">
              <div class="comparison-range"></div>
              <div class="comparison-marker comparison-marker-average" style="left:${dimensionPct(average)}%" title="Svenskt snitt: ${average.toFixed(1)}"></div>
              <div class="comparison-marker comparison-marker-user" style="left:${dimensionPct(score)}%" title="Du: ${score.toFixed(1)}"></div>
            </div>
            <div class="comparison-scale">
              <span>${meta.left_label}</span>
              <span><b>Du ${score.toFixed(1)}</b> · Snitt ${average.toFixed(1)}</span>
              <span>${meta.right_label}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
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
    if (!res.ok || typeof data.explanation !== 'string') {
      throw new Error(data.error || 'Kunde inte hämta AI-analys.');
    }

    const label = document.createElement('span');
    label.textContent = 'AI-analys';
    label.style.cssText = 'font-size:0.75rem;color:var(--accent);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:8px;';

    aiBox.textContent = '';
    aiBox.append(label, document.createTextNode(data.explanation));
  } catch (e) {
    aiBox.style.display = 'none';
  }
}

function shareTwitter() {
  const top = result.ranking[0];
  const text = encodeURIComponent(`Jag matchar med ${top.name} (${top.score}%) i Valkompass 2026. Ta reda på vilket parti du matchar med.`);
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

if (isValidResult(result)) {
  init();
}
