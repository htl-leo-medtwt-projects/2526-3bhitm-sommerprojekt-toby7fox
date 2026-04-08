<?php
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: ../login/login.php');
    exit;
}

$userId  = (int)$_SESSION['user_id'];
$success = false;
$error   = '';

// Handle bodyweight update
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $bw = (float)($_POST['bodyWeight'] ?? 0);
    if ($bw > 0) {
        $stmt = $conn->prepare("UPDATE `user` SET bodyWeight = ? WHERE user_ID = ?");
        $stmt->bind_param("di", $bw, $userId);
        $stmt->execute();
        $stmt->close();
        $success = true;
    } else {
        $error = 'Enter a valid bodyweight.';
    }
}

// Fetch user data
$stmt = $conn->prepare("SELECT username, bodyWeight FROM `user` WHERE user_ID = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();
?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>USER</title>
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
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 40px;
      padding: 32px 24px 80px;
    }

    .user-title {
      font-size: 10px;
      color: #cc44ff;
      text-shadow: 0 0 8px #cc44ff, 0 0 20px #cc44ff88;
      letter-spacing: 2px;
    }

    .username {
      font-size: 14px;
      color: #fff;
      text-shadow: 0 0 10px #cc44ff, 0 0 24px #cc44ff88;
      text-align: center;
    }

    .section {
      width: 100%;
      max-width: 320px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .section-label {
      font-size: 7px;
      color: #cc44ff;
      text-shadow: 0 0 6px #cc44ff;
      letter-spacing: 1px;
    }

    input[type=number] {
      width: 100%;
      background: #0d000d;
      border: 1px solid #cc44ff;
      box-shadow: 0 0 8px #cc44ff44;
      color: #fff;
      font-family: 'Press Start 2P', monospace;
      font-size: 12px;
      padding: 12px 10px;
      outline: none;
      -moz-appearance: textfield;
      appearance: textfield;
    }

    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }

    input[type=number]:focus {
      border-color: #dd66ff;
      box-shadow: 0 0 12px #cc44ff88;
    }

    .btn-save {
      width: 100%;
      padding: 12px 0;
      font-family: 'Press Start 2P', monospace;
      font-size: 8px;
      letter-spacing: 1px;
      cursor: pointer;
      border: none;
      background: #cc44ff;
      color: #000;
    }

    .btn-save:hover { background: #dd66ff; }

    .btn-logout {
      width: 100%;
      max-width: 320px;
      padding: 12px 0;
      font-family: 'Press Start 2P', monospace;
      font-size: 8px;
      letter-spacing: 1px;
      cursor: pointer;
      background: transparent;
      color: #cc44ff;
      border: 1px solid #cc44ff;
      box-shadow: 0 0 8px #cc44ff44;
      text-align: center;
      text-decoration: none;
      display: block;
    }

    .btn-logout:hover {
      color: #fff;
      border-color: #dd66ff;
      box-shadow: 0 0 14px #cc44ff88;
    }

    .msg {
      font-size: 7px;
      letter-spacing: 1px;
    }
    .msg-ok    { color: #44ff88; }
    .msg-error { color: #ff4444; }
  </style>
</head>
<body>

  <div class="user-title">— USER —</div>
  <div class="username"><?= htmlspecialchars($user['username']) ?></div>

  <form class="section" method="POST">
    <div class="section-label">BODY WEIGHT (KG)</div>
    <input type="number" name="bodyWeight" step="0.5" min="1"
           value="<?= htmlspecialchars($user['bodyWeight']) ?>" required>
    <?php if ($success): ?>
      <div class="msg msg-ok">SAVED.</div>
    <?php elseif ($error): ?>
      <div class="msg msg-error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    <button type="submit" class="btn-save">SAVE</button>
  </form>

  <a href="../../api/auth.php?action=logout" class="btn-logout">LOGOUT</a>

  <?php $nav_active = 'user'; require_once '../shared/nav.php'; ?>
</body>
</html>
