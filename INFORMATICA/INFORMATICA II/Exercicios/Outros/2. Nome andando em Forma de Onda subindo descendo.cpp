#include <iostream>
#include <string>
#include <cmath>
#include <windows.h> // Para Sleep

int main() {
    std::string nome = "SeuNome";
    int larguraTela = 80; // Largura da tela
    int alturaTela = 24; // Altura da tela

    while (true) {
        for (int i = 0; i < alturaTela - 1; i++) {
            // Limpa a tela
            system("cls"); // Use "clear" no Unix-like (Linux, macOS)

            // Calcula a posição vertical usando uma função senoidal
            int posY = static_cast<int>((alturaTela / 2) + (alturaTela / 2) * std::sin(2 * 3.14159265 * i / alturaTela));

            // Imprime espaços em branco para posicionar o nome verticalmente
            for (int j = 0; j < posY; j++) {
                std::cout << std::endl;
            }

            // Imprime o nome
            for (int k = 0; k < larguraTela / 2 - nome.length() / 2; k++) {
                std::cout << " ";
            }
            std::cout << nome << std::endl;

            // Pausa por um curto período de tempo
            Sleep(100);
        }

        // Para descer o nome, repetimos o loop em ordem reversa
        for (int i = alturaTela - 1; i > 0; i--) {
            // Limpa a tela
            system("cls"); // Use "clear" no Unix-like (Linux, macOS)

            // Calcula a posição vertical usando uma função senoidal
            int posY = static_cast<int>((alturaTela / 2) + (alturaTela / 2) * std::sin(2 * 3.14159265 * i / alturaTela));

            // Imprime espaços em branco para posicionar o nome verticalmente
            for (int j = 0; j < posY; j++) {
                std::cout << std::endl;
            }

            // Imprime o nome
            for (int k = 0; k < larguraTela / 2 - nome.length() / 2; k++) {
                std::cout << " ";
            }
            std::cout << nome << std::endl;

            // Pausa por um curto período de tempo
            Sleep(100);
        }
    }

    return 0;
}
