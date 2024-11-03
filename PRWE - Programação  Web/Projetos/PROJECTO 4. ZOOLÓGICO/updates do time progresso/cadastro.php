<?php
// Função de conexão com o banco de dados
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
    // Captura os dados do formulário
    $nome = $_POST['nome'];
    $apelido = $_POST['apelido'];
    $sexo = $_POST['sexo'];
    $endereco = $_POST['endereco'];
    $nacionalidade = $_POST['pais']; // Corrigido para usar o campo correto
    $telefone = $_POST['telefone'];
    $data_nascimento = $_POST['data_nascimento'];
    $ocupacao = $_POST['ocupacao'];
    $usuario = $_POST['usuario'];
    $email = $_POST['email'];
    $senha = $_POST['senha'];
    $confirmarSenha = $_POST['confirmarSenha'];

    // Validação de senha
    if ($senha !== $confirmarSenha) {
        echo "<script>alert('As senhas não coincidem');</script>";
    } else {
        // Verifica se o email já está cadastrado
        $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            echo "<script>alert('O email já está cadastrado');</script>";
        } else {
            // Validação do campo sexo
            if (!in_array($sexo, ['M', 'F', 'Outro'])) {
                die("Valor do sexo inválido.");
            }

            // Hash da senha
            $hashSenha = password_hash($senha, PASSWORD_DEFAULT);
            $nivel_id = 1; // Defina o nível padrão ou altere conforme necessário

            // Prepara a instrução SQL
            $stmt = $conn->prepare("INSERT INTO usuarios (nome, apelido, sexo, endereco, nacionalidade, telefone, data_nascimento, ocupacao, email, username, password, nivel_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssssssssssi", $nome, $apelido, $sexo, $endereco, $nacionalidade, $telefone, $data_nascimento, $ocupacao, $email, $usuario, $hashSenha, $nivel_id);

            // Executa a instrução
            if ($stmt->execute()) {
                echo "<script>alert('Cadastro realizado com sucesso!'); window.location.href='admin/painel.php';</script>";
            } else {
                echo "<script>alert('Erro ao realizar o cadastro: " . $stmt->error . "');</script>";
            }
        }

        // Fecha a instrução
        $stmt->close();
    }
}

// Fecha a conexão
$conn->close();
?>

<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="imagens/favicon/logo.png" type="image/x-icon">
    <title>Cadastro - Zoo da Oldy</title>
    <style>
        body {
            background-image: url('imagens/banner.jpg');
            background-size: cover;
            background-position: center;
            font-family: Arial, sans-serif;
            color: #333;
        }
        .form-container {
            max-width: 500px;
            margin: 50px auto;
            padding: 20px;
            background-color: rgba(255, 255, 255, 0.9);
            border-radius: 8px;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
            text-align: left;
        }
        .logo-container img {
            width: 100px;
            display: block;
            margin: 0 auto 20px;
        }
        h2 {
            text-align: center; /* Centraliza o texto */
        }
        label {
            display: block;
            margin: 10px 0 5px;
        }
        input, select, button {
            width: 100%;
            padding: 8px;
            margin-bottom: 10px;
            border-radius: 4px;
            border: 1px solid #ccc;
            text-align: left;
        }
        .btn-group {
            display: flex;
            justify-content: center;
            gap: 10px;
        }
        .btn-group button {
            width: 40%;
            padding: 8px;
            background-color: #4CAF50;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            text-align: center;
        }
        .step {
            display: none;
        }
        .step.active {
            display: block;
        }
    </style>
</head>
<body>

<div class="form-container">
    <div class="logo-container">
        <img src="imagens/logo.png" alt="Logo do Zoo da Oldy">
    </div>

    <h2>Cadastro - Zoo da Oldy</h2>

    <form id="registerForm" method="POST" action="">
        <!-- Etapa 1 -->
        <div class="step active">
            <label for="nome">Nome:</label>
            <input type="text" id="nome" name="nome" placeholder="Insira seu nome" required>

            <label for="apelido">Apelido (Sobrenome):</label>
            <input type="text" id="apelido" name="apelido" placeholder="Insira seu apelido" required>

            <label for="sexo">Sexo:</label>
            <select name="sexo" id="sexo" required>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="Outro">Outro</option>
            </select>

            <label for="endereco">Endereço:</label>
            <input type="text" id="endereco" name="endereco" placeholder="Insira seu endereço" required>

            <div class="btn-group">
                <button type="button" onclick="nextStep()">Avançar</button>
            </div>
        </div>

        <!-- Etapa 2 -->
        <div class="step">
            <label for="pais">Nacionalidade:</label>
            <select id="pais" name="pais" required>
                <option value="">Selecione um país</option>
                <option value="Moçambique">Moçambique (+258)</option>
                <option value="Brasil">Brasil (+55)</option>
                <option value="Outro">Outro (especifique)</option>
            </select>
            <input type="text" id="outroPais" name="outroPais" placeholder="Especifique o país e código" style="display:none;">

            <label for="telefone">Telefone:</label>
            <input type="tel" id="telefone" name="telefone" placeholder="Digite o telefone com o código de área" required>

            <label for="data_nascimento">Data de Nascimento:</label>
            <input type="date" id="data_nascimento" name="data_nascimento" required>

            <label for="ocupacao">Ocupação:</label>
            <input type="text" id="ocupacao" name="ocupacao" required>

            <div class="btn-group">
                <button type="button" onclick="prevStep()">Retroceder</button>
                <button type="button" onclick="nextStep()">Avançar</button>
            </div>
        </div>

        <!-- Etapa 3 -->
        <div class="step">
            <label for="usuario">Usuário:</label>
            <input type="text" id="usuario" name="usuario" placeholder="Escolha um nome de usuário" required>

            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>

            <label for="senha">Senha:</label>
            <input type="password" id="senha" name="senha" required>

            <label for="confirmarSenha">Confirmar Senha:</label>
            <input type="password" id="confirmarSenha" name="confirmarSenha" required>

            <div class="btn-group">
                <button type="button" onclick="prevStep()">Retroceder</button>
                <button type="submit">Cadastrar</button>
            </div>
        </div>
    </form>
</div>

<script>
    let currentStep = 0;

    function showStep(step) {
        const steps = document.querySelectorAll(".step");
        steps.forEach((s, index) => {
            s.classList.toggle("active", index === step);
        });
    }

    function nextStep() {
        const currentInputs = document.querySelectorAll(`.step.active input, .step.active select`);
        let allFilled = true;
        currentInputs.forEach(input => {
            if (input.value === "" && input.hasAttribute("required")) {
                allFilled = false;
            }
        });

        if (allFilled) {
            currentStep++;
            showStep(currentStep);
        } else {
            alert("Por favor, preencha todos os campos obrigatórios.");
        }
    }

    function prevStep() {
        currentStep--;
        showStep(currentStep);
    }

    document.getElementById('pais').addEventListener('change', function () {
        const outroPais = document.getElementById('outroPais');
        if (this.value === 'Outro') {
            outroPais.style.display = 'block';
        } else {
            outroPais.style.display = 'none';
        }
    });
</script>

</body>
</html>
