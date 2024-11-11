<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
include '../db_conexao.php';  // Inclui o arquivo de conexão com o banco de dados

// Consulta as fotos e informações das espécies usando PDO
$query = "SELECT e.id as especie_id, e.nome, e.tipo, f.caminho FROM especies e
          JOIN fotos_especies f ON e.id = f.especie_id";
$stmt = $conn->prepare($query);
$stmt->execute();

$fotos = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $fotos[$row['tipo']][] = $row;
}
?>

<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Galeria de Espécies</title>
    <style>
        /* Estilos básicos */
        body { font-family: Arial, sans-serif; }
        .container { text-align: center; padding: 20px; }
        .btn-container { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
        .btn { 
            padding: 10px 20px; 
            cursor: pointer; 
            background-color: #007BFF; 
            color: #fff; 
            border: none; 
            border-radius: 5px; 
            font-size: 1em;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .btn span { margin-left: 8px; }
        .gallery { display: flex; flex-wrap: wrap; justify-content: center; margin-top: 20px; }
        .gallery img { width: 150px; height: 100px; margin: 5px; cursor: pointer; border-radius: 5px; }
        
        /* Estilos do modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000; /* Sobreposição alta para evitar conflito com outros elementos */
        }
        .modal-content {
            position: relative;
            margin: auto;
            padding: 20px;
            width: 80%;
            max-width: 800px;
        }
        .modal-content img {
            width: 100%;
            border-radius: 5px;
        }
        .modal-content .animal-name {
            color: #fff;
            font-size: 1.2em;
            text-align: center;
            margin: 10px 0;
        }
        .close, .nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            color: #fff;
            font-size: 2em;
            z-index: 10001; /* Garante que os controles também fiquem acima de tudo */
        }
        .close {
            right: 20px;
            top: 20px;
            font-size: 1.5em;
        }
        .prev { left: 10px; }
        .next { right: 10px; }
    </style>
</head>
<body>

<div class="container">
    <!-- Botões de categoria com ícones e emojis -->
    <div class="btn-container">
        <button class="btn" onclick="exibirTodasFotos()">
            <i>🌍</i><span>Todos</span>
        </button>
        <button class="btn" onclick="filtrarGaleria('mamifero', true)">
            <i>🐘</i><span>Mamíferos</span>
        </button>
        <button class="btn" onclick="filtrarGaleria('reptil', true)">
            <i>🐍</i><span>Répteis</span>
        </button>
        <button class="btn" onclick="filtrarGaleria('passaro', true)">
            <i>🦜</i><span>Aves</span>
        </button>
    </div>

    <!-- Galeria de imagens -->
    <div id="gallery" class="gallery">
        <?php foreach ($fotos as $tipo => $imagens): ?>
            <?php foreach ($imagens as $foto): ?>
                <img src="../<?= htmlspecialchars($foto['caminho']) ?>" alt="<?= htmlspecialchars($foto['nome']) ?>"
                     class="galeria-item <?= htmlspecialchars($foto['tipo']) ?>" 
                     data-nome="<?= htmlspecialchars($foto['nome']) ?>" onclick="abrirModal(this)">
            <?php endforeach; ?>
        <?php endforeach; ?>
    </div>
</div>

<!-- Modal em tela cheia -->
<div id="modal" class="modal">
    <span class="close" onclick="fecharModal()">×</span>
    <span class="prev nav" onclick="navegar(-1)">❮</span>
    <span class="next nav" onclick="navegar(1)">❯</span>
    <div class="modal-content">
        <p class="animal-name" id="animalNome"></p>
        <img id="modalImg" src="">
    </div>
</div>

<script>
    let galeriaAtual = [];  // Lista de elementos da galeria filtrada
    let indiceAtual = 0;

    // Exibe o modal com a imagem e nome do animal selecionado
    function abrirModal(elemento) {
        // Define galeriaAtual como todas as imagens visíveis na galeria no momento do clique
        galeriaAtual = Array.from(document.querySelectorAll(".galeria-item")).filter(img => img.style.display === "block");
        indiceAtual = galeriaAtual.indexOf(elemento);

        document.getElementById("modalImg").src = elemento.src;
        document.getElementById("animalNome").innerText = elemento.dataset.nome;
        document.getElementById("modal").style.display = "block";
    }

    // Fecha o modal
    function fecharModal() {
        document.getElementById("modal").style.display = "none";
    }

    // Navega entre as imagens da galeria atual no modal
    function navegar(direcao) {
        indiceAtual = (indiceAtual + direcao + galeriaAtual.length) % galeriaAtual.length;
        document.getElementById("modalImg").src = galeriaAtual[indiceAtual].src;
        document.getElementById("animalNome").innerText = galeriaAtual[indiceAtual].dataset.nome;
    }

    // Exibe todas as fotos e fecha o modal
    function exibirTodasFotos() {
        const itens = document.querySelectorAll(".galeria-item");
        itens.forEach(item => item.style.display = 'block');

        // Atualiza galeriaAtual com todas as imagens e abre o modal com a primeira imagem
        galeriaAtual = Array.from(itens);
        if (galeriaAtual.length > 0) {
            abrirModal(galeriaAtual[0]);
        }
    }

    // Filtra as imagens da galeria e abre o modal para a primeira imagem filtrada
    function filtrarGaleria(tipo, abrirModalAutomatico = false) {
        const itens = document.querySelectorAll(".galeria-item");
        itens.forEach(item => {
            item.style.display = item.classList.contains(tipo) ? "block" : "none";
        });

        // Atualiza a galeria atual com as imagens filtradas
        galeriaAtual = Array.from(document.querySelectorAll(`.galeria-item.${tipo}`));
        indiceAtual = 0;

        // Abre o modal automaticamente se especificado
        if (abrirModalAutomatico && galeriaAtual.length > 0) {
            abrirModal(galeriaAtual[0]);
        }
    }
</script>

</body>
</html>
