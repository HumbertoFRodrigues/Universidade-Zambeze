Algoritmo "Soma do Maior e Menor de 100 N�meros"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descri��o   : loop para 100 nrs maior e menor
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 02/08/2024
Var
numero, maior, menor, soma: Real
contador: Inteiro
Inicio
// Inicializa o maior e menor com valores extremos
   maior <- -999999
   menor <- 999999

// Loop para ler 100 n�meros
   Para contador de 1 at� 100 fa�a
      Escreva("Digite o n�mero ", contador, ": ")
      Leia(numero)
// Verifica se o n�mero atual � maior que o maior registrado
      Se numero > maior Entao
         maior <- numero
      FimSe

// Verifica se o n�mero atual � menor que o menor registrado
      Se numero < menor Entao
         menor <- numero
      FimSe
   FimPara
   
// Calcula a soma do maior e do menor n�mero
   soma <- maior + menor

// Exibe o resultado da soma
Escreva("A soma do maior n�mero (", maior, ") e do menor n�mero(", menor, ") �: ", soma)
FimAlgoritmo
