<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require '../db_conexao.php';

// Verifica se o usuário é funcionário
if (!isset($_SESSION['user_id']) || $_SESSION['nivel_id'] != 2) {
    echo json_encode(['success' => false, 'error' => 'Acesso negado.']);
    exit;
}

$conn = conectarBancoDeDados();

// Verifica se foi passado o ID do usuário
if (!isset($_GET['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'ID do usuário não fornecido.']);
    exit;
}

$user_id = $_GET['user_id'];

// Busca informações do usuário visitante
$stmt = $conn->prepare("SELECT * FROM usuarios WHERE id = :id AND nivel_id = 3");
$stmt->execute(['id' => $user_id]);
$usuario = $stmt->fetch(PDO::FETCH_ASSOC);

if ($usuario) {
    echo json_encode(['success' => true, 'usuario' => $usuario]);
} else {
    echo json_encode(['success' => false, 'error' => 'Usuário não encontrado ou você não tem permissão para acessá-lo.']);
}
?>
