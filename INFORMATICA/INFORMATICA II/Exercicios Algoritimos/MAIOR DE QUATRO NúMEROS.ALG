Algoritmo "Maior de Quatro N�meros"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descri��o   : maior dos 4 numeros digitados
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 02/08/2024
Var
numero1, numero2, numero3, numero4, maior: Real
Inicio
// Solicita ao usu�rio para digitar os n�meros
   Escreva("Digite o primeiro n�mero: ")
   Leia(numero1)
   Escreva("Digite o segundo n�mero: ")
   Leia(numero2)
   Escreva("Digite o terceiro n�mero: ")
   Leia(numero3)
   Escreva("Digite o quarto n�mero: ")
   Leia(numero4)
   // Inicializa a vari�vel maior com o valor de numero1
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
   Escreva("O maior n�mero �: ", maior)
Fimalgoritmo