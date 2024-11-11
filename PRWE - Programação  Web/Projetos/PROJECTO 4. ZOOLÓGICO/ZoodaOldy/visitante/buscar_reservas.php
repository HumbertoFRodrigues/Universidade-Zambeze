<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require '../db_conexao.php';

// Verifica se o usuário está logado e é um visitante (nível_id 3)
if (!isset($_SESSION['user_id']) || $_SESSION['nivel_id'] != 3) {
    echo json_encode([]);
    exit;
}

$conn = conectarBancoDeDados();

// Obter reservas do usuário logado
$stmt = $conn->prepare("SELECT * FROM reservas WHERE user_id = ?");
$stmt->execute([$_SESSION['user_id']]);
$reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($reservas);
?>
