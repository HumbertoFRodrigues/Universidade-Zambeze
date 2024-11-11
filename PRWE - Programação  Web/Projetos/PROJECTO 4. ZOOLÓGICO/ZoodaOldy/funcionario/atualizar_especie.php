<?php
// Inicia a sessão apenas se ela não estiver ativa
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Inclui o arquivo de conexão com o banco de dados
require '../db_conexao.php';

// Verifica se a conexão foi criada
$conn = conectarBancoDeDados();
if (!$conn) {
    die("Erro ao conectar ao banco de dados.");
}

// Verifica se a solicitação é um POST para atualização de dados
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Coleta os dados do formulário e define valores padrão para campos não preenchidos
    $especie_id = $_POST['especie_id'];
    $nome = $_POST['nome'];
    $tipo = $_POST['tipo'];
    $data_aquisicao = $_POST['data_aquisicao'];
    $num_animais = $_POST['num_animais'];
    $num_femeas = $_POST['num_femeas'];
    $gestacao_duracao = $_POST['gestacao_duracao'];
    $peso_maximo = $_POST['peso_maximo'];
    $comprimento_min = $_POST['comprimento_min'] ?? 0; // valor padrão se não fornecido
    $comprimento_max = $_POST['comprimento_max'] ?? 0; // valor padrão se não fornecido
    $dieta = $_POST['dieta'];
    $cor_caracteristica = $_POST['cor_caracteristica'];
    $mes_acasalamento_inicio = $_POST['mes_acasalamento_inicio'];
    $mes_acasalamento_fim = $_POST['mes_acasalamento_fim'];
    $idade_maxima = $_POST['idade_maxima'];

    // Prepara a consulta SQL para atualização
    try {
        $stmt = $conn->prepare("UPDATE especies SET nome = ?, tipo = ?, data_aquisicao = ?, num_animais = ?, num_femeas = ?, gestacao_duracao = ?, peso_maximo = ?, comprimento_min = ?, comprimento_max = ?, dieta = ?, cor_caracteristica = ?, mes_acasalamento_inicio = ?, mes_acasalamento_fim = ?, idade_maxima = ? WHERE id = ?");
        
        $stmt->execute([
            $nome, $tipo, $data_aquisicao, $num_animais, $num_femeas, $gestacao_duracao, 
            $peso_maximo, $comprimento_min, $comprimento_max, $dieta, $cor_caracteristica, 
            $mes_acasalamento_inicio, $mes_acasalamento_fim, $idade_maxima, $especie_id
        ]);

        echo "Espécie atualizada com sucesso!";
    } catch (PDOException $e) {
        echo "Erro ao atualizar espécie: " . $e->getMessage();
    }
}
?>
