<?php
// Verifica se a sessão já está ativa antes de iniciar
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require '../db_conexao.php';

// Verifica se o usuário é administrador
if (!isset($_SESSION['user_id']) || $_SESSION['nivel_id'] != 1) {
    echo "Acesso negado. Você não tem permissão para acessar esta página.";
    exit;
}

$conn = conectarBancoDeDados();

// Obtém a lista de usuários
$stmt = $conn->prepare("SELECT * FROM usuarios");
$stmt->execute();
$usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Gerenciar Usuários</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            overflow-y: auto; /* Permitir a rolagem na página toda */
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
        .delete-btn {
            background-color: #f44336;
        }
        .temp-login-btn {
            background-color: #2196F3;
        }
        .add-btn {
            background-color: #4CAF50;
            margin-top: 20px;
        }
        /* Estilo para o Modal */
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
            width: 95%;
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
    <h1>Gerenciar Usuários</h1>

    <button class="btn add-btn" onclick="abrirModalAdicionar()">Adicionar Usuário</button>

    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Nível de Acesso</th>
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
                        <?= $usuario['nivel_id'] == 1 ? 'Administrador' : ($usuario['nivel_id'] == 2 ? 'Funcionário' : 'Visitante'); ?>
                    </td>
                    <td>
                        <button class="btn edit-btn" onclick="abrirModalEditar(<?= $usuario['id']; ?>)">Editar</button>
                        <button class="btn delete-btn" onclick="excluirUsuario(<?= $usuario['id']; ?>)">Excluir</button>
                        <button class="btn temp-login-btn" onclick="gerarLoginTemporario(<?= $usuario['id']; ?>)">Gerar Login Temporário</button>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

    <!-- Modal para adicionar usuário -->
    <div id="modalAdicionarUsuario" class="modal">
        <div class="modal-content">
            <span class="close" onclick="fecharModalAdicionar()">&times;</span>
            <h2>Adicionar Usuário</h2>
            <form id="adicionarUsuarioForm">
                <label for="username">Nome de Usuário:</label>
                <input type="text" id="username" name="username" required>
                <label for="nivel_id">Nível de Acesso:</label>
                <select id="nivel_id" name="nivel_id" required>
                    <option value="1">Administrador</option>
                    <option value="2">Funcionário</option>
                    <option value="3">Visitante</option>
                </select>
                <label for="password">Senha:</label>
                <input type="password" id="password" name="password" required>
                <label for="nome">Nome Completo:</label>
                <input type="text" id="nome" name="nome">
                <label for="apelido">Apelido:</label>
                <input type="text" id="apelido" name="apelido">
                <label for="sexo">Sexo:</label>
                <select id="sexo" name="sexo">
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="Outro">Outro</option>
                </select>
                <label for="endereco">Endereço:</label>
                <input type="text" id="endereco" name="endereco">
                <label for="nacionalidade">Nacionalidade:</label>
                <input type="text" id="nacionalidade" name="nacionalidade">
                <label for="telefone">Telefone:</label>
                <input type="text" id="telefone" name="telefone">
                <label for="data_nascimento">Data de Nascimento:</label>
                <input type="date" id="data_nascimento" name="data_nascimento">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email">
                <label for="ocupacao">Ocupação:</label>
                <input type="text" id="ocupacao" name="ocupacao">
                <button type="button" onclick="adicionarUsuario()">Adicionar</button>
            </form>
        </div>
    </div>

    <!-- Modal para editar usuário -->
    <div id="modalEditarUsuario" class="modal">
        <div class="modal-content">
            <span class="close" onclick="fecharModalEditar()">&times;</span>
            <h2>Editar Usuário</h2>
            <form id="editarUsuarioForm">
                <input type="hidden" id="edit_user_id" name="user_id">
                <label for="edit_username">Nome de Usuário:</label>
                <input type="text" id="edit_username" name="username">
                <label for="edit_nivel_id">Nível de Acesso:</label>
                <select id="edit_nivel_id" name="nivel_id">
                    <option value="1">Administrador</option>
                    <option value="2">Funcionário</option>
                    <option value="3">Visitante</option>
                </select>
                <label for="edit_nome">Nome Completo:</label>
                <input type="text" id="edit_nome" name="nome">
                <label for="edit_apelido">Apelido:</label>
                <input type="text" id="edit_apelido" name="apelido">
                <label for="edit_sexo">Sexo:</label>
                <select id="edit_sexo" name="sexo">
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="Outro">Outro</option>
                </select>
                <label for="edit_endereco">Endereço:</label>
                <input type="text" id="edit_endereco" name="endereco">
                <label for="edit_nacionalidade">Nacionalidade:</label>
                <input type="text" id="edit_nacionalidade" name="nacionalidade">
                <label for="edit_telefone">Telefone:</label>
                <input type="text" id="edit_telefone" name="telefone">
                <label for="edit_data_nascimento">Data de Nascimento:</label>
                <input type="date" id="edit_data_nascimento" name="data_nascimento">
                <label for="edit_email">Email:</label>
                <input type="email" id="edit_email" name="email">
                <label for="edit_ocupacao">Ocupação:</label>
                <input type="text" id="edit_ocupacao" name="ocupacao">
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
                    document.getElementById('edit_user_id').value = data.usuario.id;
                    document.getElementById('edit_username').value = data.usuario.username;
                    document.getElementById('edit_nivel_id').value = data.usuario.nivel_id;
                    document.getElementById('edit_nome').value = data.usuario.nome;
                    document.getElementById('edit_apelido').value = data.usuario.apelido;
                    document.getElementById('edit_sexo').value = data.usuario.sexo;
                    document.getElementById('edit_endereco').value = data.usuario.endereco;
                    document.getElementById('edit_nacionalidade').value = data.usuario.nacionalidade;
                    document.getElementById('edit_telefone').value = data.usuario.telefone;
                    document.getElementById('edit_data_nascimento').value = data.usuario.data_nascimento;
                    document.getElementById('edit_email').value = data.usuario.email;
                    document.getElementById('edit_ocupacao').value = data.usuario.ocupacao;

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

        // Função para excluir usuário
        function excluirUsuario(userId) {
            if (confirm("Tem certeza que deseja excluir este usuário?")) {
                fetch('excluir_usuario.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: `user_id=${userId}`
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Usuário excluído com sucesso!');
                        location.reload(); // Recarrega a página
                    } else {
                        alert(`Erro ao excluir usuário: ${data.error}`);
                    }
                })
                .catch(error => {
                    console.error('Erro:', error);
                    alert('Erro ao excluir usuário.');
                });
            }
        }

        // Função para gerar login temporário
        function gerarLoginTemporario(userId) {
            if (!userId) {
                alert('ID do usuário não fornecido.');
                return;
            }

            fetch('gerar_login_temporario.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `user_id=${userId}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(`Erro ao gerar link temporário: ${data.error}`);
                } else if (data.link) {
                    alert(`Link temporário gerado: ${data.link}`);
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao enviar requisição para gerar o link temporário.');
            });
        }

    </script>
</body>
</html>
