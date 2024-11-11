<?php
// Iniciar a sessão se ainda não estiver ativa
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Verificar se o usuário está logado e se é admin ou funcionário
if (!isset($_SESSION['user_id']) || ($_SESSION['nivel_id'] != 1 && $_SESSION['nivel_id'] != 2)) {
    http_response_code(403); // Acesso negado
    echo json_encode(['error' => 'Acesso negado.']);
    exit();
}

// Verificar se os dados foram enviados corretamente
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_POST['reclamacaoId']) || !isset($_POST['resposta'])) {
    http_response_code(400); // Dados inválidos
    echo json_encode(['error' => 'Dados inválidos fornecidos.']);
    exit();
}

$reclamacaoId = $_POST['reclamacaoId'];
$resposta = trim($_POST['resposta']);

// Verificar se a resposta não está vazia
if (empty($resposta)) {
    http_response_code(400); // Dados inválidos
    echo json_encode(['error' => 'A resposta não pode estar vazia.']);
    exit();
}

// Configurações de conexão com o banco de dados
$host = 'localhost';
$db = 'zoo_da_oldy';
$user = 'root';
$pass = '';

try {
    // Conexão com o banco de dados usando PDO
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Preparar a consulta para atualizar a resposta da reclamação
    $stmt = $pdo->prepare("UPDATE reclamacoes SET resposta = :resposta WHERE id = :id");
    $stmt->execute([
        ':resposta' => $resposta,
        ':id' => $reclamacaoId
    ]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Nenhuma reclamação foi encontrada ou não foi possível atualizar.']);
    }

} catch (PDOException $e) {
    http_response_code(500); // Erro do servidor
    echo json_encode(['error' => 'Erro na conexão com o banco de dados: ' . $e->getMessage()]);
}
?>
