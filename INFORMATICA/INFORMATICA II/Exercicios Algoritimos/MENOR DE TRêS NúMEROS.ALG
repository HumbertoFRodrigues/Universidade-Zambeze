Algoritmo "Menor de Tr�s N�meros"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descri��o   : menor dos tres numerps digitados
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 03/08/2024
Var
   numero1, numero2, numero3, menor: Real
Inicio
   Escreva("Digite o primeiro n�mero: ")
   Leia(numero1)
   Escreva("Digite o segundo n�mero: ")
   Leia(numero2)
   Escreva("Digite o terceiro n�mero: ")
   Leia(numero3)
   // Inicializando a vari�vel menor com o valor de numero1
   menor <- numero1
   // aqui vai Comparar e encontra o menor n�mero
   Se numero2 < menor Entao
      menor <- numero2
   FimSe
   Se numero3 < menor Entao
      menor <- numero3
   FimSe

   // finaliza e mostra o menor n�mero
   Escreva("O menor n�mero �: ", menor)

Fimalgoritmo