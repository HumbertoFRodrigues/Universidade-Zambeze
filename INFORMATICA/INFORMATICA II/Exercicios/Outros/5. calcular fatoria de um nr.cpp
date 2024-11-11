#include <iostream>

// Função para calcular o fatorial
unsigned long long calcularFatorial(int n) {
    if (n < 0) {
        std::cout << "O fatorial noo esta definido para numeros negativos." << std::endl;
        return 0;
    }
    
    unsigned long long fatorial = 1;
    
    for (int i = 1; i <= n; i++) {
        fatorial *= i;
    }
    
    return fatorial;
}

int main() {
    int numero;
    std::cout << "Digite um numero inteiro para calcular o fatorial: ";
    std::cin >> numero;

    unsigned long long resultado = calcularFatorial(numero);

    std::cout << "O fatorial de " << numero << " e " << resultado << std::endl;

    return 0;
}
