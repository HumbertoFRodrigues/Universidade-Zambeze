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

$reserva_id = $_POST['reserva_id'];
$valor_total = $_POST['valor_total'];
$status = $_POST['status'];

$stmt = $conn->prepare("UPDATE reservas SET valor_total = :valor_total, status = :status WHERE id = :reserva_id");
$stmt->execute([
    'valor_total' => $valor_total,
    'status' => $status,
    'reserva_id' => $reserva_id
]);

echo json_encode(['success' => true]);
?>
