#include <iostream>
#include <vector>

// Fun‡Æo que verifica se um n£mero ‚ primo
bool isPrime(int number) {
    if (number <= 1) {
        return false;
    }
    for (int i = 2; i * i <= number; ++i) {
        if (number % i == 0) {
            return false;
        }
    }
    return true;
}

int main() {
    int inicio, fim;

    // Exibe uma mensagem de boas-vindas
    std::cout << "Gerador de Numeros Primos\n";

    // Solicita ao usu rio que defina o in¡cio e o fim do intervalo
    std::cout << "Digite o inicio do intervalo: ";
    std::cin >> inicio;
    std::cout << "Digite o fim do intervalo: ";
    std::cin >> fim;

    // Cria um vetor para armazenar os n£meros primos encontrados
    std::vector<int> numerosPrimos;

    // Loop para verificar e armazenar os n£meros primos dentro do intervalo
    for (int i = inicio; i <= fim; ++i) {
        if (isPrime(i)) {
            numerosPrimos.push_back(i); // Adiciona o n£mero primo ao vetor
        }
    }

    // Exibe os n£meros primos encontrados no intervalo especificado
    std::cout << "Numeros primos no intervalo de " << inicio << " a " << fim << ":\n";
    for (int primo : numerosPrimos) {
        std::cout << primo << " "; // Exibe cada n£mero primo separado por espa‡o
    }

    return 0; // Indica que o programa foi executado com sucesso
}
