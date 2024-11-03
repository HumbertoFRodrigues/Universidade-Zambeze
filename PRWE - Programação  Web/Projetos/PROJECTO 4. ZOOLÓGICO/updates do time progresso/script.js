let currentIndex = 0;
const images = document.querySelectorAll('.carousel-images img');
const totalImages = images.length;
let autoSlideInterval;

// Função para mostrar a imagem com a transição
function showImage(index) {
    const offset = -index * 100; // Calcula o deslocamento da imagem
    document.querySelector('.carousel-images').style.transform = `translateX(${offset}%)`;
}

// Função para avançar para a próxima imagem
function showNext() {
    currentIndex++;
    if (currentIndex === totalImages - 1) {
        setTimeout(() => {
            document.querySelector('.carousel-images').style.transition = 'none';
            currentIndex = 0;
            showImage(currentIndex);
            setTimeout(() => {
                document.querySelector('.carousel-images').style.transition = 'transform 0.5s ease';
            }, 50);
        }, 500);
    } else {
        showImage(currentIndex);
    }
    resetAutoSlide();
}

// Função para voltar para a imagem anterior
function showPrev() {
    if (currentIndex === 0) {
        document.querySelector('.carousel-images').style.transition = 'none';
        currentIndex = totalImages - 2;
        showImage(currentIndex);
        setTimeout(() => {
            document.querySelector('.carousel-images').style.transition = 'transform 0.5s ease';
        }, 50);
    } else {
        currentIndex--;
        showImage(currentIndex);
    }
    resetAutoSlide();
}

// Função para reiniciar o intervalo do slide automático
function resetAutoSlide() {
    clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(showNext, 3000);
}

// Inicia a transição automática a cada 3 segundos
autoSlideInterval = setInterval(showNext, 3000);
