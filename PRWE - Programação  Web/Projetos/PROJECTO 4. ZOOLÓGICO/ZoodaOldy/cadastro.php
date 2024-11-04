<?php
// Função para conexão com o banco de dados
function conectarBancoDeDados() {
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "zoo_da_oldy";

    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        die("Falha na conexão: " . $conn->connect_error);
    }
    return $conn;
}

$conn = conectarBancoDeDados();

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Capturando os dados do formulário
    $nome = $_POST['nome'];
    $apelido = $_POST['apelido'];
    $sexo = $_POST['sexo'];
    $endereco = $_POST['endereco'];
    $nacionalidade = $_POST['pais'];
    $telefone = $_POST['telefone'];
    $data_nascimento = $_POST['data_nascimento'];
    $ocupacao = $_POST['ocupacao'];
    $usuario = $_POST['usuario'];
    $email = $_POST['email'];
    $senha = $_POST['senha'];
    $confirmarSenha = $_POST['confirmarSenha'];

    // Validação da senha na base de dados
    if ($senha !== $confirmarSenha) {
        echo "<script>alert('As senhas não coincidem');</script>";
    } else {
        // Verifica se o nome de usuário já existe
        $stmt = $conn->prepare("SELECT id FROM usuarios WHERE username = ?");
        $stmt->bind_param("s", $usuario);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            // Exibe um popup informando que o usuário já existe
            echo "<script>alert('O nome de usuário já está em uso. Tente outro.');</script>";
        } else {
            // Verifica se o email já está cadastrado
            $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $stmt->store_result();

            if ($stmt->num_rows > 0) {
                echo "<script>alert('O email já está cadastrado');</script>";
            } else {
                // Validação do campo genero sexo
                if (!in_array($sexo, ['M', 'F', 'Outro'])) {
                    die("Valor do sexo inválido.");
                }

                // Captura da senha
                $hashSenha = password_hash($senha, PASSWORD_DEFAULT);
                $nivel_id = 3; // Define o nível como 3 para todos os novos usuários

                // Prepara a instrução SQL, todos os campos que devem ser capturados conforme nome para db
                $stmt = $conn->prepare("INSERT INTO usuarios (nome, apelido, sexo, endereco, nacionalidade, telefone, data_nascimento, ocupacao, email, username, password, nivel_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("sssssssssssi", $nome, $apelido, $sexo, $endereco, $nacionalidade, $telefone, $data_nascimento, $ocupacao, $email, $usuario, $hashSenha, $nivel_id);

                // Executa a instrução com suas condições e retorna para login, caso aprovada
                if ($stmt->execute()) {
                    echo "<script>alert('Cadastro realizado com sucesso!'); window.location.href='login.php';</script>";
                } else {
                    echo "<script>alert('Erro ao realizar o cadastro: " . $stmt->error . "');</script>";
                }
            }
        }
        
        // Fechando a instrução
        $stmt->close();
    }
}

// Fechando a conexão com o banco de dados
$conn->close();
?>


<!--Aqui começa o html do formulario-->
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="imagens/favicon/logo.png" type="image/x-icon"> <!-- nossa logo para favicone do navegdor-->
    <title>Cadastro - Zoo da Oldy</title>

<!--css e js-->
    <script src="js/cadastro.js"></script>
    <link rel="stylesheet" href="css/cadastro.css">
    
</head>
<body>

<div class="form-container">
    <div class="logo-container">
        <img src="imagens/logo.png" alt="Logo do Zoo da Oldy">
    </div>

    <h2>Cadastro - Zoo da Oldy</h2>

    <form id="registerForm" method="POST" action="" onsubmit="return validarIdade()">
    <!-- Etapa 1 -->
    <div class="step active">
        <label for="nome">Nome:</label>
        <input type="text" id="nome" name="nome" placeholder="Insira seu nome" required>

        <label for="apelido">Apelido (Sobrenome):</label>
        <input type="text" id="apelido" name="apelido" placeholder="Insira seu apelido" required>

        <label for="sexo">Sexo:</label>
        <select name="sexo" id="sexo" required>
            <option value="">Selecione</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
            <option value="Outro">Outro</option>
        </select>

        <label for="endereco">Endereço:</label>
        <input type="text" id="endereco" name="endereco" placeholder="Ex.: Rua alfredo lawley, 321, Matacuane">

        <div class="btn-group-center">
            <button type="button" onclick="nextStep(1)">Avançar</button>
        </div>
        <p style="text-align: center;"><a href="login.php">Já tem uma conta? Entre agora.</a></p>
    </div>

    <!-- Etapa 2 -->
    <div class="step">
        <label for="pais">Nacionalidade:</label>
        <select id="pais" name="pais" required onchange="mostrarOutroCampo()">
            <option value="">Selecione um país</option>
            <option value="Moçambique">Moçambique (+258)</option>
            <option value="África do Sul">África do Sul (+27)</option>
            <option value="Angola">Angola (+244)</option>
            <option value="Brasil">Brasil (+55)</option>
            <option value="China">China (+86)</option>
            <option value="Espanha">Espanha (+34)</option>
            <option value="Estados Unidos">Estados Unidos (+1)</option>
            <option value="Portugal">Portugal (+351)</option>
            <option value="França">França (+33)</option>
            <option value="Japão">Japão (+81)</option>
            <option value="Nigéria">Nigéria (+234)</option>
            <option value="Zimbábue">Zimbábue (+263)</option>
            <option value="Outro">Outro (especifique)</option>
        </select>
        <input type="text" id="outroPais" name="outroPais" placeholder="Especifique o país e código" style="display:none;">

        <label for="telefone">Telefone:</label>
        <input type="tel" id="telefone" name="telefone" placeholder="Digite o seu telefone" onkeypress="validarTelefone(event)" required>

        <label for="data_nascimento">Data de Nascimento:</label>
        <input type="date" id="data_nascimento" name="data_nascimento" required>

        <label for="ocupacao">Ocupação:</label>
        <input type="text" id="ocupacao" name="ocupacao" placeholder="Ex.: Estudante, Engenheiro, Professor">

        <div class="btn-group">
            <button type="button" onclick="prevStep()">Retroceder</button>
            <button type="button" onclick="nextStep(2)">Avançar</button>
        </div>
    </div>

    <!-- Etapa 3 -->
    <div class="step">
        <label for="usuario">Usuário:</label>
        <input type="text" id="usuario" name="usuario" placeholder="Escolha um nome de usuário" required>

        <label for="email">Email:</label>
        <input type="email" id="email" name="email" placeholder="seuemail@exemplo.com" required>

        <label for="senha">Senha:</label>
        <input type="password" id="senha" name="senha" placeholder="Crie uma senha" required>

        <label for="confirmarSenha">Confirmar Senha:</label>
        <input type="password" id="confirmarSenha" name="confirmarSenha" placeholder="Digite a senha novamente" required>

        <div class="btn-group">
            <button type="button" onclick="prevStep()">Retroceder</button>
            <button type="submit">Cadastrar</button>
        </div>
    </div>
</form>

</body>
</html>