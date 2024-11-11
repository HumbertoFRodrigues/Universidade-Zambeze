<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estatísticas do Zoológico</title>
    <link rel="stylesheet" href="css/estat.css"> <!-- CSS para estilização -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script> <!-- Importando Chart.js para gráficos -->
    <style>
        /* Estilo para os cartões */
        .statistics-cards {
            display: flex;
            justify-content: space-around;
            padding: 20px;
            flex-wrap: wrap;
            gap: 10px;
        }
        .card {
            background-color: #f0f4f8;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
            width: 180px;
            margin: 10px;
        }
        .card h3 {
            font-size: 1em;
            margin: 8px 0;
        }
        .card p {
            font-size: 1.2em;
            color: #007BFF;
        }
        .card .icon {
            width: 30px;
            height: 30px;
            margin-bottom: 8px;
            fill: #007BFF;
        }
    </style>
</head>
<body>
    <?php 
    include '../db_conexao.php'; 

    // Verificar se a sessão já foi iniciada para evitar o erro
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    // Verificar se o usuário está logado com nivel_id = 3
    if (!isset($_SESSION['nivel_id']) || $_SESSION['nivel_id'] != 3) {
        echo "Acesso negado.";
        exit();
    }

    // Conexão com o banco de dados e consultas para as estatísticas
    // Total de fotos
    $stmt = $conn->prepare("SELECT COUNT(*) AS total_fotos FROM fotos_especies");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $totalFotos = $result['total_fotos'];

    // Total de reservas aprovadas
    $stmt = $conn->prepare("SELECT COUNT(*) AS total_reservas_aprovadas FROM reservas WHERE status = 'aprovada'");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $totalReservasAprovadas = $result['total_reservas_aprovadas'];

    // Total de reservas rejeitadas
    $stmt = $conn->prepare("SELECT COUNT(*) AS total_reservas_rejeitadas FROM reservas WHERE status = 'rejeitada'");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $totalReservasRejeitadas = $result['total_reservas_rejeitadas'];

    // Total de animais
    $stmt = $conn->prepare("SELECT COUNT(*) AS total_animais FROM especies");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $totalAnimais = $result['total_animais'];

    // Total de grupos (categorias)
    $stmt = $conn->prepare("SELECT COUNT(DISTINCT tipo) AS total_grupos FROM especies");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $totalGrupos = $result['total_grupos'];

    // Total de reclamações
    $stmt = $conn->prepare("SELECT COUNT(*) AS total_reclamacoes FROM reclamacoes");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $totalReclamacoes = $result['total_reclamacoes'];

    // Total de respostas
    $stmt = $conn->prepare("SELECT COUNT(*) AS total_respostas FROM reclamacoes WHERE resposta IS NOT NULL");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $totalRespostas = $result['total_respostas'];
    ?>

    <h1>Estatísticas do Zoológico</h1>

    <div class="statistics-cards">
        <div class="card">
            <!-- Ícone SVG para fotos -->
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M21 19v-12h-16v12h16zm0-14c1.104 0 2 .896 2 2v12c0 1.104-.896 2-2 2h-16c-1.104 0-2-.896-2-2v-12c0-1.104.896-2 2-2h16zm-10 6l3 4 2-3 3 4h-10z"/>
            </svg>
            <h3>Total de Fotos</h3>
            <p><?php echo $totalFotos; ?></p>
        </div>
        <div class="card">
            <!-- Ícone SVG para reservas aprovadas -->
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M9 17l-5-5 1.41-1.41L9 14.17l8.59-8.59L19 7l-10 10z"/>
            </svg>
            <h3>Reservas Aprovadas</h3>
            <p><?php echo $totalReservasAprovadas; ?></p>
        </div>
        <div class="card">
            <!-- Ícone SVG para reservas rejeitadas -->
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M18.36 6.64l-1.41 1.41L12 12.59 7.05 7.64 5.64 9.05l4.95 4.95-4.95 4.95 1.41 1.41L12 15.41l4.95 4.95 1.41-1.41-4.95-4.95 4.95-4.95z"/>
            </svg>
            <h3>Reservas Rejeitadas</h3>
            <p><?php echo $totalReservasRejeitadas; ?></p>
        </div>
        <div class="card">
            <!-- Ícone SVG de pata para animais -->
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M12 2C10.9 2 10 2.9 10 4s.9 2 2 2 2-.9 2-2-.9-2-2-2zm5 3c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-9 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm11 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-11 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm6 5c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <h3>Total de Animais</h3>
            <p><?php echo $totalAnimais; ?></p>
        </div>
        <div class="card">
            <!-- Ícone SVG para grupos -->
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M3 13h18v-2h-18v2zm0 7h18v-2h-18v2zm0-14v2h18v-2h-18z"/>
            </svg>
            <h3>Total de Grupos</h3>
            <p><?php echo $totalGrupos; ?></p>
        </div>
        <div class="card">
            <!-- Ícone SVG para reclamações -->
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M3 12l18-9-7 9 7 9-18-9zm3.5 0l11.5 5.74-4.5-5.74 4.5-5.74-11.5 5.74z"/>
            </svg>
            <h3>Total de Reclamações</h3>
            <p><?php echo $totalReclamacoes; ?></p>
        </div>
        <div class="card">
            <!-- Ícone SVG para respostas (mensagem) -->
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v16l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 10H6v-2h12v2zm0-3H6V7h12v2z"/>
            </svg>
            <h3>Total de Respostas</h3>
            <p><?php echo $totalRespostas; ?></p>
        </div>
    </div>

    <h2>Gráficos</h2>
    <canvas id="statsChart" width="400" height="200"></canvas>
    <script>
        const ctx = document.getElementById('statsChart').getContext('2d');
        const statsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Fotos', 'Reservas Aprovadas', 'Reservas Rejeitadas', 'Animais', 'Grupos', 'Reclamações', 'Respostas'],
                datasets: [{
                    label: 'Estatísticas',
                    data: [
                        <?php echo $totalFotos; ?>,
                        <?php echo $totalReservasAprovadas; ?>,
                        <?php echo $totalReservasRejeitadas; ?>,
                        <?php echo $totalAnimais; ?>,
                        <?php echo $totalGrupos; ?>,
                        <?php echo $totalReclamacoes; ?>,
                        <?php echo $totalRespostas; ?>
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
