// ── Konstanten ────────────────────────────────────────────────────────────────

// Die 5 Level-Namen für Kraft-Übungen (von schwach bis stark)
const LEVELS = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];

// Alle 6 Übungen mit Level-Schwellenwerten in % vom Körpergewicht
// bw: true = Körpergewicht zählt zur Last dazu (z.B. bei Klimmzügen)
const EXERCISES = [
  { name: 'Squat',       bw: false, male: [75, 115, 150, 200, 250], female: [55,  80, 105, 145, 185] },
  { name: 'Bench Press', bw: false, male: [50,  75, 105, 140, 175], female: [35,  50,  70,  95, 120] },
  { name: 'Deadlift',    bw: false, male: [85, 130, 170, 220, 270], female: [65,  95, 125, 160, 200] },
  { name: 'Pull-ups',    bw: true,  male: [ 0,  20,  50,  80, 100], female: [ 0,  10,  30,  55,  75] },
  { name: 'Dips',        bw: true,  male: [ 0,  30,  65, 100, 130], female: [ 0,  15,  40,  65,  90] },
  { name: 'Muscle-up',   bw: true,  male: [ 0,  10,  30,  55,  75], female: [ 0,   5,  15,  30,  50] },
];

// Farben pro Level für Chart und Icons
const COLORS = {
  Elite: '#ffd700', Advanced: '#ff8888', Intermediate: '#cc44ff',
  Novice: '#66ccff', Beginner: '#44ff88', none: '#333'
};

// Übungsname aus der URL lesen (z.B. ?exercise=Squat)
const exName = new URLSearchParams(location.search).get('exercise') || '';
const ex     = EXERCISES.find(function(e) { return e.name === exName; });

// Globale Variablen
let userData   = { bodyWeight: 70, sex: 'male' };
let exerciseId = null;   // Datenbank-ID der aktuellen Übung
let allEntries = [];     // Alle gespeicherten Einträge für diese Übung
let period     = 'day';  // Gewählter Zeitraum für den Chart
let chart      = null;   // Chart.js-Instanz (wird bei jedem Render ersetzt)
let editTarget = null;   // Der Eintrag der gerade bearbeitet wird

// ── 1. Initialisieren ─────────────────────────────────────────────────────────

// Startet die Seite: lädt Nutzerdaten und Einträge, zeigt Karte und Chart an.
async function init() {
  if (!ex) {
    document.getElementById('exerciseCard').innerHTML = '<p style="color:#ff4444;padding:20px;font-size:8px">Unknown exercise.</p>';
    return;
  }

  const res  = await fetch('../../api/entries.php');
  if (!res.ok) { console.error('entries.php error', await res.text()); return; }
  const data = await res.json();

  userData   = { bodyWeight: data.bodyWeight || 70, sex: data.sex || 'male' };
  exerciseId = data.exerciseIds ? data.exerciseIds[exName] : null;

  if (!exerciseId) {
    console.error('exerciseId not found for', exName);
    document.getElementById('exerciseCard').innerHTML = '<p style="color:#ff4444;padding:20px;font-size:8px">Exercise not found in DB.</p>';
    return;
  }

  await loadEntries();
  renderCard();
  renderChart();
}

// Holt alle Einträge für diese Übung vom Server und speichert sie in allEntries.
async function loadEntries() {
  const res = await fetch('../../api/entry.php?exercise=' + encodeURIComponent(exName));
  if (!res.ok) { console.error('entry.php error', await res.text()); return; }
  allEntries = await res.json();
  if (!Array.isArray(allEntries)) { console.error('Unexpected response', allEntries); allEntries = []; }
}

// ── 2. Übungskarte rendern ────────────────────────────────────────────────────

// Zeigt die Level-Karte oben mit dem aktuellen Stand und dem Fortschrittsbalken.
function renderCard() {
  const latest = allEntries.length > 0 ? allEntries[allEntries.length - 1] : null;
  const bw     = (latest && latest.bodyWeight) ? latest.bodyWeight : userData.bodyWeight;
  const eff    = latest ? eff1RM(latest.weight, latest.reps, bw) : 0;
  const inf    = levelInfo(eff, userData.sex, bw);
  if (!latest) { inf.li = 0; inf.level = 'Beginner'; inf.prog = 0; }

  const lvl        = inf.level || 'none';
  const cls        = lvl.toLowerCase();
  const pct        = Math.round(inf.prog * 100);
  const c          = COLORS[lvl] || COLORS.none;
  const fill       = `repeating-linear-gradient(90deg,${c} 0,${c} 8px,transparent 8px,transparent 13px)`;
  const glow       = `drop-shadow(0 0 4px ${c}) drop-shadow(0 0 10px ${c})`;
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

// ── 3. Chart rendern ──────────────────────────────────────────────────────────

// Zeichnet den Fortschritts-Chart neu mit den nach Zeitraum gruppierten Einträgen.
function renderChart() {
  const points = groupedPoints();

  if (chart) chart.destroy();

  // Leerer Chart wenn noch keine Einträge vorhanden
  if (points.length === 0) {
    chart = new Chart(document.getElementById('progressChart'), {
      type: 'line',
      data: { labels: ['no data'], datasets: [{ data: [0], borderColor: '#333', pointRadius: 0 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#555', font: { family: "'Press Start 2P'", size: 7 } }, grid: { color: '#1a1a1a' } },
          y: { ticks: { color: '#555', font: { family: "'Press Start 2P'", size: 7 }, callback: function(v) { return v + 'kg'; } }, grid: { color: '#1a1a1a' } }
        }
      }
    });
    return;
  }

  // Labels (Zeitraum-Schlüssel) und Werte (1RM in kg) aus den Punkten holen
  const labels = [];
  const values = [];
  for (let i = 0; i < points.length; i++) {
    labels.push(points[i].key);
    values.push(parseFloat(points[i].eff.toFixed(1)));
  }

  chart = new Chart(document.getElementById('progressChart'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        borderColor: '#cc44ff',
        backgroundColor: '#cc44ff18',
        pointBackgroundColor: '#cc44ff',
        pointBorderColor: '#cc44ff',
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
      onClick: function(_evt, elements) {
        if (elements.length > 0) openEditModal(points[elements[0].index]);
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: function(ctx) { return ctx.parsed.y + 'kg'; } },
          bodyFont:  { family: "'Press Start 2P'", size: 8 },
          titleFont: { family: "'Press Start 2P'", size: 8 },
          backgroundColor: '#111',
          borderColor: '#cc44ff',
          borderWidth: 1,
        }
      },
      scales: {
        x: {
          ticks: { color: '#888', font: { family: "'Press Start 2P'", size: 7 }, maxRotation: 0 },
          grid:  { color: '#cc44ff18' },
        },
        y: {
          ticks: { color: '#888', font: { family: "'Press Start 2P'", size: 7 }, callback: function(v) { return v + 'kg'; } },
          grid:  { color: '#cc44ff28' },
        }
      }
    }
  });
}

// Gruppiert alle Einträge nach dem gewählten Zeitraum; pro Gruppe nur der beste Wert.
function groupedPoints() {
  const groups = {};

  for (let i = 0; i < allEntries.length; i++) {
    const e   = allEntries[i];
    const key = periodKey(e.date);
    const bw  = e.bodyWeight || userData.bodyWeight;
    const eff = eff1RM(e.weight, e.reps, bw);

    // Nur den besten Eintrag pro Zeitgruppe behalten
    if (!groups[key] || eff > groups[key].eff) {
      groups[key] = { date: e.date, weight: e.weight, reps: e.reps, bodyWeight: e.bodyWeight, eff: eff, key: key };
    }
  }

  // Objekt in ein Array umwandeln und nach Datum sortieren
  const result = [];
  for (const key in groups) {
    result.push(groups[key]);
  }
  result.sort(function(a, b) { return a.key.localeCompare(b.key); });
  return result;
}

// Gibt den Zeitgruppen-Schlüssel für ein Datum zurück (z.B. "2025-06" für Monat).
function periodKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  if (period === 'day')   return dateStr;
  if (period === 'month') return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  if (period === 'year')  return String(d.getFullYear());
  if (period === 'week') {
    // ISO-Wochennummer berechnen
    const tmp = new Date(d);
    tmp.setDate(tmp.getDate() + 3 - (tmp.getDay() + 6) % 7);
    const jan4 = new Date(tmp.getFullYear(), 0, 4);
    const wk   = 1 + Math.round(((tmp - jan4) / 86400000 - 3 + (jan4.getDay() + 6) % 7) / 7);
    return tmp.getFullYear() + '-W' + String(wk).padStart(2, '0');
  }
  return dateStr;
}

// ── 4. Eintrag hinzufügen ─────────────────────────────────────────────────────

// Öffnet das Modal zum Hinzufügen eines neuen Eintrags und setzt die Felder zurück.
function openAddModal() {
  document.getElementById('addWeight').value = '';
  document.getElementById('addReps').value   = '';
  document.getElementById('addModal').classList.add('open');
  setTimeout(function() { document.getElementById('addWeight').focus(); }, 50);
}

// Schließt das Add-Modal ohne zu speichern.
function closeAddModal() {
  document.getElementById('addModal').classList.remove('open');
}

// Liest Gewicht und Wiederholungen aus dem Formular, sendet sie an den Server und aktualisiert die Anzeige.
async function saveNewEntry() {
  const w = parseFloat(document.getElementById('addWeight').value);
  const r = parseInt(document.getElementById('addReps').value, 10);
  if (isNaN(w) || w < 0 || isNaN(r) || r < 1 || !exerciseId) return;

  const res = await fetch('../../api/entries.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exercise_id: exerciseId, weight: w, reps: r }),
  });
  const result = await res.json().catch(function() { return {}; });
  if (!res.ok || result.error) {
    alert('Save failed: ' + (result.error || res.status));
    return;
  }

  closeAddModal();
  await loadEntries();
  renderCard();
  renderChart();
}

// Tastatur-Shortcuts für das Add-Modal (Enter = speichern, Escape = schließen)
document.getElementById('addModal').addEventListener('click', function(e) { if (e.target.id === 'addModal') closeAddModal(); });
document.getElementById('addReps').addEventListener('keydown',   function(e) { if (e.key === 'Enter') saveNewEntry(); if (e.key === 'Escape') closeAddModal(); });
document.getElementById('addWeight').addEventListener('keydown', function(e) { if (e.key === 'Escape') closeAddModal(); });

// ── 5. Eintrag bearbeiten und löschen ────────────────────────────────────────

// Öffnet das Edit-Modal und befüllt es mit den Daten des angeklickten Chart-Punkts.
function openEditModal(point) {
  editTarget = point;
  document.getElementById('editModalDate').textContent = point.date;
  document.getElementById('editWeight').value          = point.weight;
  document.getElementById('editReps').value            = point.reps;
  document.getElementById('editModal').classList.add('open');
}

// Schließt das Edit-Modal ohne zu speichern.
function closeEditModal() {
  document.getElementById('editModal').classList.remove('open');
  editTarget = null;
}

// Speichert die geänderten Werte auf dem Server und aktualisiert die Anzeige.
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

// Löscht den aktuell geöffneten Eintrag vom Server und aktualisiert die Anzeige.
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

// Schließt das Edit-Modal wenn man außerhalb klickt
document.getElementById('editModal').addEventListener('click', function(e) { if (e.target.id === 'editModal') closeEditModal(); });

// ── 6. Zeitraum-Auswahl ───────────────────────────────────────────────────────

// Reagiert auf Klick auf einen Zeitraum-Button, markiert ihn aktiv und zeichnet den Chart neu.
const periodButtons = document.querySelectorAll('.period-btn');
for (let i = 0; i < periodButtons.length; i++) {
  periodButtons[i].addEventListener('click', function() {
    for (let j = 0; j < periodButtons.length; j++) {
      periodButtons[j].classList.remove('active');
    }
    this.classList.add('active');
    period = this.dataset.period;
    renderChart();
  });
}

// ── 7. Hilfsfunktionen ────────────────────────────────────────────────────────

// Berechnet den effektiven 1RM; bei Körpergewichts-Übungen wird das Körpergewicht eingerechnet.
function eff1RM(weight, reps, bw) {
  if (ex.bw) return Math.max(0, epley(bw + weight, reps) - bw);
  return epley(weight, reps);
}

// Epley-Formel: schätzt das 1-Wiederholungs-Max aus Gewicht und Wiederholungsanzahl.
function epley(w, r) {
  return r > 1 ? w * (1 + r / 30) : w;
}

// Gibt Level-Index, Level-Name, nächsten Schwellenwert und Fortschritt (0–1) zurück.
function levelInfo(eff, sex, bw) {
  const th = getThresholds(sex, bw);
  let li = -1;
  for (let i = 0; i < th.length; i++) {
    if (eff >= th[i]) li = i;
    else break;
  }
  const curTh  = li >= 0 ? th[li] : 0;
  const nextTh = li < 4  ? th[li + 1] : th[4];
  const range  = nextTh - curTh;
  const prog   = li === 4 ? 1 : (range > 0 ? Math.min(1, (eff - curTh) / range) : 0);
  return { li: li, level: li >= 0 ? LEVELS[li] : null, nextTh: nextTh, prog: prog };
}

// Rechnet die prozentualen Level-Schwellen in echte Kilogramm-Werte um.
function getThresholds(sex, bw) {
  const pcts   = sex === 'male' ? ex.male : ex.female;
  const result = [];
  for (let i = 0; i < pcts.length; i++) {
    result.push(Math.round(pcts[i] * bw / 100 * 2) / 2);
  }
  return result;
}

// Gibt das Icon-HTML für einen Level-Namen zurück.
function iconHTML(lvl) {
  switch (lvl) {
    case 'Elite':        return '<div class="icon-star"></div>';
    case 'Advanced':     return '<div class="icon-diamond"></div>';
    case 'Intermediate': return '<div class="icon-triangle-down"></div>';
    case 'Novice':       return '<div class="icon-square"></div>';
    default:             return '<div class="icon-circle"></div>';
  }
}

// Formatiert eine Zahl: keine Dezimalstelle wenn ganzzahlig, sonst 1 Nachkommastelle.
function fmt(n) {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

// ── Start ─────────────────────────────────────────────────────────────────────
init();
