<?php
session_start();

// MySQL database information
$db_host = "localhost";
$db_datenbank = "neonkangaroo";
$db_username = "root";
$db_passwort = "root";

// open database connection
$conn = new mysqli($db_host, $db_username, $db_passwort, $db_datenbank);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}