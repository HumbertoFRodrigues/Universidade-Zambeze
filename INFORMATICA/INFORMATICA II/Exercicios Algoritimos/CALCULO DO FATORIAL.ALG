Algoritmo "calculo do fatorial"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descri��o   : calculadora de fatorial
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 03/08/2024
Var
numero, i, fatorial: Inteiro
Inicio
   Escreva("Digite um n�mero para calcular o fatorial: ")
   Leia(numero)
// Inicializa a vari�vel fatorial
   fatorial <- 1

// Verificando se o n�mero � negativo
   Se numero < 0 Entao
      Escreva("N�o � poss�vel calcular o fatorial de um n�mero negativo.")
   Senao
      // Calculando o fatorial usando um loop
      Para i de 1 at� numero faca
         fatorial <- fatorial * i
      FimPara

      // mostrando o resultado
      Escreva("O fatorial de ", numero, " �: ", fatorial)
   FimSe

FimAlgoritmo
