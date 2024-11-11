<?php
include '../conexao.php'; // Conexão com o banco de dados

// Verificar se o usuário tem permissão para acessar a página
session_start();
if ($_SESSION['nivel_id'] != 1) {
    header("Location: login.php");
    exit();
}

// Consultar todas as espécies do banco de dados
$query = "SELECT id, nome, num_animais FROM especies";
$resultado = $conexao->query($query);

// Atualizar o número de animais de uma espécie
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['atualizar_num_animais'])) {
    $id = $_POST['id'];
    $num_animais = $_POST['num_animais'];

    // Atualizar o número de animais da espécie
    $updateQuery = "UPDATE especies SET num_animais = ? WHERE id = ?";
    $stmt = $conexao->prepare($updateQuery);
    $stmt->bind_param("ii", $num_animais, $id);

    if ($stmt->execute()) {
        echo "Número de animais atualizado com sucesso!";
    } else {
        echo "Erro ao atualizar o número de animais.";
    }
}

// Excluir uma espécie
if (isset($_GET['excluir_id'])) {
    $id = $_GET['excluir_id'];

    // Excluir a espécie
    $deleteQuery = "DELETE FROM especies WHERE id = ?";
    $stmt = $conexao->prepare($deleteQuery);
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo "Espécie excluída com sucesso!";
    } else {
        echo "Erro ao excluir a espécie.";
    }
}
?>

<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Gerenciar Número de Espécies</title>
</head>
<body>

<h2>Gerenciar Número de Espécies</h2>

<table border="1">
    <thead>
        <tr>
            <th>Nome da Espécie</th>
            <th>Número de Animais</th>
            <th>Ações</th>
        </tr>
    </thead>
    <tbody>
        <?php while ($row = $resultado->fetch_assoc()) { ?>
            <tr>
                <td><?php echo $row['nome']; ?></td>
                <td><?php echo $row['num_animais']; ?></td>
                <td>
                    <!-- Formulário para atualizar o número de animais -->
                    <form method="POST" style="display:inline;">
                        <input type="number" name="num_animais" value="<?php echo $row['num_animais']; ?>" required>
                        <input type="hidden" name="id" value="<?php echo $row['id']; ?>">
                        <button type="submit" name="atualizar_num_animais">Atualizar</button>
                    </form>
                    <!-- Link para excluir a espécie -->
                    <a href="?excluir_id=<?php echo $row['id']; ?>" onclick="return confirm('Tem certeza que deseja excluir esta espécie?')">Excluir</a>
                </td>
            </tr>
        <?php } ?>
    </tbody>
</table>

</body>
</html>
