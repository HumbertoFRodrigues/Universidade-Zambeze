Algoritmo "Calculadora Simples"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descri��o   : calculadora simples com op�ao
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 03/08/2024
Var
   numero1, numero2, resultado: Real
   opcao: Inteiro
Inicio
   Escreva("Digite o primeiro n�mero: ")
   Leia(numero1)
   Escreva("Digite o segundo n�mero: ")
   Leia(numero2)
   // abre o menu das op��es de opera��es dispon�veis
   Escreva("Escolha uma op��o:")
   Escreva("1. Soma")
   Escreva("2. Subtra��o")
   Escreva("3. Multiplica��o")
   Escreva("4. Divis�o")
   Escreva("5. Resto da Divis�o")
   Leia(opcao)
   // Realizando a opera��o com base na op��o escolhida
   Escolha opcao
      Caso 1
         resultado <- numero1 + numero2
         Escreva("A soma �: ", resultado)
      Caso 2
         resultado <- numero1 - numero2
         Escreva("A subtra��o �: ", resultado)
      Caso 3
         resultado <- numero1 * numero2
         Escreva("A multiplica��o �: ", resultado)
      Caso 4
         Se numero2 <> 0 Entao
            resultado <- numero1 / numero2
            Escreva("A divis�o �: ", resultado)
         Senao
            Escreva("Erro: Divis�o por zero!")
         FimSe
      Caso 5
         Se numero2 <> 0 Entao
            resultado <- numero1 % numero2
            Escreva("O resto da divis�o �: ", resultado)
         Senao
            Escreva("Erro: Divis�o por zero!")
         FimSe
      OutroCaso
         Escreva("Op��o inv�lida!")
   FimEscolha

FimAlgoritmo
