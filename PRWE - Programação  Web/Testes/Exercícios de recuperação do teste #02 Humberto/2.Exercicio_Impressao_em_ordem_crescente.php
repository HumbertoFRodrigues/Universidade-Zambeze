<?php
// Definindo as variáveis A e B que vamos comparar
$A = 5;  // Podemos mudar este valor para testar
$B = 4;  // Podemos mudar este valor para testar

// Verificando e imprimindo os valores em ordem crescente com as condicoes if e else...
if ($A < $B) {
    $resultado = $A . " " . $B; // Se A for menor que B, imprime A e depois B
} else {
    $resultado = $B . " " . $A; // Se B for menor que A, imprime B e depois A
}
?>

<!--HTML PARA PREVISUALIZACAO-->
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exercício 2 - Ordem Crescente</title>
    
    <h1>Exercício 2 - Ordem Crescente</h1>

    <div id="saida">
        <!-- Exibindo o resultado calculado pelo PHP que foi guardado na variavel $resultado -->
        <p>Ordem crescente: <?php echo $resultado; ?></p>
    </div>



<!--CSS ESTILO SIMPLES PARA PREVISUALIZACAO-->

    <style>
        /* Resetando margens e padding */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        /* Estilo simples para o body */
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            text-align: center;
            padding: 20px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        /* Título centralizado */
        h1 {
            color: #007BFF;
            font-size: 2.5em;
            margin-bottom: 20px;
        }

        /* Estilo para a div onde o resultado será exibido */
        #saida {
            background-color: white;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #ddd;
            width: 250px;
            text-align: center;
        }
    </style>
</head>
<body>

</body>
</html>