Algoritmo "Soma de 7 N�meros"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descri��o   : Aqui voc� descreve o que o programa faz! (fun��o)
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 03/08/2024
Var
// Se��o de Declara��es das vari�veis
numero,soma: Real
contador: Inteiro
Inicio
// Inicializa a soma com 0
   soma <- 0
// Loop para ler 7 n�meros
   Para contador de 1 at� 7 fa�a
      Escreva("Digite o n�mero ", contador, ": ")
      Leia(numero)
      soma <- soma + numero
   FimPara
   // Exibe o resultado da soma
   Escreva("A soma dos 7 n�meros �: ", soma)
Fimalgoritmo