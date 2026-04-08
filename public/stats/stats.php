<?php
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: ../login/login.php');
    exit;
}
?><!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>STATS</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="stats.css">
  <link rel="stylesheet" href="../shared/nav.css">
  <script src="stats-data.js"  defer></script>
  <script src="stats-modal.js" defer></script>
</head>

<body>
  <div class="exercise-list" id="exerciseList"></div>

  <div class="modal-overlay" id="modal">
    <div class="modal">
      <div class="modal-title" id="modalTitle">EXERCISE</div>
      <input type="number" id="modalWeight" step="0.5" min="0" placeholder="Weight (kg)">
      <input type="number" id="modalReps"   step="1"   min="1" placeholder="Reps">
      <div class="modal-btns">
        <button class="btn btn-ok"     onclick="saveEntry()">OK</button>
        <button class="btn btn-cancel" onclick="closeModal()">X</button>
      </div>
    </div>
  </div>

  <?php $nav_active = 'stats'; require_once '../shared/nav.php'; ?>
</body>

</html>
