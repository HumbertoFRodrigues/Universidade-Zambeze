#include <iostream>
using namespace std;

int main() {
    int soma = 0;
    
    cout << "Por favor, insira 20 numeros:" << "\n";

    for (int i = 0; i < 20; i++) {
        int numero;
        cin >> numero;
        soma += numero;
    }

    cout << "A soma dos 20 numeros inseridos e: " << soma << "\n";

    return 0;
}
