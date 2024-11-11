#include <iostream>
using namespace std;
//Primo
// Funçao para verificar se um numero e primo
bool Primo(int numero) {
    if (numero <= 1) {
        return false; // Números menores ou iguais a 1 nao sao primos
    }
    for (int i = 2; i * i <= numero; i++) {
        if (numero % i == 0) {
            return false; // Encontrou um divisor, portanto, nao e primo
        }
    }
    return true; // Se nenhum divisor foi encontrado, e primo
}

int main() {
    int numero;
    
    // Solicita ao usuario que insira um numero
    cout << "Por favor, digite o numero que pretende verificar se e primo: ";
    cin >> numero;

    // Chama a funçao para verificar se o número e primo e exibe o resultado
    if (Primo(numero)) {
        cout << numero << " e um numero primo.\n";
    } else {
        cout << numero << " nao e um numero primo.\n";
    }

    return 0;
}
