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

// Verifica se o ID do usuário foi enviado
if (!isset($_POST['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'ID do usuário não fornecido.']);
    exit;
}

$user_id = $_POST['user_id'];

// Atualiza os dados do usuário visitante
$update_stmt = $conn->prepare("UPDATE usuarios SET username = :username, nome = :nome, email = :email WHERE id = :id AND nivel_id = 3");
$update_stmt->execute([
    'username' => $_POST['username'],
    'nome' => $_POST['nome'],
    'email' => $_POST['email'],
    'id' => $user_id
]);

echo json_encode(['success' => true]);
?>
