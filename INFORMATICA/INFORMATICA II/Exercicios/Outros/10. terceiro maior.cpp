#include <iostream>
#include <climits> // Para INT_MIN

int main() {
    int numeros[12]; // Declara um array para armazenar os 12 números

    // Solicita ao usuário que insira os 12 números
    std::cout << "Digite 12 numeros separados por espaco:" << std::endl;

    for (int i = 0; i < 12; i++) {
        std::cin >> numeros[i];
    }

    int primeiroMaior = numeros[0];
    int segundoMaior = INT_MIN; // Inicializa como o menor valor possível
    int terceiroMaior = INT_MIN; // Inicializa como o menor valor possível

    // Encontra o primeiro, o segundo e o terceiro maiores números no array
    for (int i = 1; i < 12; i++) {
        if (numeros[i] > primeiroMaior) {
            terceiroMaior = segundoMaior;
            segundoMaior = primeiroMaior;
            primeiroMaior = numeros[i];
        } else if (numeros[i] > segundoMaior && numeros[i] != primeiroMaior) {
            terceiroMaior = segundoMaior;
            segundoMaior = numeros[i];
        } else if (numeros[i] > terceiroMaior && numeros[i] != segundoMaior && numeros[i] != primeiroMaior) {
            terceiroMaior = numeros[i];
        }
    }

    // Exibe o terceiro maior número
    std::cout << "O terceiro maior numero entre os digitados e: " << terceiroMaior << std::endl;

    return 0;
}
