#include <iostream>
#include <iomanip>

int main() {
    double distanciaPercorrida, quantidadeCombustivel;

    std::cout << "Calculadora de Consumo de Combust¡vel\n";

    // Solicitar ao usu rio a distƒncia percorrida
    do {
        std::cout << "Digite a distƒncia percorrida (em km): ";
        std::cin >> distanciaPercorrida;

        if (distanciaPercorrida <= 0) {
            std::cout << "A distƒncia deve ser um valor positivo. Tente novamente." << std::endl;
        }
    } while (distanciaPercorrida <= 0);

    // Solicitar ao usu rio a quantidade de combust¡vel consumida
    do {
        std::cout << "Digite a quantidade de combust¡vel consumida (em litros): ";
        std::cin >> quantidadeCombustivel;

        if (quantidadeCombustivel <= 0) {
            std::cout << "A quantidade de combust¡vel deve ser um valor positivo. Tente novamente." << std::endl;
        }
    } while (quantidadeCombustivel <= 0);

    // Calcular o consumo de combust¡vel
    double consumo = distanciaPercorrida / quantidadeCombustivel;

    // Exibir o resultado com duas casas decimais
    std::cout << "O consumo de combust¡vel ‚ de: " << std::fixed << std::setprecision(2) << consumo << " km/l" << std::endl;

    // Dar um feedback ao usu rio sobre o consumo
    if (consumo > 10) {
        std::cout << "Seu ve¡culo tem um bom consumo de combust¡vel." << std::endl;
    } else {
        std::cout << "Talvez vocˆ possa otimizar o consumo de combust¡vel." << std::endl;
    }

    return 0;
}
