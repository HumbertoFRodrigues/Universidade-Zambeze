Algoritmo "Media na Universidade"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descri��o   : sistema de nota, adimite, dispensa e exclui
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 03/08/2024
Var
nota1, nota2, nota3, media: Real
algumaNotaNegativa: Logico

Inicio
// Solicita ao usu�rio para digitar as tr�s notas do aluno
   Escreva("Digite a primeira nota do aluno (0 a 20): ")
   Leia(nota1)
   Escreva("Digite a segunda nota do aluno (0 a 20): ")
   Leia(nota2)
   Escreva("Digite a terceira nota do aluno (0 a 20): ")
   Leia(nota3)

// Inicializa a vari�vel para verificar se alguma nota � negativa
   algumaNotaNegativa <- Falso

// Verifica se alguma nota � negativa
   Se (nota1 < 9) Ou (nota2 < 9) Ou (nota3 < 9) Entao
      algumaNotaNegativa <- Verdadeiro
   FimSe

// Calcula a m�dia das tr�s notas
   media <- (nota1 + nota2 + nota3) / 3

// Exibe a m�dia calculada
   Escreva("A m�dia do Estudante �: ", media:4:2 )

// O status do aluno com base nas notas e m�dia
   Se algumaNotaNegativa = Verdadeiro Entao
      Escreva("ADMITIDO, devido a uma nota negativa.")
   Senao
      Se media >= 14.0 Entao
         Escreva("DISPENSADO.")
      Senao
         Escreva("ADMITIDO.")
      FimSe
   FimSe

FimAlgoritmo