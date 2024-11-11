#include <iostream>
using namespace std;
//Calculo de fatorial
// Funçao para calcular o fatorial
int Fatorial(int numero) {
    if (numero == 0 || numero == 1) {
        return 1;
    } else {
        return numero * Fatorial(numero - 1);
    }
}

int main() {
    int numero;
    
    // Solicita ao usuario que insira um numero
    cout << "Por favor, insira um numero para calcular o fatorial: ";
    cin >> numero;

    // Verifica se o numero e negativo (Nao se calcula fatorial de numeros negativos)
    if (numero < 0) {
        cout << "Nao se calcula fatorial de numeros negativos.\n";
    } else {
        // Chama a funçao para calcular o fatorial e exibe o resultado
        int resultado = Fatorial(numero);
        cout << "O fatorial de " << numero << " e igual a: " << resultado << "\n";
    }

    return 0;
}
