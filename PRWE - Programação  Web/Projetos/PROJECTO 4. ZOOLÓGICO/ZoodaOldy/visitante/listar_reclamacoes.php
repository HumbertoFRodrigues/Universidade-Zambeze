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

    // Buscar as reclamações do usuário logado
    $user_id = $_SESSION['user_id']; // ID do usuário logado
    $stmt = $pdo->prepare("SELECT *, (SELECT resposta FROM respostas WHERE reclamacao_id = r.id) AS resposta FROM reclamacoes r WHERE r.user_id = :user_id ORDER BY r.id DESC");
    $stmt->execute(['user_id' => $user_id]);
    $reclamacoes = $stmt->fetchAll();

    // Exibir as reclamações com estilos
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
                        <th>Data</th>
                        <th>Resposta</th>
                        <th>Áudio</th>
                    </tr>
                </thead>
                <tbody>";

        foreach ($reclamacoes as $reclamacao) {
            echo "<tr>
                    <td>{$reclamacao['id']}</td>
                    <td>" . htmlspecialchars($reclamacao['tipo']) . "</td>
                    <td>" . htmlspecialchars($reclamacao['comentarios']) . "</td>
                    <td>" . htmlspecialchars($reclamacao['sugestoes']) . "</td>
                    <td>" . htmlspecialchars($reclamacao['problema_animal']) . "</td>
                    <td>" . htmlspecialchars($reclamacao['comentarios_animal']) . "</td>
                    <td>{$reclamacao['data']}</td>
                    <td>" . ($reclamacao['resposta'] ? htmlspecialchars($reclamacao['resposta']) : 'Sem resposta') . "</td>
                    <td>
                        <audio controls>
                            <source src='" . htmlspecialchars($reclamacao['audio']) . "' type='audio/mpeg'>
                            Seu navegador não suporta o elemento de áudio.
                        </audio>
                    </td>
                  </tr>";
        }

        echo "</tbody></table>";
    } else {
        echo "<p>Nenhuma reclamação encontrada.</p>";
    }
} catch (PDOException $e) {
    http_response_code(500); // Erro do servidor
    echo "Erro na conexão com o banco de dados: " . htmlspecialchars($e->getMessage());
}
?>