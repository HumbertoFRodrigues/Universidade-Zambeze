import cv2
import numpy as np

# Criando o objeto de subtração de fundo
back_sub = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=50, detectShadows=True)

cap = cv2.VideoCapture(0)  # 0 para a webcam padrão

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Aplicando a subtração de fundo
    fg_mask = back_sub.apply(frame)

    # Encontrando contornos
    contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    for contour in contours:
        if cv2.contourArea(contour) > 500:  # Filtrando pequenos contornos
            # Desenhando retângulos ao redor dos contornos detectados
            x, y, w, h = cv2.boundingRect(contour)
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
    
    # Mostrando o vídeo com a detecção de movimento
    cv2.imshow('Frame', frame)
    cv2.imshow('FG Mask', fg_mask)

    if cv2.waitKey(30) & 0xFF == 27:  # Tecla ESC para sair
        break

cap.release()
cv2.destroyAllWindows()


# Inicializando o filtro de Kalman
kalman = cv2.KalmanFilter(4, 2)
kalman.measurementMatrix = np.array([[1, 0, 0, 0], [0, 1, 0, 0]], np.float32)
kalman.transitionMatrix = np.array([[1, 0, 1, 0], [0, 1, 0, 1], [0, 0, 1, 0], [0, 0, 0, 1]], np.float32)
kalman.processNoiseCov = np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 5, 0], [0, 0, 0, 5]], np.float32) * 0.03

while True:
    ret, frame = cap.read()
    if not ret:
        break

    fg_mask = back_sub.apply(frame)
    contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    for contour in contours:
        if cv2.contourArea(contour) > 500:
            x, y, w, h = cv2.boundingRect(contour)
            cx, cy = x + w // 2, y + h // 2

            # Atualizando a medição
            kalman.correct(np.array([[np.float32(cx)], [np.float32(cy)]]))

            # Prevendo a próxima posição
            prediction = kalman.predict()
            pred_x, pred_y = int(prediction[0]), int(prediction[1])

            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.circle(frame, (pred_x, pred_y), 5, (0, 0, 255), -1)
    
    cv2.imshow('Frame', frame)
    cv2.imshow('FG Mask', fg_mask)

    if cv2.waitKey(30) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()