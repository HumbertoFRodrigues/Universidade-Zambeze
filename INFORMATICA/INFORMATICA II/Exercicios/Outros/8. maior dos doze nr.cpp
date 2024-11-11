#include <iostream>

int main() {
    int numeros[12]; // Declara um array para armazenar os 12 números

    // Solicita ao usuário que insira os 12 números
    std::cout << "Digite 12 numeros separados por espaco:" << std::endl;

    for (int i = 0; i < 12; i++) {
        std::cin >> numeros[i];
    }

    int maior = numeros[0]; // Inicializa a variável "maior" com o primeiro número

    // Encontra o maior número no array
    for (int i = 1; i < 12; i++) {
        if (numeros[i] > maior) {
            maior = numeros[i];
        }
    }

    // Exibe o maior número
    std::cout << "O maior numero entre os digitados e: " << maior << std::endl;

    return 0;
}
