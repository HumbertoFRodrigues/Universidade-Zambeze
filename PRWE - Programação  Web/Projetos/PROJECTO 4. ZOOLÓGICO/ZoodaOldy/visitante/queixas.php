<?php
// Iniciar a sessão se ainda não estiver ativa
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Verifique se o usuário está logado
if (!isset($_SESSION['user_id'])) {
    http_response_code(403); // Acesso negado
    echo json_encode(['error' => 'Acesso negado. Você deve estar logado.']);
    exit;
}

// Conexão com o banco de dados
$host = 'localhost';
$db = 'zoo_da_oldy';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Processar a reclamação
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $type = $_POST['type'];
        $comments = $_POST['comments'] ?? '';
        $suggestions = $_POST['suggestions'] ?? '';
        $animalIssue = $_POST['animalIssue'] ?? null;
        $animalRemarks = $_POST['animalRemarks'] ?? '';
        $audio = $_FILES['audio'] ?? null;

        // Prepare a consulta
        $stmt = $pdo->prepare("INSERT INTO reclamacoes (user_id, tipo, comentarios, sugestoes, problema_animal, comentarios_animal, audio) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $_SESSION['user_id'],
            $type,
            $comments,
            $suggestions,
            $animalIssue,
            $animalRemarks,
            $audio ? file_get_contents($audio['tmp_name']) : null
        ]);

        echo json_encode(['message' => 'Reclamação enviada com sucesso!']);
        exit;
    }
} catch (PDOException $e) {
    http_response_code(500); // Erro do servidor
    echo json_encode(['error' => 'Erro na conexão com o banco de dados: ' . $e->getMessage()]);
}
?>
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Formulário de Queixas - Zoo da Oldy</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        h1 {
            text-align: center;
        }
        form {
            max-width: 600px;
            margin: auto;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 5px;
            background-color: #f9f9f9;
        }
        label {
            display: block;
            margin: 10px 0 5px;
        }
        select, textarea {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
        }
        button, a {
            display: inline-block;
            padding: 10px 15px;
            background-color: #28a745;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            text-align: center;
        }
        button:hover, a:hover {
            background-color: #218838;
        }
        #audioControls {
            display: flex;
            align-items: center;
            margin-top: 10px;
        }
        #recordingTime {
            margin-left: 10px;
        }
    </style>
</head>
<body>

<h2 style="text-align: center;">Faça a sua reclamação, queixa, denúncia ou sugestão.</h2>
<form id="complaintForm" enctype="multipart/form-data">
    <label for="complaintType">Tipo de Reclamação:</label>
    <select id="complaintType" name="type" required>
        <option value="">Selecione...</option>
        <option value="animais">Problemas com animais</option>
        <option value="instalacoes">Instalações</option>
        <option value="atendimento">Atendimento ao cliente</option>
        <option value="limpeza">Limpeza</option>
        <option value="outros">Outros</option>
    </select>

    <div id="animalComments" style="display:none;">
        <label>Escolha uma Opção sobre Problemas com Animais:</label>
        <select id="animalIssues" name="animalIssue">
            <option value="">Selecione...</option>
            <option value="condicoes">Os animais não estão em boas condições</option>
            <option value="magros">Os animais estão magros e mal alimentados</option>
            <option value="limpeza">Os animais não estão num lugar limpo</option>
            <option value="higiene">Os animais selvagens representam um perigo</option>
        </select>
        <textarea id="animalRemarks" name="animalRemarks" rows="4" placeholder="Comentários adicionais sobre os animais..."></textarea>
    </div>

    <label>Gravar Áudio da Reclamação (opcional):</label>
    <div id="audioControls">
        <button type="button" id="toggleRecord">Iniciar Gravação</button>
        <button type="button" id="deleteAudio" style="display:none;">🗑️</button>
        <span id="recordingTime" style="display:none;">0:00</span>
    </div>
    <audio id="audioPlayback" controls style="display:none;"></audio>
    <input type="hidden" id="audioBlob" name="audio">

    <label for="comments">Comentários Adicionais:</label>
    <textarea id="comments" name="comments" rows="4"></textarea>

    <label for="suggestions">Sugestões de Melhoria:</label>
    <textarea id="suggestions" name="suggestions" rows="4" placeholder="Escreva sua sugestão..."></textarea>

    <button type="submit">Enviar Reclamação</button>
    <a href="listar_reclamacoes.php">Ver Reclamações Feitas</a>

</form>

<script>
    let mediaRecorder;
    let audioChunks = [];
    let recordingTime = 0;
    let recordingInterval;

    document.getElementById('complaintType').addEventListener('change', function() {
        const animalComments = document.getElementById('animalComments');
        animalComments.style.display = (this.value === 'animais') ? 'block' : 'none';
    });

    document.getElementById('toggleRecord').addEventListener('click', async () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            clearInterval(recordingInterval);
            document.getElementById('toggleRecord').textContent = 'Iniciar Gravação';
            document.getElementById('deleteAudio').style.display = 'block';
        } else {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.start();
            document.getElementById('toggleRecord').textContent = 'Parar Gravação';
            document.getElementById('deleteAudio').style.display = 'none';

            audioChunks = [];
            recordingTime = 0;
            document.getElementById('recordingTime').style.display = 'inline';
            document.getElementById('recordingTime').textContent = '0:00';
            
            recordingInterval = setInterval(() => {
                recordingTime++;
                document.getElementById('recordingTime').textContent = Math.floor(recordingTime / 60) + ':' + String(recordingTime % 60).padStart(2, '0');
                if (recordingTime >= 180) { // 3 minutos
                    mediaRecorder.stop();
                    clearInterval(recordingInterval);
                }
            }, 1000);

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                audioChunks = [];
                const audioUrl = URL.createObjectURL(audioBlob);
                const audioPlayback = document.getElementById('audioPlayback');
                audioPlayback.src = audioUrl;
                audioPlayback.style.display = 'block';
                
                const reader = new FileReader();
                reader.onloadend = () => {
                    document.getElementById('audioBlob').value = reader.result;
                };
                reader.readAsDataURL(audioBlob);
            };
        }
    });

    document.getElementById('deleteAudio').addEventListener('click', () => {
        document.getElementById('audioBlob').value = '';
        document.getElementById('audioPlayback').style.display = 'none';
        document.getElementById('recordingTime').style.display = 'none';
        document.getElementById('deleteAudio').style.display = 'none';
    });

    document.getElementById('complaintForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        try {
            const response = await fetch('reclamacoes.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            alert(data.message || data.error);
            if (!data.error) {
                event.target.reset();
                document.getElementById('animalComments').style.display = 'none';
                document.getElementById('audioPlayback').style.display = 'none';
            }
        } catch (error) {
            alert('Erro ao enviar a reclamação: ' + error);
        }
    });
</script>

</body>
</html>
