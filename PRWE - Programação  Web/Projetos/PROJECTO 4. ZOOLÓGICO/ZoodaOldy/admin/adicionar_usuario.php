<?php
require '../db_conexao.php';

header('Content-Type: application/json');

try {
    $conn = conectarBancoDeDados();

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $username = $_POST['username'];
        $nivel_id = $_POST['nivel_id'];
        $password = password_hash($_POST['password'], PASSWORD_BCRYPT);
        $nome = $_POST['nome'];
        $apelido = $_POST['apelido'];
        $sexo = $_POST['sexo'];
        $endereco = $_POST['endereco'];
        $nacionalidade = $_POST['nacionalidade'];
        $telefone = $_POST['telefone'];
        $data_nascimento = $_POST['data_nascimento'];
        $email = $_POST['email'];
        $ocupacao = $_POST['ocupacao'];

        $stmt = $conn->prepare("INSERT INTO usuarios (username, nivel_id, password, nome, apelido, sexo, endereco, nacionalidade, telefone, data_nascimento, email, ocupacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$username, $nivel_id, $password, $nome, $apelido, $sexo, $endereco, $nacionalidade, $telefone, $data_nascimento, $email, $ocupacao]);

        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Método de requisição inválido.']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
