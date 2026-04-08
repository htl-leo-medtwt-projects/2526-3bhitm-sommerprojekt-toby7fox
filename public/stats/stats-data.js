const LEVELS = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];

// Thresholds are % of bodyweight.
// For bodyweight exercises (bw: true), the % applies to the ADDITIONAL weight.
// 1RM for bw exercises: total = (bodyWeight + additional) * epley, then subtract bodyWeight.
const EXERCISES = [
  // Powerlifting
  { name: 'Squat',      bw: false, male: [75, 115, 150, 200, 250], female: [55,  80, 105, 145, 185] },
  { name: 'Bench Press',bw: false, male: [50,  75, 105, 140, 175], female: [35,  50,  70,  95, 120] },
  { name: 'Deadlift',   bw: false, male: [85, 130, 170, 220, 270], female: [65,  95, 125, 160, 200] },
  // Streetlifting
  { name: 'Pull-ups',   bw: true,  male: [ 0,  20,  50,  80, 100], female: [ 0,  10,  30,  55,  75] },
  { name: 'Dips',       bw: true,  male: [ 0,  30,  65, 100, 130], female: [ 0,  15,  40,  65,  90] },
  { name: 'Muscle-up',  bw: true,  male: [ 0,  10,  30,  55,  75], female: [ 0,   5,  15,  30,  50] },
];

const COLORS = {
  Elite: '#FFD88F', Advanced: '#FF8F8F', Intermediate: '#E97DFF',
  Novice: '#7DD8FF', Beginner: '#8FFF93', none: '#333'
};

let userData    = { bodyWeight: 70, sex: 'male' };
let entryData   = {};   // exercise name → { weight, reps, date }
let exerciseIds = {};   // exercise name → DB exercise_ID

// --- 1RM & level logic ---

function epley(weight, reps) {
  return reps > 1 ? weight * (1 + reps / 30) : weight;
}

function effective1RM(ex, weight, reps, bw) {
  if (ex.bw) {
    const total1RM = epley(bw + weight, reps);
    return Math.max(0, total1RM - bw);
  }
  return epley(weight, reps);
}

function thresholds(ex, sex, bw) {
  const pcts = sex === 'male' ? ex.male : ex.female;
  return pcts.map(p => Math.round(p * bw / 100 * 2) / 2);
}

function levelInfo(ex, eff1RM, sex, bw) {
  const th = thresholds(ex, sex, bw);
  let li = -1;
  for (let i = 0; i < th.length; i++) {
    if (eff1RM >= th[i]) li = i; else break;
  }
  const curTh  = li >= 0 ? th[li] : 0;
  const nextTh = li < 4  ? th[li + 1] : th[4];
  const range  = nextTh - curTh;
  const prog   = li === 4 ? 1 : (range > 0 ? Math.min(1, (eff1RM - curTh) / range) : 0);
  return { li, level: li >= 0 ? LEVELS[li] : null, nextTh, prog };
}

// --- Rendering ---

function fmt(n) { return n % 1 === 0 ? String(n) : n.toFixed(1); }

function iconHTML(lvl) {
  switch (lvl) {
    case 'Elite':        return '<div class="icon-star"></div>';
    case 'Advanced':     return '<div class="icon-diamond"></div>';
    case 'Intermediate': return '<div class="icon-triangle-down"></div>';
    case 'Novice':       return '<div class="icon-square"></div>';
    case 'Beginner':     return '<div class="icon-circle"></div>';
    default:             return '<div class="icon-circle icon-unranked"></div>';
  }
}

function render() {
  const bw  = userData.bodyWeight;
  const sex = userData.sex;

  const computed = EXERCISES.map(ex => {
    const entry  = entryData[ex.name];
    const entBW  = entry?.bodyWeight || bw;
    const eff    = entry ? effective1RM(ex, entry.weight, entry.reps, entBW) : 0;
    const inf    = levelInfo(ex, eff, sex, entBW);
    if (!entry) { inf.li = 0; inf.level = 'Beginner'; inf.prog = 0; }
    return { ex, entry, eff, inf };
  });

  computed.sort((a, b) =>
    b.inf.li !== a.inf.li ? b.inf.li - a.inf.li : b.inf.prog - a.inf.prog
  );

  document.getElementById('exerciseList').innerHTML = computed.map(({ ex, entry, eff, inf }) => {
    const lvl  = inf.level || 'none';
    const cls  = lvl.toLowerCase();
    const pct  = Math.round(inf.prog * 100);
    const c    = COLORS[lvl] || COLORS.none;
    const fill = `repeating-linear-gradient(90deg,${c} 0,${c} 1.2vh,transparent 5px,transparent 2vh)`;
    const glow = `drop-shadow(0 0 0.5px ${c}) drop-shadow(0 0 0.5px ${c})`;
    const cur  = entry ? fmt(eff) : '---';
    const next = fmt(inf.nextTh);

    return `
      <div class="exercise-card" onclick="openModal('${ex.name}')">
        <div class="lvl-icon lvl-icon-${cls}">${iconHTML(inf.level)}</div>
        <div class="bar">
          <div class="ex-name">${ex.name}</div>
          <div class="bar-and-level">
            <div class="progress-bar">
              <div class="progress-fill" style="width:${pct}%;background:${fill};filter:${glow}"></div>
              <div class="weight-txt">${cur} | ${next}kg</div>
            </div>
            <div class="lvl-label lvl-${cls}">${inf.level || '---'}</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

// --- Bootstrap ---

async function loadData() {
  const res   = await fetch('../../api/entries.php');
  const data  = await res.json();
  userData    = { bodyWeight: data.bodyWeight, sex: data.sex };
  entryData   = data.entries    || {};
  exerciseIds = data.exerciseIds || {};
  render();
}

loadData();
