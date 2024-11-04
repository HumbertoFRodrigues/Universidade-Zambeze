<?php
// Verificar se a sessão já está ativa, caso contrário, iniciar a sessão
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Verifique se o usuário está logado e se possui nível de acesso adequado
if (!isset($_SESSION['user_role']) || ($_SESSION['user_role'] != 1 && $_SESSION['user_role'] != 2)) {
    // Acesso negado
    http_response_code(403);
    echo "Acesso negado. Apenas administradores e funcionários podem visualizar esta página.";
    exit;
}

// Conexão com o banco de dados
$host = 'localhost';
$db = 'zoo_da_oldy';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Buscar todas as reclamações do banco de dados
    $stmt = $pdo->prepare("SELECT * FROM reclamacoes");
    $stmt->execute();
    $reclamacoes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Processar resposta a uma reclamação
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['reclamacao_id'], $_POST['resposta'])) {
        $reclamacao_id = $_POST['reclamacao_id'];
        $resposta = $_POST['resposta'];

        // Atualizar a reclamação com a resposta
        $stmt = $pdo->prepare("UPDATE reclamacoes SET resposta = ? WHERE id = ?");
        $stmt->execute([$resposta, $reclamacao_id]);

        echo "<p>Resposta enviada com sucesso!</p>";
        header("Refresh:0"); // Atualiza a página após a resposta
        exit;
    }
} catch (PDOException $e) {
    http_response_code(500); // Erro do servidor
    echo "Erro na conexão com o banco de dados: " . $e->getMessage();
    exit;
}
?>

<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lista de Reclamações - Zoo da Oldy</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        h1 {
            text-align: center;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        textarea {
            width: 100%;
            padding: 5px;
            margin-top: 5px;
        }
        button {
            background-color: #4CAF50;
            color: white;
            padding: 8px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>

<h1>Reclamações Recebidas</h1>

<?php if (!empty($reclamacoes)): ?>
    <table>
        <tr>
            <th>ID</th>
            <th>Tipo</th>
            <th>Comentários</th>
            <th>Sugestões</th>
            <th>Problema com Animal</th>
            <th>Comentários sobre Animal</th>
            <th>Resposta</th>
            <th>Ação</th>
        </tr>
        <?php foreach ($reclamacoes as $reclamacao): ?>
            <tr>
                <td><?php echo htmlspecialchars($reclamacao['id']); ?></td>
                <td><?php echo htmlspecialchars($reclamacao['tipo']); ?></td>
                <td><?php echo htmlspecialchars($reclamacao['comentarios']); ?></td>
                <td><?php echo htmlspecialchars($reclamacao['sugestoes']); ?></td>
                <td><?php echo htmlspecialchars($reclamacao['problema_animal']); ?></td>
                <td><?php echo htmlspecialchars($reclamacao['comentarios_animal']); ?></td>
                <td><?php echo htmlspecialchars($reclamacao['resposta']); ?></td>
                <td>
                    <?php if (empty($reclamacao['resposta'])): ?>
                        <form method="post">
                            <textarea name="resposta" placeholder="Digite sua resposta"></textarea>
                            <input type="hidden" name="reclamacao_id" value="<?php echo htmlspecialchars($reclamacao['id']); ?>">
                            <button type="submit">Enviar Resposta</button>
                        </form>
                    <?php else: ?>
                        <p>Respondido</p>
                    <?php endif; ?>
                </td>
            </tr>
        <?php endforeach; ?>
    </table>
<?php else: ?>
    <p>Nenhuma reclamação encontrada.</p>
<?php endif; ?>

</body>
</html>
