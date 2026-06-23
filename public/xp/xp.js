// ── Konstanten ────────────────────────────────────────────────────────────────

// Die 5 XP-Level mit Name, Mindest-XP und CSS-Klasse für das Icon
const LEVELS = [
  { name: 'Couch Potato',    min: 0,    cls: 'beginner' },
  { name: 'Average Joe',     min: 120,  cls: 'novice' },
  { name: 'Weekend Warrior', min: 1600, cls: 'intermediate' },
  { name: 'Freak',           min: 3000, cls: 'advanced' },
  { name: 'Sport Fanatic',   min: 5000, cls: 'elite' },
];

// Alle geladenen Aktivitäten aus der Datenbank
let activities = [];

// Aktuelle Werte im Log-Formular (werden mit +/- Buttons geändert)
let formValues = {
  gym:       { sets: 0 },
  bike:      { km: 0, hm: 0 },
  run:       { km: 0, hm: 0 },
  swim:      { meters: 0 },
  ballsport: { hours: 0, intense: false },
};

// ── 1. Daten laden ────────────────────────────────────────────────────────────

// Holt alle Aktivitäten vom Server und zeigt danach die Stats-Ansicht an.
async function loadData() {
  const res  = await fetch('../../api/activity.php');
  const data = await res.json();
  activities = data.activities || [];
  renderStats();
}

// ── 2. Stats-Ansicht rendern ──────────────────────────────────────────────────

// Berechnet den aktuellen Rang und zeigt alle XP-Infos auf der Stats-Seite an.
function renderStats() {
  const rankXP = currentRankXP();
  const level  = getLevel(rankXP);

  // Aktuellen Rang oben anzeigen
  document.getElementById('rankIcon').innerHTML  = iconHTML(level.cls);
  document.getElementById('rankIcon').className  = 'lvl-icon lvl-icon-' + level.cls;
  document.getElementById('rankName').textContent = level.name.toUpperCase();
  document.getElementById('rankXP').textContent   = fmtXP(rankXP) + 'xp';

  // Die letzten 3 Monate einzeln berechnen und als Kacheln anzeigen
  const offsets = [-3, -2, -1];
  let monthsHtml = '';
  for (let i = 0; i < offsets.length; i++) {
    const key   = getMonthKey(offsets[i]);
    const xp    = monthlyXP(key);
    const lvl   = getLevel(xp);
    const parts = key.split('-');
    const label = new Date(parts[0], parts[1] - 1).toLocaleString('en', { month: 'short' }).toUpperCase() + ' ' + parts[0];
    monthsHtml += `
      <div class="xp-month">
        <div class="lvl-icon lvl-icon-${lvl.cls}">${iconHTML(lvl.cls)}</div>
        <div class="xp-month-xp">${fmtXP(xp)}xp</div>
        <div class="xp-month-label">${label}</div>
      </div>`;
  }
  document.getElementById('recentList').innerHTML = '<div class="xp-months">' + monthsHtml + '</div>';

  // "This month" Box: aktuellen Monat und voraussichtlichen Rang anzeigen
  const thisMonthXP  = monthlyXP(getMonthKey(0));
  const projXP       = projectedRankXP();
  const projLevel    = getLevel(projXP);
  const currentLevel = getLevel(rankXP);
  const staying      = projLevel.name === currentLevel.name;

  document.getElementById('tmIcon').innerHTML  = iconHTML(projLevel.cls);
  document.getElementById('tmIcon').className  = 'lvl-icon xp-tm-icon lvl-icon-' + projLevel.cls;
  document.getElementById('tmXP').textContent  = fmtXP(thisMonthXP) + 'xp';
  document.getElementById('tmProjected').innerHTML = staying
    ? 'You will stay on rank:<br>' + projLevel.name
    : 'You will ' + (projXP > rankXP ? 'advance' : 'drop') + ' to:<br>' + projLevel.name;
}

// ── 3. XP-Berechnungen ────────────────────────────────────────────────────────

// Berechnet den Durchschnitts-XP der letzten 3 abgeschlossenen Monate — das ist der aktuelle Rang.
function currentRankXP() {
  const xp1 = monthlyXP(getMonthKey(-3));
  const xp2 = monthlyXP(getMonthKey(-2));
  const xp3 = monthlyXP(getMonthKey(-1));
  return (xp1 + xp2 + xp3) / 3;
}

// Berechnet den voraussichtlichen Rang wenn der aktuelle Monat so weiterläuft.
function projectedRankXP() {
  const xp1 = monthlyXP(getMonthKey(-2));
  const xp2 = monthlyXP(getMonthKey(-1));
  const xp3 = monthlyXP(getMonthKey(0));
  return (xp1 + xp2 + xp3) / 3;
}

// Addiert alle XP-Werte der Aktivitäten in einem bestimmten Monat.
function monthlyXP(key) {
  let total = 0;
  for (let i = 0; i < activities.length; i++) {
    if (monthKey(activities[i].date) === key) {
      total += calcXP(activities[i]);
    }
  }
  return total;
}

// Gibt den Monats-Schlüssel im Format "YYYY-MM" für einen Monatsversatz zurück.
// offsetMonths 0 = dieser Monat, -1 = letzter Monat, -3 = vor 3 Monaten
function getMonthKey(offsetMonths) {
  const date = new Date();
  date.setMonth(date.getMonth() + offsetMonths);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return y + '-' + m;
}

// Kürzt ein Datum (z.B. "2025-06-15") auf den Monats-Schlüssel (z.B. "2025-06").
function monthKey(dateStr) {
  return dateStr.substring(0, 7);
}

// Berechnet die XP einer einzelnen Aktivität anhand ihres Typs.
function calcXP(activity) {
  switch (activity.type) {
    case 'gym':       return activity.sets * 10;
    case 'bike':      return activity.km * 2.5 + activity.hm * 0.25;
    case 'run':       return activity.km * 5   + activity.hm * 0.5;
    case 'swim':      return activity.meters * 0.1;
    case 'ballsport': return activity.hours * (activity.intense ? 100 : 60);
    default: return 0;
  }
}

// Gibt das Level-Objekt zurück das zu einem XP-Wert passt (höchstes passendes Level).
function getLevel(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

// ── 4. Ansicht wechseln ───────────────────────────────────────────────────────

// Zeigt die Stats-Ansicht (Startseite) und versteckt die Log-Ansicht.
function showStats() {
  document.getElementById('statsView').style.display = 'flex';
  document.getElementById('logView').style.display   = 'none';
}

// Zeigt die Log-Ansicht (Aktivität eintragen) und versteckt die Stats-Ansicht.
function showLog() {
  document.getElementById('statsView').style.display = 'none';
  document.getElementById('logView').style.display   = 'flex';
}

// ── 5. Log-Formular ───────────────────────────────────────────────────────────

// Ändert einen Wert im Formular um den angegebenen Schritt (+ oder −), minimum 0.
function adjust(type, field, delta) {
  formValues[type][field] = Math.max(0, Math.round((formValues[type][field] + delta) * 100) / 100);
  updateLogDisplay();
}

// Wechselt den Ballsport zwischen "Normal" und "Intense" und aktualisiert die Anzeige.
function toggleIntensity() {
  formValues.ballsport.intense = !formValues.ballsport.intense;
  const btn = document.getElementById('intensityBtn');
  btn.textContent = formValues.ballsport.intense ? 'INTENSE' : 'NORMAL';
  btn.classList.toggle('intense', formValues.ballsport.intense);
  updateLogDisplay();
}

// Aktualisiert alle Zahlen im Log-Formular und die Gesamt-XP auf dem Add-Button.
function updateLogDisplay() {
  const f = formValues;
  document.getElementById('v-gym-sets').textContent        = f.gym.sets;
  document.getElementById('v-bike-km').textContent         = f.bike.km + 'km';
  document.getElementById('v-bike-hm').textContent         = f.bike.hm + 'hm';
  document.getElementById('v-run-km').textContent          = f.run.km + 'km';
  document.getElementById('v-run-hm').textContent          = f.run.hm + 'hm';
  document.getElementById('v-swim-meters').textContent     = f.swim.meters + 'm';
  document.getElementById('v-ballsport-hours').textContent = f.ballsport.hours + 'h';
  document.getElementById('addBtn').textContent = '+ ADD ' + fmtXP(calcFormXP()) + ' XP';
}

// Berechnet die Gesamt-XP aller aktuell im Formular eingetragenen Werte.
function calcFormXP() {
  const f = formValues;
  return (
    calcXP({ type: 'gym',       ...f.gym }) +
    calcXP({ type: 'bike',      ...f.bike }) +
    calcXP({ type: 'run',       ...f.run }) +
    calcXP({ type: 'swim',      ...f.swim }) +
    calcXP({ type: 'ballsport', ...f.ballsport })
  );
}

// Speichert alle Aktivitäten mit Wert > 0 auf dem Server und kehrt zur Stats-Ansicht zurück.
async function addEntries() {
  const today  = new Date().toISOString().split('T')[0];
  const f      = formValues;
  const toSave = [];

  if (f.gym.sets > 0)
    toSave.push({ type: 'gym',       date: today, sets: f.gym.sets });
  if (f.bike.km > 0 || f.bike.hm > 0)
    toSave.push({ type: 'bike',      date: today, km: f.bike.km, hm: f.bike.hm });
  if (f.run.km > 0 || f.run.hm > 0)
    toSave.push({ type: 'run',       date: today, km: f.run.km,  hm: f.run.hm });
  if (f.swim.meters > 0)
    toSave.push({ type: 'swim',      date: today, meters: f.swim.meters });
  if (f.ballsport.hours > 0)
    toSave.push({ type: 'ballsport', date: today, hours: f.ballsport.hours, intense: f.ballsport.intense });

  if (toSave.length === 0) return;

  for (const entry of toSave) {
    await fetch('../../api/activity.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  }

  // Formular zurücksetzen
  formValues = {
    gym:       { sets: 0 },
    bike:      { km: 0, hm: 0 },
    run:       { km: 0, hm: 0 },
    swim:      { meters: 0 },
    ballsport: { hours: 0, intense: false },
  };
  document.getElementById('intensityBtn').textContent = 'NORMAL';
  document.getElementById('intensityBtn').classList.remove('intense');
  updateLogDisplay();

  await loadData();
  showStats();
}

// ── 6. Hilfsfunktionen ────────────────────────────────────────────────────────

// Gibt das Icon-HTML für eine XP-Level-CSS-Klasse zurück.
function iconHTML(cls) {
  switch (cls) {
    case 'elite':        return '<div class="xp-icon xp-icon-elite"></div>';
    case 'advanced':     return '<div class="xp-icon xp-icon-advanced"></div>';
    case 'intermediate': return '<div class="xp-icon xp-icon-intermediate"></div>';
    case 'novice':       return '<div class="xp-icon xp-icon-novice"></div>';
    default:             return '<div class="xp-icon xp-icon-beginner"></div>';
  }
}

// Rundet XP auf 1 Dezimalstelle.
function fmtXP(xp) {
  return Math.round(xp * 10) / 10;
}

// ── Start ─────────────────────────────────────────────────────────────────────
loadData();
