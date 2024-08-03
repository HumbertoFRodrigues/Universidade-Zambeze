Algoritmo "Maior de Quatro Números"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descrição   : maior dos 4 numeros digitados
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 02/08/2024
Var
numero1, numero2, numero3, numero4, maior: Real
Inicio
// Solicita ao usuário para digitar os números
   Escreva("Digite o primeiro número: ")
   Leia(numero1)
   Escreva("Digite o segundo número: ")
   Leia(numero2)
   Escreva("Digite o terceiro número: ")
   Leia(numero3)
   Escreva("Digite o quarto número: ")
   Leia(numero4)
   // Inicializa a variável maior com o valor de numero1
   maior <- numero1
   Se numero2 > maior Entao
      maior <- numero2
   FimSe
   Se numero3 > maior Entao
      maior <- numero3
   FimSe
   Se numero4 > maior Entao
      maior <- numero4
   FimSe
   Escreva("O maior número é: ", maior)
Fimalgoritmo