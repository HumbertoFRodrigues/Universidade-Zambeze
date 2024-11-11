<?php
include '../conexao.php'; // Conexão com o banco de dados

// Verificar se o usuário tem permissão para acessar a página
session_start();
if (!isset($_SESSION['nivel_id'])) {
    header("Location: login.php");
    exit();
}

// Consultar as espécies do banco de dados
$query = "SELECT * FROM especies";
$resultado = $conexao->query($query);

// Verificar se o usuário é admin ou funcionário
$is_admin = ($_SESSION['nivel_id'] == 1);
$is_funcionario = ($_SESSION['nivel_id'] == 2);
?>

<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Informações das Espécies</title>
    <style>
        /* Estilo básico */
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
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(0, 0, 0, 0.7);
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
        }
        .modal-content img {
            max-width: 100%;
            height: auto;
            margin-top: 10px;
        }
        .close {
            position: absolute;
            top: 10px;
            right: 20px;
            font-size: 24px;
            cursor: pointer;
            color: #555;
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
        <?php while ($row = $resultado->fetch_assoc()) { ?>
            <tr onclick="abrirModal(<?php echo htmlspecialchars(json_encode($row)); ?>)">
                <td><?php echo $row['nome']; ?></td>
                <td><?php echo $row['data_aquisicao']; ?></td>
                <td><?php echo $row['num_animais']; ?></td>
                <td><?php echo $row['peso_maximo']; ?> kg</td>
                <td><?php echo $row['idade_maxima']; ?> anos</td>
            </tr>
        <?php } ?>
    </tbody>
</table>

<!-- Modal de Detalhes -->
<div id="modal" class="modal">
    <div class="modal-content">
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

<script>
    // Função para abrir o modal e preencher os dados
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

        // Consulta as fotos associadas à espécie via AJAX
        fetch('../obter_fotos.php?id=' + especie.id)
            .then(response => response.json())
            .then(fotos => {
                const fotosContainer = document.getElementById("modalFotos");
                fotosContainer.innerHTML = ""; // Limpa fotos anteriores
                fotos.forEach(foto => {
                    const img = document.createElement("img");
                    img.src = "../" + foto.caminho;
                    img.alt = especie.nome;
                    fotosContainer.appendChild(img);
                });
            });

        document.getElementById("modal").style.display = "flex";
    }

    // Função para fechar o modal
    function fecharModal() {
        document.getElementById("modal").style.display = "none";
    }
</script>

</body>
</html>
