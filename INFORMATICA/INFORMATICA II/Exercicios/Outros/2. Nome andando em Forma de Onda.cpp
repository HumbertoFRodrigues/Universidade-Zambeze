#include <iostream>
#include <string>
#include <cmath>
#include <windows.h> // Para Sleep

int main() {
    std::string nome = "SeuNome";
    int linhaVertical = 5; // Qual linha vertical o nome começa
    int larguraTela = 80; // Largura da tela

    while (true) {
        for (int i = 0; i < larguraTela - nome.length(); i++) {
            // Limpa a tela
            system("cls"); // Use "clear" no Unix-like (Linux, macOS)

            // Calcula a posição horizontal usando uma função senoidal
            int posX = static_cast<int>((larguraTela / 2) + (larguraTela / 2) * std::sin(2 * 3.14159265 * i / larguraTela));

            // Imprime espaços em branco para posicionar o nome horizontalmente
            for (int j = 0; j < posX; j++) {
                std::cout << " ";
            }

            // Imprime o nome
            std::cout << nome << std::endl;

            // Move o nome para a linha vertical
            for (int k = 0; k < linhaVertical; k++) {
                std::cout << std::endl;
            }

            // Pausa por um curto período de tempo
            Sleep(100);
        }
    }

    return 0;
}
