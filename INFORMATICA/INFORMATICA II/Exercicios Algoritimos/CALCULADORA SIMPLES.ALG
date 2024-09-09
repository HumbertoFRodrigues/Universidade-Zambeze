Algoritmo "Calculadora Simples"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descrição   : calculadora simples com opçao
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 03/08/2024
Var
   numero1, numero2, resultado: Real
   opcao: Inteiro
Inicio
   Escreva("Digite o primeiro número: ")
   Leia(numero1)
   Escreva("Digite o segundo número: ")
   Leia(numero2)
   // abre o menu das opções de operações disponíveis
   Escreva("Escolha uma opção:")
   Escreva("1. Soma")
   Escreva("2. Subtração")
   Escreva("3. Multiplicação")
   Escreva("4. Divisão")
   Escreva("5. Resto da Divisão")
   Leia(opcao)
   // Realizando a operação com base na opção escolhida
   Escolha opcao
      Caso 1
         resultado <- numero1 + numero2
         Escreva("A soma é: ", resultado)
      Caso 2
         resultado <- numero1 - numero2
         Escreva("A subtração é: ", resultado)
      Caso 3
         resultado <- numero1 * numero2
         Escreva("A multiplicação é: ", resultado)
      Caso 4
         Se numero2 <> 0 Entao
            resultado <- numero1 / numero2
            Escreva("A divisão é: ", resultado)
         Senao
            Escreva("Erro: Divisão por zero!")
         FimSe
      Caso 5
         Se numero2 <> 0 Entao
            resultado <- numero1 % numero2
            Escreva("O resto da divisão é: ", resultado)
         Senao
            Escreva("Erro: Divisão por zero!")
         FimSe
      OutroCaso
         Escreva("Opção inválida!")
   FimEscolha

FimAlgoritmo
