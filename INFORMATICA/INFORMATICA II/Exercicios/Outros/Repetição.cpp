#include <iostream> // Inclui a biblioteca de entrada/sa°da padr∆o
#include <string>    // Inclui a biblioteca para manipulaá∆o de strings

int main() {
    std::string nome; // Declara uma vari†vel para armazenar o nome
    int vezes = 13; // Define o n£mero de vezes que o nome ser† repetido

    std::cout << "Digite o nome: "; // Exibe uma mensagem pedindo para digitar o nome
    std::getline(std::cin, nome);   // Là o nome digitado pelo usu†rio

    // Loop que ir† repetir o processo de imprimir o nome o n£mero de vezes especificado
    for (int i = 0; i < vezes; ++i) {
        std::cout << nome << "\n"; // Imprime o nome na tela, seguido de uma quebra de linha
    }

    return 0; // Retorna 0 para indicar que o programa foi executado com sucesso
}
