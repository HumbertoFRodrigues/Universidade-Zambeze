<?php
// Iniciar a sessão se ainda não estiver ativa
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Verifique se o usuário está logado
if (!isset($_SESSION['user_id'])) {
    http_response_code(403); // Acesso negado
    exit("Acesso negado: você precisa estar logado.");
}

// Preços dos bilhetes
$preco_adulto = 200; // Preço do bilhete para adultos
$preco_crianca = 100; // Preço do bilhete para crianças

// Função para calcular o total com base na quantidade de adultos e crianças
function calcular_total($adultos, $criancas) {
    global $preco_adulto, $preco_crianca;
    return ($adultos * $preco_adulto) + ($criancas * $preco_crianca);
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reserva - Zoo da Oldy</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        h1 {
            color: #333;
            text-align: center;
        }
        form {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            margin: auto;
        }
        label {
            display: block;
            margin: 10px 0 5px;
        }
        input[type="number"], select {
            width: calc(100% - 16px);
            padding: 8px;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box; /* Para garantir que o padding não aumente a largura total */
        }
        input[type="submit"] {
            background-color: #4CAF50;
            color: white;
            padding: 10px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
        }
        input[type="submit"]:hover {
            background-color: #45a049;
        }
        .total {
            margin-top: 20px;
            font-weight: bold;
            text-align: center;
            font-size: 1.5em;
            color: #333;
        }
    </style>
</head>
<body>

<h1>Reserva de Bilhetes e Serviços</h1>
<form action="processar_reserva.php" method="POST">
    <label for="adultos">Quantidade de Adultos:</label>
    <input type="number" id="adultos" name="adultos" min="0" value="0" required>

    <label for="criancas">Quantidade de Crianças:</label>
    <input type="number" id="criancas" name="criancas" min="0" value="0" required>

    <h2>Serviços Adicionais</h2>
    <label for="safari">Safari (preço: 500 MZN):</label>
    <input type="number" id="safari" name="safari" min="0" value="0">

    <label for="alimentacao">Alimentação (preço: 150 MZN por pessoa):</label>
    <input type="number" id="alimentacao" name="alimentacao" min="0" value="0">

    <label for="hospedagem">Hospedagem (quarto) (preço: 1000 MZN por quarto):</label>
    <input type="number" id="hospedagem" name="hospedagem" min="0" value="0">

    <label for="espaco_evento">Reserva de Espaço para Eventos (preço: 2000 MZN):</label>
    <input type="number" id="espaco_evento" name="espaco_evento" min="0" value="0">

    <input type="submit" value="Calcular Total">
</form>

<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $adultos = $_POST['adultos'];
    $criancas = $_POST['criancas'];
    $safari = $_POST['safari'];
    $alimentacao = $_POST['alimentacao'];
    $hospedagem = $_POST['hospedagem'];
    $espaco_evento = $_POST['espaco_evento'];

    // Calcular total
    $total_bilhete = calcular_total($adultos, $criancas);
    $total_safari = $safari * 500;
    $total_alimentacao = $alimentacao * 150;
    $total_hospedagem = $hospedagem * 1000;
    $total_evento = $espaco_evento * 2000;

    $total_final = $total_bilhete + $total_safari + $total_alimentacao + $total_hospedagem + $total_evento;

    echo "<div class='total'>Total da Reserva: " . number_format($total_final, 2) . " MZN</div>";
}
?>

</body>
</html>
