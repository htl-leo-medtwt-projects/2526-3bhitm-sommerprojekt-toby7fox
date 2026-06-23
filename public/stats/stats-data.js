// ── Konstanten ────────────────────────────────────────────────────────────────

// Die 5 möglichen Level-Namen (von schwach bis stark)
const levels = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];

// Alle 6 Übungen mit ihren Level-Schwellenwerten (in % vom Körpergewicht)
// bw: true = Körpergewicht zählt zur Last dazu (z.B. bei Klimmzügen)
const exercises = [
  { name: 'Squat',       bw: false, male: [75, 115, 150, 200, 250], female: [55,  80, 105, 145, 185] },
  { name: 'Bench Press', bw: false, male: [50,  75, 105, 140, 175], female: [35,  50,  70,  95, 120] },
  { name: 'Deadlift',    bw: false, male: [85, 130, 170, 220, 270], female: [65,  95, 125, 160, 200] },
  { name: 'Pull-ups',    bw: true,  male: [ 0,  20,  50,  80, 100], female: [ 0,  10,  30,  55,  75] },
  { name: 'Dips',        bw: true,  male: [ 0,  30,  65, 100, 130], female: [ 0,  15,  40,  65,  90] },
  { name: 'Muscle-up',   bw: true,  male: [ 0,  10,  30,  55,  75], female: [ 0,   5,  15,  30,  50] },
];

// Farben pro Level für die Progress-Bar
const colors = {
  Elite: '#FFD88F', Advanced: '#FF8F8F', Intermediate: '#E97DFF',
  Novice: '#7DD8FF', Beginner: '#8FFF93', none: '#333'
};

// Globale Variablen (werden beim Laden vom Server befüllt)
let userData            = { bodyWeight: 70, sex: 'male' };
let entryData           = {};
let exerciseIdentifiers = {};

// ── 1. Daten laden ────────────────────────────────────────────────────────────

// Holt alle Einträge vom Server und zeigt danach die Stats-Seite an.
async function loadData() {
  const res  = await fetch('../../api/entries.php');
  const data = await res.json();
  userData            = { bodyWeight: data.bodyWeight, sex: data.sex };
  entryData           = data.entries || {};
  exerciseIdentifiers = data.exerciseIds || {};
  render();
}

// ── 2. Seite rendern ──────────────────────────────────────────────────────────

// Berechnet für jede Übung den aktuellen Level und zeigt alle Karten sortiert an.
function render() {
  const bodyWeight = userData.bodyWeight;
  const sex        = userData.sex;

  // Für jede Übung Level und Fortschritt berechnen und in einem Array sammeln
  const computed = [];
  for (let i = 0; i < exercises.length; i++) {
    const exercise        = exercises[i];
    const entry           = entryData[exercise.name];
    const entryBodyWeight = entry ? (entry.bodyWeight || bodyWeight) : bodyWeight;
    const effective       = entry ? effectiveOneRepMax(exercise, entry.weight, entry.reps, entryBodyWeight) : 0;
    const levelData       = levelInformation(exercise, effective, sex, entryBodyWeight);
    if (!entry) {
      levelData.li       = 0;
      levelData.level    = 'Beginner';
      levelData.progress = 0;
    }
    computed.push({ exercise, entry, effective, levelData });
  }

  // Sortieren: höherer Level zuerst; bei Gleichstand mehr Fortschritt zuerst
  computed.sort(function(a, b) {
    if (b.levelData.li !== a.levelData.li) return b.levelData.li - a.levelData.li;
    return b.levelData.progress - a.levelData.progress;
  });

  // HTML für jede Übungskarte zusammenbauen
  let html = '';
  for (let i = 0; i < computed.length; i++) {
    const exercise  = computed[i].exercise;
    const entry     = computed[i].entry;
    const effective = computed[i].effective;
    const levelData = computed[i].levelData;

    const level      = levelData.level || 'none';
    const cssClass   = level.toLowerCase();
    const percentage = Math.round(levelData.progress * 100);
    const color      = colors[level] || colors.none;
    const fill       = `repeating-linear-gradient(90deg,${color} 0,${color} 8px,transparent 8px,transparent 13px)`;
    const glow       = `drop-shadow(0 0 4px ${color}) drop-shadow(0 0 10px ${color})`;
    const current    = entry ? format(effective) : '---';
    const next       = format(levelData.nextThreshold);

    html += `
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
  }

  document.getElementById('exerciseList').innerHTML = html;
}

// ── 3. Hilfsfunktionen (werden von render() verwendet) ────────────────────────

// Berechnet den geschätzten 1-Wiederholungs-Max (1RM) für eine Übung.
// Bei Körpergewichts-Übungen (bw: true) wird das Körpergewicht eingerechnet.
function effectiveOneRepMax(exercise, weight, repetitions, bodyWeight) {
  if (exercise.bw) {
    const totalOneRepMax = epley(bodyWeight + weight, repetitions);
    return Math.max(0, totalOneRepMax - bodyWeight);
  }
  return epley(weight, repetitions);
}

// Epley-Formel: schätzt das 1RM aus Gewicht und Wiederholungszahl.
function epley(weight, repetitions) {
  return repetitions > 1 ? weight * (1 + repetitions / 30) : weight;
}

// Gibt zurück auf welchem Level jemand ist und wie weit er zum nächsten Level ist.
function levelInformation(exercise, effectiveMax, sex, bodyWeight) {
  const thresholdValues = thresholds(exercise, sex, bodyWeight);
  let levelIndex = -1;
  for (let i = 0; i < thresholdValues.length; i++) {
    if (effectiveMax >= thresholdValues[i]) levelIndex = i;
    else break;
  }
  const currentThreshold = levelIndex >= 0 ? thresholdValues[levelIndex] : 0;
  const nextThreshold    = levelIndex < 4  ? thresholdValues[levelIndex + 1] : thresholdValues[4];
  const range            = nextThreshold - currentThreshold;
  const progress         = levelIndex === 4 ? 1 : (range > 0 ? Math.min(1, (effectiveMax - currentThreshold) / range) : 0);
  return { li: levelIndex, level: levelIndex >= 0 ? levels[levelIndex] : null, nextThreshold, progress };
}

// Rechnet die prozentualen Schwellenwerte in echte Kilogramm-Werte um.
function thresholds(exercise, sex, bodyWeight) {
  const percentages = sex === 'male' ? exercise.male : exercise.female;
  const result = [];
  for (let i = 0; i < percentages.length; i++) {
    const kilogram = percentages[i] * bodyWeight / 100;
    result.push(Math.round(kilogram * 2) / 2);
  }
  return result;
}

// Gibt das passende Icon-HTML für einen Level-Namen zurück.
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

// Formatiert eine Zahl: ohne Dezimalstelle wenn ganzzahlig, sonst 1 Nachkommastelle.
function format(number) {
  return number % 1 === 0 ? String(number) : number.toFixed(1);
}

// ── Start ─────────────────────────────────────────────────────────────────────
loadData();
