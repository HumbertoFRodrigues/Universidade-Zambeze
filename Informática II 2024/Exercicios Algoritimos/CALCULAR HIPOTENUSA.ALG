Algoritmo "Calcular Hipotenusa"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descrição   : calclua a hipotenusa
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 02/08/2024
Var
cateto1, cateto2, hipotenusa: Real
Inicio
   Escreva("Digite o valor do primeiro cateto: ")
   Leia(cateto1)
   Escreva("Digite o valor do segundo cateto: ")
   Leia(cateto2)

   // o Calculo da hipotenusa usando o Teorema de Pitágoras
   hipotenusa <- RaizQ((cateto1^2) + (cateto2^2))

   // mostra resultado da hipotenusa
   Escreva("A hipotenusa do triângulo é: ", hipotenusa)


Fimalgoritmo