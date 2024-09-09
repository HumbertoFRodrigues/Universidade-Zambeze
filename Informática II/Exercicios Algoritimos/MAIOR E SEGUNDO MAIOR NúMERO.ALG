Algoritmo "Maior e Segundo Maior Número"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descrição   : multiplica maior e segundo maior 1000x
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 03/08/2024
Var
numero, maior, segundoMaior: Real
contador: Inteiro
Inicio
   maior <- -999999
   segundoMaior <- -999999
// Loop para ler os 1000 números
   Para contador de 1 até 1000 faça
      Escreva("Digite o número ", contador, ": ")
      Leia(numero)
// Verificando se o número atual é maior que o maior registrado
      Se numero > maior Entao
         segundoMaior <- maior // Atualiza o segundo maior
         maior <- numero       // Atualiza o maior
      Senao
         // Verifica se o número atual é maior que o segundo maior
         Se numero > segundoMaior Entao
            segundoMaior <- numero
         FimSe
      FimSe
   FimPara
// Calculando o produto do maior e do segundo maior número
   produto <- maior * segundoMaior
// mostra o resultado do produto
   Escreva("O maior número é: ", maior)
   Escreva("O segundo maior número é: ", segundoMaior)
   Escreva("O produto do maior número e do segundo maior número é: ", produto)
FimAlgoritmo
