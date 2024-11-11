#include <iostream>

int main() {
    const int tamanho = 100;
    int numeros[tamanho];
    
    // Solicita ao usuário que insira 100 números
    std::cout << "Digite 100 numeros separados por espaco:" << std::endl;
    
    for (int i = 0; i < tamanho; i++) {
        std::cin >> numeros[i];
    }
    
    // Obtém o dobro do primeiro número
    int dobroPrimeiro = numeros[0] * 2;
    
    // Inicializa a contagem
    int contador = 0;
    
    // Percorre o array e conta quantas vezes o dobro do primeiro número se repete
    for (int i = 1; i < tamanho; i++) {
        if (numeros[i] == dobroPrimeiro) {
            contador++;
        }
    }
    
    // Exibe o resultado
    std::cout << "O dobro do primeiro numero se repete " << contador << " vezes." << std::endl;
    
    return 0;
}
