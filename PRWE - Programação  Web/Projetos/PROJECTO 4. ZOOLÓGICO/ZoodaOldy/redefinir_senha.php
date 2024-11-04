<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();
require 'db_conexao.php';

// Defina a variável $token como null para evitar o aviso
$token = null;

// Verifique a conexão
if (!isset($conn)) {
    die("Erro de conexão com o banco de dados.");
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['email'])) {
        // Solicitação de redefinição de senha
        $email = trim($_POST['email']);

        if (!empty($email)) {
            // Verifica se o e-mail existe no banco de dados
            $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                // Gera um token de redefinição único
                $token = bin2hex(random_bytes(16));
                $stmt = $conn->prepare("UPDATE usuarios SET reset_token = ? WHERE email = ?");
                $stmt->execute([$token, $email]);

                // Link para redefinir a senha
                $resetLink = "http://zoo_da_oldy/redefinir_senha.php?token=" . $token;

                // Tenta enviar o link por e-mail
                if (mail($email, "Redefinição de Senha", "Clique no link para redefinir sua senha: $resetLink")) {
                    // Se o e-mail foi enviado com sucesso
                    echo "<script>
                        alert('Um e-mail com instruções para redefinir sua senha foi enviado.');
                        window.location.href = 'login.php';
                    </script>";
                } else {
                    // Se o e-mail não foi enviado (erro de SMTP, por exemplo)
                    echo "<script>
                        alert('Não foi possível enviar o e-mail, mas seu pedido de redefinição foi registrado. Tente novamente mais tarde.');
                        window.location.href = 'login.php';
                    </script>";
                }
            } else {
                echo "<script>alert('Este e-mail não está registrado.');</script>";
            }
        } else {
            echo "<script>alert('Por favor, insira seu e-mail.');</script>";
        }
    } elseif (isset($_POST['nova_senha'], $_POST['confirmar_senha'], $_POST['token'])) {
        // Redefinir a senha usando o token
        $novaSenha = trim($_POST['nova_senha']);
        $confirmarSenha = trim($_POST['confirmar_senha']);
        $token = $_POST['token'];

        if ($novaSenha === $confirmarSenha) {
            // Verifica o token
            $stmt = $conn->prepare("SELECT id FROM usuarios WHERE reset_token = ?");
            $stmt->execute([$token]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                // Atualiza a senha e remove o token
                $hashSenha = password_hash($novaSenha, PASSWORD_DEFAULT);
                $stmt = $conn->prepare("UPDATE usuarios SET password = ?, reset_token = NULL WHERE id = ?");
                $stmt->execute([$hashSenha, $user['id']]);

                echo "<script>alert('Senha redefinida com sucesso!'); window.location.href='login.php';</script>";
            } else {
                echo "<script>alert('Token inválido ou expirado.');</script>";
            }
        } else {
            echo "<script>alert('As senhas não coincidem.');</script>";
        }
    }
} elseif (isset($_GET['token'])) {
    // Exibe o formulário de redefinição de senha com base no token
    $token = $_GET['token'];
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="imagens/Favicon/logo.png" type="image/x-icon">
    <title>Redefinir Senha</title>
    <link rel="stylesheet" href="css/loginstyles.css">
</head>
<body>
<div class="login-container">
    <?php if ($token): ?>
        <h1>Nova Senha</h1>
        <form method="POST" action="redefinir_senha.php">
            <input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>">
            <div class="input-group">
                <label for="nova_senha">Nova Senha</label>
                <input type="password" name="nova_senha" id="nova_senha" placeholder="Digite a nova senha" required>
            </div>
            <div class="input-group">
                <label for="confirmar_senha">Confirmar Senha</label>
                <input type="password" name="confirmar_senha" id="confirmar_senha" placeholder="Confirme a nova senha" required>
            </div>
            <button type="submit" class="login-btn">Redefinir Senha</button>
        </form>
    <?php else: ?>
        <h1>Redefinir Senha</h1>
        <form method="POST" action="redefinir_senha.php">
            <div class="input-group">
                <label for="email">Email</label>
                <input type="email" name="email" id="email" placeholder="Digite seu email para redefinir a senha" required>
            </div>
            <button type="submit" class="login-btn">Redefinir Senha</button>
        </form>
        <div class="links">
            <p><a href="login.php">Lembrou sua senha? Faça login.</a></p>
        </div>
    <?php endif; ?>
</div>
</body>
</html>
