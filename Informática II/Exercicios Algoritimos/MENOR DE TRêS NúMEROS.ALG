Algoritmo "Menor de Três Números"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descrição   : menor dos tres numerps digitados
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 03/08/2024
Var
   numero1, numero2, numero3, menor: Real
Inicio
   Escreva("Digite o primeiro número: ")
   Leia(numero1)
   Escreva("Digite o segundo número: ")
   Leia(numero2)
   Escreva("Digite o terceiro número: ")
   Leia(numero3)
   // Inicializando a variável menor com o valor de numero1
   menor <- numero1
   // aqui vai Comparar e encontra o menor número
   Se numero2 < menor Entao
      menor <- numero2
   FimSe
   Se numero3 < menor Entao
      menor <- numero3
   FimSe

   // finaliza e mostra o menor número
   Escreva("O menor número é: ", menor)

Fimalgoritmo