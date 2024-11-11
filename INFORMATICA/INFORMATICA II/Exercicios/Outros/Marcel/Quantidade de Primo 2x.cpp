#include <iostream>
#include <cmath>
using namespace std;

// Fun��o para verificar se um n�mero � primo
bool ehPrimo(int numero) {
    if (numero <= 1) {
        return false; // N�meros menores ou iguais a 1 n�o s�o primos
    }
    for (int i = 2; i <= sqrt(numero); i++) {
        if (numero % i == 0) {
            return false; // Encontrou um divisor, portanto, n�o � primo
        }
    }
    return true; // Se nenhum divisor foi encontrado, � primo
}

int main() {
    int quantidadePrimos = 0;

    cout << "Numeros obedecendo a regra:" << endl;

    for (int i = 1; i <= 1000; i++) {
        if (ehPrimo(i)) {
            quantidadePrimos++;
        }

        if (quantidadePrimos % 2 == 0) {
            // Se a quantidade de primos for par, imprime o dobro do n�mero
            cout << 2 * i << " ";
        } else {
            // Caso contr�rio, imprime o n�mero simples
            cout << i << " ";
        }
    }

    cout << endl;

    return 0;
}
