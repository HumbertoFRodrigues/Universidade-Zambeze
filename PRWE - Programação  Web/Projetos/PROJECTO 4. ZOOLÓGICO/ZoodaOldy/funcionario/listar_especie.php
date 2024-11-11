<?php
session_start();
require '../db_conexao.php';

// Verifica se o usuário está logado e é um administrador ou funcionário
if (!isset($_SESSION['user_id']) || ($_SESSION['nivel_id'] != 1 && $_SESSION['nivel_id'] != 2)) {
    echo "Acesso negado.";
    exit;
}

$conn = conectarBancoDeDados();
$stmt = $conn->prepare("SELECT * FROM especies");
$stmt->execute();
$especies = $stmt->fetchAll();
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Listar Espécies</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Espécies Cadastradas</h1>
    <table>
        <tr>
            <th>Nome</th>
            <th>Grupo</th>
            <th>Número de Animais</th>
            <th>Ações</th>
        </tr>
        <?php foreach ($especies as $especie): ?>
            <tr>
                <td><?php echo htmlspecialchars($especie['nome']); ?></td>
                <td><?php echo htmlspecialchars($especie['grupo']); ?></td>
                <td><?php echo htmlspecialchars($especie['numero_animais']); ?></td>
                <td>
                    <a href="editar_especie.php?id=<?php echo $especie['id']; ?>">Editar</a>
                    <a href="excluir_especie.php?id=<?php echo $especie['id']; ?>">Excluir</a>
                </td>
            </tr>
        <?php endforeach; ?>
    </table>
</body>
</html>
