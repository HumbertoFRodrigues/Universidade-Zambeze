<?php
// Verificar e incluir o arquivo de conexão
$arquivo_conexao = dirname(__DIR__) . '/db_conexao.php';
if (file_exists($arquivo_conexao)) {
    include $arquivo_conexao;
} else {
    die("Erro: Arquivo de conexão não encontrado.");
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['nivel_id'])) {
    header("Location: login.php");
    exit();
}

if (!isset($conn)) {
    die("Erro: A conexão com o banco de dados não foi estabelecida.");
}

$query = "SELECT e.*, f.caminho AS foto_caminho 
          FROM especies e
          LEFT JOIN fotos_especies f ON e.id = f.especie_id";
$stmt = $conn->prepare($query);
$stmt->execute();
$especies = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $especie_id = $row['id'];
    if (!isset($especies[$especie_id])) {
        $especies[$especie_id] = [
            'id' => $row['id'],
            'nome' => $row['nome'],
            'data_aquisicao' => $row['data_aquisicao'],
            'num_animais' => $row['num_animais'],
            'num_femeas' => $row['num_femeas'],
            'peso_maximo' => $row['peso_maximo'],
            'tipo' => $row['tipo'],
            'idade_maxima' => $row['idade_maxima'],
            'mes_acasalamento_inicio' => $row['mes_acasalamento_inicio'],
            'mes_acasalamento_fim' => $row['mes_acasalamento_fim'],
            'cor_caracteristica' => $row['cor_caracteristica'],
            'gestacao_duracao' => $row['gestacao_duracao'],
            'comprimento_min' => $row['comprimento_min'],
            'comprimento_max' => $row['comprimento_max'],
            'fotos' => []
        ];
    }
    if ($row['foto_caminho']) {
        $especies[$especie_id]['fotos'][] = $row['foto_caminho'];
    }
}
?>

<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Informações das Espécies</title>
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border: 1px solid #ddd;
            cursor: pointer;
        }
        th {
            background-color: #f2f2f2;
        }
        .modal, .full-image-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }
        .modal-content {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            width: 80%;
            max-width: 600px;
            text-align: center;
            position: relative;
            overflow-y: auto;
            max-height: 90vh;
        }
        .modal-content img {
            max-width: 180px;
            max-height: 180px;
            margin: 10px;
            border-radius: 8px;
            cursor: pointer;
        }
        .close {
            position: absolute;
            top: 10px;
            right: 20px;
            font-size: 24px;
            cursor: pointer;
            color: #555;
            background: white;
            padding: 5px;
            border-radius: 50%;
        }
        /* Estilo para o modal de imagem em tela cheia */
        .full-image-content {
            position: relative;
            max-width: 90%;
            max-height: 90%;
        }
        .full-image-content img {
            width: 100%;
            height: auto;
            border-radius: 8px;
        }
    </style>
</head>
<body>

<h2>Informações das Espécies</h2>

<table>
    <thead>
        <tr>
            <th>Nome</th>
            <th>Data de Aquisição</th>
            <th>Número de Animais</th>
            <th>Peso Máximo</th>
            <th>Idade Máxima</th>
        </tr>
    </thead>
    <tbody>
        <?php foreach ($especies as $especie) { ?>
            <tr onclick="abrirModal(<?php echo htmlspecialchars(json_encode($especie)); ?>)">
                <td><?php echo $especie['nome']; ?></td>
                <td><?php echo $especie['data_aquisicao']; ?></td>
                <td><?php echo $especie['num_animais']; ?></td>
                <td><?php echo $especie['peso_maximo']; ?> kg</td>
                <td><?php echo $especie['idade_maxima']; ?> anos</td>
            </tr>
        <?php } ?>
    </tbody>
</table>

<!-- Modal de Detalhes -->
<div id="modal" class="modal" onclick="fecharModal()">
    <div class="modal-content" onclick="event.stopPropagation()">
        <span class="close" onclick="fecharModal()">&times;</span>
        <h3 id="modalNome"></h3>
        <p><strong>Data de Aquisição:</strong> <span id="modalDataAquisicao"></span></p>
        <p><strong>Número de Animais:</strong> <span id="modalNumAnimais"></span></p>
        <p><strong>Número de Fêmeas:</strong> <span id="modalNumFemeas"></span></p>
        <p><strong>Peso Máximo:</strong> <span id="modalPesoMaximo"></span> kg</p>
        <p><strong>Idade Máxima:</strong> <span id="modalIdadeMaxima"></span> anos</p>
        <p><strong>Período de Acasalamento:</strong> <span id="modalPeriodoAcasalamento"></span></p>
        <p><strong>Cor Característica:</strong> <span id="modalCorCaracteristica"></span></p>
        <p><strong>Gestação Duração:</strong> <span id="modalGestacaoDuracao"></span></p>
        <p><strong>Comprimento:</strong> <span id="modalComprimento"></span> cm</p>
        <h4>Fotos</h4>
        <div id="modalFotos"></div>
    </div>
</div>

<!-- Modal para exibir imagem em tela cheia -->
<div id="fullImageModal" class="full-image-modal" onclick="fecharImagemAmpliada()">
    <div class="full-image-content" onclick="event.stopPropagation()">
        <span class="close" onclick="fecharImagemAmpliada()">&times;</span>
        <img id="imagemAmpliada" src="" alt="Imagem Ampliada">
    </div>
</div>

<script>
    function abrirModal(especie) {
        document.getElementById("modalNome").textContent = especie.nome;
        document.getElementById("modalDataAquisicao").textContent = especie.data_aquisicao;
        document.getElementById("modalNumAnimais").textContent = especie.num_animais;
        document.getElementById("modalNumFemeas").textContent = especie.num_femeas;
        document.getElementById("modalPesoMaximo").textContent = especie.peso_maximo;
        document.getElementById("modalIdadeMaxima").textContent = especie.idade_maxima;
        document.getElementById("modalPeriodoAcasalamento").textContent = especie.mes_acasalamento_inicio + " - " + especie.mes_acasalamento_fim;
        document.getElementById("modalCorCaracteristica").textContent = especie.cor_caracteristica;
        document.getElementById("modalGestacaoDuracao").textContent = especie.gestacao_duracao;
        document.getElementById("modalComprimento").textContent = especie.comprimento_min + " - " + especie.comprimento_max;

        const fotosContainer = document.getElementById("modalFotos");
        fotosContainer.innerHTML = "";
        especie.fotos.forEach(foto => {
            const img = document.createElement("img");
            img.src = "../" + foto;
            img.alt = especie.nome;
            img.onclick = () => abrirImagemAmpliada(img.src);
            fotosContainer.appendChild(img);
        });

        document.getElementById("modal").style.display = "flex";
    }

    function fecharModal() {
        document.getElementById("modal").style.display = "none";
    }

    function abrirImagemAmpliada(src) {
        document.getElementById("imagemAmpliada").src = src;
        document.getElementById("fullImageModal").style.display = "flex";
    }

    function fecharImagemAmpliada() {
        document.getElementById("fullImageModal").style.display = "none";
    }
</script>

</body>
</html>
