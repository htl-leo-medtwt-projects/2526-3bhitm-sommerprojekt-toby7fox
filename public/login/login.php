<?php
require_once '../../config/database.php';

if (isset($_SESSION['user_id'])) {
    header('Location: ../stats/stats.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    $stmt = $conn->prepare("SELECT user_ID, password FROM `user` WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($row && password_verify($password, $row['password'])) {
        $_SESSION['user_id'] = $row['user_ID'];
        header('Location: ../stats/stats.php');
        exit;
    }

    $error = 'Invalid username or password.';
}
?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>LOGIN</title>
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
      color: #ff3fa4;
      text-shadow: 0 0 6px #ff3fa4;
      letter-spacing: 1px;
    }

    input {
      width: 100%;
      background: #0d000d;
      border: 1px solid #ff3fa4;
      box-shadow: 0 0 8px #ff3fa444;
      color: #fff;
      font-family: 'Press Start 2P', monospace;
      font-size: 11px;
      padding: 12px 10px;
      outline: none;
      margin-top: 8px;
    }

    input:focus {
      border-color: #ff6ec4;
      box-shadow: 0 0 12px #ff3fa488;
    }

    .btn-submit {
      width: 100%;
      padding: 12px 0;
      font-family: 'Press Start 2P', monospace;
      font-size: 8px;
      letter-spacing: 1px;
      cursor: pointer;
      border: none;
      background: #ff3fa4;
      color: #000;
      margin-top: 6px;
    }

    .btn-submit:hover { background: #ff6ec4; }

    .auth-link {
      font-size: 7px;
      color: #555;
      text-decoration: none;
      letter-spacing: 1px;
    }

    .auth-link:hover { color: #ff3fa4; }

    .error {
      font-size: 7px;
      color: #ff4444;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="auth-title">LOGIN</div>

  <form method="POST">
    <label>USERNAME
      <input type="text" name="username" required autofocus autocomplete="username">
    </label>
    <label>PASSWORD
      <input type="password" name="password" required autocomplete="current-password">
    </label>
    <?php if ($error): ?>
      <div class="error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    <button type="submit" class="btn-submit">LOGIN</button>
  </form>

  <a href="register.php" class="auth-link">CREATE ACCOUNT</a>
</body>
</html>
