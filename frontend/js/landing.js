const API = '/api';

async function loadStats() {
  try {
    const res = await fetch(`${API}/stats`);
    const data = await res.json();
    const el = document.getElementById('stat-total');
    if (el && data.total_completions !== undefined) {
      el.textContent = data.total_completions.toLocaleString('sv-SE');
    }
  } catch (e) {
    const el = document.getElementById('stat-total');
    if (el) el.textContent = window.Brand?.get('landing.fallbackCompletions', '1 200+') || '1 200+';
  }
}

(window.Brand?.ready || Promise.resolve()).finally(loadStats);
