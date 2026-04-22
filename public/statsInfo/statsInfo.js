const LEVELS = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];

const EXERCISES = [
  { name: 'Squat',      bw: false, male: [75,115,150,200,250], female: [55, 80,105,145,185] },
  { name: 'Bench Press',bw: false, male: [50, 75,105,140,175], female: [35, 50, 70, 95,120] },
  { name: 'Deadlift',   bw: false, male: [85,130,170,220,270], female: [65, 95,125,160,200] },
  { name: 'Pull-ups',   bw: true,  male: [ 0, 20, 50, 80,100], female: [ 0, 10, 30, 55, 75] },
  { name: 'Dips',       bw: true,  male: [ 0, 30, 65,100,130], female: [ 0, 15, 40, 65, 90] },
  { name: 'Muscle-up',  bw: true,  male: [ 0, 10, 30, 55, 75], female: [ 0,  5, 15, 30, 50] },
];

const COLORS = {
  Elite: '#ffd700', Advanced: '#ff8888', Intermediate: '#cc44ff',
  Novice: '#66ccff', Beginner: '#44ff88', none: '#333'
};

// Read exercise name from URL
const exName = new URLSearchParams(location.search).get('exercise') || '';
const ex     = EXERCISES.find(e => e.name === exName);

let userData   = { bodyWeight: 70, sex: 'male' };
let exerciseId = null;
let allEntries = [];
let period     = 'day';
let chart      = null;
let editTarget = null;

// ── Calculation helpers ──────────────────────────────────────────────────────

function epley(w, r) { return r > 1 ? w * (1 + r / 30) : w; }

function eff1RM(weight, reps, bw) {
  if (ex.bw) return Math.max(0, epley(bw + weight, reps) - bw);
  return epley(weight, reps);
}

function getThresholds(sex, bw) {
  const pcts = sex === 'male' ? ex.male : ex.female;
  return pcts.map(p => Math.round(p * bw / 100 * 2) / 2);
}

function levelInfo(eff, sex, bw) {
  const th = getThresholds(sex, bw);
  let li = -1;
  for (let i = 0; i < th.length; i++) { if (eff >= th[i]) li = i; else break; }
  const curTh  = li >= 0 ? th[li] : 0;
  const nextTh = li < 4 ? th[li + 1] : th[4];
  const range  = nextTh - curTh;
  const prog   = li === 4 ? 1 : (range > 0 ? Math.min(1, (eff - curTh) / range) : 0);
  return { li, level: li >= 0 ? LEVELS[li] : null, nextTh, prog };
}

function fmt(n) { return n % 1 === 0 ? String(n) : n.toFixed(1); }

function iconHTML(lvl) {
  switch (lvl) {
    case 'Elite':        return '<div class="icon-star"></div>';
    case 'Advanced':     return '<div class="icon-diamond"></div>';
    case 'Intermediate': return '<div class="icon-triangle-down"></div>';
    case 'Novice':       return '<div class="icon-square"></div>';
    default:             return '<div class="icon-circle"></div>';
  }
}

// ── Exercise card ────────────────────────────────────────────────────────────

function renderCard() {
  const latest = allEntries.at(-1);
  const bw     = latest?.bodyWeight || userData.bodyWeight;
  const eff    = latest ? eff1RM(latest.weight, latest.reps, bw) : 0;
  const inf    = levelInfo(eff, userData.sex, bw);
  if (!latest) { inf.li = 0; inf.level = 'Beginner'; inf.prog = 0; }

  const lvl  = inf.level || 'none';
  const cls  = lvl.toLowerCase();
  const pct  = Math.round(inf.prog * 100);
  const c    = COLORS[lvl] || COLORS.none;
  const fill = `repeating-linear-gradient(90deg,${c} 0,${c} 8px,transparent 8px,transparent 13px)`;
  const glow = `drop-shadow(0 0 4px ${c}) drop-shadow(0 0 10px ${c})`;
  const cur        = latest ? fmt(eff) : '---';
  const nextLvlIdx = Math.min(Math.max(inf.li + 1, 0), 4);
  const nextLvl    = LEVELS[nextLvlIdx];
  const nextLvlCls = nextLvl.toLowerCase();

  document.getElementById('exerciseCard').innerHTML = `
    <div class="exercise-card">
      <div class="lvl-icon lvl-icon-${cls}">${iconHTML(inf.level)}</div>
      <div class="bar">
        <div class="ex-name">${ex.name}</div>
        <div class="bar-and-level">
          <div class="progress-bar">
            <div class="progress-fill" style="width:${pct}%;background:${fill};filter:${glow}"></div>
            <div class="weight-txt">${cur} | ${fmt(inf.nextTh)}kg</div>
            <div class="next-lvl-icon lvl-icon-${nextLvlCls}">${iconHTML(nextLvl)}</div>
          </div>
          <div class="lvl-label lvl-${cls}">${inf.level || '---'}</div>
        </div>
      </div>
    </div>`;
}

// ── Time grouping ────────────────────────────────────────────────────────────

function periodKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  if (period === 'day')   return dateStr;
  if (period === 'month') return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  if (period === 'year')  return `${d.getFullYear()}`;
  if (period === 'week') {
    const tmp = new Date(d);
    tmp.setDate(tmp.getDate() + 3 - (tmp.getDay() + 6) % 7);
    const jan4 = new Date(tmp.getFullYear(), 0, 4);
    const wk   = 1 + Math.round(((tmp - jan4) / 86400000 - 3 + (jan4.getDay() + 6) % 7) / 7);
    return `${tmp.getFullYear()}-W${String(wk).padStart(2,'0')}`;
  }
  return dateStr;
}

function groupedPoints() {
  const groups = {};
  allEntries.forEach(e => {
    const key = periodKey(e.date);
    const bw  = e.bodyWeight || userData.bodyWeight;
    const eff = eff1RM(e.weight, e.reps, bw);
    if (!groups[key] || eff > groups[key].eff) {
      groups[key] = { ...e, eff, key };
    }
  });
  return Object.values(groups).sort((a, b) => a.key.localeCompare(b.key));
}

// ── Chart ────────────────────────────────────────────────────────────────────

function renderChart() {
  const points = groupedPoints();

  if (chart) chart.destroy();

  if (points.length === 0) {
    // Draw empty chart with a placeholder label
    chart = new Chart(document.getElementById('progressChart'), {
      type: 'line',
      data: { labels: ['no data'], datasets: [{ data: [0], borderColor: '#333', pointRadius: 0 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#555', font: { family: "'Press Start 2P'", size: 7 } }, grid: { color: '#1a1a1a' } },
          y: { ticks: { color: '#555', font: { family: "'Press Start 2P'", size: 7 }, callback: v => v + 'kg' }, grid: { color: '#1a1a1a' } }
        }
      }
    });
    return;
  }

  const labels = points.map(p => p.key);
  const values = points.map(p => parseFloat(p.eff.toFixed(1)));

  chart = new Chart(document.getElementById('progressChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: '#ff3fa4',
        backgroundColor: '#ff3fa411',
        pointBackgroundColor: '#ff3fa4',
        pointBorderColor: '#ff3fa4',
        pointRadius: 6,
        pointHoverRadius: 9,
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (_evt, elements) => {
        if (elements.length > 0) openEditModal(points[elements[0].index]);
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => `${ctx.parsed.y}kg` },
          bodyFont:  { family: "'Press Start 2P'", size: 8 },
          titleFont: { family: "'Press Start 2P'", size: 8 },
          backgroundColor: '#111',
          borderColor: '#ff3fa4',
          borderWidth: 1,
        }
      },
      scales: {
        x: {
          ticks: { color: '#888', font: { family: "'Press Start 2P'", size: 7 }, maxRotation: 0 },
          grid:  { color: '#ff3fa411' },
        },
        y: {
          ticks: { color: '#888', font: { family: "'Press Start 2P'", size: 7 }, callback: v => v + 'kg' },
          grid:  { color: '#ff3fa422' },
        }
      }
    }
  });
}

// ── Add entry modal ──────────────────────────────────────────────────────────

function openAddModal() {
  document.getElementById('addWeight').value = '';
  document.getElementById('addReps').value   = '';
  document.getElementById('addModal').classList.add('open');
  setTimeout(() => document.getElementById('addWeight').focus(), 50);
}

function closeAddModal() {
  document.getElementById('addModal').classList.remove('open');
}

async function saveNewEntry() {
  const w = parseFloat(document.getElementById('addWeight').value);
  const r = parseInt(document.getElementById('addReps').value, 10);
  if (isNaN(w) || w < 0 || isNaN(r) || r < 1 || !exerciseId) return;

  const res = await fetch('../../api/entries.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exercise_id: exerciseId, weight: w, reps: r }),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok || result.error) {
    console.error('Save failed:', result.error || res.status);
    alert('Save failed: ' + (result.error || res.status));
    return;
  }

  closeAddModal();
  await loadEntries();
  renderCard();
  renderChart();
}

document.getElementById('addModal').addEventListener('click', e => { if (e.target.id === 'addModal') closeAddModal(); });
document.getElementById('addReps').addEventListener('keydown',   e => { if (e.key === 'Enter') saveNewEntry(); if (e.key === 'Escape') closeAddModal(); });
document.getElementById('addWeight').addEventListener('keydown', e => { if (e.key === 'Escape') closeAddModal(); });

// ── Edit / Delete modal ──────────────────────────────────────────────────────

function openEditModal(point) {
  editTarget = point;
  document.getElementById('editModalDate').textContent = point.date;
  document.getElementById('editWeight').value = point.weight;
  document.getElementById('editReps').value   = point.reps;
  document.getElementById('editModal').classList.add('open');
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('open');
  editTarget = null;
}

async function saveEdit() {
  if (!editTarget || !exerciseId) return;
  const w = parseFloat(document.getElementById('editWeight').value);
  const r = parseInt(document.getElementById('editReps').value, 10);
  if (isNaN(w) || w < 0 || isNaN(r) || r < 1) return;

  await fetch('../../api/entry.php', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exercise_id: exerciseId, date: editTarget.date, weight: w, reps: r }),
  });

  closeEditModal();
  await loadEntries();
  renderCard();
  renderChart();
}

async function deleteEntry() {
  if (!editTarget || !exerciseId) return;

  await fetch('../../api/entry.php', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exercise_id: exerciseId, date: editTarget.date }),
  });

  closeEditModal();
  await loadEntries();
  renderCard();
  renderChart();
}

document.getElementById('editModal').addEventListener('click', e => { if (e.target.id === 'editModal') closeEditModal(); });

// ── Period buttons ───────────────────────────────────────────────────────────

document.querySelectorAll('.period-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    period = btn.dataset.period;
    renderChart();
  });
});

// ── Init ─────────────────────────────────────────────────────────────────────

async function loadEntries() {
  const res = await fetch(`../../api/entry.php?exercise=${encodeURIComponent(exName)}`);
  if (!res.ok) { console.error('entry.php error', await res.text()); return; }
  allEntries = await res.json();
  if (!Array.isArray(allEntries)) { console.error('Unexpected response', allEntries); allEntries = []; }
}

async function init() {
  if (!ex) {
    document.getElementById('exerciseCard').innerHTML = '<p style="color:#ff4444;padding:20px;font-size:8px">Unknown exercise.</p>';
    return;
  }

  const res  = await fetch('../../api/entries.php');
  if (!res.ok) { console.error('entries.php error', await res.text()); return; }
  const data = await res.json();

  userData   = { bodyWeight: data.bodyWeight || 70, sex: data.sex || 'male' };
  exerciseId = data.exerciseIds?.[exName];

  if (!exerciseId) {
    console.error('exerciseId not found for', exName, data.exerciseIds);
    document.getElementById('exerciseCard').innerHTML = '<p style="color:#ff4444;padding:20px;font-size:8px">Exercise not found in DB.</p>';
    return;
  }

  await loadEntries();
  renderCard();
  renderChart();
}

init();
