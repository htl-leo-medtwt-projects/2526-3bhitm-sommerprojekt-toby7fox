<?php
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$userId = (int)$_SESSION['user_id'];

$conn->query("ALTER TABLE `user` ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255) DEFAULT NULL");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$file = $_FILES['avatar'] ?? null;
if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Upload failed']);
    exit;
}

if ($file['size'] > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['error' => 'File too large (max 5MB)']);
    exit;
}

$finfo    = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);
$allowed  = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

if (!in_array($mimeType, $allowed)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type']);
    exit;
}

$extMap   = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'];
$ext      = $extMap[$mimeType];
$filename = 'user_' . $userId . '_' . time() . '.' . $ext;
$uploadDir = __DIR__ . '/../public/uploads/avatars/';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Delete old avatar file
$stmt = $conn->prepare("SELECT profile_picture FROM `user` WHERE user_ID = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$old = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!empty($old['profile_picture'])) {
    $oldPath = __DIR__ . '/../public/' . $old['profile_picture'];
    if (file_exists($oldPath)) {
        unlink($oldPath);
    }
}

if (!move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not save file']);
    exit;
}

$dbPath = 'uploads/avatars/' . $filename;

$stmt = $conn->prepare("UPDATE `user` SET profile_picture = ? WHERE user_ID = ?");
$stmt->bind_param("si", $dbPath, $userId);
$stmt->execute();
$stmt->close();

echo json_encode(['success' => true, 'path' => $dbPath]);
