
        let currentIndex = 0;
        const images = document.querySelectorAll('.carousel-images img');
        const totalImages = images.length;

        // Função para mostrar a imagem com a transição
        function showImage(index) {
            const offset = -index * 100; // Calcula o deslocamento da imagem
            document.querySelector('.carousel-images').style.transform = `translateX(${offset}%)`;
        }

        // Função para avançar o carrossel
        function autoSlide() {
            currentIndex++;
            showImage(currentIndex);

            // Quando atingir a imagem duplicada, reposiciona instantaneamente
            if (currentIndex === totalImages - 1) {
                setTimeout(() => {
                    document.querySelector('.carousel-images').style.transition = 'none';
                    currentIndex = 0; // Reposiciona para a primeira imagem
                    showImage(currentIndex);
                    setTimeout(() => {
                        document.querySelector('.carousel-images').style.transition = 'transform 0.5s ease';
                    }, 50); // Restaura a transição após reposicionar
                }, 500); // Espera a transição terminar antes de reposicionar
            }
        }

        function showNext() {
            currentIndex = (currentIndex + 1) % images.length;
            showImage(currentIndex);
        }

        function showPrev() {
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            showImage(currentIndex);
        }

        // Inicia a transição automática a cada 3 segundos
        setInterval(autoSlide, 3000);





// Inicia o carrossel
showSlides();
setInterval(() => {
    slideIndex++;
    showSlides();
}, 3000); // Troca a imagem a cada 3 segundos


let login = document.querySelector(".login-form");

    document.querySelector("#login-btn").onclick = ()  =>{
        login.classList.toggle('active');

    }

    var swiper = new swiper(".gallery-slider",{
        grabCursor:true,
        loop:true,
        centeredSlides: true,
        spaceBetween:20,
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        breakpoints: {
            0:{
                slidesPerView:1,
            },
            700:{
                slidesPerView:2,
            },
        }
    })