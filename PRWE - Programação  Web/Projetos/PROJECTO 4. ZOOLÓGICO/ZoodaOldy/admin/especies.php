<?php
include '../db_conexao.php'; // Verifique se o caminho está correto

// Função para executar consultas e tratar erros
function executeQuery($conn, $sql) {
    if ($conn->query($sql) === TRUE) {
        return true;
    } else {
        echo "Erro: " . $conn->error;
        return false;
    }
}

// Verifica se o formulário para adicionar ou atualizar uma nova espécie foi enviado
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST['adicionar'])) {
        // Adiciona nova espécie
        $nome = $conn->real_escape_string($_POST['nome']);
        $data_aquisicao = $conn->real_escape_string($_POST['data_aquisicao']);
        $numero_animais = (int)$_POST['numero_animais'];
        $numero_femeas = (int)$_POST['numero_femeas'];
        $peso_maximo = (float)$_POST['peso_maximo'];
        $viabilidade_acasalamento = $conn->real_escape_string($_POST['viabilidade_acasalamento']);
        $idade_maxima = (int)$_POST['idade_maxima'];
        $grupo = $conn->real_escape_string($_POST['grupo']); // grupo (mamífero, ave, réptil)

        // Processar upload de imagem
        $target_dir = "uploads/";
        $target_file = $target_dir . basename($_FILES["imagem"]["name"]);
        $uploadOk = 1;

        // Verificar se a imagem é um arquivo de imagem real
        $check = getimagesize($_FILES["imagem"]["tmp_name"]);
        if ($check === false) {
            echo "Arquivo não é uma imagem.";
            $uploadOk = 0;
        }

        // Verificar se houve erro no upload
        if ($_FILES["imagem"]["error"] !== UPLOAD_ERR_OK) {
            echo "Erro no upload do arquivo.";
            $uploadOk = 0;
        }

        // Verificar se $uploadOk é 1 por um erro
        if ($uploadOk == 1) {
            // Mover o arquivo para a pasta de uploads
            if (move_uploaded_file($_FILES["imagem"]["tmp_name"], $target_file)) {
                // Inserir os dados no banco
                $sql = "INSERT INTO especies (nome, data_aquisicao, numero_animais, numero_femeas, peso_maximo, viabilidade_acasalamento, idade_maxima, imagem, grupo)
                        VALUES ('$nome', '$data_aquisicao', $numero_animais, $numero_femeas, $peso_maximo, '$viabilidade_acasalamento', $idade_maxima, '$target_file', '$grupo')";
                
                executeQuery($conn, $sql);
            } else {
                echo "Erro ao mover o arquivo para a pasta de uploads.";
            }
        }
    } elseif (isset($_POST['atualizar'])) {
        // Atualiza dados de uma espécie
        $id = (int)$_POST['id'];
        $numero_animais = (int)$_POST['numero_animais'];
        $operacao = $_POST['operacao']; // "aumentar" ou "diminuir"

        // Aumentar ou diminuir número de animais
        if ($operacao == "aumentar") {
            $sql = "UPDATE especies SET numero_animais = numero_animais + $numero_animais WHERE id = $id";
            executeQuery($conn, $sql);
        } elseif ($operacao == "diminuir") {
            $sql = "UPDATE especies SET numero_animais = numero_animais - $numero_animais WHERE id = $id";
            executeQuery($conn, $sql);

            // Verifica se o número de animais se tornou zero
            $result = $conn->query("SELECT numero_animais FROM especies WHERE id = $id");
            $row = $result->fetch(PDO::FETCH_ASSOC);
            if ($row['numero_animais'] <= 0) {
                // Remove a espécie se o número de animais é zero
                executeQuery($conn, "DELETE FROM especies WHERE id = $id");
            }
        }
    }
}

// Buscar todas as espécies
$sql = "SELECT * FROM especies";
$result = $conn->query($sql);

// Adicione mais funções conforme necessário para cada um dos requisitos

?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Gerenciar Espécies</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .container {
            max-width: 1000px; /* Aumenta a largura da div principal */
            margin: auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background-color: #fff;
        }
        th, td {
            padding: 20px; /* Aumenta o padding para mais espaço */
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f2f2f2;
        }
        input[type="text"],
        input[type="date"],
        input[type="number"],
        select {
            width: calc(100% - 20px);
            padding: 10px;
            margin: 5px 0;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        input[type="file"] {
            margin: 5px 0;
        }
        input[type="submit"] {
            background-color: #5cb85c;
            color: white;
            padding: 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        input[type="submit"]:hover {
            background-color: #4cae4c;
        }
        .btn {
            padding: 6px 12px;
            color: white;
            background-color: red;
            border: none;
            cursor: pointer;
            border-radius: 4px;
        }
        .btn:hover {
            background-color: darkred;
        }
        img {
            max-width: 100px;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
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

            <label for="grupo">Grupo:</label>
            <select id="grupo" name="grupo">
                <option value="mamífero">Mamífero</option>
                <option value="ave">Ave</option>
                <option value="réptil">Réptil</option>
            </select>

            <input type="submit" name="adicionar" value="Adicionar Espécie">
        </form>

        <h1>Lista de Espécies</h1>
        <table>
            <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Data de Aquisição</th>
                <th>Número de Animais</th>
                <th>Número de Fêmeas</th>
                <th>Peso Máximo</th>
                <th>Viabilidade de Acasalamento</th>
                <th>Idade Máxima</th>
                <th>Imagem</th>
                <th>Ações</th>
            </tr>
            <?php if ($result->rowCount() > 0): while ($row = $result->fetch(PDO::FETCH_ASSOC)): ?>
            <tr>
                <td><?php echo $row['id']; ?></td>
                <td><?php echo $row['nome']; ?></td>
                <td><?php echo $row['data_aquisicao']; ?></td>
                <td><?php echo $row['numero_animais']; ?></td>
                <td><?php echo $row['numero_femeas']; ?></td>
                <td><?php echo $row['peso_maximo']; ?></td>
                <td><?php echo $row['viabilidade_acasalamento']; ?></td>
                <td><?php echo $row['idade_maxima']; ?></td>
                <td><img src="<?php echo $row['imagem']; ?>" alt="Imagem da Espécie"></td>
                <td>
                    <form action="" method="post" style="display:inline;">
                        <input type="hidden" name="id" value="<?php echo $row['id']; ?>">
                        <input type="number" name="numero_animais" placeholder="Quantidade" required>
                        <select name="operacao" required>
                            <option value="aumentar">Aumentar</option>
                            <option value="diminuir">Diminuir</option>
                        </select>
                        <input type="submit" name="atualizar" value="Atualizar">
                    </form>
                    <button class="btn" onclick="if(confirm('Tem certeza que deseja excluir esta espécie?')) { window.location.href='excluir.php?id=<?php echo $row['id']; ?>'; }">Excluir</button>
                </td>
            </tr>
            <?php endwhile; else: ?>
            <tr><td colspan="10">Nenhuma espécie encontrada.</td></tr>
            <?php endif; ?>
        </table>
    </div>
</body>
</html>
