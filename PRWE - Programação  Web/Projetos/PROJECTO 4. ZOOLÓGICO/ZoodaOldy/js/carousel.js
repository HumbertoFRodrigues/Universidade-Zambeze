const images = [
    'imagens/1234.png',
    'imagens/123.png'
];
let currentIndex = 0;

function changeBackground() {
    document.body.style.backgroundImage = `url(${images[currentIndex]})`;
    currentIndex = (currentIndex + 1) % images.length;
}

// Inicializa o carrossel com a primeira imagem
changeBackground();

// Troca de imagem a cada 10 segundos
setInterval(changeBackground, 10000);
