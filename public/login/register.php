<?php
require_once '../../config/database.php';

if (isset($_SESSION['user_id'])) {
    header('Location: ../stats/stats.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username   = trim($_POST['username'] ?? '');
    $password   = $_POST['password'] ?? '';
    $bodyWeight = (float)($_POST['bodyWeight'] ?? 0);
    $sex        = $_POST['sex'] ?? '';

    if ($username === '' || $password === '' || $bodyWeight <= 0 || !in_array($sex, ['male', 'female'])) {
        $error = 'Please fill in all fields correctly.';
    } else {
        $stmt = $conn->prepare("SELECT user_ID FROM `user` WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $taken = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($taken) {
            $error = 'Username already taken.';
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);

            $stmt = $conn->prepare("INSERT INTO `user` (username, password, bodyWeight) VALUES (?, ?, ?)");
            $stmt->bind_param("ssd", $username, $hash, $bodyWeight);
            $stmt->execute();
            $newId = (int)$conn->insert_id;
            $stmt->close();

            $stmt = $conn->prepare("INSERT INTO sex (sex, user_user_ID) VALUES (?, ?)");
            $stmt->bind_param("si", $sex, $newId);
            $stmt->execute();
            $stmt->close();

            header('Location: login.php');
            exit;
        }
    }
}
?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>REGISTER</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
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
      gap: 36px;
      padding: 24px;
    }

    .auth-title {
      font-size: 14px;
      color: #ff3fa4;
      text-shadow: 0 0 10px #ff3fa4, 0 0 24px #ff3fa488;
      letter-spacing: 3px;
    }

    form {
      width: 100%;
      max-width: 300px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    label {
      font-size: 7px;
      color: #cc44ff;
      text-shadow: 0 0 6px #cc44ff;
      letter-spacing: 1px;
    }

    input, select {
      width: 100%;
      background: #0d000d;
      border: 1px solid #cc44ff;
      box-shadow: 0 0 8px #cc44ff44;
      color: #fff;
      font-family: 'Press Start 2P', monospace;
      font-size: 11px;
      padding: 12px 10px;
      outline: none;
      margin-top: 8px;
      appearance: none;
    }

    input:focus, select:focus {
      border-color: #dd77ff;
      box-shadow: 0 0 12px #cc44ff88;
    }

    input::-webkit-inner-spin-button,
    input::-webkit-outer-spin-button { -webkit-appearance: none; }

    select option { background: #0d000d; }

    .btn-submit {
      width: 100%;
      padding: 12px 0;
      font-family: 'Press Start 2P', monospace;
      font-size: 8px;
      letter-spacing: 1px;
      cursor: pointer;
      background: transparent;
      color: #fff;
      border: 2px solid #cc44ff;
      margin-top: 6px;
      text-shadow: 0 0 6px #cc44ff, 0 0 14px #cc44ff;
      box-shadow: 0 0 8px #cc44ff, 0 0 18px #cc44ff66, inset 0 0 8px #cc44ff22;
    }

    .btn-submit:hover {
      background: #cc44ff22;
      box-shadow: 0 0 14px #cc44ff, 0 0 28px #cc44ff88, inset 0 0 12px #cc44ff44;
    }

    .auth-link {
      font-size: 7px;
      color: #555;
      text-decoration: none;
      letter-spacing: 1px;
    }

    .auth-link:hover { color: #cc44ff; }

    .error {
      font-size: 7px;
      color: #ff4444;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="auth-title">REGISTER</div>

  <form method="POST">
    <label>USERNAME
      <input type="text" name="username" required autofocus autocomplete="username">
    </label>
    <label>PASSWORD
      <input type="password" name="password" required autocomplete="new-password">
    </label>
    <label>BODY WEIGHT (KG)
      <input type="number" name="bodyWeight" step="0.5" min="1" required>
    </label>
    <label>SEX
      <select name="sex" required>
        <option value="">-- SELECT --</option>
        <option value="male">MALE</option>
        <option value="female">FEMALE</option>
      </select>
    </label>
    <?php if ($error): ?>
      <div class="error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    <button type="submit" class="btn-submit">CREATE ACCOUNT</button>
  </form>

  <a href="login.php" class="auth-link">ALREADY HAVE AN ACCOUNT?</a>
</body>
</html>
