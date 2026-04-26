const API = 'http://localhost:5050/api';

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
    if (el) el.textContent = '1 200+';
  }
}

loadStats();
