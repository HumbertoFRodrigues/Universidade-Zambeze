Algoritmo "Maior de Dois N�meros"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descri��o   : solicita dois numeros e mostra o maior
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 03/08/2024
Var
   numero1, numero2: Real
Inicio
 // Solicita ao usu�rio para digitar o primeiro n�mero
   Escreva("Digite o primeiro n�mero: ")
   Leia(numero1)
   // Solicita ao usu�rio para digitar o segundo n�mero
   Escreva("Digite o segundo n�mero: ")
   Leia(numero2)
   // Compara os n�meros e exibe o maior
   Se numero1 > numero2 Entao
      Escreva("O maior n�mero �: ", numero1)
   Senao
      Se numero2 > numero1 Entao
         Escreva("O maior n�mero �: ", numero2)
      Senao
         Escreva("Os dois n�meros s�o iguais.")
      FimSe
   FimSe
Fimalgoritmo