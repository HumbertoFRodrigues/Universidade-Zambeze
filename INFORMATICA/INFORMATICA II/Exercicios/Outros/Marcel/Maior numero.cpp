#include <iostream>
using namespace std;

int main() {
    int numeros[12];
    
    // Solicita ao usu�rio que insira 12 n�meros
    cout << "Por favor, insira os 12 numeros:" << "\n";

    // L� os 12 n�meros e encontra o maior
    int maior = 0; // Assumindo que o primeiro n�mero seja o maior inicialmente
    for (int i = 0; i < 12; i++) {
        cin >> numeros[i];
        if (numeros[i] > maior) {
            maior = numeros[i];
        }
    }

    // Exibe o maior n�mero
    cout << "O maior n�mero entre os 12 n�meros �: " << maior << "\n";

    return 0;
}
