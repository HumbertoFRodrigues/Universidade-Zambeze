<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require '../db_conexao.php';

// Verifica se o usuário é funcionário ou administrador
if (!isset($_SESSION['user_id']) || ($_SESSION['nivel_id'] != 1 && $_SESSION['nivel_id'] != 2)) {
    echo json_encode(['success' => false, 'error' => 'Acesso negado.']);
    exit;
}

$conn = conectarBancoDeDados();

$reserva_id = $_GET['reserva_id'];

$stmt = $conn->prepare("SELECT * FROM reservas WHERE id = :reserva_id");
$stmt->execute(['reserva_id' => $reserva_id]);
$reserva = $stmt->fetch(PDO::FETCH_ASSOC);

if ($reserva) {
    echo json_encode(['success' => true, 'reserva' => $reserva]);
} else {
    echo json_encode(['success' => false, 'error' => 'Reserva não encontrada.']);
}
?>
