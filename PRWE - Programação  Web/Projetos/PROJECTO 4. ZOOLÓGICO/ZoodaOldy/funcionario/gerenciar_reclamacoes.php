<?php
// Iniciar a sessão se ainda não estiver ativa
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Verificar se o usuário está logado e se é admin ou funcionário
if (!isset($_SESSION['user_id']) || ($_SESSION['nivel_id'] != 1 && $_SESSION['nivel_id'] != 2)) {
    http_response_code(403); // Acesso negado
    exit("Acesso negado: você precisa ter permissões de administrador ou funcionário.");
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

    // Obter todas as reclamações dos usuários
    $stmt = $pdo->prepare("SELECT reclamacoes.*, usuarios.nome AS nome_usuario FROM reclamacoes INNER JOIN usuarios ON reclamacoes.user_id = usuarios.id ORDER BY reclamacoes.id DESC");
    $stmt->execute();
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
                max-width: 150px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
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
            .responder-btn {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 8px 12px;
                cursor: pointer;
                border-radius: 4px;
                display: block;
                margin: 0 auto;
            }
            .responder-btn:hover {
                background-color: #45a049;
            }
            /* Modal styling */
            #modalDetalhes, #modalResposta {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1000;
            }
            #modalContent, #modalRespostaContent {
                background: #fff;
                padding: 20px;
                margin: 5% auto;
                width: 50%;
                max-width: 600px;
                border-radius: 8px;
                position: relative;
                text-align: left;
                box-sizing: border-box;
            }
            #closeModal, #closeModalResposta {
                background-color: #f44336;
                color: white;
                padding: 10px;
                border: none;
                cursor: pointer;
                position: absolute;
                top: 10px;
                right: 10px;
            }
            .modal-audio {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-top: 15px;
            }
            #modalRespostaContent {
                display: flex;
                flex-direction: column;
                gap: 20px;
                width: 100%;
                box-sizing: border-box;
            }
            #modalRespostaContent textarea {
                width: 100%;
                padding: 10px;
                border-radius: 4px;
                border: 1px solid #ddd;
                resize: vertical;
                max-width: 100%;
                box-sizing: border-box;
            }
            #respostaForm button {
                align-self: center;
                padding: 10px 20px;
                background-color: #4CAF50;
                color: white;
                border: none;
                cursor: pointer;
                border-radius: 4px;
            }
            #respostaForm button:hover {
                background-color: #45a049;
            }
            #mensagemSucesso {
                display: none;
                position: fixed;
                top: 20%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: #4CAF50;
                color: white;
                padding: 20px;
                border-radius: 8px;
                z-index: 1100;
            }
          </style>";

    echo "<h1>Gerenciar Reclamações dos Usuários</h1>";
    if (count($reclamacoes) > 0) {
        echo "<table id='reclamacoesTable'>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Usuário</th>
                        <th>Tipo</th>
                        <th>Comentários</th>
                        <th>Sugestões</th>
                        <th>Problema</th>
                        <th>Comentários</th>
                        <th>Áudio</th>
                        <th>Resposta</th>
                    </tr>
                </thead>
                <tbody>";

        foreach ($reclamacoes as $reclamacao) {
            $id = $reclamacao['id'];
            $nomeUsuario = htmlspecialchars($reclamacao['nome_usuario']);
            $tipo = htmlspecialchars(substr($reclamacao['tipo'], 0, 14)) . (strlen($reclamacao['tipo']) > 14 ? "..." : "");
            $comentarios = htmlspecialchars(substr($reclamacao['comentarios'], 0, 14)) . (strlen($reclamacao['comentarios']) > 14 ? "..." : "");
            $sugestoes = htmlspecialchars(substr($reclamacao['sugestoes'], 0, 14)) . (strlen($reclamacao['sugestoes']) > 14 ? "..." : "");
            $problemaAnimal = htmlspecialchars(substr($reclamacao['problema_animal'], 0, 14)) . (strlen($reclamacao['problema_animal']) > 14 ? "..." : "");
            $comentariosAnimal = htmlspecialchars(substr($reclamacao['comentarios_animal'], 0, 14)) . (strlen($reclamacao['comentarios_animal']) > 14 ? "..." : "");
            $audioUrl = $reclamacao['audio'];
            $resposta = htmlspecialchars(substr($reclamacao['resposta'] ?? '', 0, 14)) . ((isset($reclamacao['resposta']) && strlen($reclamacao['resposta']) > 14) ? "..." : "");

            echo "<tr onclick='mostrarDetalhes($id)'>
                    <td>{$id}</td>
                    <td>{$nomeUsuario}</td>
                    <td>{$tipo}</td>
                    <td>{$comentarios}</td>
                    <td>{$sugestoes}</td>
                    <td>{$problemaAnimal}</td>
                    <td>{$comentariosAnimal}</td>
                    <td>" . ($audioUrl ? "<audio controls>
                            <source src='$audioUrl' type='audio/mpeg'>
                            Seu navegador não suporta o elemento de áudio.
                        </audio>" : 'Nenhum áudio disponível') . "</td>
                    <td>" . ($resposta ? $resposta : "<button class='responder-btn' onclick='event.stopPropagation(); responderReclamacao($id)'>Responder</button>") . "</td>
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

<!-- Mensagem de Sucesso -->
<div id="mensagemSucesso">Resposta enviada com sucesso!</div>

<!-- Modal para exibir detalhes -->
<div id="modalDetalhes">
    <div id="modalContent">
        <button id="closeModal" onclick="fecharModal()">Fechar</button>
        <h2>Detalhes da Reclamação</h2>
        <div id="detalhesContent"></div>
    </div>
</div>

<!-- Modal para responder -->
<div id="modalResposta">
    <div id="modalRespostaContent">
        <button id="closeModalResposta" onclick="fecharModalResposta()">Fechar</button>
        <h2>Responder Reclamação</h2>
        <form id="respostaForm">
            <input type="hidden" id="reclamacaoId" name="reclamacaoId">
            <label for="resposta">Resposta:</label>
            <textarea id="resposta" name="resposta" rows="4" required></textarea>
            <p>
            <button type="submit">Enviar Resposta</button>
        </form>
    </div>
</div>

<script>
    function mostrarDetalhes(reclamacaoId) {
        const reclamacao = <?php echo json_encode($reclamacoes); ?>.find(r => r.id == reclamacaoId);
        if (reclamacao) {
            let detalhesHtml = `
                <p><strong>ID:</strong> ${reclamacao.id}</p>
                <p><strong>Nome do Usuário:</strong> ${reclamacao.nome_usuario}</p>
                <p><strong>Tipo:</strong> ${reclamacao.tipo}</p>
                <p><strong>Comentários:</strong> ${reclamacao.comentarios}</p>
                <p><strong>Sugestões:</strong> ${reclamacao.sugestoes}</p>
                <p><strong>Problema do Animal:</strong> ${reclamacao.problema_animal}</p>
                <p><strong>Comentários do Animal:</strong> ${reclamacao.comentarios_animal}</p>
                <p><strong>Data e Hora:</strong> ${reclamacao.data}</p>
                <div class="modal-audio">
                    <p><strong>Áudio:</strong></p>
                    ${reclamacao.audio ? '<audio controls><source src="' + reclamacao.audio + '" type="audio/mpeg">Seu navegador não suporta o elemento de áudio.</audio>' : '<p>Nenhum áudio disponível</p>'}
                </div>
                <p><strong>Resposta:</strong> ${reclamacao.resposta ? reclamacao.resposta : 'Nenhuma resposta ainda'}</p>
            `;
            document.getElementById('detalhesContent').innerHTML = detalhesHtml;
            document.getElementById('modalDetalhes').style.display = 'block';
        }
    }

    function fecharModal() {
        document.getElementById('modalDetalhes').style.display = 'none';
    }

    function responderReclamacao(reclamacaoId) {
        document.getElementById('reclamacaoId').value = reclamacaoId;
        document.getElementById('modalResposta').style.display = 'block';
    }

    function fecharModalResposta() {
        document.getElementById('modalResposta').style.display = 'none';
    }

    document.getElementById('respostaForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(event.target);

        fetch('responder_reclamacao.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                fecharModalResposta();
                mostrarMensagemSucesso();
            } else {
                alert('Erro ao enviar resposta: ' + data.error);
            }
        })
        .catch(error => alert('Erro ao enviar resposta: ' + error.message));
    });

    function mostrarMensagemSucesso() {
        const mensagemSucesso = document.getElementById('mensagemSucesso');
        mensagemSucesso.style.display = 'block';
        setTimeout(() => {
            mensagemSucesso.style.display = 'none';
            location.reload(); // Recarrega a página para atualizar a resposta
        }, 2000);
    }
</script>
