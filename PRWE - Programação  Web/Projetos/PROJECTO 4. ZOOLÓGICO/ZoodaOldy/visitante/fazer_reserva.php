<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require '../db_conexao.php';

// Verifica se o usuário é visitante
if (!isset($_SESSION['user_id']) || $_SESSION['nivel_id'] != 3) {
    echo json_encode(['success' => false, 'error' => 'Acesso negado.']);
    exit;
}

$conn = conectarBancoDeDados();

// Coleta dados do formulário
$user_id = $_SESSION['user_id'];
$tipo_reserva = $_POST['tipo_reserva'];
$data_reserva = $_POST['data_reserva'];
$num_adultos = isset($_POST['num_adultos']) ? $_POST['num_adultos'] : 0;
$num_criancas = isset($_POST['num_criancas']) ? $_POST['num_criancas'] : 0;
$num_pessoas = isset($_POST['num_pessoas']) ? $_POST['num_pessoas'] : 0;
$num_quartos = isset($_POST['num_quartos']) ? $_POST['num_quartos'] : 0;

// Calcula o valor da reserva
$valor_total = 0;

if ($tipo_reserva == 'entrada') {
    $valor_total = ($num_adultos * 200) + ($num_criancas * 100);
} elseif ($tipo_reserva == 'safari') {
    $valor_total = 500;
} elseif ($tipo_reserva == 'alimentacao') {
    $valor_total = $num_pessoas * 150;
} elseif ($tipo_reserva == 'hospedagem') {
    $valor_total = $num_quartos * 1000;
} elseif ($tipo_reserva == 'evento') {
    $valor_total = 2000;
}

// Inserir reserva na base de dados
$stmt = $conn->prepare("INSERT INTO reservas (user_id, tipo_reserva, data_reserva, valor_total, status) VALUES (:user_id, :tipo_reserva, :data_reserva, :valor_total, 'Aguardando Aprovação')");
$stmt->execute([
    'user_id' => $user_id,
    'tipo_reserva' => $tipo_reserva,
    'data_reserva' => $data_reserva,
    'valor_total' => $valor_total
]);

echo json_encode(['success' => true]);
?>
