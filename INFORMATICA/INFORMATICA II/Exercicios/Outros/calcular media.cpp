#include <iostream>
#include <vector>
#include <iomanip> // Inclui a biblioteca para formata‡Æo da sa¡da

int main() {
    std::vector<double> numeros; // Vetor para armazenar os n£meros inseridos
    int quantidade;
    double numero, soma = 0.0;

    std::cout << "Calculadora de Media\n";
    std::cout << "Quantos numeros deseja inserir? ";
    std::cin >> quantidade;

    // Solicita ao usu rio os n£meros e armazena-os no vetor
    for (int i = 0; i < quantidade; ++i) {
        std::cout << "Digite o numero " << i + 1 << ": ";
        std::cin >> numero;
        numeros.push_back(numero);
        soma += numero; // Adiciona o n£mero … soma total
    }

    // Calcula a m‚dia
    double media = soma / quantidade;

    // Exibe o resultado com duas casas decimais
    std::cout << "A media dos numeros inseridos e: " << std::fixed << std::setprecision(2) << media << std::endl;

    return 0;
}
