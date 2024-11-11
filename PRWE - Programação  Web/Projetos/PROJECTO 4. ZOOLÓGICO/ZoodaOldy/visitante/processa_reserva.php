<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require '../db_conexao.php';

// Verifica se o usuário está logado e é um visitante (nível_id 3)
if (!isset($_SESSION['user_id']) || $_SESSION['nivel_id'] != 3) {
    echo "Acesso negado. Você não tem permissão para acessar esta página.";
    exit;
}

$conn = conectarBancoDeDados();

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Coletar informações da reserva do formulário
    $tipo_reserva = $_POST['tipo_reserva'];
    $quantidade = $_POST['quantidade'];

    // Definir preços para cada tipo de reserva
    $precos = [
        'entrada_adulto' => 200,
        'entrada_crianca' => 100,
        'safari' => 500,
        'alimentacao' => 150,
        'hospedagem' => 1000,
        'evento' => 2000
    ];

    // Calcular o valor total
    $valor_total = isset($precos[$tipo_reserva]) ? $precos[$tipo_reserva] * $quantidade : 0;

    // Inserir a nova reserva no banco de dados
    $stmt = $conn->prepare("INSERT INTO reservas (user_id, tipo_reserva, valor_total) VALUES (?, ?, ?)");
    if ($stmt->execute([$_SESSION['user_id'], $tipo_reserva, $valor_total])) {
        echo "Reserva realizada com sucesso!";
    } else {
        echo "Erro ao realizar a reserva. Tente novamente.";
    }
}
?>
