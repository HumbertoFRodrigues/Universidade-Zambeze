import cv2

# Carregar o modelo pré-treinado para detecção de pessoas
detecao = cv2.HOGDescriptor()
detecao.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

# Inicializar a captura de vídeo
captar = cv2.VideoCapture(0)  # Para captura de câmera
#captar = cv2.VideoCapture()  # Para arquivo de vídeo

if not captar.isOpened():
    print("Erro ao abrir a câmera ou vídeo.")
    exit()

# Inicializar o detector de movimento
detector_de_Movimentos = cv2.createBackgroundSubtractorMOG2()

# Loop principal
while True:
    ret, frame = captar.read()
    if not ret:
        break

    # Detectar pessoas no frame
    (rects, _) = detecao.detectMultiScale(frame, winStride=(4, 4), padding=(8, 8), scale=1.05)

    # Desenhar retângulos ao redor das pessoas detectadas
    for (x, y, w, h) in rects:
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

    # Detectar movimento no frame
    fgmask = detector_de_Movimentos.apply(frame)

    # Encontrar contornos de áreas de movimento
    contornos, _ = cv2.findContours(fgmask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Desenhar retângulos ao redor das áreas de movimento
    for contorno in contornos:
        if cv2.contourArea(contorno) > 700:  # Ajuste o limite conforme necessário
            (x, y, w, h) = cv2.boundingRect(contorno)
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)

    # Mostrar o frame com as detecções
    cv2.imshow('Analise de comportamento em Multidoes', frame)

    # Parar o programa se a tecla 's' for pressionada
    if cv2.waitKey(1) & 0xFF == ord('s'):
        break

# Liberar recursos
captar.release()
cv2.destroyAllWindows()
