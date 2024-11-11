#include <iostream>
using namespace std;

int main() {
    int numeros[12];
    
    // Solicita ao usuário que insira 12 números
    cout << "Por favor, insira os 12 numeros:" << "\n";

    // Lê os 12 números e encontra o maior
    int maior = 0; // Assumindo que o primeiro número seja o maior inicialmente
    for (int i = 0; i < 12; i++) {
        cin >> numeros[i];
        if (numeros[i] > maior) {
            maior = numeros[i];
        }
    }

    // Exibe o maior número
    cout << "O maior número entre os 12 números é: " << maior << "\n";

    return 0;
}
