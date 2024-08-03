Algoritmo "Soma do Maior e Menor de 100 Números"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descrição   : loop para 100 nrs maior e menor
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 02/08/2024
Var
numero, maior, menor, soma: Real
contador: Inteiro
Inicio
// Inicializa o maior e menor com valores extremos
   maior <- -999999
   menor <- 999999

// Loop para ler 100 números
   Para contador de 1 até 100 faça
      Escreva("Digite o número ", contador, ": ")
      Leia(numero)
// Verifica se o número atual é maior que o maior registrado
      Se numero > maior Entao
         maior <- numero
      FimSe

// Verifica se o número atual é menor que o menor registrado
      Se numero < menor Entao
         menor <- numero
      FimSe
   FimPara
   
// Calcula a soma do maior e do menor número
   soma <- maior + menor

// Exibe o resultado da soma
Escreva("A soma do maior número (", maior, ") e do menor número(", menor, ") é: ", soma)
FimAlgoritmo
