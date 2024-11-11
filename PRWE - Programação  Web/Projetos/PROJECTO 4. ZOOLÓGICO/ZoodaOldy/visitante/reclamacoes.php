<?php
// Iniciar a sessão se ainda não estiver ativa
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Verificar se o usuário está logado
if (!isset($_SESSION['user_id'])) {
    http_response_code(403); // Acesso negado
    echo json_encode(['error' => 'Acesso negado. Por favor, faça login para enviar uma reclamação.']);
    exit;
}

// Conexão com o banco de dados
$host = 'localhost';
$db = 'zoo_da_oldy';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Processar a reclamação
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $type = $_POST['type'];
        $comments = $_POST['comments'] ?? '';
        $suggestions = $_POST['suggestions'] ?? '';
        $animalIssue = $_POST['animalIssue'] ?? null;
        $animalRemarks = $_POST['animalRemarks'] ?? '';
        $audio = $_POST['audio'] ?? null;

        // Definindo o caminho do diretório de uploads fora da pasta do projeto
        $uploadsDir = __DIR__ . '/../uploads';

        // Cria o diretório 'uploads' se não existir
        if (!file_exists($uploadsDir)) {
            mkdir($uploadsDir, 0777, true);
        }

        // Verificar se o áudio foi enviado e processar o áudio
        $audioPath = null;
        if (!empty($audio)) {
            $audioData = base64_decode(preg_replace('#^data:audio/\w+;base64,#i', '', $audio));
            $audioFileName = time() . '.wav';
            $audioPath = $uploadsDir . '/' . $audioFileName;

            file_put_contents($audioPath, $audioData);
            $audioPath = '../uploads/' . $audioFileName; // Guardar caminho relativo ao áudio
        }

        // Prepare a consulta para inserir a reclamação no banco de dados
        $stmt = $pdo->prepare("INSERT INTO reclamacoes (user_id, tipo, comentarios, sugestoes, problema_animal, comentarios_animal, audio) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $_SESSION['user_id'], // Usando o ID do usuário logado para garantir que a reclamação é associada ao usuário correto
            $type,
            $comments,
            $suggestions,
            $animalIssue,
            $animalRemarks,
            $audioPath // Salvar o caminho do áudio no banco de dados
        ]);

        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode(['message' => 'Reclamação enviada com sucesso!']);
        exit();
    }
} catch (PDOException $e) {
    http_response_code(500); // Erro do servidor
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(['error' => 'Erro na conexão com o banco de dados: ' . $e->getMessage()]);
    exit();
}
?>
