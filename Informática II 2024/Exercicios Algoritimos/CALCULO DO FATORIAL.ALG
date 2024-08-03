Algoritmo "calculo do fatorial"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descrição   : calculadora de fatorial
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 03/08/2024
Var
numero, i, fatorial: Inteiro
Inicio
   Escreva("Digite um número para calcular o fatorial: ")
   Leia(numero)
// Inicializa a variável fatorial
   fatorial <- 1

// Verificando se o número é negativo
   Se numero < 0 Entao
      Escreva("Não é possível calcular o fatorial de um número negativo.")
   Senao
      // Calculando o fatorial usando um loop
      Para i de 1 até numero faca
         fatorial <- fatorial * i
      FimPara

      // mostrando o resultado
      Escreva("O fatorial de ", numero, " é: ", fatorial)
   FimSe

FimAlgoritmo
