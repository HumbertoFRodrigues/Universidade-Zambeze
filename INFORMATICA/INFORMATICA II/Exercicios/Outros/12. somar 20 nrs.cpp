#include <iostream>

int main() {
    const int tamanhoGrupo = 20;
    int numeros[tamanhoGrupo];
    int soma = 0;

    // Solicita ao usuário que insira os 20 números
    std::cout << "Digite " << tamanhoGrupo << " numeros separados por espaco:" << std::endl;

    for (int i = 0; i < tamanhoGrupo; i++) {
        std::cin >> numeros[i];
        soma += numeros[i]; // Adiciona o número à soma
    }

    // Exibe a soma dos números
    std::cout << "A soma dos " << tamanhoGrupo << " numeros digitados e: " << soma << std::endl;

    return 0;
}
