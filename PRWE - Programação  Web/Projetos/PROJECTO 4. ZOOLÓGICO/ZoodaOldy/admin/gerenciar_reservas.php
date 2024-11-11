<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require '../db_conexao.php';

// Verifica se o usuário está logado e é administrador ou funcionário (nível_id 1 ou 2)
if (!isset($_SESSION['user_id']) || ($_SESSION['nivel_id'] != 1 && $_SESSION['nivel_id'] != 2)) {
    echo "Acesso negado. Você não tem permissão para acessar esta página.";
    exit;
}

$conn = conectarBancoDeDados();

// Atualizar o status da reserva
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['reserva_id']) && isset($_POST['novo_status'])) {
    $reserva_id = $_POST['reserva_id'];
    $novo_status = $_POST['novo_status'];

    $stmt = $conn->prepare("UPDATE reservas SET status = ? WHERE id = ?");
    $stmt->execute([$novo_status, $reserva_id]);

    echo "Status da reserva atualizado com sucesso!";
    exit; // Como estamos usando AJAX, finalizamos a execução aqui.
}

// Obter todas as reservas
$stmt = $conn->prepare("SELECT reservas.*, usuarios.nome FROM reservas JOIN usuarios ON reservas.user_id = usuarios.id ORDER BY reservas.data_reserva DESC");
$stmt->execute();
$reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Gerenciar Reservas</title>
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
            text-align: center;
            margin-top: 20px;
        }

        .reservas-container {
            width: 95%;
            max-width: 1000px;
            margin: 20px auto;
            background: #fff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        th, td {
            padding: 12px;
            text-align: center;
            border-bottom: 1px solid #ddd;
        }

        th {
            background-color: #4CAF50;
            color: white;
        }

        tr:nth-child(even) {
            background-color: #f2f2f2;
        }

        tr:hover {
            background-color: #e0e0e0;
        }

        select {
            padding: 5px;
            margin-right: 5px;
            border-radius: 4px;
            border: 1px solid #ccc;
        }

        button {
            padding: 6px 10px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        button:hover {
            background-color: #45a049;
        }

        .form-status {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        h2 {
            text-align: center;
            color: #333;
        }

        p {
            text-align: center;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="reservas-container">
        <h1>Gerenciar Reservas</h1>
        <table>
            <thead>
                <tr>
                    <th>ID da Reserva</th>
                    <th>Nome do Usuário</th>
                    <th>Tipo de Reserva</th>
                    <th>Valor Total (MZN)</th>
                    <th>Status</th>
                    <th>Data da Reserva</th>
                    <th>Ação</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($reservas as $reserva): ?>
                    <tr>
                        <td><?= htmlspecialchars($reserva['id']) ?></td>
                        <td><?= htmlspecialchars($reserva['nome']) ?></td>
                        <td><?= htmlspecialchars($reserva['tipo_reserva']) ?></td>
                        <td><?= htmlspecialchars($reserva['valor_total']) ?></td>
                        <td><?= htmlspecialchars($reserva['status']) ?></td>
                        <td><?= htmlspecialchars($reserva['data_reserva']) ?></td>
                        <td>
                            <form class="form-status" method="POST" onsubmit="atualizarStatus(event, <?= $reserva['id'] ?>)">
                                <input type="hidden" name="reserva_id" value="<?= $reserva['id'] ?>">
                                <select name="novo_status" required>
                                    <option value="Aguardando Aprovação">Aguardando Aprovação</option>
                                    <option value="Aprovada">Aprovada</option>
                                    <option value="Rejeitada">Rejeitada</option>
                                </select>
                                <button type="submit">Atualizar</button>
                            </form>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <h2>Ajustar Preços dos Serviços</h2>
    <p>Para ajustar os preços dos serviços ou adicionar novos serviços, brevemente... por agora alterações diretamente no codigo.</p>

    <script>
        // Função para atualizar o status da reserva via AJAX
        function atualizarStatus(event, reservaId) {
            event.preventDefault(); // Evita a atualização padrão da página

            const formData = new FormData(event.target);
            formData.append('reserva_id', reservaId);

            fetch('gerenciar_reservas.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.text())
            .then(data => {
                alert(data);
                window.location.reload(); // Recarrega a página para ver as atualizações
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao atualizar o status da reserva.');
            });
        }
    </script>
</body>
</html>
