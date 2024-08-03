Algoritmo "Verificar numero primo"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descrição   : numero primo
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 03/08/2024
Var
numero, i: Inteiro
ePrimo: Logico
Inicio
   Escreva("Digite um número: ")
   Leia(numero)
// Considerando que o número é primo até que se prove o contrário
   ePrimo <- Verdadeiro
// Verifica se o número é menor ou igual a 1
   Se numero <= 1 Entao
      ePrimo <- Falso
   Senao

      // Loop para verificar divisibilidade
      Para i de 2 até (numero - 1) faça
         Se (numero % i) = 0 Entao
            ehPrimo <- Falso
            // Quebra do loop se encontrar um divisor
            Interrompa
         FimSe
      FimPara
   FimSe
// mostra o resultado
   Se ehPrimo = Verdadeiro Entao
      Escreva("O número ", numero, " é primo.")
   Senao
      Escreva("O número ", numero, " não é primo.")
   FimSe
FimAlgoritmo
