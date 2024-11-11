<?php
// Verifica se a sessão já está ativa antes de iniciar
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require '../db_conexao.php';

// Verifica se o usuário é funcionário
if (!isset($_SESSION['user_id']) || $_SESSION['nivel_id'] != 2) {
    echo "Acesso negado. Você não tem permissão para acessar esta página.";
    exit;
}

$conn = conectarBancoDeDados();

// Obtém a lista de usuários visitantes (nivel_id = 3)
$stmt = $conn->prepare("SELECT * FROM usuarios WHERE nivel_id = 3");
$stmt->execute();
$usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Gerenciar Usuários Visitantes</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            overflow-y: auto;
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
        tr:hover {
            background-color: #f2f2f2;
        }
        .btn {
            padding: 5px 10px;
            margin: 5px;
            border: none;
            color: white;
            cursor: pointer;
            border-radius: 5px;
        }
        .edit-btn {
            background-color: #ff9800;
        }
        .add-btn {
            background-color: #4CAF50;
            margin-top: 20px;
        }
        /* Modal Styles */
        .modal {
            display: none; 
            position: fixed; 
            z-index: 1; 
            left: 0;
            top: 0;
            width: 100%; 
            height: 100%; 
            overflow: auto; 
            background-color: rgba(0,0,0,0.4); 
        }
        .modal-content {
            background-color: #fefefe;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px;
            border: 1px solid #888;
            width: 40%;
            max-width: 600px; 
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            max-height: 80vh; 
            overflow-y: auto; 
        }
        .close {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
        }
        .close:hover,
        .close:focus {
            color: black;
            text-decoration: none;
            cursor: pointer;
        }
        .modal input, .modal select {
            width: 90%;
            padding: 8px;
            margin: 8px 0;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .modal button {
            padding: 10px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
        }
    </style>
</head>
<body>
    <h1>Gerenciar Usuários Visitantes</h1>

    <button class="btn add-btn" onclick="abrirModalAdicionar()">Adicionar Usuário Visitante</button>

    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Ações</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($usuarios as $usuario) : ?>
                <tr>
                    <td><?= htmlspecialchars($usuario['id']); ?></td>
                    <td><?= htmlspecialchars($usuario['nome']); ?></td>
                    <td><?= htmlspecialchars($usuario['email']); ?></td>
                    <td>
                        <button class="btn edit-btn" onclick="abrirModalEditar(<?= $usuario['id']; ?>)">Editar</button>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

    <!-- Modal para adicionar usuário -->
    <div id="modalAdicionarUsuario" class="modal">
        <div class="modal-content">
            <span class="close" onclick="fecharModalAdicionar()">&times;</span>
            <h2>Adicionar Usuário Visitante</h2>
            <form id="adicionarUsuarioForm">
                <label for="username">Nome de Usuário:</label>
                <input type="text" id="username" name="username" required>

                <label for="password">Senha:</label>
                <input type="password" id="password" name="password" required>

                <label for="nome">Nome Completo:</label>
                <input type="text" id="nome" name="nome">

                <label for="email">Email:</label>
                <input type="email" id="email" name="email">

                <button type="button" onclick="adicionarUsuario()">Adicionar</button>
            </form>
        </div>
    </div>

    <!-- Modal para editar usuário -->
    <div id="modalEditarUsuario" class="modal">
        <div class="modal-content">
            <span class="close" onclick="fecharModalEditar()">&times;</span>
            <h2>Editar Usuário Visitante</h2>
            <form id="editarUsuarioForm">
                <input type="hidden" id="edit_user_id" name="user_id">

                <label for="edit_username">Nome de Usuário:</label>
                <input type="text" id="edit_username" name="username">

                <label for="edit_nome">Nome Completo:</label>
                <input type="text" id="edit_nome" name="nome">

                <label for="edit_email">Email:</label>
                <input type="email" id="edit_email" name="email">

                <button type="button" onclick="editarUsuarioSalvar()">Salvar</button>
            </form>
        </div>
    </div>

    <script>
        // Modal de Adicionar Usuário
        function abrirModalAdicionar() {
            document.getElementById('modalAdicionarUsuario').style.display = 'block';
        }

        function fecharModalAdicionar() {
            document.getElementById('modalAdicionarUsuario').style.display = 'none';
        }

        // Modal de Editar Usuário
        function abrirModalEditar(userId) {
            fetch('buscar_usuario.php?user_id=' + userId)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Preenche os campos com os dados do usuário
                    document.getElementById('edit_user_id').value = data.usuario.id;
                    document.getElementById('edit_username').value = data.usuario.username;
                    document.getElementById('edit_nome').value = data.usuario.nome;
                    document.getElementById('edit_email').value = data.usuario.email;

                    document.getElementById('modalEditarUsuario').style.display = 'block';
                } else {
                    alert('Erro ao buscar informações do usuário.');
                }
            });
        }

        function fecharModalEditar() {
            document.getElementById('modalEditarUsuario').style.display = 'none';
        }

        // Função para salvar edição do usuário
        function editarUsuarioSalvar() {
            const formData = new FormData(document.getElementById('editarUsuarioForm'));

            fetch('editar_usuario.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Usuário atualizado com sucesso!');
                    location.reload(); // Recarrega a página para mostrar as atualizações
                } else {
                    alert(`Erro ao atualizar usuário: ${data.error}`);
                }
            });
        }

        // Função para adicionar usuário
        function adicionarUsuario() {
            const formData = new FormData(document.getElementById('adicionarUsuarioForm'));

            fetch('adicionar_usuario.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Usuário adicionado com sucesso!');
                    location.reload(); // Recarrega a página para mostrar o novo usuário
                } else {
                    alert(`Erro ao adicionar usuário: ${data.error}`);
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao adicionar usuário.');
            });
        }
    </script>
</body>
</html>
