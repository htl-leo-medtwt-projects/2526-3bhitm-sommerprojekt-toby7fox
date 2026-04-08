// Depends on globals from stats-data.js:
// EXERCISES, entryData, exerciseIds, render()

let activeExName = null;

function openModal(exName) {
  activeExName = exName;
  document.getElementById('modalTitle').textContent  = exName.toUpperCase();
  document.getElementById('modalWeight').value = '';
  document.getElementById('modalReps').value   = '';
  document.getElementById('modal').classList.add('open');
  setTimeout(() => document.getElementById('modalWeight').focus(), 50);
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  activeExName = null;
}

async function saveEntry() {
  const w = parseFloat(document.getElementById('modalWeight').value);
  const r = parseInt(document.getElementById('modalReps').value, 10);
  if (isNaN(w) || w < 0 || isNaN(r) || r < 1) return;

  const exId = exerciseIds[activeExName];
  if (!exId) return;

  await fetch('../../api/entries.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exercise_id: exId, weight: w, reps: r }),
  });

  entryData[activeExName] = { weight: w, reps: r, bodyWeight: userData.bodyWeight };
  closeModal();
  render();
}

document.getElementById('modalWeight').addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
document.getElementById('modalReps').addEventListener('keydown', e => {
  if (e.key === 'Enter')  saveEntry();
  if (e.key === 'Escape') closeModal();
});
document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});
