<?php
require_once '../config/database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$userId = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// GET: all entries for one exercise (query by name to avoid duplicate-ID issues)
if ($method === 'GET') {
    $exerciseName = $_GET['exercise'] ?? '';
    if ($exerciseName === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Missing exercise']);
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT e.weight, e.reps, e.date, e.bodyWeight
         FROM Entry e
         JOIN exercise ex ON ex.exercise_ID = e.exercise_exercise_ID
         WHERE e.user_user_ID = ? AND ex.exercise = ?
         ORDER BY e.date ASC"
    );
    $stmt->bind_param("is", $userId, $exerciseName);
    $stmt->execute();

    if ($stmt->error) {
        // bodyWeight column might not exist yet — retry without it
        $stmt->close();
        $stmt = $conn->prepare(
            "SELECT e.weight, e.reps, e.date, 0 as bodyWeight
             FROM Entry e
             JOIN exercise ex ON ex.exercise_ID = e.exercise_exercise_ID
             WHERE e.user_user_ID = ? AND ex.exercise = ?
             ORDER BY e.date ASC"
        );
        $stmt->bind_param("is", $userId, $exerciseName);
        $stmt->execute();
    }

    $result = $stmt->get_result();
    $stmt->close();

    $entries = [];
    while ($row = $result->fetch_assoc()) {
        $entries[] = [
            'weight'     => (float)$row['weight'],
            'reps'       => (int)$row['reps'],
            'date'       => $row['date'],
            'bodyWeight' => (float)$row['bodyWeight'],
        ];
    }

    echo json_encode($entries);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// DELETE: by exercise_id + date
if ($method === 'DELETE') {
    $exerciseId = (int)($data['exercise_id'] ?? 0);
    $date       = $data['date'] ?? '';

    $stmt = $conn->prepare(
        "DELETE FROM Entry
         WHERE user_user_ID = ? AND exercise_exercise_ID = ? AND date = ?
         LIMIT 1"
    );
    $stmt->bind_param("iis", $userId, $exerciseId, $date);
    $stmt->execute();
    $stmt->close();

    echo json_encode(['success' => true]);
    exit;
}

// PUT: update by exercise_id + date
// types: d=weight, i=reps, i=userId, i=exerciseId, s=date  →  "diiis"
if ($method === 'PUT') {
    $exerciseId = (int)($data['exercise_id'] ?? 0);
    $date       = $data['date'] ?? '';
    $weight     = (float)($data['weight'] ?? 0);
    $reps       = (int)($data['reps'] ?? 0);

    if ($exerciseId <= 0 || $date === '' || $weight < 0 || $reps < 1) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid input']);
        exit;
    }

    $stmt = $conn->prepare(
        "UPDATE Entry SET weight = ?, reps = ?
         WHERE user_user_ID = ? AND exercise_exercise_ID = ? AND date = ?
         LIMIT 1"
    );
    $stmt->bind_param("diiis", $weight, $reps, $userId, $exerciseId, $date);
    $stmt->execute();
    $stmt->close();

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
