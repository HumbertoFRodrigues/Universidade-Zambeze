#include <iostream>
using namespace std;

int main() {
    int numeros[12];
    
    // Solicita ao usuário que insira 12 números
    cout << "Por favor, insira 12 numeros:" << endl;

    // Lê os 12 números
    for (int i = 0; i < 12; i++) {
        cin >> numeros[i];
    }

    // Encontra o maior, o segundo maior e o terceiro maior número
    int maior = numeros[0];
    int segundoMaior = numeros[1];
    int terceiroMaior = numeros[2];
    
    if (segundoMaior > maior) {
        // Troca os valores para garantir que 'maior' seja o maior número e 'segundoMaior' seja o segundo maior
        int temp = maior;
        maior = segundoMaior;
        segundoMaior = temp;
    }
    
    if (terceiroMaior > segundoMaior) {
        // Troca os valores para garantir que 'segundoMaior' seja o segundo maior número e 'terceiroMaior' seja o terceiro maior
        int temp = segundoMaior;
        segundoMaior = terceiroMaior;
        terceiroMaior = temp;
    }
    
    if (terceiroMaior > maior) {
        // Troca novamente para garantir que 'maior' seja o maior número e 'terceiroMaior' seja o terceiro maior
        int temp = maior;
        maior = terceiroMaior;
        terceiroMaior = temp;
    }

    for (int i = 3; i < 12; i++) {
        if (numeros[i] > maior) {
            terceiroMaior = segundoMaior;
            segundoMaior = maior;
            maior = numeros[i];
        } else if (numeros[i] > segundoMaior && numeros[i] != maior) {
            terceiroMaior = segundoMaior;
            segundoMaior = numeros[i];
        } else if (numeros[i] > terceiroMaior && numeros[i] != maior && numeros[i] != segundoMaior) {
            terceiroMaior = numeros[i];
        }
    }

    // Exibe o terceiro maior número
    cout << "O terceiro maior numero entre os 12 numeros e: " << terceiroMaior << "\n";

    return 0;
}
