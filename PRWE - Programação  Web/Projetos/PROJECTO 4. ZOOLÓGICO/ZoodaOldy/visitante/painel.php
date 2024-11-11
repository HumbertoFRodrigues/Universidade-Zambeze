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
$avatar = match ($user['sexo']) {
    'M' => '../imagens/icones/homem.png',
    'F' => '../imagens/icones/mulher.png',
    default => '../imagens/icones/user.png',
};

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
            margin-left: 200px;
            position: relative; /* Ajuste para evitar sobreposição */
            z-index: 10; /* Garante que fique acima do conteúdo */
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
            text-align: left; /* Mantém tudo alinhado à esquerda */
        }
        
        .sidebar h2 {
            text-align: center;
            font-weight: bold;
        }
        
        .sidebar ul {
            list-style: none;
            padding: 0;
        }
        
        .sidebar ul li {
            padding: 10px 15px; /* Ajuste do espaçamento entre itens */
            text-align: left;
            font-family: Arial, sans-serif;
            font-size: 14px;
        }
        
        .sidebar ul li a {
            color: white;
            text-decoration: none;
            display: block; /* Exibe como bloco para alinhar à esquerda */
            width: 100%;
            background: none; /* Remove fundo */
            border: none; /* Remove borda */
        }
        
        /* Estilo para o item ativo */
        .sidebar ul li.active {
            background-color: #B0B0B0; /* Fundo cinza para indicar item ativo */
            font-weight: normal; /* Mantém a fonte normal */
        }

        /* Estilos para o conteúdo principal */
        .main-content {
            margin-left: 220px; 
            padding: 20px;
            width: calc(100% - 220px);
            min-height: calc(100vh - 50px); 
            box-sizing: border-box; /* Garante que o padding não cause overflow */
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
        }

        /* Evitar overflow no body */
        body {
            margin: 0; /* Remove margens padrão */
            overflow-x: hidden; /* Esconde rolagem horizontal */
        }

        /* Barra de Navegação Superior (Top Bar) */
.top-bar {
    display: flex;
    align-items: center;  /* Alinha todos os elementos verticalmente ao centro */
    justify-content: space-between;  /* Distribui espaço adequadamente entre os elementos da barra */
    padding: 10px 20px;
    background-color: #ffffff;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 10;
    margin-left: 200px;  /* Para compensar a largura da sidebar, se houver */
}

.top-bar .logo {
    display: flex;
    align-items: center;  /* Alinha logo e texto verticalmente */
}

.top-bar .logo img {
    height: 40px;
    margin-right: 10px;  /* Espaço entre a imagem da logo e o texto */
}

.top-bar .logo span {
    font-weight: bold;
    font-size: 20px;
    color: #333;  /* Ajuste de cor para se adequar ao design */
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
    padding: 5px 10px;
    background-color: #f0f0f0;
    border-radius: 5px;
    margin-left: 10px;
    cursor: pointer;
    text-decoration: none;
    color: #333;
    border: none;
    font-size: 14px;
    transition: background-color 0.3s ease;
}

.top-bar .logout-btn:hover {
    background-color: #e0e0e0;
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
            <li class="<?php echo $active_menu == 'estatistica' ? 'active' : ''; ?>"><a href="?page=estatistica">Estatísticas</a></li>
            <li class="<?php echo $active_menu == 'galeria' ? 'active' : ''; ?>"><a href="?page=galeria_especies">Galeria de Fotos</a></li>
            <li class="<?php echo $active_menu == 'informacoes' ? 'active' : ''; ?>"><a href="?page=informacao_especies">Informações</a></li>
            <li class="<?php echo $active_menu == 'reserva' ? 'active' : ''; ?>"><a href="?page=pagina_reserva_visitante">Reserva</a></li>
            <li class="<?php echo $active_menu == 'perfil' ? 'active' : ''; ?>"><a href="?page=perfil">Perfil</a></li>
            <li class="<?php echo $active_menu == 'contato' ? 'active' : ''; ?>"><a href="?page=contato">Contato</a></li>
        </ul>
    </div>

    <!-- Conteúdo principal -->
    <div class="main-content">
        <?php
        // Inclui o conteúdo da página correspondente
        $page = isset($_GET['page']) ? $_GET['page'] : 'dashboard';
        $page_file = "$page.php";
        
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
