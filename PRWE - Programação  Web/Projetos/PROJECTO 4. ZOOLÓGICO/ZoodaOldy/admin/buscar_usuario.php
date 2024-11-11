<?php
require '../db_conexao.php';

header('Content-Type: application/json');

try {
    $conn = conectarBancoDeDados();

    if (isset($_GET['user_id'])) {
        $user_id = $_GET['user_id'];

        $stmt = $conn->prepare("SELECT * FROM usuarios WHERE id = ?");
        $stmt->execute([$user_id]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($usuario) {
            echo json_encode(['success' => true, 'usuario' => $usuario]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Usuário não encontrado.']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'ID do usuário não fornecido.']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
