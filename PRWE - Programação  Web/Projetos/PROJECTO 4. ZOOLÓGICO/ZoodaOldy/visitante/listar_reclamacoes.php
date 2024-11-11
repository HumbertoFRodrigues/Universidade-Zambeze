<?php
// Verifique se a sessão já está ativa antes de iniciar
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Verifique se o usuário está logado
if (!isset($_SESSION['user_id'])) {
    http_response_code(403); // Acesso negado
    exit("Acesso negado: você precisa estar logado.");
}

// Configurações de conexão com o banco de dados
$host = 'localhost';
$db = 'zoo_da_oldy';
$user = 'root';
$pass = '';

try {
    // Conexão com o banco de dados usando PDO
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Obter o nível do usuário logado e ID
    $user_id = $_SESSION['user_id'];
    $stmt = $pdo->prepare("SELECT nivel_id FROM usuarios WHERE id = :user_id");
    $stmt->execute(['user_id' => $user_id]);
    $user = $stmt->fetch();

    if (!$user) {
        exit("Usuário não encontrado.");
    }

    $nivel_id = $user['nivel_id'];

    // Filtrar as reclamações apenas do usuário logado
    if ($nivel_id == 3) { // 3 é para visitantes
        $stmt = $pdo->prepare("SELECT * FROM reclamacoes WHERE user_id = :user_id ORDER BY id DESC");
        $stmt->execute(['user_id' => $user_id]);
    } else {
        // Se for admin ou funcionário, listar apenas as reclamações feitas por eles (caso desejado)
        $stmt = $pdo->prepare("SELECT * FROM reclamacoes WHERE user_id = :user_id ORDER BY id DESC");
        $stmt->execute(['user_id' => $user_id]);
    }

    $reclamacoes = $stmt->fetchAll();

    // Exibir as reclamações com estilos básicos
    echo "<style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 20px;
            }
            h1 {
                color: #333;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            th, td {
                padding: 10px;
                text-align: left;
                border: 1px solid #ddd;
            }
            th {
                background-color: #4CAF50;
                color: white;
            }
            tr:nth-child(even) {
                background-color: #f2f2f2;
            }
            tr:hover {
                background-color: #ddd;
            }
            .popup {
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 50%;
                background-color: white;
                border: 2px solid #4CAF50;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                padding: 20px;
                z-index: 1000;
            }
            .popup .close-btn {
                float: right;
                cursor: pointer;
                font-weight: bold;
            }
            #overlay {
                position: fixed;
                display: none;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 999;
            }
          </style>";

    echo "<h1>Lista de Reclamações</h1>";
    if (count($reclamacoes) > 0) {
        echo "<table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tipo</th>
                        <th>Comentários</th>
                        <th>Sugestões</th>
                        <th>Problema do Animal</th>
                        <th>Comentários do Animal</th>
                        <th>Áudio</th>
                        <th>Resposta</th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>";

        foreach ($reclamacoes as $reclamacao) {
            $data = $reclamacao['data'];
            $audioUrl = $reclamacao['audio'];
            $resposta = isset($reclamacao['resposta']) ? $reclamacao['resposta'] : 'Sem resposta ainda';

            echo "<tr>
                    <td>{$reclamacao['id']}</td>
                    <td>" . htmlspecialchars($reclamacao['tipo']) . "</td>
                    <td>" . htmlspecialchars($reclamacao['comentarios']) . "</td>
                    <td>" . htmlspecialchars($reclamacao['sugestoes']) . "</td>
                    <td>" . htmlspecialchars($reclamacao['problema_animal']) . "</td>
                    <td>" . htmlspecialchars($reclamacao['comentarios_animal']) . "</td>
                    <td>
                        " . ($audioUrl ? "<audio controls>
                            <source src='" . htmlspecialchars($audioUrl) . "' type='audio/mpeg'>
                            Seu navegador não suporta o elemento de áudio.
                        </audio>" : 'Nenhum áudio disponível') . "
                    </td>
                    <td>
                        " . (strlen($resposta) > 30 
                            ? "<button onclick='showResponsePopup(" . json_encode($resposta) . ")'>Ver Resposta</button>" 
                            : htmlspecialchars($resposta)) . "
                    </td>
                    <td>" . htmlspecialchars($data) . "</td>
                  </tr>";
        }

        echo "</tbody></table>";
    } else {
        echo "<p>Nenhuma reclamação encontrada.</p>";
    }

    echo "<div id='overlay'></div>
          <div class='popup' id='responsePopup'>
            <span class='close-btn' onclick='closePopup()'>X</span>
            <div id='popupContent'></div>
          </div>
          <script>
            function showResponsePopup(resposta) {
                document.getElementById('popupContent').textContent = resposta;
                document.getElementById('responsePopup').style.display = 'block';
                document.getElementById('overlay').style.display = 'block';
            }
            function closePopup() {
                document.getElementById('responsePopup').style.display = 'none';
                document.getElementById('overlay').style.display = 'none';
            }
          </script>";
} catch (PDOException $e) {
    http_response_code(500); // Erro do servidor
    echo "Erro na conexão com o banco de dados: " . htmlspecialchars($e->getMessage());
}
?>
