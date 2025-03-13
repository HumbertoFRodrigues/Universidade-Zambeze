<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exercício 3 - Aceitação</title>
</head>
<body>
    <h1>Exercício 3 - Aceitação</h1>

    <!-- Formulário para entrada dos dados -->
    <form method="POST">
        <label for="nome">Nome:</label>
        <input type="text" id="nome" name="nome" required>

        <label for="sexo">Sexo:</label>
        <select id="sexo" name="sexo" required>
            <option value="feminino">Feminino</option>
            <option value="masculino">Masculino</option>
        </select>

        <label for="idade">Idade:</label>
        <input type="number" id="idade" name="idade" required>

        <button type="submit">Verificar</button>
    </form>

<!--PHP PARA VERIFCAO DO FORMULARIO-->
    <?php
    // Verificando se o formulário foi enviado
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        // Pegando os valores inseridos no formulário
        $nome = $_POST["nome"];
        $sexo = $_POST["sexo"];
        $idade = $_POST["idade"];

        // Agora, condicoes para verificar se a pessoa é do sexo feminino e tem menos de 25 anos
        if ($sexo == "feminino" && $idade < 25) {
            // Se for feminino e tiver menos de 25 anos, a pessoa é "ACEITA"
            echo "<div id='saida'><p class='aceita'>" . $nome . " ACEITA</p></div>";
        } else {
            // Caso contrário, a pessoa é "NÃO ACEITA"
            echo "<div id='saida'><p class='nao-aceita'>" . $nome . " NÃO ACEITA</p></div>";
        }
    }
    ?>
</body>
<style>
        /* Estilo simples para a página */
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            text-align: center;
            padding: 20px;
        }

        /* Título centralizado */
        h1 {
            color: #007BFF;
            font-size: 2.5em;
            margin-bottom: 20px;
        }

        /* Estilo do formulário */
        form {
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #ddd;
            width: 250px;
            margin: 0 auto;
            text-align: left;
        }

        /* Estilo para os campos de entrada */
        input, select {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            border: 1px solid #ccc;
        }

        /* Botão para submeter o formulário */
        button {
            padding: 10px 20px;
            background-color: #007BFF;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }

        button:hover {
            background-color: #0056b3;
        }

        /* Estilo para a div onde o resultado será exibido */
        #saida {
            background-color: white;
            padding: 20px;
            margin-top: 20px;
            border-radius: 12px;
            border: 1px solid #ddd;
            width: 250px;
            text-align: center;
            margin: 20px auto;
        }

        /* Estilo para o texto dentro da caixa de resultado */
        #saida p {
            margin-top: 10px;
            font-size: 1.2em;
            color: #333;
        }

        /* Negrito para as mensagens de aceitação */
        .aceita {
            font-weight: bold;
            color: green;
        }

        .nao-aceita {
            font-weight: bold;
            color: red;
        }
    </style>
</html>