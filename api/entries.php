<?php
require_once '../config/database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$userId = (int)$_SESSION['user_id'];

// Ensure the 6 exercises exist
$exerciseNames = ['Squat', 'Bench Press', 'Deadlift', 'Pull-ups', 'Dips', 'Muscle-up'];
foreach ($exerciseNames as $exName) {
    $stmt = $conn->prepare("INSERT IGNORE INTO exercise (exercise) VALUES (?)");
    $stmt->bind_param("s", $exName);
    $stmt->execute();
    $stmt->close();
}

// --- POST: insert new entry ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $exerciseId = (int)($data['exercise_id'] ?? 0);
    $weight     = (float)($data['weight'] ?? 0);
    $reps       = (int)($data['reps'] ?? 0);

    if ($exerciseId <= 0 || $weight < 0 || $reps < 1) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid input']);
        exit;
    }

    // Fetch current bodyWeight of user
    $bwStmt = $conn->prepare("SELECT bodyWeight FROM `user` WHERE user_ID = ?");
    $bwStmt->bind_param("i", $userId);
    $bwStmt->execute();
    $bwRow = $bwStmt->get_result()->fetch_assoc();
    $bwStmt->close();
    $bodyWeight = (float)($bwRow['bodyWeight'] ?? 0);

    $stmt = $conn->prepare(
        "INSERT INTO Entry (weight, reps, date, bodyWeight, user_user_ID, exercise_exercise_ID)
         VALUES (?, ?, CURDATE(), ?, ?, ?)"
    );
    $stmt->bind_param("didii", $weight, $reps, $bodyWeight, $userId, $exerciseId);
    $stmt->execute();
    $stmt->close();

    echo json_encode(['success' => true]);
    exit;
}

// --- GET: fetch user info + exercise IDs + latest entry per exercise ---

// User info
$stmt = $conn->prepare(
    "SELECT u.bodyWeight, s.sex
     FROM `user` u
     LEFT JOIN sex s ON s.user_user_ID = u.user_ID
     WHERE u.user_ID = ?"
);
$stmt->bind_param("i", $userId);
$stmt->execute();
$userRow = $stmt->get_result()->fetch_assoc();
$stmt->close();

// Exercise IDs
$exerciseIds = [];
$result = $conn->query("SELECT exercise_ID, exercise FROM exercise");
while ($row = $result->fetch_assoc()) {
    $exerciseIds[$row['exercise']] = (int)$row['exercise_ID'];
}

// Latest entry per exercise for this user
$entries = [];
foreach ($exerciseNames as $exName) {
    $stmt = $conn->prepare(
        "SELECT e.weight, e.reps, e.date, e.bodyWeight
         FROM Entry e
         JOIN exercise ex ON ex.exercise_ID = e.exercise_exercise_ID
         WHERE e.user_user_ID = ? AND ex.exercise = ?
         ORDER BY e.date DESC
         LIMIT 1"
    );
    $stmt->bind_param("is", $userId, $exName);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($row) {
        $entries[$exName] = [
            'weight'     => (float)$row['weight'],
            'reps'       => (int)$row['reps'],
            'date'       => $row['date'],
            'bodyWeight' => (float)$row['bodyWeight'],
        ];
    }
}

echo json_encode([
    'bodyWeight'  => (float)($userRow['bodyWeight'] ?? 70),
    'sex'         => $userRow['sex'] ?? 'male',
    'exerciseIds' => $exerciseIds,
    'entries'     => $entries,
]);
