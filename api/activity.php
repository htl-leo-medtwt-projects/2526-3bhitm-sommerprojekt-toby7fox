<?php
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$userId = (int)$_SESSION['user_id'];

$conn->query("CREATE TABLE IF NOT EXISTS activity (
    activity_ID  INT AUTO_INCREMENT PRIMARY KEY,
    user_user_ID INT NOT NULL,
    type         ENUM('gym','bike','run','swim','ballsport') NOT NULL,
    date         DATE NOT NULL,
    sets         INT        NOT NULL DEFAULT 0,
    km           FLOAT      NOT NULL DEFAULT 0,
    hm           FLOAT      NOT NULL DEFAULT 0,
    meters       INT        NOT NULL DEFAULT 0,
    hours        FLOAT      NOT NULL DEFAULT 0,
    intense      TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (user_user_ID) REFERENCES user(user_ID)
)");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $conn->prepare(
        "SELECT activity_ID, type, date, sets, km, hm, meters, hours, intense
         FROM activity WHERE user_user_ID = ? ORDER BY date DESC, activity_ID DESC"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $activities = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    echo json_encode(['activities' => $activities]);
    exit;
}

if ($method === 'POST') {
    $data    = json_decode(file_get_contents('php://input'), true) ?? [];
    $type    = $data['type'] ?? '';
    $date    = $data['date'] ?? date('Y-m-d');
    $sets    = (int)($data['sets']    ?? 0);
    $km      = (float)($data['km']   ?? 0);
    $hm      = (float)($data['hm']   ?? 0);
    $meters  = (int)($data['meters'] ?? 0);
    $hours   = (float)($data['hours'] ?? 0);
    $intense = (int)(bool)($data['intense'] ?? false);

    if (!in_array($type, ['gym','bike','run','swim','ballsport'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid type']);
        exit;
    }

    $stmt = $conn->prepare(
        "INSERT INTO activity (user_user_ID, type, date, sets, km, hm, meters, hours, intense)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("issiddidi", $userId, $type, $date, $sets, $km, $hm, $meters, $hours, $intense);
    $ok = $stmt->execute();
    if (!$ok) {
        http_response_code(500);
        echo json_encode(['error' => $stmt->error]);
        exit;
    }
    $stmt->close();
    echo json_encode(['success' => true]);
    exit;
}

if ($method === 'PUT') {
    $data    = json_decode(file_get_contents('php://input'), true) ?? [];
    $id      = (int)($data['activity_ID'] ?? 0);
    $sets    = (int)($data['sets']    ?? 0);
    $km      = (float)($data['km']    ?? 0);
    $hm      = (float)($data['hm']    ?? 0);
    $meters  = (int)($data['meters']  ?? 0);
    $hours   = (float)($data['hours'] ?? 0);
    $intense = (int)(bool)($data['intense'] ?? false);
    $date    = $data['date'] ?? date('Y-m-d');

    $stmt = $conn->prepare(
        "UPDATE activity SET date=?, sets=?, km=?, hm=?, meters=?, hours=?, intense=?
         WHERE activity_ID=? AND user_user_ID=?"
    );
    $stmt->bind_param("siddidiii", $date, $sets, $km, $hm, $meters, $hours, $intense, $id, $userId);
    $ok = $stmt->execute();
    if (!$ok) { http_response_code(500); echo json_encode(['error' => $stmt->error]); exit; }
    $stmt->close();
    echo json_encode(['success' => true]);
    exit;
}

if ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int)($data['activity_ID'] ?? 0);
    $stmt = $conn->prepare("DELETE FROM activity WHERE activity_ID=? AND user_user_ID=?");
    $stmt->bind_param("ii", $id, $userId);
    $stmt->execute();
    $stmt->close();
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
