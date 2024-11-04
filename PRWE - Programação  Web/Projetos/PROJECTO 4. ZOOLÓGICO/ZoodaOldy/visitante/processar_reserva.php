<?php
// Iniciar a sessão se ainda não estiver ativa
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Verifique se o usuário está logado
if (!isset($_SESSION['user_id'])) {
    http_response_code(403); // Acesso negado
    exit("Acesso negado: você precisa estar logado.");
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
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Obter dados da reserva
    $user_id = $_SESSION['user_id']; // ID do usuário logado
    $adultos = $_POST['adultos'];
    $criancas = $_POST['criancas'];
    $safari = $_POST['safari'];
    $alimentacao = $_POST['alimentacao'];
    $hospedagem = $_POST['hospedagem'];
    $espaco_evento = $_POST['espaco_evento'];

    // Calcular total
    $total_bilhete = ($adultos * 200) + ($criancas * 100);
    $total_safari = $safari * 500;
    $total_alimentacao = $alimentacao * 150;
    $total_hospedagem = $hospedagem * 1000;
    $total_evento = $espaco_evento * 2000;

    $total_final = $total_bilhete + $total_safari + $total_alimentacao + $total_hospedagem + $total_evento;

    // Inserir reserva no banco de dados
    $stmt = $pdo->prepare("INSERT INTO reservas (user_id, adultos, criancas, safari, alimentacao, hospedagem, espaco_evento, total) VALUES (:user_id, :adultos, :criancas, :safari, :alimentacao, :hospedagem, :espaco_evento, :total)");
    $stmt->execute([
        'user_id' => $user_id,
        'adultos' => $adultos,
        'criancas' => $criancas,
        'safari' => $safari,
        'alimentacao' => $alimentacao,
        'hospedagem' => $hospedagem,
        'espaco_evento' => $espaco_evento,
        'total' => $total_final
    ]);

    echo "Reserva realizada com sucesso! Total: " . number_format($total_final, 2) . " MZN";

} catch (PDOException $e) {
    http_response_code(500); // Erro do servidor
    echo "Erro na conexão com o banco de dados: " . htmlspecialchars($e->getMessage());
}
?>
