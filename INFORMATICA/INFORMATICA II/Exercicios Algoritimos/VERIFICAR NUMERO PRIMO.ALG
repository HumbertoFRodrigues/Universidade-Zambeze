Algoritmo "Verificar numero primo"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descri��o   : numero primo
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 03/08/2024
Var
numero, i: Inteiro
ePrimo: Logico
Inicio
   Escreva("Digite um n�mero: ")
   Leia(numero)
// Considerando que o n�mero � primo at� que se prove o contr�rio
   ePrimo <- Verdadeiro
// Verifica se o n�mero � menor ou igual a 1
   Se numero <= 1 Entao
      ePrimo <- Falso
   Senao

      // Loop para verificar divisibilidade
      Para i de 2 at� (numero - 1) fa�a
         Se (numero % i) = 0 Entao
            ehPrimo <- Falso
            // Quebra do loop se encontrar um divisor
            Interrompa
         FimSe
      FimPara
   FimSe
// mostra o resultado
   Se ehPrimo = Verdadeiro Entao
      Escreva("O n�mero ", numero, " � primo.")
   Senao
      Escreva("O n�mero ", numero, " n�o � primo.")
   FimSe
FimAlgoritmo
