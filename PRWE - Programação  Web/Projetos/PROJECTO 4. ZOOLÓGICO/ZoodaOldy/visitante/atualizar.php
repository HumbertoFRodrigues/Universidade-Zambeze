<?php
include '../db_conexao.php'; // Conexão com o banco de dados

// Verifica se o ID foi fornecido
if (!isset($_GET['id'])) {
    header("Location: especies.php");
}

$id = $_GET['id'];

// Busca os dados da espécie
$sql = "SELECT * FROM especies WHERE id = $id";
$result = $conn->query($sql);
$especie = $result->fetch_assoc();

// Verifica se o formulário foi enviado
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nome = $_POST['nome'];
    $data_aquisicao = $_POST['data_aquisicao'];
    $numero_animais = $_POST['numero_animais'];
    $numero_femeas = $_POST['numero_femeas'];
    $peso_maximo = $_POST['peso_maximo'];
    $viabilidade_acasalamento = $_POST['viabilidade_acasalamento'];
    $idade_maxima = $_POST['idade_maxima'];

    // Processa upload de imagem se uma nova imagem for enviada
    if ($_FILES["imagem"]["error"] == 0) {
        $target_dir = "uploads/";
        $target_file = $target_dir . basename($_FILES["imagem"]["name"]);
        move_uploaded_file($_FILES["imagem"]["tmp_name"], $target_file);
        $imagem = ", imagem = '$target_file'";
    } else {
        $imagem = ""; // Mantém a imagem existente
    }

    // Atualiza os dados no banco
    $sql = "UPDATE especies SET nome = '$nome', data_aquisicao = '$data_aquisicao', numero_animais = $numero_animais, 
            numero_femeas = $numero_femeas, peso_maximo = $peso_maximo, viabilidade_acasalamento = '$viabilidade_acasalamento', 
            idade_maxima = $idade_maxima $imagem WHERE id = $id";
    
    if ($conn->query($sql) === TRUE) {
        header("Location: especies.php");
    } else {
        echo "Erro: " . $conn->error;
    }
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Atualizar Espécie</title>
</head>
<body>
    <h1>Atualizar Espécie</h1>
    <form action="" method="post" enctype="multipart/form-data">
        <label for="nome">Nome:</label>
        <input type="text" id="nome" name="nome" value="<?php echo $especie['nome']; ?>" required>

        <label for="data_aquisicao">Data de Aquisição:</label>
        <input type="date" id="data_aquisicao" name="data_aquisicao" value="<?php echo $especie['data_aquisicao']; ?>" required>

        <label for="numero_animais">Número de Animais:</label>
        <input type="number" id="numero_animais" name="numero_animais" value="<?php echo $especie['numero_animais']; ?>" required>

        <label for="numero_femeas">Número de Fêmeas:</label>
        <input type="number" id="numero_femeas" name="numero_femeas" value="<?php echo $especie['numero_femeas']; ?>" required>

        <label for="peso_maximo">Peso Máximo:</label>
        <input type="number" id="peso_maximo" name="peso_maximo" value="<?php echo $especie['peso_maximo']; ?>" required>

        <label for="viabilidade_acasalamento">Viabilidade de Acasalamento:</label>
        <input type="text" id="viabilidade_acasalamento" name="viabilidade_acasalamento" value="<?php echo $especie['viabilidade_acasalamento']; ?>" required>

        <label for="idade_maxima">Idade Máxima:</label>
        <input type="number" id="idade_maxima" name="idade_maxima" value="<?php echo $especie['idade_maxima']; ?>" required>

        <label for="imagem">Nova Imagem (opcional):</label>
        <input type="file" id="imagem" name="imagem" accept="image/*">

        <input type="submit" value="Atualizar Espécie">
    </form>
</body>
</html>
