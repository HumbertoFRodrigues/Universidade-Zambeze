<?php
// Exibe erros para facilitar a depuração
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include '../db_conexao.php'; // Certifique-se de que o caminho está correto
$mensagem = "";

function executeQuery($conn, $sql) {
    if ($conn->query($sql) === TRUE) {
        return true;
    } else {
        echo "Erro na execução da query: " . $conn->error;
        return false;
    }
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST['adicionar'])) {
        // Obtenção dos dados do formulário e tratamento de entradas
        $nome = $conn->real_escape_string($_POST['nome']);
        $data_aquisicao = $conn->real_escape_string($_POST['data_aquisicao']);
        $numero_animais = (int)$_POST['numero_animais'];
        $numero_femeas = (int)$_POST['numero_femeas'];
        $peso_maximo = (float)$_POST['peso_maximo'];
        $viabilidade_acasalamento = $conn->real_escape_string($_POST['viabilidade_acasalamento']);
        $idade_maxima = (int)$_POST['idade_maxima'];
        $grupo = $conn->real_escape_string($_POST['grupo']);

        // Processo de upload de imagem
        $target_dir = "uploads/";
        $target_file = $target_dir . basename($_FILES["imagem"]["name"]);
        $uploadOk = 1;

        // Verificação se o arquivo é uma imagem
        $check = getimagesize($_FILES["imagem"]["tmp_name"]);
        if ($check === false) {
            $mensagem = "Arquivo não é uma imagem.";
            $uploadOk = 0;
        }

        // Verifica se há algum erro no upload do arquivo
        if ($_FILES["imagem"]["error"] !== UPLOAD_ERR_OK) {
            $mensagem = "Erro no upload do arquivo.";
            $uploadOk = 0;
        }

        // Verifica e move o arquivo para o diretório de uploads
        if ($uploadOk == 1) {
            if (move_uploaded_file($_FILES["imagem"]["tmp_name"], $target_file)) {
                // Insere os dados na base de dados
                $sql = "INSERT INTO especies (nome, data_aquisicao, numero_animais, numero_femeas, peso_maximo, viabilidade_acasalamento, idade_maxima, imagem, grupo)
                        VALUES ('$nome', '$data_aquisicao', $numero_animais, $numero_femeas, $peso_maximo, '$viabilidade_acasalamento', $idade_maxima, '$target_file', '$grupo')";
                
                if (executeQuery($conn, $sql)) {
                    $mensagem = "Espécie cadastrada com sucesso!";
                } else {
                    $mensagem = "Erro ao cadastrar a espécie.";
                }
            } else {
                $mensagem = "Erro ao mover o arquivo para a pasta de uploads.";
            }
        }
    } else {
        $mensagem = "Ação não definida.";
    }
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Gerenciar Espécies</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        /* Estilos do formulário e mensagens */
        .mensagem {
            text-align: center;
            margin-bottom: 20px;
            padding: 10px;
            border-radius: 5px;
            color: #fff;
        }
        .sucesso { background-color: #5cb85c; }
        .erro { background-color: #d9534f; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Adicionar Espécie</h1>

        <!-- Exibe mensagem de status -->
        <?php if (!empty($mensagem)): ?>
            <div class="mensagem <?php echo strpos($mensagem, 'sucesso') !== false ? 'sucesso' : 'erro'; ?>">
                <?php echo $mensagem; ?>
            </div>
        <?php endif; ?>

        <form action="" method="post" enctype="multipart/form-data">
            <!-- Campos do formulário -->
            <label for="nome">Nome:</label>
            <input type="text" id="nome" name="nome" required>
            <label for="data_aquisicao">Data de Aquisição:</label>
            <input type="date" id="data_aquisicao" name="data_aquisicao" required>
            <label for="numero_animais">Número de Animais:</label>
            <input type="number" id="numero_animais" name="numero_animais" required>
            <label for="numero_femeas">Número de Fêmeas:</label>
            <input type="number" id="numero_femeas" name="numero_femeas" required>
            <label for="peso_maximo">Peso Máximo (kg):</label>
            <input type="number" id="peso_maximo" name="peso_maximo" step="0.1" required>
            <label for="viabilidade_acasalamento">Viabilidade de Acasalamento:</label>
            <input type="text" id="viabilidade_acasalamento" name="viabilidade_acasalamento" required>
            <label for="idade_maxima">Idade Máxima:</label>
            <input type="number" id="idade_maxima" name="idade_maxima" required>
            <label for="grupo">Grupo:</label>
            <input type="text" id="grupo" name="grupo" required>
            <label for="imagem">Imagem:</label>
            <input type="file" id="imagem" name="imagem" required>

            <input type="submit" name="adicionar" value="Adicionar Espécie">
        </form>
    </div>
</body>
</html>
