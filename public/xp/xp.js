const LEVELS = [
  { name: 'Couch Potato',    min: 0,    cls: 'beginner' },
  { name: 'Average Joe',     min: 120,  cls: 'novice' },
  { name: 'Weekend Warrior', min: 1600, cls: 'intermediate' },
  { name: 'Freak',           min: 3000, cls: 'advanced' },
  { name: 'Sport Fanatic',   min: 5000, cls: 'elite' },
];

let activities = [];
let showAll    = false;

let formValues = {
  gym:       { sets: 0 },
  bike:      { km: 0, hm: 0 },
  run:       { km: 0, hm: 0 },
  swim:      { meters: 0 },
  ballsport: { hours: 0, intense: false },
};

// ── XP calculation ───────────────────────────────────────────────────────────

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

function getLevel(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

function monthKey(dateStr) { return dateStr.substring(0, 7); }

function monthlyXP(key) {
  return activities
    .filter(a => monthKey(a.date) === key)
    .reduce((sum, a) => sum + calcXP(a), 0);
}

function getMonthKeys(offsetMonths) {
  const date = new Date();
  date.setMonth(date.getMonth() + offsetMonths);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function currentRankXP() {
  const xp1 = monthlyXP(getMonthKeys(-3));
  const xp2 = monthlyXP(getMonthKeys(-2));
  const xp3 = monthlyXP(getMonthKeys(-1));
  return (xp1 + xp2 + xp3) / 3;
}

function projectedRankXP() {
  const xp1 = monthlyXP(getMonthKeys(-2));
  const xp2 = monthlyXP(getMonthKeys(-1));
  const xp3 = monthlyXP(getMonthKeys(0));
  return (xp1 + xp2 + xp3) / 3;
}

// ── Icons ────────────────────────────────────────────────────────────────────

function iconHTML(cls) {
  switch (cls) {
    case 'elite':        return '<div class="xp-icon xp-icon-elite"></div>';
    case 'advanced':     return '<div class="xp-icon xp-icon-advanced"></div>';
    case 'intermediate': return '<div class="xp-icon xp-icon-intermediate"></div>';
    case 'novice':       return '<div class="xp-icon xp-icon-novice"></div>';
    default:             return '<div class="xp-icon xp-icon-beginner"></div>';
  }
}

function activityLabel(a) {
  switch (a.type) {
    case 'gym':       return `${a.sets} sets`;
    case 'bike':      return `${a.km}km ${a.hm}hm bike`;
    case 'run':       return `${a.km}km ${a.hm}hm run`;
    case 'swim':      return `${a.meters}m swim`;
    case 'ballsport': return `${a.hours}h ${a.intense ? 'intense ' : ''}sport`;
    default: return a.type;
  }
}

function fmtXP(xp) {
  return Math.round(xp * 10) / 10;
}

// ── Render stats ─────────────────────────────────────────────────────────────

function renderStats() {
  const rankXP  = currentRankXP();
  const level   = getLevel(rankXP);

  document.getElementById('rankIcon').innerHTML  = iconHTML(level.cls);
  document.getElementById('rankIcon').className  = `lvl-icon lvl-icon-${level.cls}`;
  document.getElementById('rankName').textContent = level.name.toUpperCase();
  document.getElementById('rankXP').textContent   = `${fmtXP(rankXP)}xp`;

  const months = [-3, -2, -1].map(offset => {
    const key = getMonthKeys(offset);
    const xp  = monthlyXP(key);
    const lvl = getLevel(xp);
    const [year, month] = key.split('-');
    const label = new Date(year, month - 1).toLocaleString('en', { month: 'short' }).toUpperCase() + ' ' + year;
    return { key, xp, lvl, label };
  });

  document.getElementById('recentList').innerHTML = `
    <div class="xp-months">
      ${months.map(m => `
        <div class="xp-month">
          <div class="lvl-icon lvl-icon-${m.lvl.cls}">${iconHTML(m.lvl.cls)}</div>
          <div class="xp-month-xp">${fmtXP(m.xp)}xp</div>
          <div class="xp-month-label">${m.label}</div>
        </div>`).join('')}
    </div>`;

  document.getElementById('showAllBtn').style.display = 'block';

  const thisMonthXP   = monthlyXP(getMonthKeys(0));
  const projXP        = projectedRankXP();
  const projLevel     = getLevel(projXP);
  const currentLevel  = getLevel(rankXP);
  const staying       = projLevel.name === currentLevel.name;

  document.getElementById('tmIcon').innerHTML  = iconHTML(projLevel.cls);
  document.getElementById('tmIcon').className  = `lvl-icon xp-tm-icon lvl-icon-${projLevel.cls}`;
  document.getElementById('tmXP').textContent  = `${fmtXP(thisMonthXP)}xp`;
  document.getElementById('tmProjected').innerHTML =
    staying
      ? `You will stay on rank:<br>${projLevel.name}`
      : `You will ${projXP > rankXP ? 'advance' : 'drop'} to:<br>${projLevel.name}`;
}

// ── View switching ────────────────────────────────────────────────────────────

function showView(name) {
  ['statsView','logView','historyView'].forEach(id => {
    document.getElementById(id).style.display = id === name ? 'flex' : 'none';
  });
}

function showStats()   { showView('statsView'); }
function showLog()     { showView('logView'); }
function showHistory() { renderHistory(); showView('historyView'); }

// ── History view ─────────────────────────────────────────────────────────────

function renderHistory() {
  const grouped = {};
  activities.forEach(a => {
    const key = monthKey(a.date);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });

  const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  document.getElementById('historyList').innerHTML = sortedKeys.map(key => {
    const [year, month] = key.split('-');
    const label = new Date(year, month - 1).toLocaleString('en', { month: 'long' }).toUpperCase() + ' ' + year;
    const totalXP = grouped[key].reduce((sum, a) => sum + calcXP(a), 0);
    const lvl = getLevel(totalXP);

    const entries = grouped[key].map(a => {
      const xp = calcXP(a);
      return `
        <div class="hist-entry" onclick="openEditActivity(${a.activity_ID})">
          <div class="hist-entry-info">
            <span class="hist-date">${a.date}</span>
            <span class="hist-label">${activityLabel(a)}</span>
          </div>
          <div class="hist-entry-xp">${fmtXP(xp)}xp</div>
        </div>`;
    }).join('');

    return `
      <div class="hist-month">
        <div class="hist-month-header">
          <div class="lvl-icon lvl-icon-${lvl.cls} hist-month-icon">${iconHTML(lvl.cls)}</div>
          <div class="hist-month-title">${label}</div>
          <div class="hist-month-xp">${fmtXP(totalXP)}xp</div>
        </div>
        ${entries}
      </div>`;
  }).join('');
}

// ── Edit activity modal ───────────────────────────────────────────────────────

let editingActivity = null;

function openEditActivity(id) {
  editingActivity = activities.find(a => a.activity_ID == id);
  if (!editingActivity) return;

  const a = editingActivity;
  document.getElementById('editActivityTitle').textContent = a.type.toUpperCase() + ' — ' + a.date;

  let fields = `<input type="date" id="ea-date" value="${a.date}" style="margin-bottom:1vh">`;
  if (a.type === 'gym')
    fields += `<label style="font-size:0.9vh;color:#cc44ff">SETS<br><input type="number" id="ea-sets" value="${a.sets}" min="0"></label>`;
  if (a.type === 'bike' || a.type === 'run')
    fields += `<label style="font-size:0.9vh;color:#cc44ff">KM<br><input type="number" id="ea-km" value="${a.km}" step="0.5" min="0"></label>
               <label style="font-size:0.9vh;color:#cc44ff">HM<br><input type="number" id="ea-hm" value="${a.hm}" step="10" min="0"></label>`;
  if (a.type === 'swim')
    fields += `<label style="font-size:0.9vh;color:#cc44ff">METERS<br><input type="number" id="ea-meters" value="${a.meters}" step="50" min="0"></label>`;
  if (a.type === 'ballsport')
    fields += `<label style="font-size:0.9vh;color:#cc44ff">HOURS<br><input type="number" id="ea-hours" value="${a.hours}" step="0.5" min="0"></label>
               <label style="font-size:0.9vh;color:#cc44ff">INTENSE<br><input type="checkbox" id="ea-intense" ${a.intense ? 'checked' : ''}></label>`;

  document.getElementById('editActivityFields').innerHTML = fields;
  document.getElementById('editActivityModal').classList.add('open');
}

function closeEditActivity() {
  document.getElementById('editActivityModal').classList.remove('open');
  editingActivity = null;
}

async function saveActivityEdit() {
  const a = editingActivity;
  const payload = {
    activity_ID: a.activity_ID,
    date:    document.getElementById('ea-date').value,
    sets:    a.type === 'gym'                      ? +document.getElementById('ea-sets').value    : 0,
    km:      (a.type === 'bike'||a.type === 'run') ? +document.getElementById('ea-km').value      : 0,
    hm:      (a.type === 'bike'||a.type === 'run') ? +document.getElementById('ea-hm').value      : 0,
    meters:  a.type === 'swim'                     ? +document.getElementById('ea-meters').value  : 0,
    hours:   a.type === 'ballsport'                ? +document.getElementById('ea-hours').value   : 0,
    intense: a.type === 'ballsport' && document.getElementById('ea-intense').checked,
  };
  await fetch('../../api/activity.php', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  closeEditActivity();
  await loadData();
  renderHistory();
}

async function deleteActivity() {
  await fetch('../../api/activity.php', {
    method: 'DELETE',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ activity_ID: editingActivity.activity_ID }),
  });
  closeEditActivity();
  await loadData();
  renderHistory();
}

// ── Log form ─────────────────────────────────────────────────────────────────

function adjust(type, field, delta) {
  formValues[type][field] = Math.max(0, Math.round((formValues[type][field] + delta) * 100) / 100);
  updateLogDisplay();
}

function toggleIntensity() {
  formValues.ballsport.intense = !formValues.ballsport.intense;
  const btn = document.getElementById('intensityBtn');
  btn.textContent = formValues.ballsport.intense ? 'INTENSE' : 'NORMAL';
  btn.classList.toggle('intense', formValues.ballsport.intense);
  updateLogDisplay();
}

function updateLogDisplay() {
  const f = formValues;
  document.getElementById('v-gym-sets').textContent      = f.gym.sets;
  document.getElementById('v-bike-km').textContent       = `${f.bike.km}km`;
  document.getElementById('v-bike-hm').textContent       = `${f.bike.hm}hm`;
  document.getElementById('v-run-km').textContent        = `${f.run.km}km`;
  document.getElementById('v-run-hm').textContent        = `${f.run.hm}hm`;
  document.getElementById('v-swim-meters').textContent   = `${f.swim.meters}m`;
  document.getElementById('v-ballsport-hours').textContent = `${f.ballsport.hours}h`;

  const totalXP = calcFormXP();
  document.getElementById('addBtn').textContent = `+ ADD ${fmtXP(totalXP)} XP`;
}

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

async function addEntries() {
  const today = new Date().toISOString().split('T')[0];
  const f = formValues;
  const toSave = [];

  if (f.gym.sets > 0)
    toSave.push({ type: 'gym', date: today, sets: f.gym.sets });
  if (f.bike.km > 0 || f.bike.hm > 0)
    toSave.push({ type: 'bike', date: today, km: f.bike.km, hm: f.bike.hm });
  if (f.run.km > 0 || f.run.hm > 0)
    toSave.push({ type: 'run', date: today, km: f.run.km, hm: f.run.hm });
  if (f.swim.meters > 0)
    toSave.push({ type: 'swim', date: today, meters: f.swim.meters });
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

// ── Bootstrap ────────────────────────────────────────────────────────────────

async function loadData() {
  const res  = await fetch('../../api/activity.php');
  const data = await res.json();
  activities = data.activities || [];
  renderStats();
}

loadData();
