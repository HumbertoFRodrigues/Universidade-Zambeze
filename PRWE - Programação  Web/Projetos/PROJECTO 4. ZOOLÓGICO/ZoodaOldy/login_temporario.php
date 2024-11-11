<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Iniciar a sessão se ainda não estiver ativa
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require 'db_conexao.php'; // Importando o arquivo de conexão com o banco de dados

// Definir o fuso horário
date_default_timezone_set('Africa/Harare');

// Verificar se o token foi fornecido
if (!isset($_GET['token'])) {
    echo "Token não fornecido.";
    exit();
}

$token = $_GET['token'];
$conn = conectarBancoDeDados();

try {
    // Verificar se o token é válido e ainda não expirou
    $stmt = $conn->prepare("SELECT * FROM logins_temporarios WHERE token = ? AND expira_em > NOW()");
    $stmt->execute([$token]);
    $login_temporario = $stmt->fetch(PDO::FETCH_ASSOC);

    // Debugging - Verificar informações importantes
    var_dump($token); // Exibir o token fornecido
    var_dump($login_temporario); // Exibir o resultado da consulta ao banco de dados

    if (!$login_temporario) {
        echo "Link expirado ou inválido.";
        exit();
    }

    // Se o token for válido, iniciar a sessão para o usuário correspondente
    $_SESSION['user_id'] = $login_temporario['user_id'];

    // Buscar o nível de acesso do usuário
    $stmt_usuario = $conn->prepare("SELECT nivel_id FROM usuarios WHERE id = ?");
    $stmt_usuario->execute([$_SESSION['user_id']]);
    $usuario = $stmt_usuario->fetch(PDO::FETCH_ASSOC);

    if ($usuario) {
        $_SESSION['nivel_id'] = $usuario['nivel_id'];

        // Redirecionar para o painel apropriado
        switch ($usuario['nivel_id']) {
            case 1: // Administrador
                header("Location: admin/painel.php?page=estatistica");
                exit();
            case 2: // Funcionário
                header("Location: funcionario/painel.php?page=estatistica");
                exit();
            case 3: // Visitante
                header("Location: visitante/painel.php?page=estatistica");
                exit();
            default:
                echo "Nível de usuário inválido.";
                exit();
        }
    } else {
        echo "Usuário não encontrado.";
        exit();
    }
} catch (PDOException $e) {
    echo "Erro na conexão com o banco de dados: " . $e->getMessage();
    exit();
}
?>
