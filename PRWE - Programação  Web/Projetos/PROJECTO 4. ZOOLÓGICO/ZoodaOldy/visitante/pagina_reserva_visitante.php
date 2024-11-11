<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require '../db_conexao.php';

// Verifica se o usuário está logado e é um visitante (nível_id 3)
if (!isset($_SESSION['user_id']) || $_SESSION['nivel_id'] != 3) {
    echo "Acesso negado. Você não tem permissão para acessar esta página.";
    exit;
}

$conn = conectarBancoDeDados();

// Obter reservas do usuário logado
$stmt = $conn->prepare("SELECT * FROM reservas WHERE user_id = ?");
$stmt->execute([$_SESSION['user_id']]);
$reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Fazer Reserva</title>
    <link rel="stylesheet" href="styles.css"> <!-- Adicione seu arquivo CSS aqui -->
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
        }

        h1 {
            color: #333;
            margin-top: 20px;
            text-align: center;
        }

        .reserva-container {
            background: #ffffff;
            padding: 10px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 500px; /* Reduzindo a largura máxima para melhor ajuste */
            margin: 30px auto; /* Centralizando na tela */
        }

        .reserva-container label {
            font-weight: bold;
        }

        .reserva-container input,
        .reserva-container select {
            width: 95%;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            border: 1px solid #ddd;
            box-sizing: border-box; /* Garante que o padding não aumente a largura total */
        }

        .reserva-container button {
            background-color: #4CAF50;
            color: white;
            padding: 10px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
            max-width: 200px; /* Limitando a largura do botão */
            margin: 0 auto; /* Centralizando o botão */
            display: block; /* Centralizar botão com margem */
        }

        .reserva-container button:hover {
            background-color: #45a049;
        }

        .reservas-table-container {
            width: 100%;
            max-width: 600px;
            margin: 30px auto; /* Centralizando a tabela */
        }

        .reservas-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }

        .reservas-table th,
        .reservas-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }

        .reservas-table th {
            background-color: #4CAF50;
            color: white;
        }

        .reservas-table tr:nth-child(even) {
            background-color: #f2f2f2;
        }

        @media (max-width: 768px) {
            .reserva-container,
            .reservas-table-container {
                width: 90%;
                margin: 20px auto;
            }

            .reserva-container button {
                width: 100%; /* Tornando o botão responsivo */
            }
        }
    </style>
</head>
<body>
    <h1>Fazer Reserva</h1>
    <div class="reserva-container">
        <form id="reservaForm">
            <label for="tipo_reserva">Tipo de Reserva:</label>
            <select name="tipo_reserva" id="tipo_reserva" required>
                <option value="entrada_adulto">Entrada Adulto (200 MZN)</option>
                <option value="entrada_crianca">Entrada Criança (100 MZN)</option>
                <option value="safari">Safari (500 MZN)</option>
                <option value="alimentacao">Alimentação (150 MZN por pessoa)</option>
                <option value="hospedagem">Hospedagem (1000 MZN por quarto)</option>
                <option value="evento">Reserva de Espaço para Eventos (2000 MZN)</option>
            </select>

            <label for="quantidade">Quantidade:</label>
            <input type="number" name="quantidade" id="quantidade" min="1" required>

            <button type="button" onclick="fazerReserva()">Reservar</button>
        </form>
    </div>

    <div class="reservas-table-container">
        <h2>Minhas Reservas</h2>
        <table class="reservas-table">
            <thead>
                <tr>
                    <th>Tipo de Reserva</th>
                    <th>Valor Total (MZN)</th>
                    <th>Status</th>
                    <th>Data da Reserva</th>
                </tr>
            </thead>
            <tbody id="reservasTabela">
                <?php foreach ($reservas as $reserva): ?>
                    <tr>
                        <td><?= htmlspecialchars($reserva['tipo_reserva']) ?></td>
                        <td><?= htmlspecialchars($reserva['valor_total']) ?></td>
                        <td><?= htmlspecialchars($reserva['status']) ?></td>
                        <td><?= htmlspecialchars($reserva['data_reserva']) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <script>
        function fazerReserva() {
            const formData = new FormData(document.getElementById("reservaForm"));

            fetch('processa_reserva.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.text())
            .then(responseText => {
                alert(responseText);
                atualizarReservas();
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao fazer a reserva.');
            });
        }

        function atualizarReservas() {
            fetch('buscar_reservas.php')
            .then(response => response.json())
            .then(data => {
                const reservasTabela = document.getElementById("reservasTabela");
                reservasTabela.innerHTML = '';

                data.forEach(reserva => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${reserva.tipo_reserva}</td>
                        <td>${reserva.valor_total}</td>
                        <td>${reserva.status}</td>
                        <td>${reserva.data_reserva}</td>
                    `;
                    reservasTabela.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Erro ao atualizar reservas:', error);
            });
        }
    </script>
</body>
</html>
