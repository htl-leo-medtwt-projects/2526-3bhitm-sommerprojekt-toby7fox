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
  <title>XP</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../stats/stats.css">
  <link rel="stylesheet" href="../shared/nav.css">
  <link rel="stylesheet" href="xp.css">
  <script src="xp.js" defer></script>
</head>
<body>

  <!-- Stats view -->
  <div id="statsView">
    <div class="xp-rank-card">
      <div id="rankIcon" class="lvl-icon"></div>
      <div id="rankName" class="xp-rank-name"></div>
      <div id="rankXP"   class="xp-value"></div>
    </div>

    <div class="xp-recent" id="recentList"></div>

    <div class="xp-this-month">
      <div class="xp-tm-title">This month</div>
      <div id="tmIcon"      class="lvl-icon xp-tm-icon"></div>
      <div id="tmXP"        class="xp-tm-xp"></div>
      <div id="tmProjected" class="xp-tm-projected"></div>
    </div>

    <button class="xp-btn" onclick="showLog()">LOG</button>
  </div>

  <!-- Log view -->
  <div id="logView">

    <div class="log-section">
      <div class="log-label">GYM SETS</div>
      <div class="log-counter">
        <button onclick="adjust('gym','sets',-1)">-</button>
        <span id="v-gym-sets">0</span>
        <button onclick="adjust('gym','sets',1)">+</button>
      </div>
    </div>

    <div class="log-section">
      <div class="log-label">BIKING</div>
      <div class="log-counter">
        <button onclick="adjust('bike','km',-0.5)">-</button>
        <span id="v-bike-km">0km</span>
        <button onclick="adjust('bike','km',0.5)">+</button>
      </div>
      <div class="log-counter">
        <button onclick="adjust('bike','hm',-10)">-</button>
        <span id="v-bike-hm">0hm</span>
        <button onclick="adjust('bike','hm',10)">+</button>
      </div>
    </div>

    <div class="log-section">
      <div class="log-label">RUNNING</div>
      <div class="log-counter">
        <button onclick="adjust('run','km',-0.5)">-</button>
        <span id="v-run-km">0km</span>
        <button onclick="adjust('run','km',0.5)">+</button>
      </div>
      <div class="log-counter">
        <button onclick="adjust('run','hm',-10)">-</button>
        <span id="v-run-hm">0hm</span>
        <button onclick="adjust('run','hm',10)">+</button>
      </div>
    </div>

    <div class="log-section">
      <div class="log-label">SWIMMING</div>
      <div class="log-counter">
        <button onclick="adjust('swim','meters',-50)">-</button>
        <span id="v-swim-meters">0m</span>
        <button onclick="adjust('swim','meters',50)">+</button>
      </div>
    </div>

    <div class="log-section">
      <div class="log-label">BALLSPORT &amp; CO</div>
      <div class="log-counter">
        <button onclick="adjust('ballsport','hours',-0.5)">-</button>
        <span id="v-ballsport-hours">0h</span>
        <button onclick="adjust('ballsport','hours',0.5)">+</button>
      </div>
      <div class="log-intensity">
        <button id="intensityBtn" onclick="toggleIntensity()">NORMAL</button>
      </div>
    </div>

    <button class="xp-btn" id="addBtn" onclick="addEntries()">+ ADD 0 XP</button>
    <button class="xp-btn xp-btn-back" onclick="showStats()">BACK</button>
  </div>

  <?php $nav_active = 'xp'; require_once '../shared/nav.php'; ?>
</body>
</html>
