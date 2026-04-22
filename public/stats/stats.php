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
  <script src="stats-data.js" defer></script>
</head>

<body>
  <div class="exercise-list" id="exerciseList"></div>

  <?php $nav_active = 'stats'; require_once '../shared/nav.php'; ?>
</body>

</html>
