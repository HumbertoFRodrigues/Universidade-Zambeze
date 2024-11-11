#include <iostream>

int main() {
    int numeros[12]; // Declara um array para armazenar os 12 números

    // Solicita ao usuário que insira os 12 números
    std::cout << "Digite 12 numeros separados por espaco:" << std::endl;

    for (int i = 0; i < 12; i++) {
        std::cin >> numeros[i];
    }

    int maior = numeros[0]; // Inicializa a variável "maior" com o primeiro número
    int segundoMaior = numeros[0]; // Inicializa a variável "segundoMaior" com o primeiro número

    // Encontra o maior e o segundo maior número no array
    for (int i = 1; i < 12; i++) {
        if (numeros[i] > maior) {
            segundoMaior = maior; // Atualiza o segundo maior com o valor anterior do maior
            maior = numeros[i]; // Atualiza o maior com o novo maior número encontrado
        } else if (numeros[i] > segundoMaior && numeros[i] != maior) {
            segundoMaior = numeros[i]; // Atualiza o segundo maior se o número for maior que o atual segundo maior
        }
    }

    // Exibe o segundo maior número
    std::cout << "O segundo maior numero entre os digitados e: " << segundoMaior << std::endl;

    return 0;
}
