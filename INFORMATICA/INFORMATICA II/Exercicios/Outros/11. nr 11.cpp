#include <iostream>

bool ehPrimo(int numero) {
    if (numero <= 1) {
        return false; // Números menores ou iguais a 1 não são primos
    }

    if (numero <= 3) {
        return true; // 2 e 3 são primos
    }

    if (numero % 2 == 0 || numero % 3 == 0) {
        return false; // Números divisíveis por 2 ou 3 não são primos
    }

    // Verifica divisibilidade por outros números
    for (int i = 5; i * i <= numero; i += 6) {
        if (numero % i == 0 || numero % (i + 2) == 0) {
            return false;
        }
    }

    return true;
}

int main() {
    for (int i = 1; i <= 1000; i++) {
        if (ehPrimo(i)) {
            std::cout << i << " "; // Se for primo, imprime o número normal
        } else {
            std::cout << i * 2 << " "; // Se não for primo, imprime o dobro do número
        }
    }

    std::cout << std::endl;

    return 0;
}
