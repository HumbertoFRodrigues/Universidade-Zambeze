Algoritmo "Simulador de Rel�gio Anal�gico"
// Disciplina   : Informatica II - Algoritimos
// Professor   : Fancisco Chimbinde
// Descri��o   : simulando relogio analogico
// Autor(a)    : Humberto F. Rodrigues e Abel D. Martins
// Data atual  : 03/08/2024
Var
   horas, minutos, segundos: Inteiro
Inicio
   // Inicializa as vari�veis para representar o tempo atual
   horas <- 0
   minutos <- 0
   segundos <- 0

// Loop infinito para simular o rel�gio em tempo real
   Enquanto Verdadeiro Fa�a

// Exibe o hor�rio atual formatado
      EscrevaL("Hora: ", horas, ":", minutos, ":", segundos)
// Incrementa os segundos
      segundos <- segundos + 1
// Verifica se os segundos alcan�aram 60
      Se segundos = 60 Entao
         segundos <- 0
         minutos <- minutos + 1
      FimSe
// Verifica se os minutos alcan�aram 60
      Se minutos = 60 Entao
         minutos <- 0
         horas <- horas + 1
      FimSe
// Verifica se as horas alcan�aram 24
      Se horas = 24 Entao
         horas <- 0
      FimSe
// Pausa por 1 segundo para simular o avan�o do tempo
      Aguarde(1000)
// Limpando a tela para atualizar a exibi��o do rel�gio
      LimpaTela
   FimEnquanto

FimAlgoritmo