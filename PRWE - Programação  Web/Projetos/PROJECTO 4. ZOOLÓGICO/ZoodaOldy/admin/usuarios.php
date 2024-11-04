<?php
include '../db_conexao.php'; // Verifique se o caminho está correto

// Função para obter todos os usuários
function getAllUsers($conn) {
    $sql = "SELECT * FROM usuarios";
    return $conn->query($sql);
}

// Adicionar novo usuário
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['add'])) {
    $nome = $_POST['nome'];
    $email = $_POST['email'];
    $senha = password_hash($_POST['senha'], PASSWORD_DEFAULT); // Hash da senha

    $sql = "INSERT INTO usuarios (nome, email, senha) VALUES (:nome, :email, :senha)";
    $stmt = $conn->prepare($sql);
    $stmt->execute([':nome' => $nome, ':email' => $email, ':senha' => $senha]);
}

// Editar usuário
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['edit'])) {
    $id = $_POST['id'];
    $nome = $_POST['nome'];
    $email = $_POST['email'];

    $sql = "UPDATE usuarios SET nome=:nome, email=:email WHERE id=:id";
    $stmt = $conn->prepare($sql);
    $stmt->execute([':nome' => $nome, ':email' => $email, ':id' => $id]);
}

// Apagar usuário
if (isset($_GET['delete'])) {
    $id = $_GET['delete'];
    $sql = "DELETE FROM usuarios WHERE id=:id";
    $stmt = $conn->prepare($sql);
    $stmt->execute([':id' => $id]);
}

// Obter todos os usuários
$users = getAllUsers($conn);
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Gerenciar Usuários</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        h1 {
            text-align: center;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        table, th, td {
            border: 1px solid #ddd;
        }
        th, td {
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #5cb85c;
            color: white;
        }
        .form-container {
            margin: 20px 0;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        input[type="text"], input[type="email"], input[type="password"] {
            width: 100%;
            padding: 10px;
            margin: 5px 0;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        input[type="submit"] {
            background-color: #5cb85c;
            color: white;
            padding: 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        input[type="submit"]:hover {
            background-color: #4cae4c;
        }
    </style>
</head>
<body>
    <h1>Gerenciar Usuários</h1>

    <div class="form-container">
        <h2>Adicionar Novo Usuário</h2>
        <form action="" method="post">
            <input type="text" name="nome" placeholder="Nome" required>
            <input type="email" name="email" placeholder="Email" required>
            <input type="password" name="senha" placeholder="Senha" required>
            <input type="submit" name="add" value="Adicionar Usuário">
        </form>
    </div>

    <table>
        <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Ações</th>
        </tr>
        <?php foreach ($users as $user): ?>
        <tr>
            <td><?php echo $user['id']; ?></td>
            <td><?php echo $user['nome']; ?></td>
            <td><?php echo $user['email']; ?></td>
            <td>
                <form action="" method="post" style="display:inline;">
                    <input type="hidden" name="id" value="<?php echo $user['id']; ?>">
                    <input type="text" name="nome" value="<?php echo $user['nome']; ?>" required>
                    <input type="email" name="email" value="<?php echo $user['email']; ?>" required>
                    <input type="submit" name="edit" value="Editar">
                </form>
                <a href="?delete=<?php echo $user['id']; ?>" onclick="return confirm('Tem certeza que deseja apagar este usuário?');">Apagar</a>
            </td>
        </tr>
        <?php endforeach; ?>
    </table>
</body>
</html>
