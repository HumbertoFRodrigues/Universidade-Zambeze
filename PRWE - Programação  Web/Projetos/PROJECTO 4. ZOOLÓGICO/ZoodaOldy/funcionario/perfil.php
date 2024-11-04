<?php
// Inicia a sessão apenas se ainda não estiver ativa
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
require '../db_conexao.php'; // Inclui o arquivo de conexão com o banco de dados

// Verifica se o usuário está logado
if (!isset($_SESSION['user_id'])) {
    header("Location: ../login.php");
    exit;
}

// Obtém o ID do usuário logado da sessão
$user_id = $_SESSION['user_id'];

// Consulta para buscar as informações atuais do usuário
$stmt = $conn->prepare("SELECT nome, apelido, username, data_nascimento, email, telefone, endereco, ocupacao, nacionalidade FROM usuarios WHERE id = :id");
$stmt->execute(['id' => $user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Mensagem inicial vazia
$mensagemSucesso = "";

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Captura os dados enviados pelo formulário
    $email = $_POST['email'] ?? null;
    $telefone = $_POST['telefone'] ?? null;
    $endereco = $_POST['endereco'] ?? null;
    $ocupacao = $_POST['ocupacao'] ?? null;
    $nacionalidade = $_POST['nacionalidade'] ?? null;
    $senha = $_POST['senha'] ?? null;

    // Inicializa a query base
    $query = "UPDATE usuarios SET ";
    $params = [];
    $setFields = []; // Para armazenar os campos a serem atualizados

    // Adiciona campos à query apenas se foram preenchidos
    if (!empty($email)) {
        $setFields[] = "email = :email";
        $params['email'] = $email;
    }
    if (!empty($telefone)) {
        $setFields[] = "telefone = :telefone";
        $params['telefone'] = $telefone;
    }
    if (!empty($endereco)) {
        $setFields[] = "endereco = :endereco";
        $params['endereco'] = $endereco;
    }
    if (!empty($ocupacao)) {
        $setFields[] = "ocupacao = :ocupacao";
        $params['ocupacao'] = $ocupacao;
    }
    if (!empty($nacionalidade)) {
        $setFields[] = "nacionalidade = :nacionalidade";
        $params['nacionalidade'] = $nacionalidade;
    }
    if (!empty($senha)) {
        $setFields[] = "password = :password"; // Se a senha for preenchida
        $params['password'] = password_hash($senha, PASSWORD_DEFAULT); // Hasheia a senha
    }

    // Verifica se há campos para atualizar
    if (count($setFields) > 0) {
        $query .= implode(", ", $setFields); // Junta os campos a serem atualizados
        $query .= " WHERE id = :id"; // Adiciona a condição de onde

        // Adiciona o ID do usuário aos parâmetros
        $params['id'] = $user_id;

        $update_stmt = $conn->prepare($query);
        $update_stmt->execute($params); // Executa a atualização

        // Define a mensagem para ser exibida no popup
        $mensagemSucesso = "Perfil atualizado com sucesso!";
    } else {
        $mensagemSucesso = "Nenhuma informação foi modificada.";
    }
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editar Perfil</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            padding: 20px;
            max-width: 600px;
            width: 100%;
            margin: 0 auto;
        }
        h2 {
            color: #4CAF50;
            text-align: center;
            margin-bottom: 20px;
        }
        .form-group {
            display: flex;
            flex-direction: column;
            margin-bottom: 10px;
        }
        .form-row {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        label {
            font-weight: bold;
            margin-bottom: 5px;
        }
        input[type="text"], input[type="email"], input[type="password"] {
            width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        .btn-submit {
            background-color: #4CAF50;
            color: white;
            padding: 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
            font-size: 16px;
            font-weight: bold;
            margin-top: 15px;
            transition: background-color 0.3s;
        }
        .btn-submit:hover {
            background-color: #45a049;
        }
        .spinner {
            display: none; 
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-left-color: #4CAF50; 
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite; 
            margin: 0 auto; 
        }
        @keyframes spin {
            to {
                transform: rotate(360deg); 
            }
        }
        .popup {
            display: none; 
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #fff;
            border: 1px solid #4CAF50;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .popup button {
            background-color: #4CAF50;
            color: white;
            padding: 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Editar Perfil</h2>

        <form id="form-perfil" method="POST">
            <div class="form-row">
                <div class="form-group" style="flex: 1;">
                    <label>Nome:</label>
                    <input type="text" value="<?php echo htmlspecialchars($user['nome']); ?>" disabled>
                </div>

                <div class="form-group" style="flex: 1;">
                    <label>Apelido:</label>
                    <input type="text" value="<?php echo htmlspecialchars($user['apelido']); ?>" disabled>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group" style="flex: 1;">
                    <label>Nome de Usuário:</label>
                    <input type="text" value="<?php echo htmlspecialchars($user['username']); ?>" disabled>
                </div>

                <div class="form-group" style="flex: 1;">
                    <label>Data de Nascimento:</label>
                    <input type="text" value="<?php echo htmlspecialchars($user['data_nascimento']); ?>" disabled>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group" style="flex: 1;">
                    <label>Telefone:</label>
                    <input type="text" name="telefone" value="<?php echo htmlspecialchars($user['telefone']); ?>" placeholder="Digite o seu novo telefone" required>
                </div>

                <div class="form-group" style="flex: 1;">
                    <label>Email:</label>
                    <input type="email" name="email" value="<?php echo htmlspecialchars($user['email']); ?>" placeholder="Digite seu novo email"  required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group" style="flex: 1;">
                    <label>Endereço:</label>
                    <input type="text" name="endereco" value="<?php echo htmlspecialchars($user['endereco']); ?>" placeholder="Digite seu endereco ex:( Cidade, Rua, Avenida..)" required>
                </div>

                <div class="form-group" style="flex: 1;">
                    <label>Ocupação:</label>
                    <input type="text" name="ocupacao" value="<?php echo htmlspecialchars($user['ocupacao']); ?>" placeholder="Insira sua ocupação (ex: emprego ou curso" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group" style="flex: 1;">
                    <label>Nacionalidade:</label>
                    <input type="text" name="nacionalidade" value="<?php echo htmlspecialchars($user['nacionalidade']); ?>" placeholder="Sua Nacionalidade, pais" required>
                </div>

                <div class="form-group" style="flex: 1;">
                    <label>Nova Senha:</label>
                    <input type="password" placeholder="Insira sua nova senha para atualizar" name="senha">
                </div>
            </div>

            <button type="submit" class="btn-submit">Atualizar</button>
        </form>

        <div class="spinner" id="spinner"></div>
        
        <div class="popup" id="popup">
            <p id="popup-mensagem"><?php echo htmlspecialchars($mensagemSucesso); ?></p>
            <button onclick="document.getElementById('popup').style.display='none'">Fechar</button>
        </div>
    </div>

    <script>
        // Mostra o popup se houver mensagem de sucesso
        <?php if ($mensagemSucesso): ?>
            document.getElementById('popup').style.display = 'block';
        <?php endif; ?>

        // Adiciona evento de submit no formulário
        document.getElementById('form-perfil').onsubmit = function() {
            document.getElementById('spinner').style.display = 'block'; // Mostra o spinner
        };
    </script>
</body>
</html>
