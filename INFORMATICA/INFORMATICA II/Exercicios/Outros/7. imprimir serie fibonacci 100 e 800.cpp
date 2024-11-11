#include <iostream>

int main() {
    int numero1 = 0;
    int numero2 = 1;

    while (true) {
        int proximoNumero = numero1 + numero2;
        if (proximoNumero >= 800) {
            break; // Se o próximo número for maior ou igual a 800, saímos do loop
        }

        if (proximoNumero > 100) {
            std::cout << proximoNumero << " ";
        }

        numero1 = numero2;
        numero2 = proximoNumero;
    }

    std::cout << std::endl;

    return 0;
}
