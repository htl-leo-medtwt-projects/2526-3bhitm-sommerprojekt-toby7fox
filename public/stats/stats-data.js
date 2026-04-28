const levels = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];

const exercises = [
  // Powerlifting
  { name: 'Squat',      bw: false, male: [75, 115, 150, 200, 250], female: [55,  80, 105, 145, 185] },
  { name: 'Bench Press',bw: false, male: [50,  75, 105, 140, 175], female: [35,  50,  70,  95, 120] },
  { name: 'Deadlift',   bw: false, male: [85, 130, 170, 220, 270], female: [65,  95, 125, 160, 200] },
  // Streetlifting
  { name: 'Pull-ups',   bw: true,  male: [ 0,  20,  50,  80, 100], female: [ 0,  10,  30,  55,  75] },
  { name: 'Dips',       bw: true,  male: [ 0,  30,  65, 100, 130], female: [ 0,  15,  40,  65,  90] },
  { name: 'Muscle-up',  bw: true,  male: [ 0,  10,  30,  55,  75], female: [ 0,   5,  15,  30,  50] },
];

const colors = {
  Elite: '#FFD88F', Advanced: '#FF8F8F', Intermediate: '#E97DFF',
  Novice: '#7DD8FF', Beginner: '#8FFF93', none: '#333'
};

let userData = { bodyWeight: 70, sex: 'male' };
let entryData = {};
let exerciseIdentifiers = {};

// --- Bootstrap ---

async function loadData() {
  const res = await fetch('../../api/entries.php');
  const data = await res.json();
  userData = { bodyWeight: data.bodyWeight, sex: data.sex };
  entryData = data.entries || {};
  exerciseIdentifiers = data.exerciseIds || {};
  render();
}

// --- Rendering ---

function render() {
  const bodyWeight = userData.bodyWeight;
  const sex = userData.sex;

  const computed = exercises.map(exercise => {
    const entry = entryData[exercise.name];
    const entryBodyWeight = entry?.bodyWeight || bodyWeight;
    const effective = entry ? effectiveOneRepMax(exercise, entry.weight, entry.reps, entryBodyWeight) : 0;
    const levelData = levelInformation(exercise, effective, sex, entryBodyWeight);
    if (!entry) { levelData.li = 0; levelData.level = 'Beginner'; levelData.progress = 0; }
    return { exercise, entry, effective, levelData };
  });

  computed.sort((a, b) =>
    b.levelData.li !== a.levelData.li
      ? b.levelData.li - a.levelData.li
      : b.levelData.progress - a.levelData.progress
  );

  document.getElementById('exerciseList').innerHTML = computed.map(({ exercise, entry, effective, levelData }) => {
    const level = levelData.level || 'none';
    const cssClass = level.toLowerCase();
    const percentage = Math.round(levelData.progress * 100);
    const color = colors[level] || colors.none;
    const fill = `repeating-linear-gradient(90deg,${color} 0,${color} 8px,transparent 8px,transparent 13px)`;
    const glow = `drop-shadow(0 0 4px ${color}) drop-shadow(0 0 10px ${color})`;
    const current = entry ? format(effective) : '---';
    const next = format(levelData.nextThreshold);
    return `
      <div class="exercise-card" onclick="location.href='../statsInfo/statsInfo.php?exercise=${encodeURIComponent(exercise.name)}'">
        <div class="lvl-icon lvl-icon-${cssClass}">${iconHtml(levelData.level)}</div>
        <div class="bar">
          <div class="ex-name">${exercise.name}</div>
          <div class="bar-and-level">
            <div class="progress-bar">
              <div class="progress-fill" style="width:${percentage}%;background:${fill};filter:${glow}"></div>
              <div class="weight-txt">${current} | ${next}kg</div>
            </div>
            <div class="lvl-label lvl-${cssClass}">${levelData.level || '---'}</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function iconHtml(level) {
  switch (level) {
    case 'Elite':        return '<div class="icon-star"></div>';
    case 'Advanced':     return '<div class="icon-diamond"></div>';
    case 'Intermediate': return '<div class="icon-triangle-down"></div>';
    case 'Novice':       return '<div class="icon-square"></div>';
    case 'Beginner':     return '<div class="icon-circle"></div>';
    default:             return '<div class="icon-circle icon-unranked"></div>';
  }
}

function format(number) { return number % 1 === 0 ? String(number) : number.toFixed(1); }

// --- 1RM & level logic ---

function levelInformation(exercise, effectiveMax, sex, bodyWeight) {
  const thresholdValues = thresholds(exercise, sex, bodyWeight);
  let levelIndex = -1;
  for (let index = 0; index < thresholdValues.length; index++) {
    if (effectiveMax >= thresholdValues[index]) levelIndex = index; else break;
  }
  const currentThreshold = levelIndex >= 0 ? thresholdValues[levelIndex] : 0;
  const nextThreshold = levelIndex < 4 ? thresholdValues[levelIndex + 1] : thresholdValues[4];
  const range = nextThreshold - currentThreshold;
  const progress = levelIndex === 4 ? 1 : (range > 0 ? Math.min(1, (effectiveMax - currentThreshold) / range) : 0);
  return { li: levelIndex, level: levelIndex >= 0 ? levels[levelIndex] : null, nextThreshold, progress };
}

function thresholds(exercise, sex, bodyWeight) {
  const percentages = sex === 'male' ? exercise.male : exercise.female;
  const result = [];
  for (let index = 0; index < percentages.length; index++) {
    const kilogram = percentages[index] * bodyWeight / 100;
    result.push(Math.round(kilogram * 2) / 2);
  }
  return result;
}

function effectiveOneRepMax(exercise, weight, repetitions, bodyWeight) {
  if (exercise.bw) {
    const totalOneRepMax = epley(bodyWeight + weight, repetitions);
    return Math.max(0, totalOneRepMax - bodyWeight);
  }
  return epley(weight, repetitions);
}

function epley(weight, repetitions) {
  return repetitions > 1 ? weight * (1 + repetitions / 30) : weight;
}

loadData();
