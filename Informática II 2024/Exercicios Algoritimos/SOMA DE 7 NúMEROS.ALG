Algoritmo "Soma de 7 Números"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descrição   : Aqui você descreve o que o programa faz! (função)
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 03/08/2024
Var
// Seção de Declarações das variáveis
numero,soma: Real
contador: Inteiro
Inicio
// Inicializa a soma com 0
   soma <- 0
// Loop para ler 7 números
   Para contador de 1 até 7 faça
      Escreva("Digite o número ", contador, ": ")
      Leia(numero)
      soma <- soma + numero
   FimPara
   // Exibe o resultado da soma
   Escreva("A soma dos 7 números é: ", soma)
Fimalgoritmo