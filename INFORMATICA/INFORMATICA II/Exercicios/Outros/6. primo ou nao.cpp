#include <iostream>

bool ehPrimo(int numero) {
    if (numero <= 1) {
        return false; // Números menores ou iguais a 1 não são primos
    }

    if (numero <= 3) {
        return true; // 2 e 3 são primos
    }

    // Verifica divisibilidade por 2 e 3
    if (numero % 2 == 0 || numero % 3 == 0) {
        return false;
    }

    // Verifica divisibilidade por outros números
    for (int i = 5; i * i <= numero; i += 6) {
        if (numero % i == 0 || numero % (i + 2) == 0) {
            return false;
        }
    }

    return true; // Se não for divisível por nenhum número, é primo
}

int main() {
    int numero;
    std::cout << "Digite um numero inteiro positivo: ";
    std::cin >> numero;

    if (ehPrimo(numero)) {
        std::cout << numero << " e um numero primo." << std::endl;
    } else {
        std::cout << numero << " nao e um numero primo." << std::endl;
    }

    return 0;
}
