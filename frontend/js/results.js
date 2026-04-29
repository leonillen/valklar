const API = 'http://localhost:5050/api';

const PARTY_META = {
  S: { name: 'Socialdemokraterna', color: '#D83B36', tagline: 'Trygghet, j\u00e4mlikhet och en stark v\u00e4lf\u00e4rd.' },
  M: { name: 'Moderaterna', color: '#3C4E82', tagline: 'L\u00e4gre skatter, mer frihet och ett tryggare Sverige.' },
  SD: { name: 'Sverigedemokraterna', color: '#DCC715', tagline: 'Sverige och svenska intressen f\u00f6rst.' },
  C: { name: 'Centerpartiet', color: '#005A44', tagline: 'Frihet, f\u00f6retagande och en levande landsbygd.' },
  V: { name: 'V\u00e4nsterpartiet', color: '#9E2B27', tagline: 'J\u00e4mlikhet, feminism och ett starkare samh\u00e4lle.' },
  KD: { name: 'Kristdemokraterna', color: '#557CB1', tagline: 'Familjens och gemenskapens parti.' },
  L: { name: 'Liberalerna', color: '#87BFE3', tagline: 'Frihet, bildning och ett \u00f6ppet samh\u00e4lle.' },
  MP: { name: 'Milj\u00f6partiet', color: '#2FAA35', tagline: 'F\u00f6r klimatet, r\u00e4ttvisan och framtiden.' }
};

const PARTY_LOGOS = {
  S: 'assets/party-logos/S.png',
  M: 'assets/party-logos/M.png',
  SD: 'assets/party-logos/SD.png',
  C: 'assets/party-logos/C.png',
  V: 'assets/party-logos/V.png',
  KD: 'assets/party-logos/KD.png',
  L: 'assets/party-logos/L.png',
  MP: 'assets/party-logos/MP.png'
};

const PARTY_PROFILE_CONTEXT = {
  S: 'Din profil ligger n\u00e4ra en socialdemokratisk tyngdpunkt: trygghet, gemensamma l\u00f6sningar och en stark v\u00e4lf\u00e4rd.',
  M: 'Din profil ligger n\u00e4ra en moderat tyngdpunkt: ekonomi, ansvar, trygghet och mer utrymme f\u00f6r individen.',
  SD: 'Din profil ligger n\u00e4ra en sverigedemokratisk tyngdpunkt: trygghet, sammanh\u00e5llning och konservativa samh\u00e4llsv\u00e4rden.',
  C: 'Din profil ligger n\u00e4ra en centerpartistisk tyngdpunkt: frihet, f\u00f6retagande, landsbygd och gr\u00f6n omst\u00e4llning.',
  V: 'Din profil ligger n\u00e4ra en v\u00e4nsterpartistisk tyngdpunkt: j\u00e4mlikhet, stark offentlig v\u00e4lf\u00e4rd och kollektivt ansvar.',
  KD: 'Din profil ligger n\u00e4ra en kristdemokratisk tyngdpunkt: familj, v\u00e4lf\u00e4rd, trygghet och socialt ansvar.',
  L: 'Din profil ligger n\u00e4ra en liberal tyngdpunkt: frihet, skola, r\u00e4ttigheter och ett \u00f6ppet samh\u00e4lle.',
  MP: 'Din profil ligger n\u00e4ra en milj\u00f6partistisk tyngdpunkt: klimat, framtidsfr\u00e5gor, r\u00e4ttigheter och social h\u00e5llbarhet.'
};

const PRIORITY_PROFILE_NOUNS = {
  'Milj\u00f6 & Klimat': 'klimatv\u00e4ljare',
  'V\u00e4lf\u00e4rd': 'v\u00e4lf\u00e4rdsv\u00e4ljare',
  'Lag & Ordning': 'trygghetsv\u00e4ljare',
  'Ekonomi': 'ekonomiv\u00e4ljare',
  'Utbildning': 'kunskapsv\u00e4ljare',
  'Migration': 'samh\u00e4llsv\u00e4ljare',
  'Integration': 'samh\u00e4llsv\u00e4ljare',
  'Energi': 'energiv\u00e4ljare',
  'F\u00f6rsvar & utrikespolitik': 's\u00e4kerhetsv\u00e4ljare',
  'Demokrati & r\u00e4ttigheter': 'r\u00e4ttighetsv\u00e4ljare'
};

function loadStoredResult() {
  const sharedResult = new URLSearchParams(window.location.search).get('result');
  if (sharedResult) {
    try {
      const parsed = JSON.parse(sharedResult);
      const hydrated = hydrateSharedResult(parsed);
      if (isValidResult(hydrated)) {
        sessionStorage.setItem('quiz_result', JSON.stringify(hydrated));
        return hydrated;
      }
    } catch (e) {
      // Fall back to the locally stored result below.
    }
  }

  try {
    return JSON.parse(sessionStorage.getItem('quiz_result') || 'null');
  } catch (e) {
    return null;
  }
}

function hydrateSharedResult(value) {
  if (!value || value.v !== 1 || !Array.isArray(value.ranking)) {
    return value;
  }

  const ranking = value.ranking
    .map(item => {
      const id = String(item.id || '').toUpperCase();
      const meta = PARTY_META[id];
      if (!meta) return null;
      return {
        id,
        name: meta.name,
        color: meta.color,
        score: sanitizeScore(item.score),
        tagline: meta.tagline,
        description: ''
      };
    })
    .filter(Boolean);

  return {
    ranking,
    top_party: value.top_party || ranking[0]?.id,
    user_dimensions: sanitizeDimensions(value.user_dimensions),
    priority_areas: Array.isArray(value.priority_areas) ? value.priority_areas.filter(area => typeof area === 'string').slice(0, 4) : [],
    is_shared_result: true
  };
}

const result = loadStoredResult();

const DEFAULT_AVERAGE_DIMENSIONS = {
  ekonomi: 4.2,
  frihet_trygghet: 3.6,
  individ_kollektiv: 4.1,
  progressiv_konservativ: 5.4,
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
  applyPartyTheme(top);
  renderTopMatch(top);
  renderAllParties(result.ranking);
  renderOutlierComparison(result.user_dimensions, getAverageDimensions(result.average_dimensions), result.dimensions_meta);
  initLeadCapture();
  loadAIExplanation();

  document.getElementById('results-title').textContent = `Du matchar med ${top.name}`;
  document.getElementById('results-subtitle').textContent = `${top.score}% matchning`;
}

function getAverageDimensions(resultAverageDims) {
  return {
    ...DEFAULT_AVERAGE_DIMENSIONS,
    ...(resultAverageDims || {})
  };
}

function getPartyTextColor(hex) {
  const bg = hexToRgb(hex);
  const black = { r: 0, g: 0, b: 0 };
  const white = { r: 255, g: 255, b: 255 };
  return contrastRatio(bg, black) >= contrastRatio(bg, white) ? '#000000' : '#ffffff';
}

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}

function relativeLuminance({ r, g, b }) {
  return [r, g, b].map(channel => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrastRatio(a, b) {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
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

function sanitizeHexColor(value) {
  const color = String(value || '');
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#2F3440';
}

function sanitizeDomId(value) {
  return String(value || 'party').replace(/[^A-Za-z0-9_-]/g, '-');
}

function sanitizeScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? clamp(score, 0, 100) : 0;
}

function sanitizeDimensions(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, score]) => [key, Number(score)])
      .filter(([, score]) => Number.isFinite(score))
      .map(([key, score]) => [key, clamp(score, 1, 10)])
  );
}

function applyPartyTheme(top) {
  const color = sanitizeHexColor(top?.color);
  const ink = getPartyTextColor(color);
  [document.documentElement, document.body].forEach(target => {
    target.style.setProperty('--result-party-color', color);
    target.style.setProperty('--result-party-ink', ink);
    target.style.setProperty('--result-party-soft', hexToRgba(color, 0.14));
    target.style.setProperty('--result-party-faint', hexToRgba(color, 0.07));
    target.style.setProperty('--result-party-border', hexToRgba(color, 0.28));
    target.style.setProperty('--result-party-shadow', hexToRgba(color, 0.18));
  });
  document.body.dataset.topParty = String(top?.id || '').toLowerCase();
}

function getDimensionTraits(userDims) {
  const dims = sanitizeDimensions(userDims);
  if (!dims) return [];

  const traits = [];
  const addTrait = (dimension, score, low, high, label) => {
    if (!Number.isFinite(score)) return;
    if (score <= 4.2) traits.push({ dimension, label: low, strength: Math.abs(score - 5.5), score });
    if (score >= 6.8) traits.push({ dimension, label: high, strength: Math.abs(score - 5.5), score });
  };

  addTrait('ekonomi', dims.ekonomi, 'v\u00e4lf\u00e4rdsorienterad', 'marknadsliberal', 'Ekonomi');
  addTrait('frihet_trygghet', dims.frihet_trygghet, 'trygghetsorienterad', 'frihetsorienterad', 'Frihet/trygghet');
  addTrait('individ_kollektiv', dims.individ_kollektiv, 'solidarisk', 'individualistisk', 'Individ/kollektiv');
  addTrait('progressiv_konservativ', dims.progressiv_konservativ, 'v\u00e4rdekonservativ', 'progressiv', 'V\u00e4rderingar');
  addTrait('miljo_tillvaxt', dims.miljo_tillvaxt, 'tillv\u00e4xtorienterad', 'klimatorienterad', 'Milj\u00f6/tillv\u00e4xt');

  return traits.sort((a, b) => b.strength - a.strength);
}

function getProfileNoun(traits, priorityAreas = []) {
  const priorityNoun = priorityAreas
    .map(area => PRIORITY_PROFILE_NOUNS[area])
    .find(Boolean);
  if (priorityNoun) return priorityNoun;

  const topTrait = traits[0]?.dimension;
  if (topTrait === 'miljo_tillvaxt') return 'klimatv\u00e4ljare';
  if (topTrait === 'ekonomi') return 'ekonomiv\u00e4ljare';
  if (topTrait === 'frihet_trygghet') return 'trygghetsv\u00e4ljare';
  if (topTrait === 'progressiv_konservativ') return 'v\u00e4rderingsv\u00e4ljare';
  return 'samh\u00e4llsv\u00e4ljare';
}

function isRedundantProfileTrait(traitLabel, noun) {
  const trait = String(traitLabel || '').toLowerCase();
  const profileNoun = String(noun || '').toLowerCase();
  return (
    (profileNoun.startsWith('trygghets') && trait.includes('trygghet')) ||
    (profileNoun.startsWith('klimat') && trait.includes('klimat')) ||
    (profileNoun.startsWith('ekonomi') && trait.includes('marknad')) ||
    (profileNoun.startsWith('v\u00e4lf\u00e4rd') && trait.includes('v\u00e4lf\u00e4rd')) ||
    (profileNoun.startsWith('r\u00e4ttighet') && trait.includes('frihet'))
  );
}

function buildPoliticalProfile(top) {
  const traits = getDimensionTraits(result.user_dimensions);
  const priorityAreas = Array.isArray(result.priority_areas) ? result.priority_areas : [];
  const leadingTraits = traits.slice(0, 2);
  const noun = getProfileNoun(traits, priorityAreas);
  const titleTraits = leadingTraits.filter(trait => !isRedundantProfileTrait(trait.label, noun));
  const titleParts = titleTraits.length ? titleTraits.map(trait => trait.label) : leadingTraits.slice(0, 1).map(trait => trait.label);
  if (!titleParts.length) titleParts.push(top.name.replace(/na$/, ''));
  const title = `${titleParts.join(' ')} ${noun}`.replace(/\s+/g, ' ').trim();
  const priorityText = priorityAreas.length
    ? ` Dina viktigaste fr\u00e5gor var ${priorityAreas.slice(0, 3).join(', ').toLowerCase()}, vilket v\u00e4ger in i profilen.`
    : '';
  const traitText = leadingTraits.length
    ? `Du sticker fr\u00e4mst ut som ${leadingTraits.map(trait => trait.label).join(' och ')}.`
    : 'Profilen bygger fr\u00e4mst p\u00e5 vilket parti du matchar starkast med.';

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    summary: `${traitText} ${PARTY_PROFILE_CONTEXT[top.id] || top.tagline}${priorityText}`,
    chips: [
      ...leadingTraits.map(trait => trait.label),
      ...priorityAreas.slice(0, 2)
    ].slice(0, 4)
  };
}

function renderTopMatch(top) {
  const color = sanitizeHexColor(top.color);
  const textColor = getPartyTextColor(color);
  const score = sanitizeScore(top.score);
  const profile = buildPoliticalProfile(top);
  const section = document.getElementById('top-match-section');
  section.innerHTML = `
    <div class="top-match-card" style="--top-party-color:${color};">
      <div class="top-match-main">
      <div class="top-match-logo-wrap">
        <div class="top-party-logo" style="--top-party-color:${color};--top-party-text:${textColor};" aria-label="${escapeHtml(top.name)} logotyp">
          <span class="top-party-logo-mark">
            <img src="${PARTY_LOGOS[top.id] || ''}" alt="" onerror="this.remove()">
            <span>${escapeHtml(top.id)}</span>
          </span>
        </div>
      </div>
      <div class="top-match-content">
        <div class="top-match-label">Bästa matchning</div>
        <div class="top-match-name">${escapeHtml(top.name)}</div>
        <div class="top-match-scoreline">
          <div class="top-match-score" style="color:${color}">${score}%</div>
          <div class="top-match-meter" aria-label="Matchning ${score} procent">
            <span style="background:${color};width:${score}%"></span>
          </div>
        </div>
      </div>
      </div>
        <div class="top-match-tagline">${escapeHtml(top.tagline)}</div>
        <div class="political-profile-panel">
          <div class="political-profile-kicker">Din politiska profil</div>
          <h2>${escapeHtml(profile.title)}</h2>
          <p>${escapeHtml(profile.summary)}</p>
          <div class="political-profile-chips" aria-label="Profilmark\u00f6rer">
            ${profile.chips.map(chip => `<span>${escapeHtml(chip)}</span>`).join('')}
          </div>
        </div>
    </div>
  `;
}

function renderAllParties(ranking) {
  const container = document.getElementById('all-parties-list');
  container.innerHTML = ranking.map((p, i) => {
    const color = sanitizeHexColor(p.color);
    const txtColor = getPartyTextColor(color);
    const partyId = sanitizeDomId(p.id);
    const partyLabel = escapeHtml(p.id);
    const score = sanitizeScore(p.score);
    return `
    <div class="party-result-item" id="party-item-${partyId}" style="--party-color:${color};--party-soft:${hexToRgba(color, 0.13)};--party-tint:${hexToRgba(color, 0.055)};--party-border:${hexToRgba(color, 0.24)};">
      <button class="party-result-row" id="party-button-${partyId}" type="button" aria-expanded="false" aria-controls="party-panel-${partyId}" onclick="togglePartyDetails('${partyId}')">
        <span class="party-rank">${i + 1}</span>
        <span class="party-result-logo" style="--party-logo-bg:${hexToRgba(color, 0.11)};--party-logo-text:${txtColor};--party-logo-color:${color};">
          <img src="${PARTY_LOGOS[p.id] || ''}" alt="" onerror="this.remove()">
          <span>${partyLabel}</span>
        </span>
        <span class="party-result-name">${escapeHtml(p.name)}</span>
        <span class="party-result-bar-wrap">
          <span class="party-result-bar">
            <span class="party-result-bar-fill" style="background:${color};width:0%" data-target="${score}"></span>
          </span>
        </span>
        <span class="party-result-score">${score}%</span>
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

  const direction = String(diff > 0 ? meta.right_label : meta.left_label);
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
      const scoreNumber = Number(score);
      const average = Number(averageDims[dim]);
      const meta = dimsMeta[dim];
      if (!Number.isFinite(scoreNumber) || !Number.isFinite(average) || !meta) return null;
      return {
        dim,
        score: scoreNumber,
        average,
        meta,
        diff: scoreNumber - average,
        absDiff: Math.abs(scoreNumber - average)
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
    ? `Mest ovanlig: ${escapeHtml(biggest.meta.label).toLowerCase()} (${escapeHtml(getDifferenceText(biggest.diff, biggest.meta))}).`
    : 'Du ligger nära snittväljaren på alla fem dimensioner.';

  container.innerHTML = `
    <div class="outlier-summary">
      <span>${highlight}</span>
      <small>Snittet är en estimerad svensk väljarprofil.</small>
    </div>
    <div class="outlier-rows">
      ${rows.map(({ score, average, meta, diff, absDiff }) => {
        const diffClass = absDiff >= 1.5 ? 'is-high' : absDiff >= 0.8 ? 'is-medium' : '';
        return `
          <div class="outlier-row ${diffClass}">
            <div class="outlier-row-head">
              <span class="outlier-label">${escapeHtml(meta.label)}</span>
              <span class="outlier-diff">${escapeHtml(getDifferenceText(diff, meta))}</span>
            </div>
            <div class="comparison-track" aria-label="${escapeHtml(meta.label)}: du ${score.toFixed(1)}, snitt ${average.toFixed(1)}">
              <div class="comparison-range"></div>
              <div class="comparison-marker comparison-marker-average" style="left:${dimensionPct(average)}%" title="Svenskt snitt: ${average.toFixed(1)}"></div>
              <div class="comparison-marker comparison-marker-user" style="left:${dimensionPct(score)}%" title="Du: ${score.toFixed(1)}"></div>
            </div>
            <div class="comparison-scale">
              <span>${escapeHtml(meta.left_label)}</span>
              <span><b>Du ${score.toFixed(1)}</b> · Snitt ${average.toFixed(1)}</span>
              <span>${escapeHtml(meta.right_label)}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function loadAIExplanation() {
  const aiBox = document.getElementById('ai-explanation');
  if (!result.answers || !result.user_dimensions || !Number.isInteger(result.seed)) {
    aiBox.style.display = 'none';
    return;
  }

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

function getSelectedLeadInterests(form) {
  return Array.from(form.querySelectorAll('input[name="interest"]:checked'))
    .map(input => input.value);
}

function setLeadStatus(message, type = '') {
  const status = document.getElementById('lead-capture-status');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('is-success', type === 'success');
  status.classList.toggle('is-error', type === 'error');
}

function initLeadCapture() {
  const form = document.getElementById('lead-capture-form');
  const emailInput = document.getElementById('lead-email');
  const consentInput = document.getElementById('lead-consent');
  if (!form || !emailInput || !consentInput) return;

  const storedEmail = localStorage.getItem('lead_capture_email');
  if (storedEmail) emailInput.value = storedEmail;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const submitButton = form.querySelector('.lead-submit');
    const originalText = submitButton?.textContent;

    if (!emailInput.checkValidity()) {
      setLeadStatus('Ange en giltig e-postadress.', 'error');
      emailInput.focus();
      return;
    }

    if (!consentInput.checked) {
      setLeadStatus('Du behöver godkänna e-postutskick för att anmäla dig.', 'error');
      consentInput.focus();
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Anmäler...';
    }
    setLeadStatus('');

    try {
      const top = result.ranking[0];
      const productName = window.Brand?.get('brand.productName', 'Valkompass') || 'Valkompass';
      const res = await fetch(`${API}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          consent: true,
          interests: getSelectedLeadInterests(form),
          source: `${productName}-results`,
          top_party: top.id,
          match_score: sanitizeScore(top.score),
          priority_areas: result.priority_areas || []
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kunde inte anmäla e-postadressen.');

      localStorage.setItem('lead_capture_email', email);
      setLeadStatus('Klart. Du får valguiden och relevanta uppdateringar via e-post.', 'success');
      showToast('Du är anmäld');
    } catch (e) {
      setLeadStatus(e.message || 'Kunde inte anmäla e-postadressen just nu.', 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText || window.Brand?.get('results.leadButton', 'Följ valet') || 'Följ valet';
      }
    }
  });
}

function getShareUrl() {
  const url = new URL(window.location.href);
  url.pathname = url.pathname.replace(/[^/]*$/, 'results.html');
  url.search = '';
  url.hash = '';
  const compactResult = {
    v: 1,
    top_party: result.top_party,
    ranking: result.ranking.map(p => ({
      id: p.id,
      score: sanitizeScore(p.score)
    }))
  };
  if (result.user_dimensions) compactResult.user_dimensions = sanitizeDimensions(result.user_dimensions);
  if (Array.isArray(result.priority_areas)) compactResult.priority_areas = result.priority_areas.slice(0, 4);
  url.searchParams.set('result', JSON.stringify(compactResult));
  return url.toString();
}

function shareTwitter() {
  const top = result.ranking[0];
  const electionLabel = window.Brand?.get('brand.electionLabel', 'Valkompass 2026') || 'Valkompass 2026';
  const text = encodeURIComponent(`Jag matchar med ${top.name} (${top.score}%) i ${electionLabel}. Ta reda på vilket parti du matchar med.`);
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(getShareUrl())}`);
}

function shareFacebook() {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`);
}

async function writeTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fall through to the legacy copy path.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand('copy');
  } catch (e) {
    return false;
  } finally {
    textarea.remove();
  }
}

async function copyLink() {
  const copied = await writeTextToClipboard(getShareUrl());
  showToast(copied
    ? (window.Brand?.get('results.copiedText', 'Länk kopierad') || 'Länk kopierad')
    : 'Kunde inte kopiera länken');
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawRoundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function fillRoundRect(ctx, x, y, width, height, radius, fillStyle) {
  drawRoundRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function strokeRoundRect(ctx, x, y, width, height, radius, strokeStyle, lineWidth = 1) {
  drawRoundRect(ctx, x, y, width, height, radius);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let line = '';

  words.forEach(word => {
    const nextLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  });
  if (line) lines.push(line);

  lines.slice(0, maxLines).forEach((lineText, index) => {
    const clipped = index === maxLines - 1 && lines.length > maxLines;
    ctx.fillText(clipped ? `${lineText.replace(/\W?\w+$/, '')}...` : lineText, x, y + index * lineHeight);
  });
}

function getPartyLogoPath(partyId) {
  return PARTY_LOGOS[String(partyId || '').toUpperCase()] || '';
}

function loadImage(src) {
  return new Promise(resolve => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadCardLogos(ranking) {
  const entries = await Promise.all(
    ranking.slice(0, 3).map(async party => [party.id, await loadImage(getPartyLogoPath(party.id))])
  );
  return Object.fromEntries(entries);
}

function drawImageContain(ctx, image, x, y, width, height) {
  if (!image) return false;
  const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  return true;
}

function truncateForCanvas(ctx, value, maxWidth) {
  const textValue = String(value || '');
  if (ctx.measureText(textValue).width <= maxWidth) return textValue;
  let output = textValue;
  while (output.length > 1 && ctx.measureText(`${output}...`).width > maxWidth) {
    output = output.slice(0, -1);
  }
  return `${output.trim()}...`;
}

function drawSocialCard(canvas, logoImages = {}) {
  const ctx = canvas.getContext('2d');
  const config = window.Brand?.config || {};
  const theme = config.theme || {};
  const top = result.ranking[0];
  const top3 = result.ranking.slice(0, 3);
  const red = theme.redBloc || '#D83B36';
  const blue = theme.blueBloc || '#3C4E82';
  const bg = theme.background || '#F6F8FB';
  const surface = theme.surface || '#FFFFFF';
  const text = theme.text || '#16150F';
  const muted = theme.muted || '#6B6860';
  const partyColor = sanitizeHexColor(top.color);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const wash = ctx.createLinearGradient(0, 0, canvas.width, 0);
  wash.addColorStop(0, hexToRgba(red, 0.12));
  wash.addColorStop(0.5, 'rgba(255,255,255,0)');
  wash.addColorStop(1, hexToRgba(blue, 0.12));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = red;
  ctx.fillRect(0, 0, canvas.width / 2, 10);
  ctx.fillStyle = blue;
  ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, 10);

  fillRoundRect(ctx, 60, 54, 1080, 522, 28, surface);
  strokeRoundRect(ctx, 60, 54, 1080, 522, 28, 'rgba(18,20,31,0.10)', 2);

  ctx.save();
  drawRoundRect(ctx, 60, 54, 1080, 522, 28);
  ctx.clip();

  ctx.font = '800 25px "IBM Plex Sans", sans-serif';
  ctx.fillStyle = text;
  ctx.fillText(config.brand?.productName || 'Valkompass', 118, 116);
  ctx.font = '700 18px "IBM Plex Sans", sans-serif';
  ctx.fillStyle = muted;
  ctx.fillText(config.results?.socialCardKicker || config.brand?.electionLabel || 'Mitt resultat', 118, 148);

  fillRoundRect(ctx, 960, 86, 92, 46, 23, hexToRgba(red, 0.10));
  fillRoundRect(ctx, 1048, 86, 92, 46, 23, hexToRgba(blue, 0.10));
  ctx.fillStyle = red;
  ctx.fillRect(982, 106, 48, 6);
  ctx.fillStyle = blue;
  ctx.fillRect(1070, 106, 48, 6);

  ctx.font = '900 47px "Source Serif 4", Georgia, serif';
  ctx.fillStyle = text;
  drawWrappedText(ctx, `Jag matchar med ${top.name}`, 118, 205, 620, 52, 2);

  fillRoundRect(ctx, 118, 290, 154, 118, 22, hexToRgba(partyColor, 0.12));
  strokeRoundRect(ctx, 118, 290, 154, 118, 22, hexToRgba(partyColor, 0.18), 2);
  const hasTopLogo = drawImageContain(ctx, logoImages[top.id], 146, 310, 98, 78);
  if (!hasTopLogo) {
    fillRoundRect(ctx, 118, 290, 154, 118, 22, partyColor);
    ctx.fillStyle = getPartyTextColor(partyColor);
    ctx.font = '900 46px "IBM Plex Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(top.id, 195, 362);
    ctx.textAlign = 'left';
  }

  ctx.font = '900 92px "Source Serif 4", Georgia, serif';
  ctx.fillStyle = partyColor;
  ctx.fillText(`${sanitizeScore(top.score)}%`, 306, 365);
  ctx.font = '800 22px "IBM Plex Sans", sans-serif';
  ctx.fillStyle = muted;
  drawWrappedText(ctx, top.tagline, 310, 396, 420, 30, 2);

  ctx.font = '900 22px "IBM Plex Sans", sans-serif';
  ctx.fillStyle = text;
  ctx.fillText('Topp 3', 790, 205);
  top3.forEach((party, index) => {
    const y = 236 + index * 66;
    const color = sanitizeHexColor(party.color);
    ctx.font = '900 18px "IBM Plex Sans", sans-serif';
    ctx.fillStyle = muted;
    ctx.fillText(`${index + 1}`, 790, y + 30);

    fillRoundRect(ctx, 828, y, 46, 46, 13, hexToRgba(color, 0.14));
    const hasLogo = drawImageContain(ctx, logoImages[party.id], 836, y + 7, 30, 32);
    if (!hasLogo) {
      fillRoundRect(ctx, 828, y, 46, 46, 13, color);
      ctx.fillStyle = getPartyTextColor(color);
      ctx.font = '900 14px "IBM Plex Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(party.id, 851, y + 29);
      ctx.textAlign = 'left';
    }

    ctx.fillStyle = text;
    ctx.font = '900 19px "IBM Plex Sans", sans-serif';
    ctx.fillText(truncateForCanvas(ctx, party.name, 190), 892, y + 18);
    fillRoundRect(ctx, 892, y + 31, 184, 8, 4, 'rgba(18,20,31,0.10)');
    fillRoundRect(ctx, 892, y + 31, 184 * sanitizeScore(party.score) / 100, 8, 4, color);
    ctx.fillStyle = text;
    ctx.font = '900 20px "IBM Plex Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${sanitizeScore(party.score)}%`, 1110, y + 29);
    ctx.textAlign = 'left';
  });

  const profile = buildPoliticalProfile(top);
  if (profile?.title) {
    ctx.font = '900 21px "IBM Plex Sans", sans-serif';
    ctx.fillStyle = text;
    ctx.fillText('Politisk profil', 118, 486);

    ctx.font = '900 32px "Source Serif 4", Georgia, serif';
    ctx.fillStyle = text;
    drawWrappedText(ctx, profile.title, 118, 525, 620, 34, 2);

    let chipX = 770;
    const chipY = 488;
    profile.chips.slice(0, 2).forEach(chip => {
      const chipText = truncateForCanvas(ctx, chip, 142);
      ctx.font = '800 14px "IBM Plex Sans", sans-serif';
      const width = Math.min(ctx.measureText(chipText).width + 24, 168);
      fillRoundRect(ctx, chipX, chipY, width, 34, 17, hexToRgba(partyColor, 0.10));
      strokeRoundRect(ctx, chipX, chipY, width, 34, 17, hexToRgba(partyColor, 0.18), 1);
      ctx.fillStyle = text;
      ctx.fillText(chipText, chipX + 12, chipY + 22);
      chipX += width + 9;
    });
  }

  ctx.restore();
}

async function createResultImageBlob() {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const logoImages = await loadCardLogos(result.ranking);
  drawSocialCard(canvas, logoImages);
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.96));
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function shareResultImage() {
  const button = document.querySelector('.btn-share-image');
  const originalText = button?.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = 'Skapar...';
  }

  try {
    const blob = await createResultImageBlob();
    const file = new File([blob], 'valkompass-resultat.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `${window.Brand?.get('brand.electionLabel', 'Valkompass 2026')} - mitt resultat`,
        text: `Jag matchar med ${result.ranking[0].name} (${result.ranking[0].score}%).`
      });
    } else {
      downloadBlob(blob, 'valkompass-resultat.png');
      showToast('Resultatbild sparad');
    }
  } catch (e) {
    showToast('Kunde inte skapa bilden');
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalText || window.Brand?.get('results.imageButton', 'Bild') || 'Bild';
    }
  }
}

function showToast(message) {
  let toast = document.getElementById('ui-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ui-toast';
    toast.className = 'ui-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 2200);
}

if (isValidResult(result)) {
  (window.Brand?.ready || Promise.resolve()).finally(init);
}
