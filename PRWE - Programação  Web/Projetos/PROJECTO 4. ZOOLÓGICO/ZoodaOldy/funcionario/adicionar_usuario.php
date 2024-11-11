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

// Insere um novo usuário visitante
$insert_stmt = $conn->prepare("INSERT INTO usuarios (username, password, nome, email, nivel_id) VALUES (:username, :password, :nome, :email, 3)");
$insert_stmt->execute([
    'username' => $_POST['username'],
    'password' => password_hash($_POST['password'], PASSWORD_DEFAULT),
    'nome' => $_POST['nome'],
    'email' => $_POST['email']
]);

echo json_encode(['success' => true]);
?>  