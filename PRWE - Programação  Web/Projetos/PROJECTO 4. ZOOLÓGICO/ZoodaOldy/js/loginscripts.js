// scripts.js

// Função de validação geral para todos os formulários
function validateForm(event, formType) {
    event.preventDefault(); // Impede o comportamento padrão de enviar o formulário
  
    // Coleta os dados dos campos de input
    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
  
    let errorMessage = "";
  
    // Validação do formulário de login ou cadastro
    if (formType === 'login' || formType === 'signup') {
      if (!email && !username) {
        errorMessage += "O campo de email ou usuário é obrigatório.\n";
      }
  
      if (password.value === "") {
        errorMessage += "O campo de palavra-passe é obrigatório.\n";
      }
    }
  
    // Validação do formulário de redefinição de senha
    if (formType === 'reset') {
      if (email.value === "") {
        errorMessage += "O campo de email é obrigatório para redefinir a senha.\n";
      }
    }
  
    // Exibe erros ou redireciona para outra página
    if (errorMessage) {
      alert(errorMessage); // Mostra os erros encontrados
    } else {
      if (formType === 'login') {
        alert("Login realizado com sucesso!");
        // Aqui você pode redirecionar para uma página específica após login, por exemplo:
        // window.location.href = "pagina_principal.html";
      } else if (formType === 'signup') {
        alert("Conta criada com sucesso!");
        // Redireciona para a página de login após criar a conta
        window.location.href = "login.html";
      } else if (formType === 'reset') {
        alert("Instruções para redefinir a senha foram enviadas para o seu email.");
        // Redireciona para a página de login após redefinir a senha
        window.location.href = "login.html";
      }
    }
  }
  
  // Definindo comportamento para a página de login
  if (document.title === "Página de Login") {
    const loginForm = document.querySelector('form');
    loginForm.addEventListener('submit', function(event) {
      validateForm(event, 'login');
    });
  }
  
  // Definindo comportamento para a página de criação de conta
  if (document.title === "Criação de Conta") {
    const signupForm = document.querySelector('form');
    signupForm.addEventListener('submit', function(event) {
      validateForm(event, 'signup');
    });
  }
  
  // Definindo comportamento para a página de redefinição de senha
  if (document.title === "Redefinir Senha") {
    const resetForm = document.querySelector('form');
    resetForm.addEventListener('submit', function(event) {
      validateForm(event, 'reset');
    });
  }
  const carouselBackground = document.getElementById('carousel-background');
const images = [
    'imagens/oldi.jpg',
    'imagens/background2.jpg'
];
let currentIndex = 0;

function changeBackground() {
    currentIndex = (currentIndex + 1) % images.length;
    carouselBackground.style.backgroundImage = `url(${images[currentIndex]})`;
}

// Inicializa o carrossel com a primeira imagem
carouselBackground.style.backgroundImage = `url(${images[currentIndex]})`;

// Troca de imagem a cada 10 segundos
setInterval(changeBackground, 10000);
