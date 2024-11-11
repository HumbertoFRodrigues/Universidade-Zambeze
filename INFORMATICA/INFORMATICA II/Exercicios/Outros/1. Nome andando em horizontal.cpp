#include <iostream>
#include <string>
#include <windows.h> // Para usar Sleep
#include <cstdlib>   // Para usar system

// Função para limpar a tela no Windows
void limparTela() {
    system("cls");
}

int main() {
    std::string nome = "Humberto";
    int espacoHorizontal = 10; // Quantos espaços para a direita o nome se move
    int linhaVertical = 5;     // Qual linha vertical o nome começa

    // Loop para mover o nome horizontalmente
    for (int i = 0; i < 400; i++) {
        limparTela(); // Limpa a tela

        // Imprime espaços em branco para mover o nome para a direita
        for (int j = 0; j < espacoHorizontal; j++) {
            std::cout << " ";
        }

        // Imprime o nome
        std::cout << nome << std::endl;

        // Aguarda um curto período de tempo usando Sleep
        Sleep(100);

        // Incrementa o espaço horizontal
        espacoHorizontal++;

        // Move o nome para a próxima linha vertical
        for (int k = 0; k < linhaVertical; k++) {
            std::cout << std::endl;
        }
    }

    return 0;
}
