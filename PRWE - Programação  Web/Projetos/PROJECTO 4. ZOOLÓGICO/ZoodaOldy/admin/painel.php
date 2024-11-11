<?php
session_start();

// Configuração da conexão com o banco de dados
$host = 'localhost';
$db = 'zoo_da_oldy';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    die("Erro na conexão com o banco de dados: " . $e->getMessage());
}

// Verifica se o usuário está logado
if (!isset($_SESSION['user_id'])) {
    header("Location: ../login.php");
    exit;
}

// Obtém o ID do usuário logado da sessão
$user_id = $_SESSION['user_id'];

// Consulta para obter o nome do usuário
$stmt = $pdo->prepare("SELECT nome, sexo FROM usuarios WHERE id = :id");
$stmt->execute(['id' => $user_id]);
$user = $stmt->fetch();

// Verifica o sexo para exibir o avatar correto
$avatar = '';
if ($user['sexo'] == 'M') {
    $avatar = '../imagens/icones/homem.png';
} elseif ($user['sexo'] == 'F') {
    $avatar = '../imagens/icones/mulher.png';
} else {
    $avatar = '../imagens/icones/user.png';
}

// Define o item ativo da sidebar
$active_menu = isset($_GET['page']) ? $_GET['page'] : 'dashboard';

?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="../imagens/Favicon/logo.png" type="image/x-icon">


    <title>Painel do Usuário</title>
    <style>
        /* Estilos para a barra superior */
        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 20px;
            background-color: #ffffff;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
            z-index: 10;
            position: relative;
            margin-left: 200px;
        }
        
        .top-bar .logo {
            display: flex;
            align-items: center;
        }

        .top-bar .logo img {
            height: 40px;
            margin-right: 10px;
        }

        .top-bar .user-info {
            display: flex;
            align-items: center;
        }
        
        .top-bar .user-info .avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            margin-right: 10px;
        }
        
        .top-bar .logout-btn {
            color: #000;
            text-decoration: none;
            padding: 5px 10px;
            background-color: #f0f0f0;
            border-radius: 5px;
            margin-left: 10px;
        }
        
        /* Estilos para a sidebar */
        .sidebar {
            width: 200px;
            background-color: #4CAF50;
            height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
            padding-top: 20px;
            color: white;
            z-index: 1000;
        }
        
        .sidebar h2 {
            text-align: center;
        }
        
        .sidebar ul {
            list-style: none;
            padding: 0;
        }
        
        .sidebar ul li {
            padding: 15px;
        }
        
        .sidebar ul li a {
            color: white;
            text-decoration: none;
            display: block;
        }
        
        /* Destaca o item ativo */
        .sidebar ul li.active {
            background-color: #45a049;
        }

        /* Estilos para o conteúdo principal */
        .main-content {
            margin-left: 220px; 
            padding: 20px;
            box-sizing: border-box;
            width: calc(100% - 220px);
            min-height: calc(100vh - 50px); 
            padding-bottom: 40px; 
        }
        
        /* Estilos para o rodapé */
        footer {
            background-color: #4CAF50;
            color: white;
            text-align: center;
            padding: 3px; 
            position: fixed; 
            bottom: 0; 
            left: 0;
            width: 100%; 
            z-index: 1000; 
        }
        
        /* Responsividade */
        @media screen and (max-width: 768px) {
            .sidebar {
                position: static;
                width: 100%;
                height: auto;
            }

            .main-content {
                margin-left: 0;
                width: 100%;
                padding-bottom: 40px; 
            }

            footer {
                position: relative; 
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <!-- Barra de navegação superior -->
    <div class="top-bar">
        <div class="logo">
            <img src="../imagens/logo.png" alt="Logo Zoo da Oldy">
            <span style="font-weight: bold; font-size: 20px;">ZOO DA OLDY</span>
        </div>
        <div class="user-info">
            <img src="<?php echo $avatar; ?>" alt="Avatar" class="avatar">
            <span><?php echo htmlspecialchars($user['nome']); ?></span>
            <a href="logout.php" class="logout-btn">Sair</a>
        </div>
    </div>

    <!-- Sidebar de navegação -->
    <div class="sidebar">
        <h2>Painel</h2>
        <ul>
            <li class="<?php echo $active_menu == 'dashboard' ? 'active' : ''; ?>"><a href="?page=estatistica">Estatísticas</a></li>
            <li class="<?php echo $active_menu == 'galeria' ? 'active' : ''; ?>"><a href="?page=adicionar_especie">Adicionar Especies</a></li>
            <li class="<?php echo $active_menu == 'perfil' ? 'active' : ''; ?>"><a href="?page=gerenciar_especies">Gerenciar Especies</a></li>
            <li class="<?php echo $active_menu == 'perfil' ? 'active' : ''; ?>"><a href="?page=galeria_especies">Ver Galeria</a></li>
            <li class="<?php echo $active_menu == 'perfil' ? 'active' : ''; ?>"><a href="?page=gerenciar_reservas">Reservas</a></li>
            <li class="<?php echo $active_menu == 'reserva' ? 'active' : ''; ?>"><a href="?page=gerir_usuarios">Usuarios</a></li>
            <li class="<?php echo $active_menu == 'perfil' ? 'active' : ''; ?>"><a href="?page=perfil">Perfil</a></li>
            <li class="<?php echo $active_menu == 'queixas' ? 'active' : ''; ?>"><a href="?page=gerenciar_reclamacoes">Queixas e Sugestões</a>
        </ul>
    </div>




<style>
    /* Estilos para a sub-lista */
    .sub-list {
        display: none; /* Esconde a sub-lista inicialmente */
        margin-left: 20px; /* Indentação para a sub-lista */
    }
    /* Estilo para o item ativo */
    .active > .sub-list {
        display: block; /* Mostra a sub-lista se o item estiver ativo */
    }
</style>

<script>
    // Adiciona um evento de clique ao link principal
    const mainLink = document.querySelector('li.active > a');

    if (mainLink) {
        mainLink.addEventListener('click', (event) => {
            event.preventDefault(); // Evita a navegação padrão
            const subList = mainLink.nextElementSibling; // Seleciona a sub-lista seguinte
            subList.style.display = subList.style.display === 'none' || subList.style.display === '' ? 'block' : 'none'; // Alterna a visibilidade
        });
    }
</script>


    <!-- Conteúdo principal -->
    <div class="main-content">
        <?php
        // Inclui o conteúdo da página correspondente
        $page = isset($_GET['page']) ? $_GET['page'] : 'dashboard';
        $page_file = "$page.php"; // Altere para o caminho correto se necessário
        
        if (file_exists($page_file)) {
            include $page_file;
        } else {
            echo "<p>Página não encontrada.</p>";
        }
        ?>
    </div>

    <!-- Rodapé -->
    <footer>
        <p>© <span id="currentYear"></span> Zoo da Oldy. Todos os direitos reservados.</p>
    </footer>

    <!-- Script para definir o ano atual -->
    <script>
        document.getElementById('currentYear').textContent = new Date().getFullYear();
    </script>
</body>
</html>
