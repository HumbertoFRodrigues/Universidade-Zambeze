<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Galeria de Espécies</title>
    <link rel="stylesheet" href="styles.css"> <!-- Seu CSS -->
    <style>
        body {
            font-family: Arial, sans-serif;
        }
        .gallery {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
            padding: 20px;
        }
        .gallery img {
            width: 150px;
            height: auto;
            cursor: pointer;
            border: 2px solid #ccc;
            border-radius: 5px;
            transition: transform 0.2s;
        }
        .gallery img:hover {
            transform: scale(1.05);
        }
        /* Estilo do modal */
        .modal {
            display: none; /* Escondido por padrão */
            position: fixed;
            z-index: 1;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0, 0, 0, 0.8);
            justify-content: center;
            align-items: center;
        }
        .modal-content {
            position: relative;
            margin: auto;
            max-width: 80%;
            text-align: center;
        }
        .modal-content img {
            width: 100%;
            height: auto;
        }
        .close, .prev, .next {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            color: white;
            font-size: 30px;
            cursor: pointer;
        }
        .close {
            right: 20px;
        }
        .prev {
            left: 20px;
        }
        .next {
            right: 60px;
        }
        .modal-title {
            color: white;
            font-size: 24px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <?php include '../db_conexao.php'; ?> <!-- Inclui a conexão ao banco de dados -->

    <h1>Galeria de Espécies</h1>
    <div class="gallery">
        <?php
        // Consulta para buscar as espécies e suas imagens
        $sql = "SELECT nome, imagem FROM especies"; // Incluindo o campo 'imagem'
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $especies = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Verifica se há espécies e as exibe
        if (count($especies) > 0) {
            foreach ($especies as $index => $especie) {
                echo '<img src="' . htmlspecialchars($especie['imagem']) . '" alt="' . htmlspecialchars($especie['nome']) . '" onclick="openModal(' . $index . ')" data-index="' . $index . '">';
            }
        } else {
            echo '<p>Nenhuma imagem encontrada.</p>';
        }
        ?>
    </div>

    <!-- Modal -->
    <div id="myModal" class="modal">
        <span class="close" onclick="closeModal()">&times;</span>
        <span class="prev" onclick="changeImage(-1)">&#10094;</span>
        <span class="next" onclick="changeImage(1)">&#10095;</span>
        <div class="modal-content">
            <img id="modalImage" src="" alt="">
            <div class="modal-title" id="modalTitle"></div>
        </div>
    </div>

    <script>
        let currentIndex = 0;
        const species = <?php echo json_encode($especies); ?>; // Captura todas as espécies

        function openModal(index) {
            currentIndex = index;
            document.getElementById("modalImage").src = species[currentIndex].imagem;
            document.getElementById("modalTitle").textContent = species[currentIndex].nome; // Atualiza o título no modal
            document.getElementById("myModal").style.display = "flex";
        }

        function closeModal() {
            document.getElementById("myModal").style.display = "none";
        }

        function changeImage(n) {
            currentIndex += n;
            if (currentIndex < 0) currentIndex = species.length - 1; // Vai para a última imagem
            if (currentIndex >= species.length) currentIndex = 0; // Volta para a primeira imagem
            document.getElementById("modalImage").src = species[currentIndex].imagem;
            document.getElementById("modalTitle").textContent = species[currentIndex].nome; // Atualiza o título
        }

        // Fecha o modal ao clicar fora da imagem
        window.onclick = function(event) {
            const modal = document.getElementById("myModal");
            if (event.target == modal) {
                closeModal();
            }
        }
    </script>
</body>
</html>
