<?php
// Inicia a sessão apenas se ela não estiver ativa
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require '../db_conexao.php';

// Verifica se o usuário está logado e é um administrador ou funcionário (nível_id 1 ou 2)
if (!isset($_SESSION['user_id']) || ($_SESSION['nivel_id'] != 1 && $_SESSION['nivel_id'] != 2)) {
    echo "Acesso negado. Você não tem permissão para acessar esta página.";
    exit;
}

$conn = conectarBancoDeDados();

// Inicializa a variável $especies como um array vazio para evitar erros
$especies = [];

// Executa a consulta para buscar todas as espécies do banco de dados
try {
    $stmt = $conn->query("SELECT * FROM especies");
    $especies = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    echo "Erro ao buscar espécies: " . $e->getMessage();
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Gerenciar Espécies</title>
    <link rel="stylesheet" href="styles.css">
    <style>
       /* Estilos para a tabela */
       .container {
            padding: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }

        /* Estilos para modal centralizado com sombra */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5); /* Fundo escuro para a área fora do modal */
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .modal-content {
            background-color: #ffffff;
            padding: 20px 30px;
            border-radius: 10px;
            box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.3); /* Sombra suave */
            max-width: 600px; /* Ajusta a largura do modal */
            width: 90%; /* Permite que o modal se adapte à largura da tela */
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            text-align: left;
        }

        .modal-content h2 {
            font-size: 24px;
            text-align: center;
            color: #333;
            margin-top: 0;
        }

        .close-modal {
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 24px;
            font-weight: bold;
            color: #999;
            cursor: pointer;
            transition: color 0.3s ease;
        }

        .close-modal:hover {
            color: #333;
        }

        .modal-content label {
            font-weight: bold;
            margin-top: 10px;
            display: block;
            color: #555;
        }

        .modal-content input, 
        .modal-content select {
            width: 100%;
            padding: 8px;
            margin-top: 5px;
            border-radius: 5px;
            border: 1px solid #ddd;
            font-size: 16px;
        }

        .modal-content button {
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #4CAF50;
            color: #ffffff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
            font-size: 16px;
            font-weight: bold;
        }

        .modal-content button:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Gerenciar Espécies</h1>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Grupo</th>
                    <th>Número de Animais</th>
                    <th>Cor Característica</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($especies)): ?>
                    <tr>
                        <td colspan="6">Nenhuma espécie encontrada.</td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($especies as $especie): ?>
                        <tr>
                            <td><?= htmlspecialchars($especie['id']) ?></td>
                            <td><?= htmlspecialchars($especie['nome']) ?></td>
                            <td><?= htmlspecialchars($especie['tipo']) ?></td>
                            <td><?= htmlspecialchars($especie['num_animais']) ?></td>
                            <td><?= htmlspecialchars($especie['cor_caracteristica']) ?></td>
                            <td>
                                <button onclick="abrirModal(<?= $especie['id'] ?>)">Editar</button>
                                <button onclick="confirmarExclusao(<?= $especie['id'] ?>)">Excluir</button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>

    <!-- Modal para edição -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="fecharModal('editModal')">&times;</span>
            <h2>Editar Espécie</h2>
            <form id="editForm">
                <input type="hidden" id="especie_id" name="especie_id">
                <label for="nome">Nome:</label>
                <input type="text" id="nome" name="nome" required><br>

                <label for="tipo">Grupo:</label>
                <select id="tipo" name="tipo" required>
                    <option value="mamifero">Mamíferos</option>
                    <option value="passaro">Pássaros</option>
                    <option value="reptil">Répteis</option>
                </select><br>

                <label for="data_aquisicao">Data de Aquisição:</label>
                <input type="date" id="data_aquisicao" name="data_aquisicao" required><br>

                <label for="num_animais">Número de Animais:</label>
                <input type="number" id="num_animais" name="num_animais" required><br>

                <label for="num_femeas">Número de Fêmeas:</label>
                <input type="number" id="num_femeas" name="num_femeas" required><br>

                <label for="gestacao_duracao">Duração da Gestação (dias):</label>
                <input type="number" id="gestacao_duracao" name="gestacao_duracao"><br>

                <label for="peso_maximo">Peso Máximo (kg):</label>
                <input type="number" id="peso_maximo" name="peso_maximo" step="0.01"><br>

                <label for="comprimento_max">Comprimento Máximo (m):</label>
                <input type="number" id="comprimento_max" name="comprimento_max" step="0.01"><br>

                <label for="dieta">Dieta:</label>
                <select id="dieta" name="dieta" required>
                    <option value="herbivoro">Herbívoro</option>
                    <option value="carnivoro">Carnívoro</option>
                    <option value="onivoro">Onívoro</option>
                </select><br>

                <label for="cor_caracteristica">Cor Característica:</label>
                <input type="text" id="cor_caracteristica" name="cor_caracteristica" required><br>

                <label for="mes_acasalamento_inicio">Mês de Início de Acasalamento:</label>
                <input type="number" id="mes_acasalamento_inicio" name="mes_acasalamento_inicio"><br>

                <label for="mes_acasalamento_fim">Mês de Fim de Acasalamento:</label>
                <input type="number" id="mes_acasalamento_fim" name="mes_acasalamento_fim"><br>

                <label for="idade_maxima">Idade Máxima (anos):</label>
                <input type="number" id="idade_maxima" name="idade_maxima"><br>

                <button type="button" onclick="atualizarEspecie()">Salvar Alterações</button>
            </form>
        </div>
    </div>

    <script>
        let especieIdParaExcluir;

        // Função para abrir o modal de edição e carregar os dados da espécie
        function abrirModal(id) {
            fetch('obter_especie.php?id=' + id)
                .then(response => response.json())
                .then(data => {
                    document.getElementById("especie_id").value = data.id;
                    document.getElementById("nome").value = data.nome;
                    document.getElementById("tipo").value = data.tipo;
                    document.getElementById("data_aquisicao").value = data.data_aquisicao;
                    document.getElementById("num_animais").value = data.num_animais;
                    document.getElementById("num_femeas").value = data.num_femeas;
                    document.getElementById("gestacao_duracao").value = data.gestacao_duracao;
                    document.getElementById("peso_maximo").value = data.peso_maximo;
                    document.getElementById("comprimento_max").value = data.comprimento_max;
                    document.getElementById("dieta").value = data.dieta;
                    document.getElementById("cor_caracteristica").value = data.cor_caracteristica;
                    document.getElementById("mes_acasalamento_inicio").value = data.mes_acasalamento_inicio;
                    document.getElementById("mes_acasalamento_fim").value = data.mes_acasalamento_fim;
                    document.getElementById("idade_maxima").value = data.idade_maxima;

                    document.getElementById("editModal").style.display = "flex";
                })
                .catch(error => console.error('Erro:', error));
        }

        // Função para atualizar a espécie via AJAX
        function atualizarEspecie() {
            const formData = new FormData(document.getElementById("editForm"));

            fetch('atualizar_especie.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.text())
            .then(responseText => {
                alert(responseText);
                fecharModal('editModal');
                location.reload();
            })
            .catch(error => console.error('Erro:', error));
        }

        // Função para fechar o modal
        function fecharModal(modalId) {
            document.getElementById(modalId).style.display = "none";
        }

        // Fechar o modal ao clicar fora do conteúdo
        window.onclick = function(event) {
            const editModal = document.getElementById("editModal");
            const confirmModal = document.getElementById("confirmModal");
            if (event.target === editModal) fecharModal("editModal");
            if (event.target === confirmModal) fecharModal("confirmModal");
        }
    </script>
</body>
</html>
