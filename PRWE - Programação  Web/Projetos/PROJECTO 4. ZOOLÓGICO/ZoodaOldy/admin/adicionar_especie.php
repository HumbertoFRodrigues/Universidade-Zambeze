<?php
// Inicia a sessão apenas se ela não estiver ativa
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require '../db_conexao.php';

// Verifica se o usuário está logado e é um administrador ou funcionário (nível_id 1 ou 2)
if (!isset($_SESSION['user_id']) || ($_SESSION['nivel_id'] != 1 && $_SESSION['nivel_id'] != 2)) {
    echo "Acesso negado. Você não tem permissão para acessar esta página.";
    exit;
}

$conn = conectarBancoDeDados();

// Se a solicitação for um POST, processar a adição de uma nova espécie
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = $_POST['nome'];
    $tipo = $_POST['grupo'];
    $data_aquisicao = $_POST['data_aquisicao'];
    $numero_animais = $_POST['numero_animais'];
    $num_femeas = $_POST['num_femeas'];
    $gestacao_duracao = $_POST['periodo_gestacao'];
    $peso_maximo = $_POST['peso_maximo'];
    $comprimento_max = $_POST['comprimento_maximo'];
    $dieta = $_POST['dieta'];
    $cor_caracteristica = $_POST['cor_caracteristica'];
    $acasalamento_inicio = $_POST['acasalamento_inicio'];
    $acasalamento_fim = $_POST['acasalamento_fim'];
    $idade_maxima = $_POST['idade_maxima'];

    // Insere os dados da nova espécie na tabela `especies`
    $stmt = $conn->prepare("INSERT INTO especies (nome, tipo, data_aquisicao, num_animais, num_femeas, gestacao_duracao, peso_maximo, comprimento_max, dieta, cor_caracteristica, mes_acasalamento_inicio, mes_acasalamento_fim, idade_maxima) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$nome, $tipo, $data_aquisicao, $numero_animais, $num_femeas, $gestacao_duracao, $peso_maximo, $comprimento_max, $dieta, $cor_caracteristica, $acasalamento_inicio, $acasalamento_fim, $idade_maxima]);

    // Obtém o ID da espécie recém-inserida
    $especie_id = $conn->lastInsertId();

    // Verifica e processa o upload da imagem
    if (isset($_FILES['foto']) && $_FILES['foto']['error'] == UPLOAD_ERR_OK) {
        $diretorioUpload = '../especies/';
        $fotoNome = uniqid() . '_' . basename($_FILES['foto']['name']);
        $fotoCaminho = $diretorioUpload . $fotoNome;

        if (move_uploaded_file($_FILES['foto']['tmp_name'], $fotoCaminho)) {
            $fotoCaminhoRelativo = 'especies/' . $fotoNome;
            $stmtFoto = $conn->prepare("INSERT INTO fotos_especies (especie_id, caminho) VALUES (?, ?)");
            $stmtFoto->execute([$especie_id, $fotoCaminhoRelativo]);
        } else {
            echo "Erro ao salvar a foto da espécie.";
            exit;
        }
    }

    echo "Espécie adicionada com sucesso!";
    exit;
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Adicionar Espécie</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
        }

        .container {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: calc(100vh - 70px);
            padding-top: 20px;
        }

        h1 {
            color: #333;
            margin-bottom: 20px;
            text-align: center;
        }

        .especie-container {
            background: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 500px;
            margin-top: 10px;
        }

        .especie-container label {
            font-weight: bold;
            margin-top: 10px;
            display: block;
        }

        .especie-container input,
        .especie-container select {
            width: calc(100% - 20px);
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            border: 1px solid #ddd;
        }

        .especie-container button {
            background-color: #4CAF50;
            color: white;
            padding: 10px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
        }

        .especie-container button:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="especie-container">
            <h1>Adicionar Nova Espécie</h1>
            <form id="especieForm" enctype="multipart/form-data">
                <label for="nome">Nome da Espécie:</label>
                <input type="text" id="nome" name="nome" required>

                <label for="grupo">Grupo:</label>
                <select id="grupo" name="grupo" required>
                    <option value="mamifero">Mamíferos</option>
                    <option value="passaro">Pássaros</option>
                    <option value="reptil">Répteis</option>
                </select>

                <label for="data_aquisicao">Data de Aquisição:</label>
                <input type="date" id="data_aquisicao" name="data_aquisicao" required>

                <label for="numero_animais">Número de Animais:</label>
                <input type="number" id="numero_animais" name="numero_animais" min="0" required>

                <label for="num_femeas">Número de Fêmeas:</label>
                <input type="number" id="num_femeas" name="num_femeas" min="0" required>

                <label for="periodo_gestacao">Período de Gestação (em dias):</label>
                <input type="number" id="periodo_gestacao" name="periodo_gestacao">

                <label for="peso_maximo">Peso Máximo (em kg):</label>
                <input type="number" id="peso_maximo" name="peso_maximo" step="0.01">

                <label for="comprimento_maximo">Comprimento Máximo (em metros):</label>
                <input type="number" id="comprimento_maximo" name="comprimento_maximo" step="0.01">

                <label for="dieta">Dieta:</label>
                <select id="dieta" name="dieta" required>
                    <option value="herbivoro">Herbívoro</option>
                    <option value="carnivoro">Carnívoro</option>
                    <option value="onivoro">Onívoro</option>
                </select>

                <label for="cor_caracteristica">Cor Característica:</label>
                <input type="text" id="cor_caracteristica" name="cor_caracteristica">

                <label for="acasalamento_inicio">Início do Período de Acasalamento (mês):</label>
                <input type="text" id="acasalamento_inicio" name="acasalamento_inicio">

                <label for="acasalamento_fim">Fim do Período de Acasalamento (mês):</label>
                <input type="text" id="acasalamento_fim" name="acasalamento_fim">

                <label for="idade_maxima">Idade Máxima (em anos):</label>
                <input type="number" id="idade_maxima" name="idade_maxima">

                <label for="foto">Foto da Espécie:</label>
                <input type="file" id="foto" name="foto" accept="image/*">

                <button type="button" onclick="adicionarEspecie()">Adicionar Espécie</button>
            </form>
        </div>
    </div>

    <script>
        function adicionarEspecie() {
            const form = document.getElementById("especieForm");
            const formData = new FormData(form);

            fetch('adicionar_especie.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.text())
            .then(responseText => {
                alert(responseText);
                if (responseText.includes("Espécie adicionada com sucesso!")) {
                    form.reset(); // Limpa o formulário
                    window.location.reload(); // Recarrega a página
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao adicionar espécie.');
            });
        }
    </script>
</body>
</html>
