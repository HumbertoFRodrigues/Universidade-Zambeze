Algoritmo "Maior de Dois Números"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descrição   : solicita dois numeros e mostra o maior
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 03/08/2024
Var
   numero1, numero2: Real
Inicio
 // Solicita ao usuário para digitar o primeiro número
   Escreva("Digite o primeiro número: ")
   Leia(numero1)
   // Solicita ao usuário para digitar o segundo número
   Escreva("Digite o segundo número: ")
   Leia(numero2)
   // Compara os números e exibe o maior
   Se numero1 > numero2 Entao
      Escreva("O maior número é: ", numero1)
   Senao
      Se numero2 > numero1 Entao
         Escreva("O maior número é: ", numero2)
      Senao
         Escreva("Os dois números são iguais.")
      FimSe
   FimSe
Fimalgoritmo