<?php
// Verifica se a sessão está ativa, caso contrário, inicia uma sessão
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require '../db_conexao.php'; // Conectar ao banco de dados

// Verifique se o ID do usuário foi fornecido pela solicitação AJAX
if (!isset($_POST['user_id']) || empty($_POST['user_id'])) {
    http_response_code(400); // Erro de solicitação ruim
    echo json_encode(['error' => 'ID do usuário não fornecido.']);
    exit();
}

$user_id = intval($_POST['user_id']); // Obter o ID do usuário e garantir que seja um valor inteiro

try {
    // Conectar ao banco de dados
    $conn = conectarBancoDeDados();

    // Gerar um token único para o login temporário
    $token = bin2hex(random_bytes(16));

    // Definir o tempo de expiração (30 minutos a partir de agora)
    $expira_em = new DateTime('now', new DateTimeZone('Africa/Harare'));
    $expira_em->modify('+30 minutes');

    // Inserir o registro de login temporário no banco de dados
    $stmt = $conn->prepare("INSERT INTO logins_temporarios (user_id, token, expira_em) VALUES (?, ?, ?)");
    $stmt->execute([$user_id, $token, $expira_em->format('Y-m-d H:i:s')]);

    // Retornar o link para o login temporário
    $link_temporario = "http://localhost/zoo_da_oldy/login_temporario.php?token=" . $token;

    echo json_encode(['link' => $link_temporario]);
} catch (PDOException $e) {
    http_response_code(500); // Erro interno do servidor
    echo json_encode(['error' => 'Erro ao conectar ao banco de dados: ' . $e->getMessage()]);
}
?>
