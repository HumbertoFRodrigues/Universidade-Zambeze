Algoritmo "Maior e Segundo Maior N�mero"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descri��o   : multiplica maior e segundo maior 1000x
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 03/08/2024
Var
numero, maior, segundoMaior: Real
contador: Inteiro
Inicio
   maior <- -999999
   segundoMaior <- -999999
// Loop para ler os 1000 n�meros
   Para contador de 1 at� 1000 fa�a
      Escreva("Digite o n�mero ", contador, ": ")
      Leia(numero)
// Verificando se o n�mero atual � maior que o maior registrado
      Se numero > maior Entao
         segundoMaior <- maior // Atualiza o segundo maior
         maior <- numero       // Atualiza o maior
      Senao
         // Verifica se o n�mero atual � maior que o segundo maior
         Se numero > segundoMaior Entao
            segundoMaior <- numero
         FimSe
      FimSe
   FimPara
// Calculando o produto do maior e do segundo maior n�mero
   produto <- maior * segundoMaior
// mostra o resultado do produto
   Escreva("O maior n�mero �: ", maior)
   Escreva("O segundo maior n�mero �: ", segundoMaior)
   Escreva("O produto do maior n�mero e do segundo maior n�mero �: ", produto)
FimAlgoritmo
