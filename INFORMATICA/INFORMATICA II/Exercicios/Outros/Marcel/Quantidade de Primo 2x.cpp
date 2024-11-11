#include <iostream>
#include <cmath>
using namespace std;

// Função para verificar se um número é primo
bool ehPrimo(int numero) {
    if (numero <= 1) {
        return false; // Números menores ou iguais a 1 não são primos
    }
    for (int i = 2; i <= sqrt(numero); i++) {
        if (numero % i == 0) {
            return false; // Encontrou um divisor, portanto, não é primo
        }
    }
    return true; // Se nenhum divisor foi encontrado, é primo
}

int main() {
    int quantidadePrimos = 0;

    cout << "Numeros obedecendo a regra:" << endl;

    for (int i = 1; i <= 1000; i++) {
        if (ehPrimo(i)) {
            quantidadePrimos++;
        }

        if (quantidadePrimos % 2 == 0) {
            // Se a quantidade de primos for par, imprime o dobro do número
            cout << 2 * i << " ";
        } else {
            // Caso contrário, imprime o número simples
            cout << i << " ";
        }
    }

    cout << endl;

    return 0;
}
