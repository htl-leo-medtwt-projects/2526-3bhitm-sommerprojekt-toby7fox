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
  <link rel="stylesheet" href="../shared/nav.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #000;
      color: #fff;
      font-family: 'Press Start 2P', monospace;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-bottom: 58px;
    }
    .placeholder {
      color: #333;
      font-size: 10px;
      text-align: center;
      line-height: 2.5;
    }
  </style>
</head>
<body>
  <div class="placeholder">COMING SOON</div>
  <?php $nav_active = 'xp'; require_once '../shared/nav.php'; ?>
</body>
</html>
