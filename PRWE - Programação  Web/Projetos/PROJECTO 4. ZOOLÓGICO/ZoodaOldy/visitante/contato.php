<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Formulário de Queixas - Zoo da Oldy</title>
    <link rel="stylesheet" href="../css/style.css"> <!-- Mantenha o CSS externo caso tenha um arquivo específico -->
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
            margin-top: 10px;
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
        .error-message {
            color: red;
            font-weight: bold;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>

<h2 style="text-align: center;">Faça a sua reclamação, queixa, denúncia ou sugestão.</h2>
<form id="complaintForm" enctype="multipart/form-data">
    <div class="error-message" id="errorMessage" style="display: none;"></div>

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
    <a href="?page=listar_reclamacoes">Ver Reclamações Feitas</a>
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
            try {
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
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        document.getElementById('audioBlob').value = reader.result; // Salva o áudio codificado em base64
                    };
                    reader.readAsDataURL(audioBlob);
                };
            } catch (error) {
                alert('Erro ao acessar o microfone: ' + error.message);
            }
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
            if (data.error) {
                document.getElementById('errorMessage').textContent = data.error;
                document.getElementById('errorMessage').style.display = 'block';
            } else {
                alert(data.message);
                event.target.reset(); // Limpa o formulário
                document.getElementById('animalComments').style.display = 'none';
                document.getElementById('audioPlayback').style.display = 'none';
                document.getElementById('recordingTime').style.display = 'none'; // Esconde o tempo de gravação
                document.getElementById('deleteAudio').style.display = 'none'; // Esconde o botão de deletar
            }
        } catch (error) {
            alert('Erro ao enviar a reclamação: ' + error);
        }
    });
</script>
</body>
</html>
