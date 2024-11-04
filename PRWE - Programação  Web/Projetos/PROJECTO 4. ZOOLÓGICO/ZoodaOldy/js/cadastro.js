// para validar idade apenas +13 podem criar conta e validar campos

        function validarIdade() {
            const dataNascimento = document.getElementById("data_nascimento").value;
            if (dataNascimento) {
                const hoje = new Date();
                const nascimento = new Date(dataNascimento);
                let idade = hoje.getFullYear() - nascimento.getFullYear();
                const mes = hoje.getMonth() - nascimento.getMonth();

                if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
                    idade--;
                }

                if (idade < 13) {
                    alert("Você deve ter pelo menos 13 anos para se registrar.");
                    return false;
                }
            }
            return true;
        }

        function nextStep() {
            const currentStep = document.querySelector('.step.active');
            const inputs = currentStep.querySelectorAll("[required]");

            for (let input of inputs) {
                if (!input.value) {
                    alert("Por favor, preencha os campos obrigatórios.");
                    input.focus();
                    return;
                }
            }

            const nextStep = currentStep.nextElementSibling;
            if (nextStep) {
                currentStep.classList.remove('active');
                nextStep.classList.add('active');
            }
        }

        function prevStep() {
            const currentStep = document.querySelector('.step.active');
            const prevStep = currentStep.previousElementSibling;
            if (prevStep) {
                currentStep.classList.remove('active');
                prevStep.classList.add('active');
            }
        }

        function validarTelefone(event) {
            const key = event.key;
            if (!/[0-9]/.test(key)) {
                event.preventDefault();
                alert("Por favor, insira apenas números no campo de telefone.");
            }
        }

        document.getElementById("pais").addEventListener("change", function() {
            const outroPais = document.getElementById("outroPais");
            outroPais.style.display = this.value === "Outro" ? "block" : "none";
        });



        
// mostarar outros paises ao escolher outro no formulario

function mostrarOutroCampo() {
    const selectPais = document.getElementById("pais");
    const outroCampo = document.getElementById("outroPais");

    if (selectPais.value === "Outro") {
        outroCampo.style.display = "block";
    } else {
        outroCampo.style.display = "none";
    }
}

function nextStep(step) {
    const activeStep = document.querySelector(".step.active");

    // Validação de campos obrigatórios
    let isValid = true;
    if (step === 1) {
        if (!document.getElementById("nome").value.trim()) {
            alert("Por favor, preencha o campo Nome.");
            isValid = false;
        } else if (!document.getElementById("sexo").value.trim()) {
            alert("Por favor, selecione o campo Sexo.");
            isValid = false;
        }
    } else if (step === 2) {
        if (!document.getElementById("pais").value.trim()) {
            alert("Por favor, selecione o campo Nacionalidade.");
            isValid = false;
        } else if (!document.getElementById("telefone").value.trim()) {
            alert("Por favor, preencha o campo Telefone.");
            isValid = false;
        }
    }

    if (isValid) {
        const nextStep = activeStep.nextElementSibling;
        if (nextStep && nextStep.classList.contains("step")) {
            activeStep.classList.remove("active");
            nextStep.classList.add("active");
        }
    }
}

function prevStep() {
    const activeStep = document.querySelector(".step.active");
    const prevStep = activeStep.previousElementSibling;
    if (prevStep && prevStep.classList.contains("step")) {
        activeStep.classList.remove("active");
        prevStep.classList.add("active");
    }
}

// Limpar o formulário ao carregar a página
window.onload = function() {
    document.getElementById("registerForm").reset();
};