<?php
require_once '../config/database.php';

$action = $_GET['action'] ?? '';

if ($action === 'logout') {
    session_destroy();
    header('Location: ../public/login/login.php');
    exit;
}

http_response_code(400);
echo 'Unknown action';
