#include <iostream>
using namespace std;

int main() {
    int numeros[12];
    
    // Solicita ao usu�rio que insira 12 n�meros
    cout << "Por favor, insira 12 numeros:" << endl;

    // L� os 12 n�meros
    for (int i = 0; i < 12; i++) {
        cin >> numeros[i];
    }

    // Encontra o maior e o segundo maior n�mero
    int maior = numeros[0];
    int segundoMaior = numeros[1];
    
    if (segundoMaior > maior) {
        // Troca os valores para garantir que 'maior' seja o maior n�mero e 'segundoMaior' seja o segundo maior
        int temp = maior;
        maior = segundoMaior;
        segundoMaior = temp;
    }

    for (int i = 2; i < 12; i++) {
        if (numeros[i] > maior) {
            segundoMaior = maior;
            maior = numeros[i];
        } else if (numeros[i] > segundoMaior && numeros[i] != maior) {
            segundoMaior = numeros[i];
        }
    }

    // Exibe o segundo maior n�mero
    cout << "O segundo maior numero entre os 12 numeros e: " << segundoMaior << "\n";

    return 0;
}
