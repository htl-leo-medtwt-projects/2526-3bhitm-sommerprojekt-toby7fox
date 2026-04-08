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
        // Check if username taken
        $stmt = $conn->prepare("SELECT user_ID FROM `user` WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $taken = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($taken) {
            $error = 'Username already taken.';
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);

            $stmt = $conn->prepare(
                "INSERT INTO `user` (username, password, bodyWeight) VALUES (?, ?, ?)"
            );
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
  <title>Register</title>
</head>
<body>
  <h2>Create Account</h2>
  <?php if ($error): ?>
    <p style="color:red"><?= htmlspecialchars($error) ?></p>
  <?php endif; ?>
  <form method="POST">
    <label>Username<br><input type="text" name="username" required autofocus></label><br><br>
    <label>Password<br><input type="password" name="password" required></label><br><br>
    <label>Body Weight (kg)<br><input type="number" name="bodyWeight" step="0.5" min="1" required></label><br><br>
    <label>Sex<br>
      <select name="sex" required>
        <option value="">-- select --</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
    </label><br><br>
    <button type="submit">Register</button>
  </form>
  <br>
  <a href="login.php">Already have an account? Login</a>
</body>
</html>
