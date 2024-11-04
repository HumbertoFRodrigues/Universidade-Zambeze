<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Espécies do Zoológico</title>
</head>
<body>
    <?php include '../db_conexao.php'; ?> <!-- Inclui a conexão ao banco de dados -->

    <h1>Espécies Existentes</h1>
    <ul>
        <?php
        // Consulta para buscar as espécies, incluindo a imagem
        $sql = "SELECT nome, imagem FROM especies"; // Incluindo o campo 'imagem'
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $especies = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Verifica se há espécies e as exibe
        if (count($especies) > 0) {
            foreach ($especies as $especie) {
                echo '<li>';
                echo '<img src="' . htmlspecialchars($especie['imagem']) . '" alt="' . htmlspecialchars($especie['nome']) . '" style="width:100px; height:auto;">'; // Exibe a imagem
                echo '<span>' . htmlspecialchars($especie['nome']) . '</span>'; // Exibe o nome da espécie
                echo '</li>';
            }
        } else {
            echo '<li>Nenhuma espécie encontrada.</li>';
        }
        ?>
    </ul>
</body>
</html>
