<?php
include 'db.php'; // Conexão com o banco de dados

// Remover espécie
if (isset($_GET['action']) && $_GET['action'] == 'delete') {
    $id = $_GET['id'];
    $sql = "DELETE FROM especies WHERE id = $id";
    $conn->query($sql);
    header("Location: especies.php");
}

$sql = "SELECT * FROM especies";
$result = $conn->query($sql);
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Espécies</title>
</head>
<body>
    <h1>Lista de Espécies</h1>
    <table>
        <tr>
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
        <?php
        if ($result->num_rows > 0) {
            while ($especie = $result->fetch_assoc()) {
                echo "<tr>";
                echo "<td>" . $especie['nome'] . "</td>";
                echo "<td>" . $especie['data_aquisicao'] . "</td>";
                echo "<td>" . $especie['numero_animais'] . "</td>";
                echo "<td>" . $especie['numero_femeas'] . "</td>";
                echo "<td>" . $especie['peso_maximo'] . "</td>";
                echo "<td>" . $especie['viabilidade_acasalamento'] . "</td>";
                echo "<td>" . $especie['idade_maxima'] . "</td>";
                echo "<td><img src='" . $especie['imagem'] . "' alt='Imagem de " . $especie['nome'] . "' style='width:100px;'></td>";
                echo "<td>
                        <a href='atualizar.php?id=" . $especie['id'] . "'>Atualizar</a> | 
                        <a href='especies.php?action=delete&id=" . $especie['id'] . "' onclick=\"return confirm('Tem certeza que deseja remover esta espécie?');\">Remover</a>
                      </td>";
                echo "</tr>";
            }
        } else {
            echo "<tr><td colspan='9'>Nenhuma espécie encontrada.</td></tr>";
        }
        ?>
    </table>
    <br>
    <a href="adicionar.php">Adicionar Nova Espécie</a>
</body>
</html>
