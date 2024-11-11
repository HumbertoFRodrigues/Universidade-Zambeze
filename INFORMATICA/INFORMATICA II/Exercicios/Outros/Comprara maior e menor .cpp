#include <iostream>
#include <vector>

int main() {
    std::vector<int> numeros; // Vetor para armazenar os n£meros inseridos
    int quantidade, numero;

    // Solicitar ao usu rio a quantidade de n£meros a serem inseridos
    std::cout << "Quantos numeros deseja comparar? ";
    std::cin >> quantidade;

    // Solicitar ao usu rio os n£meros e armazen -los no vetor
    for (int i = 0; i < quantidade; ++i) {
        std::cout << "Digite o numero " << i + 1 << ": ";
        std::cin >> numero;
        numeros.push_back(numero);
    }

    // Inicializar vari veis para armazenar o maior e o menor n£mero
    int maior = numeros[0];
    int menor = numeros[0];

    // Comparar os n£meros no vetor para encontrar o maior e o menor
    for (int i = 1; i < quantidade; ++i) {
        if (numeros[i] > maior) {
            maior = numeros[i];
        }
        if (numeros[i] < menor) {
            menor = numeros[i];
        }
    }

    // Exibir o maior e o menor n£mero
    std::cout << "Maior numero: " << maior << std::endl;
    std::cout << "Menor numero: " << menor << std::endl;

    return 0;
}
