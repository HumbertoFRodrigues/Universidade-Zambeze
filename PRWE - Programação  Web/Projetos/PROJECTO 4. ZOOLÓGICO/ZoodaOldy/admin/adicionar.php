<?php
include '../db_conexao.php'; // Verifique se o caminho está correto

// Verifica se o formulário foi enviado
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nome = $conn->real_escape_string($_POST['nome']);
    $data_aquisicao = $conn->real_escape_string($_POST['data_aquisicao']);
    $numero_animais = (int)$_POST['numero_animais'];
    $numero_femeas = (int)$_POST['numero_femeas'];
    $peso_maximo = (float)$_POST['peso_maximo'];
    $viabilidade_acasalamento = $conn->real_escape_string($_POST['viabilidade_acasalamento']);
    $idade_maxima = (int)$_POST['idade_maxima'];

    // Processar upload de imagem
    $target_dir = "uploads/";
    $target_file = $target_dir . basename($_FILES["imagem"]["name"]);
    $uploadOk = 1;

    // Verificar se a imagem é um arquivo de imagem real
    $check = getimagesize($_FILES["imagem"]["tmp_name"]);
    if($check === false) {
        echo "Arquivo não é uma imagem.";
        $uploadOk = 0;
    }

    // Verificar se houve erro no upload
    if ($_FILES["imagem"]["error"] !== UPLOAD_ERR_OK) {
        echo "Erro no upload do arquivo.";
        $uploadOk = 0;
    }

    // Verificar se $uploadOk é 0 por um erro
    if ($uploadOk == 1) {
        // Mover o arquivo para a pasta de uploads
        if (move_uploaded_file($_FILES["imagem"]["tmp_name"], $target_file)) {
            // Inserir os dados no banco
            $sql = "INSERT INTO especies (nome, data_aquisicao, numero_animais, numero_femeas, peso_maximo, viabilidade_acasalamento, idade_maxima, imagem)
                    VALUES ('$nome', '$data_aquisicao', $numero_animais, $numero_femeas, $peso_maximo, '$viabilidade_acasalamento', $idade_maxima, '$target_file')";

            if ($conn->query($sql) === TRUE) {
                header("Location: especies.php");
                exit();
            } else {
                echo "Erro: " . $conn->error;
            }
        } else {
            echo "Erro ao mover o arquivo para a pasta de uploads.";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Adicionar Espécie</title>
</head>
<body>
    <h1>Adicionar Espécie</h1>
    <form action="" method="post" enctype="multipart/form-data">
        <label for="nome">Nome:</label>
        <input type="text" id="nome" name="nome" required>

        <label for="data_aquisicao">Data de Aquisição:</label>
        <input type="date" id="data_aquisicao" name="data_aquisicao" required>

        <label for="numero_animais">Número de Animais:</label>
        <input type="number" id="numero_animais" name="numero_animais" required>

        <label for="numero_femeas">Número de Fêmeas:</label>
        <input type="number" id="numero_femeas" name="numero_femeas" required>

        <label for="peso_maximo">Peso Máximo:</label>
        <input type="number" id="peso_maximo" name="peso_maximo" required>

        <label for="viabilidade_acasalamento">Viabilidade de Acasalamento:</label>
        <input type="text" id="viabilidade_acasalamento" name="viabilidade_acasalamento" required>

        <label for="idade_maxima">Idade Máxima:</label>
        <input type="number" id="idade_maxima" name="idade_maxima" required>

        <label for="imagem">Imagem:</label>
        <input type="file" id="imagem" name="imagem" accept="image/*" required>

        <input type="submit" value="Adicionar Espécie">
    </form>
</body>
</html>
