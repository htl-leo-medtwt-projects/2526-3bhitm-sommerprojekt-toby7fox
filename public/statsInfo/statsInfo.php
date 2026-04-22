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
  <title>STATS INFO</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../stats/stats.css">
  <link rel="stylesheet" href="../shared/nav.css">
  <link rel="stylesheet" href="statsInfo.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="statsInfo.js" defer></script>
</head>
<body>

  <!-- Back + exercise card -->
  <a href="../stats/stats.php" class="si-back">&#8249;</a>
  <div class="exercise-list" id="exerciseCard"></div>

  <!-- Add entry -->
  <button class="add-btn" onclick="openAddModal()">+ ADD ENTRY</button>

  <!-- Push chart to bottom -->
  <div class="si-spacer"></div>

  <!-- Period selector -->
  <div class="period-bar">
    <button class="period-btn active" data-period="day">DAY</button>
    <button class="period-btn" data-period="week">WEEK</button>
    <button class="period-btn" data-period="month">MONTH</button>
    <button class="period-btn" data-period="year">YEAR</button>
  </div>

  <!-- Chart -->
  <div class="chart-wrap">
    <canvas id="progressChart"></canvas>
  </div>

  <!-- Add entry modal -->
  <div class="modal-overlay" id="addModal">
    <div class="modal">
      <div class="modal-title" id="addModalTitle">ADD ENTRY</div>
      <input type="number" id="addWeight" step="0.5" min="0" placeholder="Weight (kg)">
      <input type="number" id="addReps"   step="1"   min="1" placeholder="Reps">
      <div class="modal-btns">
        <button class="btn btn-ok"     onclick="saveNewEntry()">OK</button>
        <button class="btn btn-cancel" onclick="closeAddModal()">X</button>
      </div>
    </div>
  </div>

  <!-- Edit / Delete modal -->
  <div class="modal-overlay" id="editModal">
    <div class="modal">
      <div class="modal-title" id="editModalDate"></div>
      <input type="number" id="editWeight" step="0.5" min="0" placeholder="Weight (kg)">
      <input type="number" id="editReps"   step="1"   min="1" placeholder="Reps">
      <div class="modal-btns">
        <button class="btn btn-ok"     onclick="saveEdit()">SAVE</button>
        <button class="btn btn-cancel" onclick="closeEditModal()">X</button>
      </div>
      <button class="btn-delete" onclick="deleteEntry()">DELETE ENTRY</button>
    </div>
  </div>

  <?php $nav_active = 'stats'; require_once '../shared/nav.php'; ?>
</body>
</html>
