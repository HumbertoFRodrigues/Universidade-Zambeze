#include <iostream>

bool ehPrimo(int numero) {
    if (numero <= 1) {
        return false;
    }

    for (int i = 2; i * i <= numero; ++i) {
        if (numero % i == 0) {
            return false;
        }
    }

    return true;
}

int main() {
    std::cout << "Numeros primos no intervalo de 1 a 500:" << std::endl;

    for (int i = 1; i <= 500; ++i) {
        if (ehPrimo(i)) {
            std::cout << i << " ";
        }
    }

    std::cout << std::endl;

    return 0;
}
