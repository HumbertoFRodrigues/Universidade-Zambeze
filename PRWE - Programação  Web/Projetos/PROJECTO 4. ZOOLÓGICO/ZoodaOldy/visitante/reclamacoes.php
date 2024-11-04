<?php
// Iniciar a sessão se ainda não estiver ativa
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Simular um usuário logado (remova isso em produção)
$_SESSION['user_id'] = 1; // Apenas para teste

// Verifique se o usuário está logado
if (!isset($_SESSION['user_id'])) {
    http_response_code(403); // Acesso negado
    exit;
}

// Conexão com o banco de dados
$host = 'localhost';
$db = 'zoo_da_oldy';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Processar a reclamação
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $type = $_POST['type'];
        $comments = $_POST['comments'] ?? '';
        $suggestions = $_POST['suggestions'] ?? '';
        $animalIssue = $_POST['animalIssue'] ?? null;
        $animalRemarks = $_POST['animalRemarks'] ?? '';
        $audio = $_FILES['audio'] ?? null;

        // Prepare a consulta
        $stmt = $pdo->prepare("INSERT INTO reclamacoes (user_id, tipo, comentarios, sugestoes, problema_animal, comentarios_animal, audio) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $_SESSION['user_id'],
            $type,
            $comments,
            $suggestions,
            $animalIssue,
            $animalRemarks,
            $audio ? file_get_contents($audio['tmp_name']) : null
        ]);

        echo json_encode(['message' => 'Reclamação enviada com sucesso!']);
        exit;
    }
} catch (PDOException $e) {
    http_response_code(500); // Erro do servidor
    echo json_encode(['error' => 'Erro na conexão com o banco de dados: ' . $e->getMessage()]);
}
?>
