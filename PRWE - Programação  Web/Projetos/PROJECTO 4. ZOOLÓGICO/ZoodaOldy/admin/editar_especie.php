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

// Verifica se o ID da espécie foi enviado
if (!isset($_GET['id'])) {
    echo "ID da espécie não fornecido.";
    exit;
}

$id = $_GET['id'];

// Busca a espécie no banco de dados
$stmt = $conn->prepare("SELECT * FROM especies WHERE id = ?");
$stmt->execute([$id]);
$especie = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$especie) {
    echo "Espécie não encontrada.";
    exit;
}

// Processa o formulário de edição
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = $_POST['nome'];
    $grupo = $_POST['grupo'];
    $numero_animais = $_POST['numero_animais'];
    $periodo_gestacao = $_POST['periodo_gestacao'];
    $peso_maximo = $_POST['peso_maximo'];
    $comprimento_maximo = $_POST['comprimento_maximo'];
    $dieta = $_POST['dieta'];
    $cor_caracteristica = $_POST['cor_caracteristica'];
    $acasalamento_inicio = $_POST['acasalamento_inicio'];
    $acasalamento_fim = $_POST['acasalamento_fim'];
    $idade_maxima = $_POST['idade_maxima'];

    // Verifica se há uma nova imagem
    if (isset($_FILES['foto']) && $_FILES['foto']['error'] == UPLOAD_ERR_OK) {
        $fotoData = file_get_contents($_FILES['foto']['tmp_name']);
    } else {
        $fotoData = $especie['foto'];
    }

    // Atualiza a espécie no banco de dados
    $stmt = $conn->prepare("UPDATE especies SET nome = ?, grupo = ?, numero_animais = ?, periodo_gestacao = ?, peso_maximo = ?, comprimento_maximo = ?, dieta = ?, cor_caracteristica = ?, acasalamento_inicio = ?, acasalamento_fim = ?, idade_maxima = ?, foto = ? WHERE id = ?");
    $stmt->execute([$nome, $grupo, $numero_animais, $periodo_gestacao, $peso_maximo, $comprimento_maximo, $dieta, $cor_caracteristica, $acasalamento_inicio, $acasalamento_fim, $idade_maxima, $fotoData, $id]);

    echo "Espécie atualizada com sucesso!";
    exit;
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Editar Espécie</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <div class="especie-container">
            <h1>Editar Espécie</h1>
            <form id="editarEspecieForm" enctype="multipart/form-data" method="post">
                <!-- Campos de edição -->
                <label for="nome">Nome da Espécie:</label>
                <input type="text" id="nome" name="nome" value="<?= htmlspecialchars($especie['nome']) ?>" required>
                
                <!-- Adicionar mais campos semelhantes aos da página adicionar_especie.php -->
                
                <label for="foto">Foto da Espécie:</label>
                <input type="file" id="foto" name="foto" accept="image/*">
                
                <button type="submit">Atualizar Espécie</button>
            </form>
        </div>
    </div>
</body>
</html>
