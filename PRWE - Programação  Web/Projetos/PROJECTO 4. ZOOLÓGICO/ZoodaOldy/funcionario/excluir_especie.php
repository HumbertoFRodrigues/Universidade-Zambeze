<?php
// Inicia a sessão apenas se ela não estiver ativa
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require '../db_conexao.php';

// Verifica se o usuário está logado e é um administrador ou funcionário (nível_id 1 ou 2)
if (!isset($_SESSION['user_id']) || ($_SESSION['nivel_id'] != 1 && $_SESSION['nivel_id'] != 2)) {
    echo "Acesso negado. Você não tem permissão para acessar esta página.";
    exit;
}

$conn = conectarBancoDeDados();

// Verifica se o ID da espécie foi enviado
if (!isset($_GET['id'])) {
    echo "ID da espécie não fornecido.";
    exit;
}

$id = $_GET['id'];

// Exclui a espécie do banco de dados
$stmt = $conn->prepare("DELETE FROM especies WHERE id = ?");
$stmt->execute([$id]);

echo "Espécie excluída com sucesso!";
exit;
?>
