<?php
session_start();
require 'db_conexao.php'; // Importando o arquivo de conexão com o banco de dados

// Lógica de Login
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $conn = conectarBancoDeDados(); // Conexão ao banco de dados - nossa Funçao

    if (isset($_POST['email-username']) && isset($_POST['password'])) {
        $usuario = trim($_POST['email-username']);
        $senha = trim($_POST['password']);

        // Verificando se os campos estão vazios
        if (!empty($usuario) && !empty($senha)) {
            // Preparando a consulta no banco de dados
            $stmt = $conn->prepare("SELECT * FROM usuarios WHERE username = ? OR email = ?");
            $stmt->execute([$usuario, $usuario]);

            if ($stmt->rowCount() > 0) {
                $usuario_data = $stmt->fetch(PDO::FETCH_ASSOC);

                // Verificando a senha
                if (password_verify($senha, $usuario_data['password'])) {
                    $_SESSION['user_id'] = $usuario_data['id'];
                    $_SESSION['nivel_id'] = $usuario_data['nivel_id']; // Verificando o nível de acesso pelo id atribuido ao usuario.

                    // Redirecionando ao painel com base no nível do usuário
                    switch ($usuario_data['nivel_id']) {
                        case 1: // Administrador
                            session_write_close();
                            header("Location: admin/painel.php?page=estatistica");
                            exit();
                        case 2: // Funcionário
                            session_write_close();
                            header("Location: funcionario/painel.php?page=estatistica");
                            exit();
                        case 3: // Visitante
                            session_write_close();
                            header("Location: visitante/painel.php?page=estatistica");
                            exit();
                        default:
                            echo "<script>alert('Nível de usuário inválido.');</script>";
                            break;
                    }
                } else {
                    echo "<script>alert('Senha incorreta!');</script>";
                }
            } else {
                echo "<script>alert('Usuário não encontrado!');</script>";
            }
        } else {
            echo "<script>alert('Por favor, preencha todos os campos.');</script>";
        }
    }

    $conn = null; // Fechando a conexão com bd
}
?>

<!--HTML para o formulario-->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="imagens/Favicon/logo.png" type="image/x-icon"> 
    <title>Página de Login</title>
    <link rel="stylesheet" href="css/loginstyles.css">
</head>
<body>
    <div class="login-container">
        <h1>Login</h1>
        <form method="POST" action="login.php">
            <div class="input-group">
                <label for="email-username">Email ou Usuário</label>
                <input type="text" name="email-username" id="email-username" placeholder="Digite seu email ou nome de usuário" required>
            </div>
            
            <div class="input-group">
                <label for="password">Palavra-passe</label>
                <input type="password" name="password" id="password" placeholder="Digite sua palavra-passe" required>
            </div>

            <button type="submit" class="login-btn">Entrar</button>
        </form>

        <div class="links">
            <p><a href="cadastro.php">Não tem conta? Crie uma agora.</a></p>
            <p><a href="redefinir_senha.php">Esqueceu sua senha? Redefinir senha.</a></p>
            <p><a href="index.html">Voltar ao Inicio.</a></p>
        </div>
    </div>

    <!-- Modal de Redefinição de Senha apenas em html retirado pos agora vamos para outro arquivo php -->
    <div id="reset-password-modal" style="display:none;">
        <div class="modal-content">
            <span class="close" onclick="document.getElementById('reset-password-modal').style.display='none'">&times;</span>
            <h2>Redefinir Senha</h2>
            <form method="POST" action="login.php">
                <div class="input-group">
                    <label for="email">Email</label>
                    <input type="email" name="email" id="email" placeholder="Digite seu email" required>
                </div>
                <button type="submit" name="reset-password">Enviar Instruções</button>
            </form>
        </div>
    </div>

    <script>
        // Script para abrir e fechar o modal de redefinição de senha - inativo por enquanto apenas em html
        document.querySelector('.links a[data-modal]').onclick = function(event) {
            event.preventDefault(); // Evita o comportamento padrão do link
            document.getElementById('reset-password-modal').style.display = 'block';
        };
        
        // Fechando o modal se clicar fora dele
        window.onclick = function(event) {
            if (event.target == document.getElementById('reset-password-modal')) {
                document.getElementById('reset-password-modal').style.display = 'none';
            }
        };
    </script>
    <script src="js/carousel.js"></script>
</body>
</html>