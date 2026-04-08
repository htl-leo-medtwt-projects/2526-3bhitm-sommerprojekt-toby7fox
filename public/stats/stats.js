const BW = 70;
const LEVELS = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];

const exercises = [
  // Powerlifting
  { id: 'squat',      name: 'Kniebeuge',    t: [75, 115, 150, 200, 250] },
  { id: 'bench',      name: 'Bankdrücken',  t: [50,  75, 105, 140, 175] },
  { id: 'deadlift',   name: 'Kreuzheben',   t: [85, 130, 170, 220, 270] },
  { id: 'pl_total',   name: 'PL Total',     t: [210, 320, 425, 560, 695] },
  // Gewichtheben
  { id: 'snatch',     name: 'Reißen',       t: [50,  75, 100, 130, 165] },
  { id: 'cj',         name: 'Clean & Jerk', t: [65,  95, 125, 160, 200] },
  { id: 'wl_total',   name: 'WL Total',     t: [115, 170, 225, 290, 365] },
  // Streetlifting
  { id: 'pullup',     name: 'Klimmzüge',    t: [0,  20,  50,  80, 100] },
  { id: 'dip',        name: 'Dips',         t: [0,  30,  65, 100, 130] },
  { id: 'muscleup',   name: 'Muscle-Up',    t: [0,  10,  30,  55,  75] },
  // Strongman
  { id: 'farmers',    name: 'Farmers Walk', t: [50,  75, 100, 130, 175] },
  { id: 'logpress',   name: 'Log Press',    t: [50,  75, 100, 130, 165] },
  { id: 'yoke',       name: 'Yoke Walk',    t: [150, 225, 300, 400, 500] },
  { id: 'atlas',      name: 'Atlas Stones', t: [75, 110, 150, 200, 250] },
  // Nische
  { id: 'strictcurl', name: 'Strict Curl',  t: [25,  40,  55,  70,  85] },
  { id: 'scottcurl',  name: 'Scott Curl',   t: [20,  35,  50,  65,  80] },
  { id: 'pushpress',  name: 'Push Press',   t: [45,  70,  95, 125, 155] },
  { id: 'frontsq',    name: 'Front Squat',  t: [50,  80, 110, 145, 180] },
  { id: 'ohsq',       name: 'OHS',          t: [30,  55,  85, 115, 145] },
  { id: 'clean',      name: 'Clean',        t: [55,  85, 115, 150, 185] },
  { id: 'backlift',   name: 'Back Lift',    t: [200, 400, 700, 1000, 1500] },
  { id: 'hiplift',    name: 'Hip Lift',     t: [300, 600, 1000, 1500, 2000] },
];

const COLORS = {
  Elite: '#ffd700', Advanced: '#ff9090', Intermediate: '#ffaa66',
  Novice: '#4499ee', Beginner: '#777', none: '#333'
};

let weights = {};
try { weights = JSON.parse(localStorage.getItem('nk_weights') || '{}'); } catch(e) {}

function thresholds(ex) {
  return ex.t.map(p => Math.round(p * BW / 100 * 2) / 2);
}

function levelInfo(ex, w) {
  const th = thresholds(ex);
  let li = -1;
  for (let i = 0; i < th.length; i++) {
    if (w >= th[i]) li = i; else break;
  }
  const curTh = li >= 0 ? th[li] : 0;
  const nextTh = li < 4 ? th[li + 1] : th[4];
  const range  = nextTh - curTh;
  const prog   = li === 4 ? 1 : (range > 0 ? Math.min(1, (w - curTh) / range) : (w >= curTh ? 1 : 0));
  return { li, level: li >= 0 ? LEVELS[li] : null, nextTh, prog };
}

function fmt(n) { return n % 1 === 0 ? n : n.toFixed(1); }

function iconHTML(lvl) {
  switch(lvl) {
    case 'Elite':        return '<span class="icon-star">★</span>';
    case 'Advanced':     return '<div class="icon-diamond"></div>';
    case 'Intermediate': return '<div class="icon-diamond icon-inter"></div>';
    case 'Novice':       return '<div class="icon-square"></div>';
    case 'Beginner':     return '<span class="icon-tri">▶</span>';
    default:             return '<span class="icon-tri">▶</span>';
  }
}

function render() {
  const sorted = [...exercises].sort((a, b) => {
    const ia = levelInfo(a, weights[a.id] || 0);
    const ib = levelInfo(b, weights[b.id] || 0);
    return ib.li !== ia.li ? ib.li - ia.li : ib.prog - ia.prog;
  });

  document.getElementById('exerciseList').innerHTML = sorted.map(ex => {
    const w   = weights[ex.id] || 0;
    const inf = levelInfo(ex, w);
    const lvl = inf.level || 'none';
    const cls = lvl.toLowerCase();
    const pct = Math.round(inf.prog * 100);
    const c   = COLORS[lvl] || COLORS.none;
    const fill = `repeating-linear-gradient(90deg,${c} 0,${c} 5px,transparent 5px,transparent 9px)`;

    return `
      <div class="exercise-card" onclick="openModal('${ex.id}')">
        <div class="lvl-icon">${iconHTML(inf.level)}</div>
        <div class="bar">
          <div class="ex-name">${ex.name}</div>
          <div class="bar-and-level">
            <div class="progress-bar">
              <div class="progress-fill" style="width:${pct}%;background:${fill}"></div>
              <div class="weight-txt">${fmt(w)} | ${fmt(inf.nextTh)}kg</div>
            </div>
            <div class="lvl-label lvl-${cls}">${inf.level || '---'}</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

let activeId = null;

function openModal(id) {
  activeId = id;
  const ex = exercises.find(e => e.id === id);
  document.getElementById('modalTitle').textContent = ex.name.toUpperCase();
  document.getElementById('modalInput').value = weights[id] || '';
  document.getElementById('modal').classList.add('open');
  setTimeout(() => document.getElementById('modalInput').select(), 50);
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  activeId = null;
}

function saveWeight() {
  const v = parseFloat(document.getElementById('modalInput').value);
  if (!isNaN(v) && v >= 0) {
    weights[activeId] = v;
    localStorage.setItem('nk_weights', JSON.stringify(weights));
    render();
  }
  closeModal();
}

document.getElementById('modalInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') saveWeight();
  if (e.key === 'Escape') closeModal();
});

document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});

render();