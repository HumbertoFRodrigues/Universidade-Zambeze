<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estatísticas do Zoológico</title>
    <link rel="stylesheet" href="css/estat.css"> <!-- CSS para estilização -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script> <!-- Importando Chart.js para gráficos -->
</head>
<body>
    <?php include '../db_conexao.php'; ?> <!-- Inclui a conexão ao banco de dados -->

    <h1>Estatísticas do Zoológico</h1>

    <div class="statistics-cards">
        <?php
        // Total de usuários
        $stmt = $conn->prepare("SELECT COUNT(*) AS total_usuarios FROM usuarios");
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalUsuarios = $result['total_usuarios'];

        // Total de respostas (assumindo que estão na tabela de reclamações)
        $stmt = $conn->prepare("SELECT COUNT(*) AS total_respostas FROM reclamacoes WHERE problema_animal IS NOT NULL");
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalRespostas = $result['total_respostas'];

        // Total de sugestões (assumindo que estão na tabela de reclamações)
        $stmt = $conn->prepare("SELECT COUNT(*) AS total_sugestoes FROM reclamacoes WHERE sugestoes IS NOT NULL");
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalSugestoes = $result['total_sugestoes'];

        // Mostrar os dados em cards com ícones
        echo "<div class='card'><i class='icon-user'></i><h3>Total de Usuários</h3><p>$totalUsuarios</p></div>";
        echo "<div class='card'><i class='icon-reply'></i><h3>Respostas Recebidas</h3><p>$totalRespostas</p></div>";
        echo "<div class='card'><i class='icon-suggestion'></i><h3>Sugestões Recebidas</h3><p>$totalSugestoes</p></div>";
        ?>
    </div>

    <h2>Gráficos</h2>
    <canvas id="statsChart" width="400" height="200"></canvas>
    <script>
        const ctx = document.getElementById('statsChart').getContext('2d');
        const statsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Usuários', 'Respostas', 'Sugestões'],
                datasets: [{
                    label: 'Estatísticas',
                    data: [
                        <?php echo $totalUsuarios; ?>,
                        <?php echo $totalRespostas; ?>,
                        <?php echo $totalSugestoes; ?>
                    ],
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    </script>
</body>
</html>
